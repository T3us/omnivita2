#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$HOME/.local/share/applications"
APP_FILE="$APP_DIR/omnivita-cloudflare.desktop"
DESKTOP_NAME="OmniVita Cloudflare.desktop"
TERMINAL_WRAPPER="$PROJECT_ROOT/open-omnivita-cloudflare-terminal.sh"

mkdir -p "$APP_DIR"
chmod +x "$TERMINAL_WRAPPER"

cat > "$APP_FILE" <<DESKTOP
[Desktop Entry]
Name=OmniVita Cloudflare
Comment=Iniciar OmniVita com Cloudflare Tunnel
Exec="$TERMINAL_WRAPPER"
Icon=utilities-terminal
Terminal=false
Type=Application
Categories=Game;Development;
DESKTOP

chmod +x "$APP_FILE"

copy_to_desktop_dir() {
  local dir="$1"
  if [ -d "$dir" ]; then
    cp "$APP_FILE" "$dir/$DESKTOP_NAME"
    chmod +x "$dir/$DESKTOP_NAME"
    echo "Atalho criado em: $dir/$DESKTOP_NAME"
  fi
}

copy_to_desktop_dir "$HOME/Desktop"
copy_to_desktop_dir "$HOME/Área de Trabalho"

echo "Atalho criado em: $APP_FILE"
echo "Procure por OmniVita Cloudflare no menu de aplicativos."
