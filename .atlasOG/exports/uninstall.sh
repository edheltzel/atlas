#!/bin/bash
# Atlas Uninstaller
# Cleanly removes Atlas components from the system

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="${CLAUDE_DIR:-$HOME/.claude}"
SAFE_REMOVE_DIR="$HOME/safeToRemoveAtlas"
DOTFILES_DIR="$HOME/.dotfiles"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Options
DRY_RUN=false
FORCE=false
PURGE=false

# Atlas-installed directories to remove
ATLAS_DIRS=(
  "commands/atlas"
  "hooks"
  "lib"
  "security"
  "skills"
  "voice"
  "observability"
  "Bundles"
  "docs"
  "tools"
  "backlog"
)

# Atlas-installed files to remove
ATLAS_FILES=(
  "settings.json"
  "settings-hooks.json"
  "modules.json"
  "statusline.sh"
  "statusline-style.sh"
  "atlas.example.yaml"
  "voice-personalities.json"
  "README.md"
)

# User data to move to safeToRemoveAtlas
USER_DATA=(
  "MEMORY"
  "plans"
  ".env"
  "atlas.yaml"
  "history.jsonl"
  "projects"
  "agent-sessions.json"
)

# Runtime files to leave alone (created by Claude Code)
RUNTIME_FILES=(
  "debug"
  "file-history"
  "cache"
  "chrome"
  "paste-cache"
  ".current-session"
)

print_header() {
  echo -e "${CYAN}"
  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║                                                              ║"
  echo "║                   ${BOLD}Atlas Uninstaller${NC}${CYAN}                          ║"
  echo "║                                                              ║"
  echo "╚══════════════════════════════════════════════════════════════╝"
  echo -e "${NC}"
  echo ""
}

usage() {
  echo "Usage: $0 [OPTIONS]"
  echo ""
  echo "Options:"
  echo "  --dry-run     Preview what would be removed without making changes"
  echo "  --force       Skip confirmation prompts"
  echo "  --purge       Delete everything including user data (no safeToRemove)"
  echo "  --help        Show this help message"
  echo ""
}

# Detect installation mode
# Returns: stow, symlink, filecopy, or none
detect_install_mode() {
  if [ ! -d "$CLAUDE_DIR" ] && [ ! -L "$CLAUDE_DIR" ]; then
    echo "none"
    return
  fi

  if [ -L "$CLAUDE_DIR" ]; then
    echo "symlink"
    return
  fi

  # Check if hooks is a symlink pointing to dotfiles/atlas
  if [ -L "$CLAUDE_DIR/hooks" ]; then
    local target
    target=$(readlink "$CLAUDE_DIR/hooks" 2>/dev/null || true)
    if echo "$target" | grep -q "dotfiles/atlas"; then
      echo "stow"
      return
    fi
  fi

  # Check if any skill is a symlink to dotfiles/atlas
  if [ -d "$CLAUDE_DIR/skills" ]; then
    for skill in "$CLAUDE_DIR/skills"/*; do
      if [ -L "$skill" ]; then
        local target
        target=$(readlink "$skill" 2>/dev/null || true)
        if echo "$target" | grep -q "dotfiles/atlas"; then
          echo "stow"
          return
        fi
      fi
    done
  fi

  echo "filecopy"
}

# Stop running Atlas services
stop_services() {
  echo -e "${YELLOW}Stopping Atlas services...${NC}"

  # Stop voice server
  if pgrep -f "voice.*server" > /dev/null 2>&1; then
    if [ "$DRY_RUN" = true ]; then
      echo -e "  ${BLUE}[dry-run]${NC} Would kill voice server process"
    else
      pkill -f "voice.*server" 2>/dev/null || true
      echo -e "  ${GREEN}Stopped voice server${NC}"
    fi
  else
    echo -e "  ${CYAN}No voice server running${NC}"
  fi
}

# List what will be removed
list_removals() {
  local mode=$1

  echo -e "${BOLD}Installation mode detected:${NC} ${CYAN}$mode${NC}"
  echo ""

  case $mode in
    stow)
      echo -e "${BOLD}Will run:${NC} cd $DOTFILES_DIR && stow -D atlas"
      echo ""
      echo -e "${BOLD}This will remove symlinks:${NC}"
      # List actual symlinks that would be removed
      for item in "$CLAUDE_DIR"/*; do
        if [ -L "$item" ]; then
          local target
          target=$(readlink "$item" 2>/dev/null || true)
          if echo "$target" | grep -q "dotfiles/atlas"; then
            echo -e "  ${RED}$item${NC} -> $target"
          fi
        fi
      done
      ;;

    symlink)
      echo -e "${BOLD}Will remove symlinks:${NC}"
      if [ -L "$CLAUDE_DIR" ]; then
        local target
        target=$(readlink "$CLAUDE_DIR" 2>/dev/null || true)
        echo -e "  ${RED}$CLAUDE_DIR${NC} -> $target"
      fi
      if [ -L "$HOME/.config/opencode" ]; then
        local target
        target=$(readlink "$HOME/.config/opencode" 2>/dev/null || true)
        echo -e "  ${RED}$HOME/.config/opencode${NC} -> $target"
      fi
      ;;

    filecopy)
      echo -e "${BOLD}Will remove directories:${NC}"
      for dir in "${ATLAS_DIRS[@]}"; do
        if [ -d "$CLAUDE_DIR/$dir" ]; then
          echo -e "  ${RED}$CLAUDE_DIR/$dir${NC}"
        fi
      done

      echo ""
      echo -e "${BOLD}Will remove files:${NC}"
      for file in "${ATLAS_FILES[@]}"; do
        if [ -f "$CLAUDE_DIR/$file" ]; then
          echo -e "  ${RED}$CLAUDE_DIR/$file${NC}"
        fi
      done
      ;;
  esac

  # Show user data handling (only non-symlinks - real user data)
  local has_user_data=false
  for item in "${USER_DATA[@]}"; do
    if [ -e "$CLAUDE_DIR/$item" ] && [ ! -L "$CLAUDE_DIR/$item" ]; then
      has_user_data=true
      break
    fi
  done

  if [ "$has_user_data" = true ]; then
    echo ""
    if [ "$PURGE" = true ]; then
      echo -e "${BOLD}${RED}Will DELETE user data (--purge):${NC}"
    else
      echo -e "${BOLD}Will move to ${YELLOW}$SAFE_REMOVE_DIR${NC}${BOLD}:${NC}"
    fi

    for item in "${USER_DATA[@]}"; do
      # Only show non-symlinks (real user data, not repo links)
      if [ -e "$CLAUDE_DIR/$item" ] && [ ! -L "$CLAUDE_DIR/$item" ]; then
        if [ "$PURGE" = true ]; then
          echo -e "  ${RED}$CLAUDE_DIR/$item${NC}"
        else
          echo -e "  ${YELLOW}$CLAUDE_DIR/$item${NC}"
        fi
      fi
    done
  fi

  # Show opencode cleanup
  if [ -e "$HOME/.config/opencode" ]; then
    echo ""
    echo -e "${BOLD}Will remove:${NC}"
    echo -e "  ${RED}$HOME/.config/opencode${NC}"
  fi

  echo ""
}

# Confirm action
confirm() {
  if [ "$FORCE" = true ]; then
    return 0
  fi

  echo -e "${YELLOW}This action cannot be undone.${NC}"
  echo -n "Continue? [y/N] "
  read -r response
  case "$response" in
    [yY][eE][sS]|[yY])
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

# Move user data to safe location
# Skips symlinks (they point to repo, not real user data)
move_user_data() {
  if [ "$PURGE" = true ]; then
    echo -e "${YELLOW}Deleting user data (--purge)...${NC}"
    for item in "${USER_DATA[@]}"; do
      if [ -e "$CLAUDE_DIR/$item" ] && [ ! -L "$CLAUDE_DIR/$item" ]; then
        if [ "$DRY_RUN" = true ]; then
          echo -e "  ${BLUE}[dry-run]${NC} Would delete $CLAUDE_DIR/$item"
        else
          rm -rf "$CLAUDE_DIR/$item"
          echo -e "  ${RED}Deleted${NC} $item"
        fi
      fi
    done
  else
    echo -e "${YELLOW}Moving user data to $SAFE_REMOVE_DIR...${NC}"

    local has_data=false
    for item in "${USER_DATA[@]}"; do
      if [ -e "$CLAUDE_DIR/$item" ] && [ ! -L "$CLAUDE_DIR/$item" ]; then
        has_data=true
        break
      fi
    done

    if [ "$has_data" = false ]; then
      echo -e "  ${CYAN}No user data to move${NC}"
      return
    fi

    if [ "$DRY_RUN" = false ]; then
      mkdir -p "$SAFE_REMOVE_DIR"
    fi

    for item in "${USER_DATA[@]}"; do
      # Skip symlinks - they point to repo, not real user data
      if [ -e "$CLAUDE_DIR/$item" ] && [ ! -L "$CLAUDE_DIR/$item" ]; then
        if [ "$DRY_RUN" = true ]; then
          echo -e "  ${BLUE}[dry-run]${NC} Would move $item to $SAFE_REMOVE_DIR/"
        else
          mv "$CLAUDE_DIR/$item" "$SAFE_REMOVE_DIR/" 2>/dev/null || true
          echo -e "  ${GREEN}Moved${NC} $item"
        fi
      fi
    done
  fi
}

# Uninstall stow-based installation
uninstall_stow() {
  echo -e "${YELLOW}Removing stow symlinks...${NC}"

  if [ "$DRY_RUN" = true ]; then
    echo -e "  ${BLUE}[dry-run]${NC} Would run: cd $DOTFILES_DIR && stow -D atlas"
  else
    if command -v stow &> /dev/null; then
      cd "$DOTFILES_DIR" && stow -D atlas 2>/dev/null || true
      echo -e "  ${GREEN}Removed stow symlinks${NC}"
    else
      echo -e "  ${RED}stow not found, removing symlinks manually...${NC}"
      # Manually remove symlinks that point to dotfiles/atlas
      for item in "$CLAUDE_DIR"/*; do
        if [ -L "$item" ]; then
          local target
          target=$(readlink "$item" 2>/dev/null || true)
          if echo "$target" | grep -q "dotfiles/atlas"; then
            rm "$item"
            echo -e "  ${GREEN}Removed${NC} $item"
          fi
        fi
      done
    fi
  fi

  # Clean up empty directories left by stow
  # Stow creates real directories with symlinked contents
  echo -e "${YELLOW}Cleaning up empty directories...${NC}"
  if [ -d "$CLAUDE_DIR/skills" ]; then
    for dir in "$CLAUDE_DIR/skills"/*/; do
      if [ -d "$dir" ]; then
        # Check if directory is empty (only . and .. or .DS_Store)
        local count
        count=$(find "$dir" -mindepth 1 ! -name '.DS_Store' 2>/dev/null | wc -l | tr -d ' ')
        if [ "$count" -eq 0 ]; then
          if [ "$DRY_RUN" = true ]; then
            echo -e "  ${BLUE}[dry-run]${NC} Would remove empty dir: $dir"
          else
            rm -rf "$dir"
            echo -e "  ${GREEN}Removed empty${NC} $(basename "$dir")/"
          fi
        fi
      fi
    done
    # Remove skills dir if empty
    local skills_count
    skills_count=$(find "$CLAUDE_DIR/skills" -mindepth 1 ! -name '.DS_Store' 2>/dev/null | wc -l | tr -d ' ')
    if [ "$skills_count" -eq 0 ]; then
      if [ "$DRY_RUN" = true ]; then
        echo -e "  ${BLUE}[dry-run]${NC} Would remove empty dir: $CLAUDE_DIR/skills"
      else
        rm -rf "$CLAUDE_DIR/skills"
        echo -e "  ${GREEN}Removed empty${NC} skills/"
      fi
    fi
  fi
}

# Uninstall direct symlink installation
uninstall_symlink() {
  echo -e "${YELLOW}Removing symlinks...${NC}"

  if [ -L "$CLAUDE_DIR" ]; then
    if [ "$DRY_RUN" = true ]; then
      echo -e "  ${BLUE}[dry-run]${NC} Would remove $CLAUDE_DIR"
    else
      rm "$CLAUDE_DIR"
      echo -e "  ${GREEN}Removed${NC} $CLAUDE_DIR"
    fi
  fi

  if [ -L "$HOME/.config/opencode" ]; then
    if [ "$DRY_RUN" = true ]; then
      echo -e "  ${BLUE}[dry-run]${NC} Would remove $HOME/.config/opencode"
    else
      rm "$HOME/.config/opencode"
      echo -e "  ${GREEN}Removed${NC} $HOME/.config/opencode"
    fi
  fi
}

# Uninstall file-copy installation
uninstall_filecopy() {
  echo -e "${YELLOW}Removing Atlas files...${NC}"

  # Remove directories
  for dir in "${ATLAS_DIRS[@]}"; do
    if [ -d "$CLAUDE_DIR/$dir" ]; then
      if [ "$DRY_RUN" = true ]; then
        echo -e "  ${BLUE}[dry-run]${NC} Would remove $CLAUDE_DIR/$dir"
      else
        rm -rf "$CLAUDE_DIR/$dir"
        echo -e "  ${GREEN}Removed${NC} $dir/"
      fi
    fi
  done

  # Remove files
  for file in "${ATLAS_FILES[@]}"; do
    if [ -f "$CLAUDE_DIR/$file" ]; then
      if [ "$DRY_RUN" = true ]; then
        echo -e "  ${BLUE}[dry-run]${NC} Would remove $CLAUDE_DIR/$file"
      else
        rm -f "$CLAUDE_DIR/$file"
        echo -e "  ${GREEN}Removed${NC} $file"
      fi
    fi
  done
}

# Clean up opencode config
cleanup_opencode() {
  if [ -e "$HOME/.config/opencode" ]; then
    echo -e "${YELLOW}Cleaning up opencode config...${NC}"
    if [ "$DRY_RUN" = true ]; then
      echo -e "  ${BLUE}[dry-run]${NC} Would remove $HOME/.config/opencode"
    else
      rm -rf "$HOME/.config/opencode"
      echo -e "  ${GREEN}Removed${NC} $HOME/.config/opencode"
    fi
  fi
}

# Print final status
print_status() {
  echo ""
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

  if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}Dry run complete. No changes were made.${NC}"
  else
    echo -e "${GREEN}Atlas uninstalled successfully.${NC}"

    if [ "$PURGE" = false ] && [ -d "$SAFE_REMOVE_DIR" ]; then
      echo ""
      echo -e "User data moved to: ${YELLOW}$SAFE_REMOVE_DIR${NC}"
      echo -e "Review and delete when ready: ${CYAN}rm -rf $SAFE_REMOVE_DIR${NC}"
    fi

    # Check what remains
    if [ -d "$CLAUDE_DIR" ]; then
      local remaining
      remaining=$(ls -A "$CLAUDE_DIR" 2>/dev/null | wc -l | tr -d ' ')
      if [ "$remaining" -gt 0 ]; then
        echo ""
        echo -e "Remaining in $CLAUDE_DIR (Claude Code runtime files):"
        ls -A "$CLAUDE_DIR" 2>/dev/null | head -10 | while read -r item; do
          echo -e "  ${CYAN}$item${NC}"
        done
      fi
    fi
  fi

  echo ""
}

# Main
main() {
  # Parse arguments
  while [[ $# -gt 0 ]]; do
    case $1 in
      --dry-run)
        DRY_RUN=true
        shift
        ;;
      --force)
        FORCE=true
        shift
        ;;
      --purge)
        PURGE=true
        shift
        ;;
      --help|-h)
        print_header
        usage
        exit 0
        ;;
      *)
        echo -e "${RED}Unknown option: $1${NC}"
        usage
        exit 1
        ;;
    esac
  done

  print_header

  # Detect installation mode
  local mode
  mode=$(detect_install_mode)

  if [ "$mode" = "none" ]; then
    echo -e "${YELLOW}No Atlas installation detected at $CLAUDE_DIR${NC}"
    exit 0
  fi

  # Show what will be done
  list_removals "$mode"

  # Confirm
  if [ "$DRY_RUN" = false ]; then
    if ! confirm; then
      echo -e "${YELLOW}Aborted.${NC}"
      exit 0
    fi
    echo ""
  fi

  # Stop services
  stop_services

  # Move user data first (before removing files)
  move_user_data

  # Execute uninstall based on mode
  case $mode in
    stow)
      uninstall_stow
      cleanup_opencode
      ;;
    symlink)
      uninstall_symlink
      ;;
    filecopy)
      uninstall_filecopy
      cleanup_opencode
      ;;
  esac

  print_status
}

main "$@"
