#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMAND="cd '$PROJECT_ROOT' && exec ./start-omnivita-cloudflare.sh"

if command -v konsole >/dev/null 2>&1; then
  exec konsole --hold -e bash -lc "$COMMAND"
fi
if command -v gnome-terminal >/dev/null 2>&1; then
  exec gnome-terminal -- bash -lc "$COMMAND; echo; read -rp 'Pressione Enter para fechar...' _"
fi
if command -v xfce4-terminal >/dev/null 2>&1; then
  exec xfce4-terminal --hold -e "bash -lc \"$COMMAND\""
fi
if command -v kitty >/dev/null 2>&1; then
  exec kitty bash -lc "$COMMAND"
fi
if command -v alacritty >/dev/null 2>&1; then
  exec alacritty -e bash -lc "$COMMAND"
fi
if command -v xterm >/dev/null 2>&1; then
  exec xterm -hold -e bash -lc "$COMMAND"
fi

exec bash -lc "$COMMAND"
