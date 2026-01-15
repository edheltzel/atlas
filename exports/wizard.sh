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

# Identity configuration
AI_NAME="Atlas"
USER_NAME=""

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

# Configure identity
configure_identity() {
  echo ""
  echo -e "${BOLD}${CYAN}━━━ Identity Configuration ━━━${NC}"
  echo ""
  echo -e "Configure your AI assistant's identity."
  echo ""

  # AI Name
  read -p "AI Assistant name [Atlas]: " input_ai_name
  AI_NAME="${input_ai_name:-Atlas}"

  # User Name
  read -p "Your name: " input_user_name
  USER_NAME="${input_user_name}"

  if [ -z "$USER_NAME" ]; then
    echo -e "${YELLOW}No name provided - will use generic greeting${NC}"
  fi

  echo ""
  echo -e "${GREEN}Identity configured:${NC}"
  echo -e "  AI Name: ${BOLD}$AI_NAME${NC}"
  if [ -n "$USER_NAME" ]; then
    echo -e "  User: ${BOLD}$USER_NAME${NC}"
  fi
  echo ""
}

# Update CORE skill with identity
update_core_identity() {
  local skill_file="$CLAUDE_DIR/skills/CORE/SKILL.md"

  if [ ! -f "$skill_file" ]; then
    return
  fi

  # Update AI name
  if [ -n "$AI_NAME" ] && [ "$AI_NAME" != "Atlas" ]; then
    sed -i '' "s/- Name: Atlas/- Name: $AI_NAME/g" "$skill_file" 2>/dev/null || true
  fi

  # Update user name
  if [ -n "$USER_NAME" ]; then
    sed -i '' "s/- Name: Ed/- Name: $USER_NAME/g" "$skill_file" 2>/dev/null || true
    sed -i '' "s/Ed's AI assistant/$USER_NAME's AI assistant/g" "$skill_file" 2>/dev/null || true
  fi

  # Update voice greeting in hook
  local hook_file="$CLAUDE_DIR/hooks/load-core-context.ts"
  if [ -f "$hook_file" ] && [ -n "$USER_NAME" ]; then
    sed -i '' "s/Hello, Ed\. Atlas, standing by\./Hello, $USER_NAME. $AI_NAME, standing by./g" "$hook_file" 2>/dev/null || true
    sed -i '' "s/message: 'Hello, Ed/message: 'Hello, $USER_NAME/g" "$hook_file" 2>/dev/null || true
  fi

  echo -e "${GREEN}  ✓ Identity configured in CORE skill${NC}"
}

# Install selected modules
install_modules() {
  # Configure identity first
  configure_identity

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

  # Update identity in CORE skill if it was installed
  if [ "${SELECTED_MODULES[core]}" = "1" ]; then
    update_core_identity
  fi

  echo ""
  echo -e "${GREEN}${BOLD}Installation complete!${NC}"
  echo ""
  echo -e "Your AI assistant ${BOLD}$AI_NAME${NC} is ready."
  echo ""
  echo "Next steps:"
  echo "  1. Add any required API keys to ~/.claude/.env"
  echo "  2. Start a new Claude Code session"
  echo ""
  if [ -n "$USER_NAME" ]; then
    echo -e "${CYAN}$AI_NAME will greet you as $USER_NAME${NC}"
  fi
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
    echo "       wizard.sh --install --ai-name MyAI --user-name John module1 module2"
    exit 1
  fi

  # Parse flags
  while [[ $# -gt 0 ]]; do
    case $1 in
      --ai-name)
        AI_NAME="$2"
        shift 2
        ;;
      --user-name)
        USER_NAME="$2"
        shift 2
        ;;
      *)
        if [ -n "${MODULE_DESCRIPTIONS[$1]}" ]; then
          SELECTED_MODULES[$1]="1"
        else
          echo "Unknown module: $1"
        fi
        shift
        ;;
    esac
  done

  # Skip interactive identity config if flags provided
  if [ -n "$USER_NAME" ]; then
    configure_identity() {
      echo -e "${GREEN}Identity configured via flags:${NC}"
      echo -e "  AI Name: ${BOLD}$AI_NAME${NC}"
      echo -e "  User: ${BOLD}$USER_NAME${NC}"
    }
  fi

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
