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

  # Mini progress bar (10 chars)
  BAR_WIDTH=10
  FILLED=$((PERCENT_USED * BAR_WIDTH / 100))
  [ "$FILLED" -lt 1 ] && FILLED=1
  EMPTY=$((BAR_WIDTH - FILLED))

  BAR_FILLED=""
  BAR_EMPTY=""
  for ((j=0; j<FILLED; j++)); do BAR_FILLED+="━"; done
  for ((j=0; j<EMPTY; j++)); do BAR_EMPTY+="╌"; done

  OUTPUT+=" ${SEP_FG}${SEP}${COLOR_RESET} "
  OUTPUT+="${CTX_FG}${ICON_CONTEXT} ${BAR_FILLED}${SEP_FG}${BAR_EMPTY}${CTX_FG} ${PERCENT_USED}%${COLOR_RESET}"

  # --- Cache ---
  CACHE_TOTAL=$((CACHE_READ + CACHE_CREATE))
  if [ "$CACHE_TOTAL" -gt 0 ]; then
    CACHE_HIT_RATE=$((CACHE_READ * 100 / CACHE_TOTAL))
    OUTPUT+=" ${SEP_FG}${SEP}${COLOR_RESET} "
    OUTPUT+="${CACHE_FG}${ICON_CACHE} ${CACHE_HIT_RATE}%${COLOR_RESET}"
  fi
fi

# --- Cycle Usage (Max Plan Tracking) ---
USAGE_JSON=$(bun run "$HOME/.claude/lib/usage-tracker.ts" --json 2>/dev/null)
if [ -n "$USAGE_JSON" ] && [ "$USAGE_JSON" != "null" ]; then
  CYCLE_PROMPTS=$(echo "$USAGE_JSON" | jq -r '.cyclePrompts // 0')
  CYCLE_LIMIT=$(echo "$USAGE_JSON" | jq -r '.cycleLimit // 100')
  CYCLE_PERCENT=$(echo "$USAGE_JSON" | jq -r '.cyclePercent // 0')
  CYCLE_RESET=$(echo "$USAGE_JSON" | jq -r '.cycleResetMinutes // 0')

  # Color based on usage
  if [ "$CYCLE_PERCENT" -ge 80 ]; then
    CYCLE_FG="$CYCLE_CRIT_FG"
  elif [ "$CYCLE_PERCENT" -ge 50 ]; then
    CYCLE_FG="$CYCLE_WARN_FG"
  else
    CYCLE_FG="$CYCLE_OK_FG"
  fi

  # Format reset time
  RESET_H=$((CYCLE_RESET / 60))
  RESET_M=$((CYCLE_RESET % 60))

  OUTPUT+=" ${SEP_FG}${SEP}${COLOR_RESET} "
  OUTPUT+="${CYCLE_FG}${ICON_CYCLE} ${CYCLE_PROMPTS}/${CYCLE_LIMIT}p${COLOR_RESET}"
  OUTPUT+=" ${SEP_FG}${SEP}${COLOR_RESET} "
  OUTPUT+="${CYCLE_RESET_FG}${ICON_RESET} ${RESET_H}h${RESET_M}m${COLOR_RESET}"
fi

# --- CWD with Git Branch ---
OUTPUT+=" ${SEP_FG}${SEP}${COLOR_RESET} "

# Get git branch if in a repo
GIT_BRANCH=""
if [ -d "$CWD/.git" ] || git -C "$CWD" rev-parse --git-dir > /dev/null 2>&1; then
  GIT_BRANCH=$(git -C "$CWD" symbolic-ref --short HEAD 2>/dev/null || git -C "$CWD" describe --tags --exact-match 2>/dev/null || git -C "$CWD" rev-parse --short HEAD 2>/dev/null)
fi

if [ -n "$GIT_BRANCH" ]; then
  OUTPUT+="${CWD_FG}${ICON_FOLDER} ${CWD_DISPLAY}${COLOR_RESET} ${SEP_FG}on${COLOR_RESET} ${BRANCH_FG}${ICON_BRANCH} ${GIT_BRANCH}${COLOR_RESET}"
else
  OUTPUT+="${CWD_FG}${ICON_FOLDER} ${CWD_DISPLAY}${COLOR_RESET} ${SEP_FG}on${COLOR_RESET} ${CONTEXT_WARN_FG}not a git repo${COLOR_RESET}"
fi

echo "$OUTPUT"
