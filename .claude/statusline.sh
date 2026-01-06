#!/bin/bash
# Minimal Status Line for Claude Code

# Source style configuration
source "$HOME/.claude/statusline-style.sh"

# Read JSON input from stdin
INPUT=$(cat)

# Extract values from JSON
MODEL=$(echo "$INPUT" | jq -r '.model.display_name // "Claude"')
CWD=$(echo "$INPUT" | jq -r '.workspace.current_dir // .cwd')
VERSION=$(echo "$INPUT" | jq -r '.version // ""')

# Show only current directory name
CWD_DISPLAY=$(basename "$CWD")

# Get context usage
CONTEXT_SIZE=$(echo "$INPUT" | jq -r '.context_window.context_window_size // 0')
CURRENT_USAGE=$(echo "$INPUT" | jq '.context_window.current_usage // null')

# Build Output
OUTPUT=""

# --- Version ---
if [ -n "$VERSION" ] && [ "$VERSION" != "null" ]; then
  OUTPUT+="${VERSION_FG}${ICON_VERSION} v${VERSION}${COLOR_RESET}"
  OUTPUT+=" ${SEP_FG}${SEP}${COLOR_RESET} "
fi

# --- Model ---
OUTPUT+="${MODEL_FG}${ICON_MODEL} ${MODEL}${COLOR_RESET}"

# --- Context ---
if [ "$CURRENT_USAGE" != "null" ] && [ "$CONTEXT_SIZE" -gt 0 ]; then
  INPUT_TOKENS=$(echo "$CURRENT_USAGE" | jq -r '.input_tokens // 0')
  CACHE_CREATE=$(echo "$CURRENT_USAGE" | jq -r '.cache_creation_input_tokens // 0')
  CACHE_READ=$(echo "$CURRENT_USAGE" | jq -r '.cache_read_input_tokens // 0')
  TOTAL_TOKENS=$((INPUT_TOKENS + CACHE_CREATE + CACHE_READ))
  PERCENT_USED=$((TOTAL_TOKENS * 100 / CONTEXT_SIZE))

  # Color based on usage
  if [ "$PERCENT_USED" -ge 80 ]; then
    CTX_FG="$CONTEXT_CRIT_FG"
  elif [ "$PERCENT_USED" -ge 50 ]; then
    CTX_FG="$CONTEXT_WARN_FG"
  else
    CTX_FG="$CONTEXT_OK_FG"
  fi

  OUTPUT+=" ${SEP_FG}${SEP}${COLOR_RESET} "
  OUTPUT+="${CTX_FG}${ICON_CONTEXT} ${PERCENT_USED}%${COLOR_RESET}"

  # --- Cache ---
  CACHE_TOTAL=$((CACHE_READ + CACHE_CREATE))
  if [ "$CACHE_TOTAL" -gt 0 ]; then
    CACHE_HIT_RATE=$((CACHE_READ * 100 / CACHE_TOTAL))
    OUTPUT+=" ${SEP_FG}${SEP}${COLOR_RESET} "
    OUTPUT+="${CACHE_FG}${ICON_CACHE} ${CACHE_HIT_RATE}%${COLOR_RESET}"
  fi
fi

# --- CWD ---
OUTPUT+=" ${SEP_FG}${SEP}${COLOR_RESET} "
OUTPUT+="${CWD_FG}${ICON_FOLDER} ${CWD_DISPLAY}${COLOR_RESET}"

echo "$OUTPUT"
