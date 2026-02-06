#!/bin/bash
# PAI quote helper - outputs inspirational quote from cache
# Refreshes from ZenQuotes API if stale (>30s)

PAI_DIR="${PAI_DIR:-$HOME/.claude}"
QUOTE_CACHE="$PAI_DIR/.quote-cache"

# Source .env for API keys
[ -f "$PAI_DIR/.env" ] && source "$PAI_DIR/.env"

# Refresh if stale
quote_age=$(($(date +%s) - $(stat -f %m "$QUOTE_CACHE" 2>/dev/null || echo 0)))
if [ "$quote_age" -gt 30 ] || [ ! -f "$QUOTE_CACHE" ]; then
  if [ -n "${ZENQUOTES_API_KEY:-}" ]; then
    new_quote=$(curl -s --max-time 1 "https://zenquotes.io/api/random/${ZENQUOTES_API_KEY}" 2>/dev/null |
      jq -r '.[0] | select(.q | length < 80) | .q + "|" + .a' 2>/dev/null)
    [ -n "$new_quote" ] && [ "$new_quote" != "null" ] && echo "$new_quote" >"$QUOTE_CACHE"
  fi
fi

if [ -f "$QUOTE_CACHE" ]; then
  IFS='|' read -r quote_text quote_author <"$QUOTE_CACHE"
  # Colors from original: QUOTE_PRIMARY=252,211,77 QUOTE_AUTHOR=180,140,60
  QP='\033[38;2;252;211;77m'
  QA='\033[38;2;180;140;60m'
  R='\033[0m'
  [ -n "$quote_text" ] && printf "${QP}✦${R} ${QP}\"%s\"${R} ${QA}—%s${R}" "$quote_text" "$quote_author"
fi
