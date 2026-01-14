#!/bin/bash
# Atlas Install Wizard
# Interactive installer for Claude Code modules

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODULES_DIR="$SCRIPT_DIR/modules"
CLAUDE_DIR="${CLAUDE_DIR:-$HOME/.claude}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Module state
declare -A SELECTED_MODULES
declare -A MODULE_DESCRIPTIONS

# Get all available modules
get_modules() {
  for dir in "$MODULES_DIR"/*/; do
    if [ -f "${dir}module.json" ]; then
      name=$(basename "$dir")
      desc=$(cat "${dir}module.json" | grep -o '"description": *"[^"]*"' | sed 's/"description": *"\([^"]*\)"/\1/')
      MODULE_DESCRIPTIONS[$name]="$desc"
    fi
  done
}

# Print header
print_header() {
  clear
  echo -e "${CYAN}"
  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║                                                              ║"
  echo "║               ${BOLD}Atlas Module Install Wizard${NC}${CYAN}                   ║"
  echo "║                                                              ║"
  echo "║      Modular extensions for Claude Code                      ║"
  echo "║                                                              ║"
  echo "╚══════════════════════════════════════════════════════════════╝"
  echo -e "${NC}"
  echo ""
}

# Print module list with selection state
print_modules() {
  echo -e "${BOLD}Available Modules:${NC}"
  echo ""

  local i=1
  for name in "${!MODULE_DESCRIPTIONS[@]}"; do
    if [ "${SELECTED_MODULES[$name]}" = "1" ]; then
      echo -e "  ${GREEN}[$i] [✓] $name${NC}"
    else
      echo -e "  ${YELLOW}[$i] [ ] $name${NC}"
    fi
    echo -e "      ${MODULE_DESCRIPTIONS[$name]}"
    echo ""
    ((i++))
  done
}

# Toggle module selection
toggle_module() {
  local index=$1
  local i=1
  for name in "${!MODULE_DESCRIPTIONS[@]}"; do
    if [ $i -eq $index ]; then
      if [ "${SELECTED_MODULES[$name]}" = "1" ]; then
        SELECTED_MODULES[$name]="0"
      else
        SELECTED_MODULES[$name]="1"
      fi
      return
    fi
    ((i++))
  done
}

# Select all modules
select_all() {
  for name in "${!MODULE_DESCRIPTIONS[@]}"; do
    SELECTED_MODULES[$name]="1"
  done
}

# Install selected modules
install_modules() {
  echo ""
  echo -e "${BOLD}Installing selected modules...${NC}"
  echo ""

  # Create base directories
  mkdir -p "$CLAUDE_DIR/hooks/lib"
  mkdir -p "$CLAUDE_DIR/skills"
  mkdir -p "$CLAUDE_DIR/commands"

  # Initialize settings.json if it doesn't exist
  if [ ! -f "$CLAUDE_DIR/settings.json" ]; then
    echo '{"env": {"PAI_DIR": "'$CLAUDE_DIR'"}, "hooks": {}}' > "$CLAUDE_DIR/settings.json"
  fi

  # Initialize atlas.yaml if it doesn't exist
  if [ ! -f "$CLAUDE_DIR/atlas.yaml" ]; then
    echo "# Atlas Configuration" > "$CLAUDE_DIR/atlas.yaml"
  fi

  for name in "${!SELECTED_MODULES[@]}"; do
    if [ "${SELECTED_MODULES[$name]}" = "1" ]; then
      echo -e "${BLUE}Installing $name...${NC}"
      install_module "$name"
    fi
  done

  echo ""
  echo -e "${GREEN}${BOLD}Installation complete!${NC}"
  echo ""
  echo "Next steps:"
  echo "  1. Review ~/.claude/settings.json"
  echo "  2. Add any required API keys to ~/.claude/.env"
  echo "  3. Start a new Claude Code session"
}

# Install a single module
install_module() {
  local name=$1
  local module_dir="$MODULES_DIR/$name"
  local module_json="$module_dir/module.json"

  if [ ! -f "$module_json" ]; then
    echo -e "${RED}  Module $name not found${NC}"
    return 1
  fi

  # Copy files
  for item in "$module_dir"/*; do
    if [ -d "$item" ] && [ "$(basename "$item")" != "commands" ]; then
      local dest_name=$(basename "$item")
      cp -r "$item" "$CLAUDE_DIR/$dest_name" 2>/dev/null || true
    elif [ -f "$item" ] && [ "$(basename "$item")" != "module.json" ]; then
      cp "$item" "$CLAUDE_DIR/" 2>/dev/null || true
    fi
  done

  # Copy commands if they exist
  if [ -d "$module_dir/commands" ]; then
    mkdir -p "$CLAUDE_DIR/commands/atlas"
    cp -r "$module_dir/commands/"* "$CLAUDE_DIR/commands/" 2>/dev/null || true
  fi

  # Merge hooks into settings.json using bun
  if command -v bun &> /dev/null; then
    bun run "$SCRIPT_DIR/merge-hooks.ts" "$module_json" "$CLAUDE_DIR/settings.json" 2>/dev/null || true
  fi

  echo -e "${GREEN}  ✓ $name installed${NC}"
}

# Main interactive loop
main() {
  get_modules

  while true; do
    print_header
    print_modules

    echo -e "${BOLD}Commands:${NC}"
    echo "  [1-${#MODULE_DESCRIPTIONS[@]}] Toggle module"
    echo "  [a] Select all"
    echo "  [n] Select none"
    echo "  [i] Install selected"
    echo "  [q] Quit"
    echo ""
    read -p "Enter choice: " choice

    case $choice in
      [1-9])
        toggle_module $choice
        ;;
      a|A)
        select_all
        ;;
      n|N)
        for name in "${!MODULE_DESCRIPTIONS[@]}"; do
          SELECTED_MODULES[$name]="0"
        done
        ;;
      i|I)
        install_modules
        exit 0
        ;;
      q|Q)
        echo "Cancelled."
        exit 0
        ;;
    esac
  done
}

# Non-interactive mode
if [ "$1" = "--install" ]; then
  shift
  get_modules

  if [ $# -eq 0 ]; then
    echo "Usage: wizard.sh --install module1 module2 ..."
    exit 1
  fi

  for mod in "$@"; do
    if [ -n "${MODULE_DESCRIPTIONS[$mod]}" ]; then
      SELECTED_MODULES[$mod]="1"
    else
      echo "Unknown module: $mod"
    fi
  done

  install_modules
  exit 0
fi

# List mode
if [ "$1" = "--list" ]; then
  get_modules
  echo "Available modules:"
  for name in "${!MODULE_DESCRIPTIONS[@]}"; do
    echo "  $name - ${MODULE_DESCRIPTIONS[$name]}"
  done
  exit 0
fi

main
