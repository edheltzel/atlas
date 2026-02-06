#!/bin/bash
# PAI Statusline Wrapper - bridges helper scripts to Oh My Posh
# Runs helpers in parallel, exports as env vars, pipes stdin to OMP

PAI_DIR="${PAI_DIR:-$HOME/.claude}"
HELPERS="$PAI_DIR/statusline-helpers"
OMP_CONFIG="$PAI_DIR/atlas-claude.omp.json"

# Read stdin immediately (Claude Code JSON)
input=$(cat)

# Run helpers in parallel, capture output
_tmp="/tmp/pai-sl-$$"
mkdir -p "$_tmp"

"$HELPERS/pai-counts.sh"  > "$_tmp/counts"  2>/dev/null &
"$HELPERS/pai-ratings.sh" > "$_tmp/ratings" 2>/dev/null &
"$HELPERS/pai-quote.sh"   > "$_tmp/quote"   2>/dev/null &
wait

# Export as env vars for OMP templates
export PAI_COUNTS=$(cat "$_tmp/counts" 2>/dev/null)
export PAI_RATINGS=$(cat "$_tmp/ratings" 2>/dev/null)
export PAI_QUOTE=$(cat "$_tmp/quote" 2>/dev/null)

# Get PAI version from settings
export PAI_VERSION=$(jq -r '.pai.version // "2.5"' "$PAI_DIR/settings.json" 2>/dev/null)
export PAI_DA_NAME=$(jq -r '.daidentity.name // "PAI"' "$PAI_DIR/settings.json" 2>/dev/null)

# Build context gauge bar from JSON input
# Gradient: green → yellow → orange → red using ⛁ buckets
ctx_pct=$(echo "$input" | jq -r '.context_window.used_percentage // 0' 2>/dev/null)
ctx_pct=${ctx_pct%%.*}  # truncate decimal
bar_width=12
filled=$((ctx_pct * bar_width / 100))
[ "$filled" -lt 0 ] && filled=0
bar=""
for i in $(seq 1 $bar_width); do
  if [ "$i" -le "$filled" ]; then
    p=$((i * 100 / bar_width))
    if [ "$p" -le 33 ]; then
      r=$((74 + (250 - 74) * p / 33)); g=$((222 + (204 - 222) * p / 33)); b=$((128 + (21 - 128) * p / 33))
    elif [ "$p" -le 66 ]; then
      t=$((p - 33)); r=$((250 + (251 - 250) * t / 33)); g=$((204 + (146 - 204) * t / 33)); b=$((21 + (60 - 21) * t / 33))
    else
      t=$((p - 66)); r=$((251 + (239 - 251) * t / 34)); g=$((146 + (68 - 146) * t / 34)); b=$((60 + (68 - 60) * t / 34))
    fi
    bar="${bar}\033[38;2;${r};${g};${b}m⛁\033[0m "
  else
    bar="${bar}\033[38;2;75;82;95m⛁\033[0m "
  fi
done
# Color the percentage based on value
if [ "$ctx_pct" -ge 75 ] 2>/dev/null; then
  pct_color="\033[38;2;239;68;68m"
elif [ "$ctx_pct" -ge 50 ] 2>/dev/null; then
  pct_color="\033[38;2;251;146;60m"
else
  pct_color="\033[38;2;165;180;252m"
fi
export PAI_CONTEXT="$(printf "${bar}${pct_color}${ctx_pct}%%\033[0m")"

# Cleanup temp
rm -rf "$_tmp" 2>/dev/null

# Pipe to Oh My Posh
echo "$input" | oh-my-posh claude --config "$OMP_CONFIG"
