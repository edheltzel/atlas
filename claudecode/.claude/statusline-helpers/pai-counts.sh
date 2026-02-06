#!/bin/bash
# PAI counts helper - outputs skills/workflows/hooks counts
# Uses cached counts from settings.json or counts-cache.sh

PAI_DIR="${PAI_DIR:-$HOME/.claude}"
COUNTS_CACHE="$PAI_DIR/MEMORY/STATE/counts-cache.sh"
SETTINGS="$PAI_DIR/settings.json"

# Try settings.json first (updated by hooks)
if [ -f "$SETTINGS" ]; then
  skills=$(jq -r '.counts.skills // empty' "$SETTINGS" 2>/dev/null)
  workflows=$(jq -r '.counts.workflows // empty' "$SETTINGS" 2>/dev/null)
  hooks=$(jq -r '.counts.hooks // empty' "$SETTINGS" 2>/dev/null)
fi

# Fallback to cache file
if [ -z "$skills" ] && [ -f "$COUNTS_CACHE" ]; then
  source "$COUNTS_CACHE"
  skills="${skills_count:-0}"
  workflows="${workflows_count:-0}"
  hooks="${hooks_count:-0}"
fi

# Colors from original bash statusline
WIELD_ACCENT='\033[38;2;103;232;249m'   # skills icon
WIELD_WORKFLOWS='\033[38;2;94;234;212m' # workflows icon
WIELD_HOOKS='\033[38;2;6;182;212m'      # hooks icon
SLATE_300='\033[38;2;203;213;225m'      # count numbers
SLATE_400='\033[38;2;148;163;184m'      # labels
R='\033[0m'
printf "${WIELD_ACCENT}\xee\xb8\x9b${R} ${SLATE_300}%s${R} ${SLATE_400}skills${R} ${WIELD_WORKFLOWS}\xef\x94\xae${R} ${SLATE_300}%s${R} ${SLATE_400}workflows${R} ${WIELD_HOOKS}\xf3\xb0\x9b\xa2${R} ${SLATE_300}%s${R} ${SLATE_400}hooks${R}" "${skills:-0}" "${workflows:-0}" "${hooks:-0}"
