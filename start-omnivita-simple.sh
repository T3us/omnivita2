#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

export OPEN_BROWSER=0
export COPY_LINK=0
export OPEN_PATH="${OPEN_PATH:-}"

exec "$SCRIPT_DIR/start-omnivita-cloudflare.sh"
