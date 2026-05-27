#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

BACKEND_PORT="${BACKEND_PORT:-3001}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
FRONTEND_HOST="${FRONTEND_HOST:-0.0.0.0}"
BACKEND_ORIGIN="${BACKEND_ORIGIN:-http://127.0.0.1:$BACKEND_PORT}"
FRONTEND_ORIGIN="${FRONTEND_ORIGIN:-http://127.0.0.1:$FRONTEND_PORT}"
OPEN_PATH="${OPEN_PATH:-/tabletop}"
OPEN_BROWSER="${OPEN_BROWSER:-1}"
COPY_LINK="${COPY_LINK:-1}"
STOP_EXISTING="${OMNIVITA_STOP_EXISTING:-auto}"
STOP_OLD_CLOUDFLARED="${OMNIVITA_STOP_OLD_CLOUDFLARED:-1}"
CLOUDFLARE_MAX_ATTEMPTS="${CLOUDFLARE_MAX_ATTEMPTS:-3}"
LOG_DIR="$PROJECT_ROOT/logs"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"
CLOUDFLARED_LOG="$LOG_DIR/cloudflared.log"
URL_FILE="$PROJECT_ROOT/.omnivita-cloudflare-url"

BACKEND_PID=""
FRONTEND_PID=""
CLOUDFLARED_PID=""
LAST_CLOUDFLARE_STATUS=""
CLEANED_UP=0

mkdir -p "$LOG_DIR"
: > "$BACKEND_LOG"
: > "$FRONTEND_LOG"
: > "$CLOUDFLARED_LOG"
rm -f "$URL_FILE"

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

kill_process_tree() {
  local pid="$1"
  if [ -z "$pid" ] || ! kill -0 "$pid" >/dev/null 2>&1; then
    return
  fi
  pkill -TERM -P "$pid" >/dev/null 2>&1 || true
  kill "$pid" >/dev/null 2>&1 || true
  sleep 0.4
  pkill -KILL -P "$pid" >/dev/null 2>&1 || true
  kill -0 "$pid" >/dev/null 2>&1 && kill -KILL "$pid" >/dev/null 2>&1 || true
}

cleanup() {
  if [ "$CLEANED_UP" = "1" ]; then
    return
  fi
  CLEANED_UP=1
  echo
  echo "Encerrando OmniVita..."
  kill_process_tree "$CLOUDFLARED_PID"
  kill_process_tree "$FRONTEND_PID"
  kill_process_tree "$BACKEND_PID"
  echo "OmniVita encerrado."
}

trap 'cleanup; exit 130' INT TERM
trap cleanup EXIT

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

port_pids() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true
    return
  fi
  if command -v fuser >/dev/null 2>&1; then
    fuser "${port}/tcp" 2>/dev/null || true
    return
  fi
}

port_in_use() {
  local port="$1"
  if command -v ss >/dev/null 2>&1; then
    ss -ltn "( sport = :$port )" | grep -q ":$port"
    return
  fi
  [ -n "$(port_pids "$port")" ]
}

pid_belongs_to_project() {
  local pid="$1"
  local cmdline cwd
  cmdline="$(tr '\0' ' ' < "/proc/$pid/cmdline" 2>/dev/null || true)"
  cwd="$(readlink -f "/proc/$pid/cwd" 2>/dev/null || true)"
  [[ "$cmdline" == *"$PROJECT_ROOT"* || "$cwd" == "$PROJECT_ROOT"* ]]
}

handle_existing_port() {
  local port="$1"
  if ! port_in_use "$port"; then
    return
  fi

  local pids
  pids="$(port_pids "$port" | tr ' ' '\n' | sed '/^$/d' | sort -u || true)"
  if [ -z "$pids" ]; then
    die "A porta $port ja esta em uso, mas nao consegui identificar o processo. Feche manualmente ou instale lsof/fuser."
  fi

  local can_stop=1
  local pid
  if [ "$STOP_EXISTING" != "1" ]; then
    while read -r pid; do
      [ -z "$pid" ] && continue
      if ! pid_belongs_to_project "$pid"; then
        can_stop=0
      fi
    done <<< "$pids"
  fi

  if [ "$STOP_EXISTING" = "1" ] || { [ "$STOP_EXISTING" = "auto" ] && [ "$can_stop" = "1" ]; }; then
    echo "Porta $port ocupada por processo antigo do OmniVita. Encerrando para iniciar limpo..."
    while read -r pid; do
      [ -z "$pid" ] && continue
      kill_process_tree "$pid"
    done <<< "$pids"
    sleep 1
    if port_in_use "$port"; then
      die "A porta $port continuou ocupada apos tentar encerrar o processo antigo."
    fi
    return
  fi

  die "A porta $port ja esta em uso por outro processo. Feche-o ou rode com OMNIVITA_STOP_EXISTING=1."
}

stop_old_cloudflared_tunnels() {
  if [ "$STOP_OLD_CLOUDFLARED" != "1" ] || ! command -v pgrep >/dev/null 2>&1; then
    return
  fi
  local pids
  pids="$(pgrep -f 'cloudflared.*tunnel.*--url' 2>/dev/null || true)"
  if [ -z "$pids" ]; then
    return
  fi
  echo "Encerrando Quick Tunnel antigo do cloudflared..."
  local pid
  while read -r pid; do
    [ -z "$pid" ] && continue
    [ "$pid" = "$$" ] && continue
    kill_process_tree "$pid"
  done <<< "$pids"
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

http_status() {
  local url="$1"
  local status
  status="$(curl -sS -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 12 --location --max-redirs 3 "$url" 2>/dev/null)" || status="000"
  printf "%s" "${status:-000}"
}

is_good_status() {
  case "$1" in
    200|204|301|302|304) return 0 ;;
    *) return 1 ;;
  esac
}

is_bad_origin_status() {
  case "$1" in
    502|503|504) return 0 ;;
    *) return 1 ;;
  esac
}

wait_for_http() {
  local url="$1"
  local timeout_seconds="$2"
  local name="$3"
  local log_file="${4:-}"
  local expected="${5:-}"

  echo "Aguardando $name responder em $url ..."
  local status
  for _ in $(seq 1 "$timeout_seconds"); do
    status="$(http_status "$url")"
    if is_good_status "$status"; then
      if [ -n "$expected" ]; then
        if curl -fsS --connect-timeout 3 --max-time 6 "$url" 2>/dev/null | grep -q "$expected"; then
          echo "$name OK."
          return 0
        fi
      else
        echo "$name OK."
        return 0
      fi
    fi
    sleep 1
  done

  echo "$name nao respondeu em ${timeout_seconds}s. Ultimo HTTP: $status"
  if [ -n "$log_file" ]; then
    echo "Ultimas linhas de $log_file:"
    tail -n 80 "$log_file" || true
  fi
  return 1
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
    xdg-open "$url" >/dev/null 2>&1 || echo "Nao consegui abrir o navegador automaticamente: $url"
  else
    echo "xdg-open nao encontrado. Abra manualmente: $url"
  fi
}

stop_cloudflared() {
  kill_process_tree "$CLOUDFLARED_PID"
  CLOUDFLARED_PID=""
}

start_cloudflared() {
  stop_cloudflared
  : > "$CLOUDFLARED_LOG"
  echo "Iniciando cloudflared apontando para $FRONTEND_ORIGIN ..."
  (
    cloudflared tunnel --url "$FRONTEND_ORIGIN"
  ) >> "$CLOUDFLARED_LOG" 2>&1 &
  CLOUDFLARED_PID=$!
}

wait_for_trycloudflare_url() {
  echo "Aguardando Cloudflare gerar link..."
  local url
  for _ in $(seq 1 60); do
    url="$(grep -Eo 'https://[a-zA-Z0-9.-]+\.trycloudflare\.com' "$CLOUDFLARED_LOG" | tail -n 1 || true)"
    if [ -n "$url" ]; then
      printf "%s" "$url"
      return 0
    fi
    if [ -n "$CLOUDFLARED_PID" ] && ! kill -0 "$CLOUDFLARED_PID" >/dev/null 2>&1; then
      return 1
    fi
    sleep 1
  done
  return 1
}

validate_cloudflare_url() {
  local url="$1"
  local root_status tabletop_status debug_status health_status
  echo "Validando link Cloudflare antes de copiar/abrir..."

  for _ in $(seq 1 45); do
    root_status="$(http_status "$url/")"
    tabletop_status="$(http_status "$url/tabletop")"
    debug_status="$(http_status "$url/debug-connection")"
    health_status="$(http_status "$url/health")"
    LAST_CLOUDFLARE_STATUS="root=$root_status tabletop=$tabletop_status debug=$debug_status health=$health_status"

    if is_bad_origin_status "$root_status" || is_bad_origin_status "$tabletop_status" || is_bad_origin_status "$debug_status" || is_bad_origin_status "$health_status"; then
      echo "Cloudflare retornou erro de origem: $LAST_CLOUDFLARE_STATUS"
      return 1
    fi

    if is_good_status "$root_status" && is_good_status "$tabletop_status" && is_good_status "$debug_status" && is_good_status "$health_status"; then
      echo "Cloudflare OK: $LAST_CLOUDFLARE_STATUS"
      return 0
    fi

    sleep 1
  done

  echo "Cloudflare nao validou em tempo util: $LAST_CLOUDFLARE_STATUS"
  return 1
}

print_config_warning_if_needed() {
  if [ -f "$HOME/.cloudflared/config.yml" ] || [ -f "$HOME/.cloudflared/config.yaml" ]; then
    echo
    echo "Aviso: Quick Tunnel pode falhar se houver config.yaml/config.yml em ~/.cloudflared."
  fi
}

print_failure_diagnostics() {
  echo
  echo "Nao consegui gerar um link Cloudflare valido."
  echo
  echo "Diagnostico:"
  echo "- Backend local /health: $(http_status "$BACKEND_ORIGIN/health")"
  echo "- Frontend local: $(http_status "$FRONTEND_ORIGIN")"
  echo "- Ultimo Cloudflare: ${LAST_CLOUDFLARE_STATUS:-sem status}"
  echo
  echo "Logs:"
  echo "- $BACKEND_LOG"
  echo "- $FRONTEND_LOG"
  echo "- $CLOUDFLARED_LOG"
  echo
  echo "Ultimas linhas de $CLOUDFLARED_LOG:"
  tail -n 120 "$CLOUDFLARED_LOG" || true
  print_config_warning_if_needed
  if [ -n "$CLOUDFLARE_URL" ] && is_good_status "$(http_status "$CLOUDFLARE_URL/debug-connection")"; then
    echo
    echo "Abrindo /debug-connection do ultimo link para diagnostico..."
    open_browser "$CLOUDFLARE_URL/debug-connection"
  fi
  echo
  echo "Backend e frontend continuam rodando enquanto este terminal estiver aberto."
  echo "Pressione Ctrl+C para encerrar."
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
  echo "Tabletop:"
  echo "$url/tabletop"
  echo
  echo "Players:"
  echo "$url"
  echo
  echo "Debug:"
  echo "$url/debug-connection"
  echo
  echo "Local:"
  echo "$FRONTEND_ORIGIN"
  echo
  echo "Logs:"
  echo "logs/backend.log"
  echo "logs/frontend.log"
  echo "logs/cloudflared.log"
  echo
  echo "Link validado e copiado."
  echo "O link foi salvo em:"
  echo ".omnivita-cloudflare-url"
  echo
  echo "============================================================"
  echo
}

check_dependencies
stop_old_cloudflared_tunnels
handle_existing_port "$BACKEND_PORT"
handle_existing_port "$FRONTEND_PORT"
ensure_backend_env
ensure_node_modules "$PROJECT_ROOT/backend" "$BACKEND_LOG"
ensure_node_modules "$PROJECT_ROOT/frontend" "$FRONTEND_LOG"
ensure_postgres_if_available

export OMNIVITA_API_PROXY_TARGET="${OMNIVITA_API_PROXY_TARGET:-$BACKEND_ORIGIN}"
export OMNIVITA_FRONTEND_PORT="$FRONTEND_PORT"

if [ -f "$PROJECT_ROOT/scripts/set-runtime-api-url.mjs" ]; then
  node "$PROJECT_ROOT/scripts/set-runtime-api-url.mjs" --relative >> "$FRONTEND_LOG" 2>&1 || true
fi

echo "Aplicando migrations..."
npm --prefix "$PROJECT_ROOT/backend" run migrate >> "$BACKEND_LOG" 2>&1

echo "Subindo backend em $BACKEND_ORIGIN ..."
(
  cd "$PROJECT_ROOT/backend"
  PORT="$BACKEND_PORT" HOST="${BACKEND_HOST:-0.0.0.0}" npm run dev
) >> "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!
wait_for_http "$BACKEND_ORIGIN/health" 60 "backend" "$BACKEND_LOG" '"ok":true' || exit 1

echo "Subindo frontend em $FRONTEND_ORIGIN ..."
(
  cd "$PROJECT_ROOT/frontend"
  npm run dev -- --host "$FRONTEND_HOST" --port "$FRONTEND_PORT" --strictPort
) >> "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!
wait_for_http "$FRONTEND_ORIGIN" 60 "frontend" "$FRONTEND_LOG" || exit 1

echo "Local OK. Agora vou iniciar o Cloudflare Quick Tunnel."
PUBLIC_READY=0
CLOUDFLARE_URL=""

for attempt in $(seq 1 "$CLOUDFLARE_MAX_ATTEMPTS"); do
  echo
  echo "Tentativa Cloudflare $attempt/$CLOUDFLARE_MAX_ATTEMPTS"
  start_cloudflared
  if CLOUDFLARE_URL="$(wait_for_trycloudflare_url)"; then
    echo "Link capturado: $CLOUDFLARE_URL"
    if validate_cloudflare_url "$CLOUDFLARE_URL"; then
      PUBLIC_READY=1
      break
    fi
  else
    echo "Cloudflare nao gerou link em 60s."
  fi

  echo "Link rejeitado. Reiniciando apenas o cloudflared e tentando outro link..."
  stop_cloudflared
  wait_for_http "$FRONTEND_ORIGIN" 15 "frontend local antes de nova tentativa" "$FRONTEND_LOG" || true
  sleep 2
done

if [ "$PUBLIC_READY" = "1" ]; then
  printf "%s\n" "$CLOUDFLARE_URL" > "$URL_FILE"
  print_ready "$CLOUDFLARE_URL"
  copy_to_clipboard "$CLOUDFLARE_URL"
  open_browser "$CLOUDFLARE_URL$OPEN_PATH"
else
  rm -f "$URL_FILE"
  print_failure_diagnostics
fi

while true; do
  sleep 3600
done
