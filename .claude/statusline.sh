#!/bin/bash
# Powerline-style Status Line for Claude Code

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

# =============================================================================
# Build Output
# =============================================================================

# Start with version segment
OUTPUT=""
PREV_SEP_FG=""
PREV_BG=""

# --- Version Segment ---
if [ -n "$VERSION" ] && [ "$VERSION" != "null" ]; then
  OUTPUT+="${VERSION_BG}${VERSION_FG} ${ICON_VERSION} v${VERSION} "
  PREV_BG="$VERSION_BG"
  PREV_SEP_FG="$VERSION_SEP_FG"
  # Transition to model
  OUTPUT+="${MODEL_BG}${PREV_SEP_FG}${PL_SEP}"
fi

# --- Model Segment ---
if [ -z "$PREV_BG" ]; then
  OUTPUT+="${MODEL_BG}${MODEL_FG} ${ICON_MODEL} ${MODEL} "
else
  OUTPUT+="${MODEL_FG} ${ICON_MODEL} ${MODEL} "
fi
PREV_SEP_FG="$MODEL_SEP_FG"

# --- Context Segment ---
if [ "$CURRENT_USAGE" != "null" ] && [ "$CONTEXT_SIZE" -gt 0 ]; then
  INPUT_TOKENS=$(echo "$CURRENT_USAGE" | jq -r '.input_tokens // 0')
  CACHE_CREATE=$(echo "$CURRENT_USAGE" | jq -r '.cache_creation_input_tokens // 0')
  CACHE_READ=$(echo "$CURRENT_USAGE" | jq -r '.cache_read_input_tokens // 0')
  TOTAL_TOKENS=$((INPUT_TOKENS + CACHE_CREATE + CACHE_READ))
  PERCENT_USED=$((TOTAL_TOKENS * 100 / CONTEXT_SIZE))

  # Mini progress bar (10 chars)
  BAR_WIDTH=10
  FILLED=$((PERCENT_USED * BAR_WIDTH / 100))
  [ "$FILLED" -lt 1 ] && FILLED=1
  EMPTY=$((BAR_WIDTH - FILLED))

  BAR_FILLED=""
  BAR_EMPTY=""
  for ((j=0; j<FILLED; j++)); do BAR_FILLED+="━"; done
  for ((j=0; j<EMPTY; j++)); do BAR_EMPTY+="╌"; done

  # Color based on usage level
  if [ "$PERCENT_USED" -ge 80 ]; then
    CTX_BG="$CONTEXT_CRIT_BG"
    CTX_FG="$CONTEXT_CRIT_FG"
    CTX_SEP="$CONTEXT_CRIT_SEP"
  elif [ "$PERCENT_USED" -ge 50 ]; then
    CTX_BG="$CONTEXT_WARN_BG"
    CTX_FG="$CONTEXT_WARN_FG"
    CTX_SEP="$CONTEXT_WARN_SEP"
  else
    CTX_BG="$CONTEXT_OK_BG"
    CTX_FG="$CONTEXT_OK_FG"
    CTX_SEP="$CONTEXT_OK_SEP"
  fi

  # Transition to context
  OUTPUT+="${CTX_BG}${PREV_SEP_FG}${PL_SEP}${CTX_FG} ${ICON_CONTEXT} ${BAR_FILLED}${BAR_EMPTY} ${PERCENT_USED}% "
  PREV_SEP_FG="$CTX_SEP"

  # --- Cache Segment ---
  CACHE_TOTAL=$((CACHE_READ + CACHE_CREATE))
  if [ "$CACHE_TOTAL" -gt 0 ]; then
    CACHE_HIT_RATE=$((CACHE_READ * 100 / CACHE_TOTAL))
    OUTPUT+="${CACHE_BG}${PREV_SEP_FG}${PL_SEP}${CACHE_FG} ${ICON_CACHE} ${CACHE_HIT_RATE}% "
    PREV_SEP_FG="$CACHE_SEP_FG"
  fi
fi

# --- CWD Segment ---
OUTPUT+="${CWD_BG}${PREV_SEP_FG}${PL_SEP}${CWD_FG} ${ICON_FOLDER} ${CWD_DISPLAY} "

# Final transition to terminal background
OUTPUT+="${COLOR_RESET}${CWD_SEP_FG}${PL_SEP}${COLOR_RESET}"

echo -e "$OUTPUT"
