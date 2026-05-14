#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAMBA_ROOT_PREFIX="${MAMBA_ROOT_PREFIX:-$HOME/.local/share/micromamba}"
MICROMAMBA="${MICROMAMBA:-$HOME/.local/bin/micromamba}"
ENV_PREFIX="$MAMBA_ROOT_PREFIX/envs/omnivita"
PGDATA="${OMNIVITA_PGDATA:-$HOME/.local/share/omnivita/postgres}"
PGLOG="${OMNIVITA_PGLOG:-$HOME/.local/share/omnivita/postgres.log}"
API_ORIGIN="${OMNIVITA_API_ORIGIN:-http://localhost:3001}"
PUBLIC_API_URL="${OMNIVITA_PUBLIC_API_URL:-}"
SITE_HOST="${OMNIVITA_SITE_HOST:-0.0.0.0}"
SITE_PORT="${OMNIVITA_SITE_PORT:-5173}"
STOP_EXISTING="${OMNIVITA_STOP_EXISTING:-1}"

if [ ! -x "$MICROMAMBA" ] || [ ! -x "$ENV_PREFIX/bin/node" ]; then
  echo "Ambiente local omnivita nao encontrado." >&2
  echo "Esperado: $ENV_PREFIX" >&2
  exit 1
fi

export PATH="$ENV_PREFIX/bin:$PATH"

stop_port_listener() {
  local port="$1"
  if [ "$STOP_EXISTING" != "1" ]; then
    return
  fi
  if command -v fuser >/dev/null 2>&1 && fuser -s "${port}/tcp"; then
    echo "Encerrando processo na porta ${port}..."
    fuser -k "${port}/tcp" >/dev/null 2>&1 || true
    sleep 0.3
  fi
}

if [ ! -s "$PGDATA/PG_VERSION" ]; then
  mkdir -p "$(dirname "$PGDATA")"
  initdb -D "$PGDATA" -U postgres --auth=trust
fi

if ! pg_ctl -D "$PGDATA" status >/dev/null 2>&1; then
  pg_ctl -D "$PGDATA" -l "$PGLOG" -o "-p 5432 -h 127.0.0.1" start >/dev/null
fi

bash -lc "psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -tAc \"SELECT 1 FROM pg_database WHERE datname='omnivita'\" | grep -q 1 || createdb -h 127.0.0.1 -p 5432 -U postgres omnivita"

if [ ! -f "$REPO_ROOT/backend/.env" ]; then
  cp "$REPO_ROOT/backend/.env.example" "$REPO_ROOT/backend/.env"
fi

export OMNIVITA_API_PROXY_TARGET="${OMNIVITA_API_PROXY_TARGET:-http://127.0.0.1:3001}"

if [ -n "$PUBLIC_API_URL" ]; then
  node "$REPO_ROOT/scripts/set-runtime-api-url.mjs" "$PUBLIC_API_URL"
else
  node "$REPO_ROOT/scripts/set-runtime-api-url.mjs" --relative
fi

echo "API interna:  $API_ORIGIN"
echo "API no front: mesma origem (/api via proxy)"
echo "Site: http://localhost:$SITE_PORT"
echo

stop_port_listener 3001
stop_port_listener "$SITE_PORT"

BACKEND_PID=""
FRONTEND_PID=""

(
  cd "$REPO_ROOT/backend"
  npm run dev
) &
BACKEND_PID=$!

cleanup() {
  if [ -n "$BACKEND_PID" ]; then kill "$BACKEND_PID" >/dev/null 2>&1 || true; fi
  if [ -n "$FRONTEND_PID" ]; then kill "$FRONTEND_PID" >/dev/null 2>&1 || true; fi
}
trap cleanup EXIT INT TERM

for _ in $(seq 1 30); do
  if curl -fsS "$API_ORIGIN/health" >/dev/null 2>&1; then
    break
  fi
  sleep 0.3
done

(
  cd "$REPO_ROOT/frontend"
  npm run dev -- --host "$SITE_HOST" --port "$SITE_PORT"
) &
FRONTEND_PID=$!

wait "$BACKEND_PID" "$FRONTEND_PID"
