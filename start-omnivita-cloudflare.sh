#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

BACKEND_PORT="${BACKEND_PORT:-3001}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
FRONTEND_HOST="${FRONTEND_HOST:-0.0.0.0}"
OPEN_PATH="${OPEN_PATH:-/mestre}"
OPEN_BROWSER="${OPEN_BROWSER:-1}"
COPY_LINK="${COPY_LINK:-1}"
STOP_EXISTING="${OMNIVITA_STOP_EXISTING:-0}"
LOG_DIR="$PROJECT_ROOT/logs"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"
CLOUDFLARED_LOG="$LOG_DIR/cloudflared.log"
URL_FILE="$PROJECT_ROOT/.omnivita-cloudflare-url"

BACKEND_PID=""
FRONTEND_PID=""
CLOUDFLARED_PID=""

mkdir -p "$LOG_DIR"
: > "$BACKEND_LOG"
: > "$FRONTEND_LOG"
: > "$CLOUDFLARED_LOG"

if [ -d "$HOME/.local/share/micromamba/envs/omnivita/bin" ]; then
  export PATH="$HOME/.local/share/micromamba/envs/omnivita/bin:$PATH"
fi

die() {
  echo
  echo "ERRO: $*" >&2
  echo
  exit 1
}

require_command() {
  local command_name="$1"
  local install_hint="${2:-}"
  if command -v "$command_name" >/dev/null 2>&1; then
    return
  fi
  echo "Comando obrigatorio nao encontrado: $command_name" >&2
  if [ -n "$install_hint" ]; then
    echo "$install_hint" >&2
  fi
  exit 1
}

cleanup() {
  echo
  echo "Encerrando OmniVita..."
  for pid in "$CLOUDFLARED_PID" "$FRONTEND_PID" "$BACKEND_PID"; do
    if [ -n "$pid" ] && kill -0 "$pid" >/dev/null 2>&1; then
      pkill -TERM -P "$pid" >/dev/null 2>&1 || true
      kill "$pid" >/dev/null 2>&1 || true
    fi
  done
  echo "OmniVita encerrado."
}
trap cleanup EXIT INT TERM

check_dependencies() {
  require_command node "Instale Node.js ou use o ambiente micromamba do OmniVita."
  require_command npm "Instale npm junto com Node.js."
  require_command curl "No Arch/CachyOS: sudo pacman -S curl"
  require_command cloudflared "cloudflared nao encontrado. Instale com seu gerenciador de pacotes ou baixe da Cloudflare."

  if ! command -v wl-copy >/dev/null 2>&1 && ! command -v xclip >/dev/null 2>&1 && ! command -v xsel >/dev/null 2>&1; then
    echo "Aviso: nenhum clipboard helper encontrado. O link sera impresso, mas nao copiado automaticamente."
    echo "Arch/CachyOS X11: sudo pacman -S xclip"
    echo "Arch/CachyOS Wayland: sudo pacman -S wl-clipboard"
    echo
  fi
}

port_in_use() {
  local port="$1"
  if command -v ss >/dev/null 2>&1; then
    ss -ltn "( sport = :$port )" | grep -q ":$port"
    return
  fi
  if command -v lsof >/dev/null 2>&1; then
    lsof -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
    return
  fi
  if command -v fuser >/dev/null 2>&1; then
    fuser -s "${port}/tcp"
    return
  fi
  return 1
}

handle_existing_port() {
  local port="$1"
  if ! port_in_use "$port"; then
    return
  fi
  if [ "$STOP_EXISTING" = "1" ] && command -v fuser >/dev/null 2>&1; then
    echo "Porta $port ja estava em uso. Encerrando processo antigo porque OMNIVITA_STOP_EXISTING=1..."
    fuser -k "${port}/tcp" >/dev/null 2>&1 || true
    sleep 0.5
    return
  fi
  die "A porta $port ja esta em uso. Feche o processo antigo ou rode com OMNIVITA_STOP_EXISTING=1 ./start-omnivita-cloudflare.sh"
}

ensure_node_modules() {
  local dir="$1"
  local log="$2"
  if [ -d "$dir/node_modules" ]; then
    return
  fi
  echo "Instalando dependencias em $dir..."
  npm --prefix "$dir" install >> "$log" 2>&1
}

ensure_backend_env() {
  if [ ! -f "$PROJECT_ROOT/backend/.env" ] && [ -f "$PROJECT_ROOT/backend/.env.example" ]; then
    cp "$PROJECT_ROOT/backend/.env.example" "$PROJECT_ROOT/backend/.env"
  fi
}

ensure_postgres_if_available() {
  local pgdata="${OMNIVITA_PGDATA:-$HOME/.local/share/omnivita/postgres}"
  local pglog="${OMNIVITA_PGLOG:-$HOME/.local/share/omnivita/postgres.log}"
  if ! command -v pg_ctl >/dev/null 2>&1 || ! command -v initdb >/dev/null 2>&1 || ! command -v psql >/dev/null 2>&1; then
    echo "Aviso: ferramentas do PostgreSQL nao encontradas no PATH. Vou tentar subir o backend mesmo assim."
    return
  fi
  if [ ! -s "$pgdata/PG_VERSION" ]; then
    mkdir -p "$(dirname "$pgdata")"
    initdb -D "$pgdata" -U postgres --auth=trust >> "$BACKEND_LOG" 2>&1
  fi
  if ! pg_ctl -D "$pgdata" status >/dev/null 2>&1; then
    pg_ctl -D "$pgdata" -l "$pglog" -o "-p 5432 -h 127.0.0.1" start >> "$BACKEND_LOG" 2>&1
  fi
  if ! psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='omnivita'" | grep -q 1; then
    createdb -h 127.0.0.1 -p 5432 -U postgres omnivita >> "$BACKEND_LOG" 2>&1
  fi
}

wait_for_backend() {
  local url="http://localhost:$BACKEND_PORT/health"
  for _ in $(seq 1 60); do
    if curl -fsS "$url" 2>/dev/null | grep -q '"ok":true'; then
      return 0
    fi
    sleep 0.5
  done
  echo "Backend nao ficou pronto em 30 segundos."
  echo "Ultimas linhas de $BACKEND_LOG:"
  tail -n 80 "$BACKEND_LOG" || true
  exit 1
}

wait_for_frontend() {
  local url="http://localhost:$FRONTEND_PORT"
  for _ in $(seq 1 60); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.5
  done
  echo "Frontend nao ficou pronto em 30 segundos."
  echo "Ultimas linhas de $FRONTEND_LOG:"
  tail -n 80 "$FRONTEND_LOG" || true
  exit 1
}

copy_to_clipboard() {
  local url="$1"
  if [ "$COPY_LINK" != "1" ]; then
    return
  fi
  if command -v wl-copy >/dev/null 2>&1; then
    printf "%s" "$url" | wl-copy && echo "Link copiado para a area de transferencia."
    return
  fi
  if command -v xclip >/dev/null 2>&1; then
    printf "%s" "$url" | xclip -selection clipboard && echo "Link copiado para a area de transferencia."
    return
  fi
  if command -v xsel >/dev/null 2>&1; then
    printf "%s" "$url" | xsel --clipboard --input && echo "Link copiado para a area de transferencia."
    return
  fi
  echo "Nao foi possivel copiar automaticamente. Instale xclip ou wl-clipboard."
}

open_browser() {
  local url="$1"
  if [ "$OPEN_BROWSER" != "1" ]; then
    return
  fi
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$url" >/dev/null 2>&1 || true
  fi
}

wait_for_cloudflare_url() {
  local url=""
  for _ in $(seq 1 120); do
    url="$(grep -Eo 'https://[a-zA-Z0-9.-]+\.trycloudflare\.com' "$CLOUDFLARED_LOG" | tail -n 1 || true)"
    if [ -n "$url" ]; then
      printf "%s" "$url"
      return 0
    fi
    sleep 0.5
  done
  return 1
}

wait_for_public_url() {
  local url="$1"
  echo "Aguardando DNS/Cloudflare ficar acessivel..."
  for _ in $(seq 1 120); do
    if curl -fsS --max-time 6 "$url/health" >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.5
  done
  return 1
}

start_cloudflared() {
  if [ -n "$CLOUDFLARED_PID" ] && kill -0 "$CLOUDFLARED_PID" >/dev/null 2>&1; then
    pkill -TERM -P "$CLOUDFLARED_PID" >/dev/null 2>&1 || true
    kill "$CLOUDFLARED_PID" >/dev/null 2>&1 || true
    wait "$CLOUDFLARED_PID" >/dev/null 2>&1 || true
  fi
  (
    cloudflared tunnel --url "http://localhost:$FRONTEND_PORT"
  ) >> "$CLOUDFLARED_LOG" 2>&1 &
  CLOUDFLARED_PID=$!
}

print_ready() {
  local url="$1"
  echo
  echo "============================================================"
  echo "OMNIVITA ONLINE"
  echo "============================================================"
  echo
  echo "Mestre:"
  echo "$url/mestre"
  echo
  echo "Players:"
  echo "$url"
  echo
  echo "Debug:"
  echo "$url/debug-connection"
  echo
  echo "Local:"
  echo "http://localhost:$FRONTEND_PORT"
  echo
  echo "Logs:"
  echo "logs/backend.log"
  echo "logs/frontend.log"
  echo "logs/cloudflared.log"
  echo
  echo "O link foi salvo em:"
  echo ".omnivita-cloudflare-url"
  echo
  echo "============================================================"
  echo
}

check_dependencies
handle_existing_port "$BACKEND_PORT"
handle_existing_port "$FRONTEND_PORT"
ensure_backend_env
ensure_node_modules "$PROJECT_ROOT/backend" "$BACKEND_LOG"
ensure_node_modules "$PROJECT_ROOT/frontend" "$FRONTEND_LOG"
ensure_postgres_if_available

export OMNIVITA_API_PROXY_TARGET="${OMNIVITA_API_PROXY_TARGET:-http://127.0.0.1:$BACKEND_PORT}"
export OMNIVITA_FRONTEND_PORT="$FRONTEND_PORT"

if [ -f "$PROJECT_ROOT/scripts/set-runtime-api-url.mjs" ]; then
  node "$PROJECT_ROOT/scripts/set-runtime-api-url.mjs" --relative >> "$FRONTEND_LOG" 2>&1 || true
fi

echo "Aplicando migrations..."
npm --prefix "$PROJECT_ROOT/backend" run migrate >> "$BACKEND_LOG" 2>&1

echo "Subindo backend em http://localhost:$BACKEND_PORT ..."
(
  cd "$PROJECT_ROOT/backend"
  PORT="$BACKEND_PORT" HOST="${BACKEND_HOST:-0.0.0.0}" npm run dev
) >> "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!
wait_for_backend

echo "Subindo frontend em http://localhost:$FRONTEND_PORT ..."
(
  cd "$PROJECT_ROOT/frontend"
  npm run dev -- --host "$FRONTEND_HOST" --port "$FRONTEND_PORT"
) >> "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!
wait_for_frontend

echo "Subindo Cloudflare Quick Tunnel..."
PUBLIC_READY=0
CLOUDFLARE_URL=""
for attempt in 1 2 3; do
  echo "--- tentativa cloudflared $attempt ---" >> "$CLOUDFLARED_LOG"
  start_cloudflared
  if CLOUDFLARE_URL="$(wait_for_cloudflare_url)" && wait_for_public_url "$CLOUDFLARE_URL"; then
    PUBLIC_READY=1
    break
  fi
  echo "O link ainda nao resolveu pelo DNS. Reiniciando cloudflared para pedir outro link..."
done

if [ "$PUBLIC_READY" = "1" ]; then
  printf "%s\n" "$CLOUDFLARE_URL" > "$URL_FILE"
  print_ready "$CLOUDFLARE_URL"
  copy_to_clipboard "$CLOUDFLARE_URL"
  open_browser "$CLOUDFLARE_URL$OPEN_PATH"
else
  echo
  echo "Capturei o link, mas ele nao ficou acessivel pelo DNS/Cloudflare em tempo util."
  if [ -n "$CLOUDFLARE_URL" ]; then
    echo "Ultimo link tentado: $CLOUDFLARE_URL"
    printf "%s\n" "$CLOUDFLARE_URL" > "$URL_FILE"
  else
    echo "Nao consegui capturar o link trycloudflare.com em 60 segundos."
  fi
  echo "Ultimas linhas de $CLOUDFLARED_LOG:"
  tail -n 120 "$CLOUDFLARED_LOG" || true
  if [ -f "$HOME/.cloudflared/config.yml" ] || [ -f "$HOME/.cloudflared/config.yaml" ]; then
    echo
    echo "Aviso: Quick Tunnel pode nao funcionar se existir config.yaml/config.yml em ~/.cloudflared."
  fi
  echo
  echo "Backend e frontend continuam rodando. Pressione Ctrl+C para encerrar."
fi

wait "$BACKEND_PID" "$FRONTEND_PID" "$CLOUDFLARED_PID"
