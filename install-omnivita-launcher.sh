#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

chmod +x "$PROJECT_ROOT/start-omnivita-cloudflare.sh"
chmod +x "$PROJECT_ROOT/start-omnivita-simple.sh"
chmod +x "$PROJECT_ROOT/open-omnivita-cloudflare-terminal.sh"
chmod +x "$PROJECT_ROOT/create-desktop-launcher.sh"

"$PROJECT_ROOT/create-desktop-launcher.sh"

echo
echo "Launcher instalado."
echo "Procure por OmniVita Cloudflare no menu de aplicativos."
echo "Ou clique no atalho criado."
