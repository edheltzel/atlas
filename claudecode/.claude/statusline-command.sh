#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# PAI Status Line
# ═══════════════════════════════════════════════════════════════════════════════
#
# Responsive status line with 4 display modes based on terminal width:
#   - nano   (<35 cols): Minimal single-line displays
#   - micro  (35-54):    Compact with key metrics
#   - mini   (55-79):    Balanced information density
#   - normal (80+):      Full display with sparklines
#
# Output order: Greeting → Wielding → Git → Learning → Signal → Context → Quote
#
# Context percentage scales to compaction threshold if configured in settings.json.
# When contextDisplay.compactionThreshold is set (e.g., 62), the bar shows 62% as 100%.
# Set threshold to 100 or remove the setting to show raw 0-100% from Claude Code.
# ═══════════════════════════════════════════════════════════════════════════════

set -o pipefail

# ─────────────────────────────────────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────────────────────────────────────

PAI_DIR="${PAI_DIR:-$HOME/.claude}"
SETTINGS_FILE="$PAI_DIR/settings.json"
RATINGS_FILE="$PAI_DIR/MEMORY/LEARNING/SIGNALS/ratings.jsonl"
TREND_CACHE="$PAI_DIR/MEMORY/STATE/trending-cache.json"
MODEL_CACHE="$PAI_DIR/MEMORY/STATE/model-cache.txt"
QUOTE_CACHE="$PAI_DIR/.quote-cache"
LOCATION_CACHE="$PAI_DIR/MEMORY/STATE/location-cache.json"
WEATHER_CACHE="$PAI_DIR/MEMORY/STATE/weather-cache.json"

# NOTE: context_window.used_percentage provides raw context usage from Claude Code.
# Scaling to compaction threshold is applied if configured in settings.json.

# Cache TTL in seconds
LOCATION_CACHE_TTL=3600 # 1 hour (IP rarely changes)
WEATHER_CACHE_TTL=900   # 15 minutes
GIT_CACHE_TTL=5         # 5 seconds (fast refresh, but avoids repeated scans)
COUNTS_CACHE_TTL=30     # 30 seconds (file counts rarely change mid-session)

# Additional cache files for expensive operations
GIT_CACHE="$PAI_DIR/MEMORY/STATE/git-status-cache.sh"
COUNTS_CACHE="$PAI_DIR/MEMORY/STATE/counts-cache.sh"

# Source .env for API keys
[ -f "$PAI_DIR/.env" ] && source "$PAI_DIR/.env"

# Source theme (configured in settings.json)
# Themes stored in USER/STATUSLINE per PAI convention
THEME_NAME=$(jq -r '.theme // "default/tailwind"' "$SETTINGS_FILE" 2>/dev/null)
THEME_FILE="$PAI_DIR/skills/CORE/USER/STATUSLINE/themes/${THEME_NAME}.sh"
[ -f "$THEME_FILE" ] && source "$THEME_FILE"

# ─────────────────────────────────────────────────────────────────────────────
# PARSE INPUT (must happen before parallel block consumes stdin)
# ─────────────────────────────────────────────────────────────────────────────

input=$(cat)

# Get DA name from settings (single source of truth)
DA_NAME=$(jq -r '.daidentity.name // .daidentity.displayName // .env.DA // "Assistant"' "$SETTINGS_FILE" 2>/dev/null)
DA_NAME="${DA_NAME:-Assistant}"

# Get PAI version from settings
PAI_VERSION=$(jq -r '.pai.version // "—"' "$SETTINGS_FILE" 2>/dev/null)
PAI_VERSION="${PAI_VERSION:-—}"

# Extract all data from JSON in single jq call
eval "$(echo "$input" | jq -r '
  "current_dir=" + (.workspace.current_dir // .cwd // "." | @sh) + "\n" +
  "model_name=" + (.model.display_name // "unknown" | @sh) + "\n" +
  "cc_version_json=" + (.version // "" | @sh) + "\n" +
  "duration_ms=" + (.cost.total_duration_ms // 0 | tostring) + "\n" +
  "context_max=" + (.context_window.context_window_size // 200000 | tostring) + "\n" +
  "context_pct=" + (.context_window.used_percentage // 0 | tostring) + "\n" +
  "context_remaining=" + (.context_window.remaining_percentage // 100 | tostring) + "\n" +
  "total_input=" + (.context_window.total_input_tokens // 0 | tostring) + "\n" +
  "total_output=" + (.context_window.total_output_tokens // 0 | tostring) + "\n" +
  "cache_read=" + (.context_window.current_usage.cache_read_input_tokens // 0 | tostring) + "\n" +
  "cache_create=" + (.context_window.current_usage.cache_creation_input_tokens // 0 | tostring)
' 2>/dev/null)"

# Ensure defaults for critical numeric values
context_pct=${context_pct:-0}
context_max=${context_max:-200000}
context_remaining=${context_remaining:-100}
total_input=${total_input:-0}
total_output=${total_output:-0}
cache_read=${cache_read:-0}
cache_create=${cache_create:-0}

# Calculate cache hit rate (percentage of cache reads vs total cache operations)
cache_total=$((cache_read + cache_create))
if [ "$cache_total" -gt 0 ]; then
  cache_hit_rate=$((cache_read * 100 / cache_total))
else
  cache_hit_rate=0
fi

# If used_percentage is 0 but we have token data, calculate manually
# This handles cases where statusLine is called before percentage is populated
if [ "$context_pct" = "0" ] && [ "$total_input" -gt 0 ]; then
  total_tokens=$((total_input + total_output))
  context_pct=$((total_tokens * 100 / context_max))
fi

# Get Claude Code version
if [ -n "$cc_version_json" ] && [ "$cc_version_json" != "unknown" ]; then
  cc_version="$cc_version_json"
else
  cc_version=$(claude --version 2>/dev/null | head -1 | awk '{print $1}')
  cc_version="${cc_version:-unknown}"
fi

# Cache model name for other tools
mkdir -p "$(dirname "$MODEL_CACHE")" 2>/dev/null
echo "$model_name" >"$MODEL_CACHE" 2>/dev/null

dir_name=$(basename "$current_dir" 2>/dev/null || echo ".")

# ─────────────────────────────────────────────────────────────────────────────
# PARALLEL PREFETCH - Launch ALL expensive operations immediately
# ─────────────────────────────────────────────────────────────────────────────
# This section launches everything in parallel BEFORE any sequential work.
# Results are collected via temp files and sourced later.

_parallel_tmp="/tmp/pai-parallel-$$"
mkdir -p "$_parallel_tmp"

# --- PARALLEL BLOCK START ---
{
  # 1. Git info (branch + last commit age only)
  if git rev-parse --git-dir >/dev/null 2>&1; then
    git_root=$(git rev-parse --show-toplevel 2>/dev/null | tr '/' '_')
    GIT_REPO_CACHE="$PAI_DIR/MEMORY/STATE/git-cache${git_root}.sh"

    # Check cache validity
    if [ -f "$GIT_REPO_CACHE" ]; then
      git_cache_mtime=$(stat -f %m "$GIT_REPO_CACHE" 2>/dev/null || echo 0)
      git_cache_age=$(($(date +%s) - git_cache_mtime))
      [ "$git_cache_age" -lt "$GIT_CACHE_TTL" ] && cp "$GIT_REPO_CACHE" "$_parallel_tmp/git.sh" && exit 0
    fi

    # Fresh git computation (minimal - branch + age only)
    branch=$(git branch --show-current 2>/dev/null)
    [ -z "$branch" ] && branch="detached"
    last_commit_epoch=$(git log -1 --format='%ct' 2>/dev/null)

    cat >"$_parallel_tmp/git.sh" <<GITEOF
branch='$branch'
last_commit_epoch=${last_commit_epoch:-0}
is_git_repo=true
GITEOF
    cp "$_parallel_tmp/git.sh" "$GIT_REPO_CACHE" 2>/dev/null
  else
    echo "is_git_repo=false" >"$_parallel_tmp/git.sh"
  fi
} &

{
  # 2. Location fetch (with caching)
  cache_age=999999
  [ -f "$LOCATION_CACHE" ] && cache_age=$(($(date +%s) - $(stat -f %m "$LOCATION_CACHE" 2>/dev/null || echo 0)))

  if [ "$cache_age" -gt "$LOCATION_CACHE_TTL" ]; then
    loc_data=$(curl -s --max-time 2 "http://ip-api.com/json/?fields=city,regionName,country,lat,lon" 2>/dev/null)
    if [ -n "$loc_data" ] && echo "$loc_data" | jq -e '.city' >/dev/null 2>&1; then
      echo "$loc_data" >"$LOCATION_CACHE"
    fi
  fi

  if [ -f "$LOCATION_CACHE" ]; then
    jq -r '"location_city=" + (.city | @sh) + "\nlocation_state=" + (.regionName | @sh)' "$LOCATION_CACHE" >"$_parallel_tmp/location.sh" 2>/dev/null
  else
    echo -e "location_city='Unknown'\nlocation_state=''" >"$_parallel_tmp/location.sh"
  fi
} &

{
  # 3. Weather fetch (with caching)
  cache_age=999999
  [ -f "$WEATHER_CACHE" ] && cache_age=$(($(date +%s) - $(stat -f %m "$WEATHER_CACHE" 2>/dev/null || echo 0)))

  if [ "$cache_age" -gt "$WEATHER_CACHE_TTL" ]; then
    lat="" lon=""
    if [ -f "$LOCATION_CACHE" ]; then
      lat=$(jq -r '.lat // empty' "$LOCATION_CACHE" 2>/dev/null)
      lon=$(jq -r '.lon // empty' "$LOCATION_CACHE" 2>/dev/null)
    fi
    lat="${lat:-37.7749}"
    lon="${lon:-122.4194}"

    weather_json=$(curl -s --max-time 3 "https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&temperature_unit=celsius" 2>/dev/null)
    if [ -n "$weather_json" ] && echo "$weather_json" | jq -e '.current' >/dev/null 2>&1; then
      temp=$(echo "$weather_json" | jq -r '.current.temperature_2m' 2>/dev/null)
      code=$(echo "$weather_json" | jq -r '.current.weather_code' 2>/dev/null)
      condition="Clear"
      case "$code" in
      0) condition="Clear" ;; 1 | 2 | 3) condition="Cloudy" ;; 45 | 48) condition="Foggy" ;;
      51 | 53 | 55 | 56 | 57) condition="Drizzle" ;; 61 | 63 | 65 | 66 | 67) condition="Rain" ;;
      71 | 73 | 75 | 77) condition="Snow" ;; 80 | 81 | 82) condition="Showers" ;;
      85 | 86) condition="Snow" ;; 95 | 96 | 99) condition="Storm" ;;
      esac
      echo "${temp}°C ${condition}" >"$WEATHER_CACHE"
    fi
  fi

  if [ -f "$WEATHER_CACHE" ]; then
    echo "weather_str='$(cat "$WEATHER_CACHE" 2>/dev/null)'" >"$_parallel_tmp/weather.sh"
  else
    echo "weather_str='—'" >"$_parallel_tmp/weather.sh"
  fi
} &

{
  # 4. File counts (with caching)
  counts_cache_valid=false
  if [ -f "$COUNTS_CACHE" ]; then
    counts_cache_mtime=$(stat -f %m "$COUNTS_CACHE" 2>/dev/null || echo 0)
    counts_cache_age=$(($(date +%s) - counts_cache_mtime))
    [ "$counts_cache_age" -lt "$COUNTS_CACHE_TTL" ] && counts_cache_valid=true
  fi

  if [ "$counts_cache_valid" = true ]; then
    cp "$COUNTS_CACHE" "$_parallel_tmp/counts.sh"
  else
    # Use GetCounts.ts as single source of truth for deterministic counts
    # This ensures banner and statusline show identical numbers
    GETCOUNTS_TOOL="$PAI_DIR/skills/CORE/Tools/GetCounts.ts"
    if [ -f "$GETCOUNTS_TOOL" ]; then
      bun run "$GETCOUNTS_TOOL" --shell >"$_parallel_tmp/counts.sh" 2>/dev/null
      # Map signals_count to learnings_count for compatibility
      sed -i '' 's/signals_count/learnings_count/' "$_parallel_tmp/counts.sh" 2>/dev/null
      # Add sessions_count (not in GetCounts.ts)
      sessions_count=$(fd -e jsonl . "$PAI_DIR/MEMORY" 2>/dev/null | wc -l | tr -d ' ')
      echo "sessions_count=$sessions_count" >>"$_parallel_tmp/counts.sh"
    else
      # Fallback if GetCounts.ts doesn't exist
      skills_count=$(fd -t d -d 1 . "$PAI_DIR/skills" 2>/dev/null | wc -l | tr -d ' ')
      workflows_count=$(fd --no-ignore -t f -e md . "$PAI_DIR/skills" 2>/dev/null | grep -ci '/[Ww]orkflows/' || echo 0)
      hooks_count=$(fd -e ts -d 1 . "$PAI_DIR/hooks" 2>/dev/null | wc -l | tr -d ' ')
      learnings_count=$(fd -e md . "$PAI_DIR/MEMORY/LEARNING" 2>/dev/null | wc -l | tr -d ' ')
      work_count=$(fd -t d -d 1 . "$PAI_DIR/MEMORY/WORK" 2>/dev/null | wc -l | tr -d ' ')
      sessions_count=$(fd -e jsonl . "$PAI_DIR/MEMORY" 2>/dev/null | wc -l | tr -d ' ')
      research_count=$(fd -e md -e json . "$PAI_DIR/MEMORY/RESEARCH" 2>/dev/null | wc -l | tr -d ' ')
      ratings_count=$([ -f "$RATINGS_FILE" ] && wc -l <"$RATINGS_FILE" 2>/dev/null | tr -d ' ' || echo 0)

      cat >"$_parallel_tmp/counts.sh" <<COUNTSEOF
skills_count=$skills_count
workflows_count=$workflows_count
hooks_count=$hooks_count
learnings_count=$learnings_count
work_count=$work_count
sessions_count=$sessions_count
research_count=$research_count
ratings_count=$ratings_count
COUNTSEOF
    fi
    cp "$_parallel_tmp/counts.sh" "$COUNTS_CACHE" 2>/dev/null
  fi
} &

# --- PARALLEL BLOCK END - wait for all to complete ---
wait

# Source all parallel results
[ -f "$_parallel_tmp/git.sh" ] && source "$_parallel_tmp/git.sh"
[ -f "$_parallel_tmp/location.sh" ] && source "$_parallel_tmp/location.sh"
[ -f "$_parallel_tmp/weather.sh" ] && source "$_parallel_tmp/weather.sh"
[ -f "$_parallel_tmp/counts.sh" ] && source "$_parallel_tmp/counts.sh"
rm -rf "$_parallel_tmp" 2>/dev/null

learning_count="$learnings_count"

# ─────────────────────────────────────────────────────────────────────────────
# TERMINAL WIDTH DETECTION
# ─────────────────────────────────────────────────────────────────────────────
# Hooks don't inherit terminal context. Try multiple methods.

detect_terminal_width() {
  local width=""

  # Tier 1: Kitty IPC (most accurate for Kitty panes)
  if [ -n "$KITTY_WINDOW_ID" ] && command -v kitten >/dev/null 2>&1; then
    width=$(kitten @ ls 2>/dev/null | jq -r --argjson wid "$KITTY_WINDOW_ID" \
      '.[].tabs[].windows[] | select(.id == $wid) | .columns' 2>/dev/null)
  fi

  # Tier 2: Direct TTY query
  [ -z "$width" ] || [ "$width" = "0" ] || [ "$width" = "null" ] &&
    width=$(stty size </dev/tty 2>/dev/null | awk '{print $2}')

  # Tier 3: tput fallback
  [ -z "$width" ] || [ "$width" = "0" ] && width=$(tput cols 2>/dev/null)

  # Tier 4: Environment variable
  [ -z "$width" ] || [ "$width" = "0" ] && width=${COLUMNS:-80}

  echo "$width"
}

term_width=$(detect_terminal_width)

if [ "$term_width" -lt 35 ]; then
  MODE="nano"
elif [ "$term_width" -lt 55 ]; then
  MODE="micro"
elif [ "$term_width" -lt 80 ]; then
  MODE="mini"
else
  MODE="normal"
fi

# Get DA name from settings (single source of truth)
DA_NAME=$(jq -r '.daidentity.name // .daidentity.displayName // .env.DA // "Assistant"' "$SETTINGS_FILE" 2>/dev/null)
DA_NAME="${DA_NAME:-Assistant}"

# Get PAI version from settings
PAI_VERSION=$(jq -r '.pai.version // "—"' "$SETTINGS_FILE" 2>/dev/null)
PAI_VERSION="${PAI_VERSION:-—}"

# Extract all data from JSON in single jq call
# Uses official Claude Code context_window values directly
eval "$(echo "$input" | jq -r '
  "current_dir=" + (.workspace.current_dir // .cwd | @sh) + "\n" +
  "model_name=" + (.model.display_name | @sh) + "\n" +
  "cc_version_json=" + (.version // "" | @sh) + "\n" +
  "duration_ms=" + (.cost.total_duration_ms // 0 | tostring) + "\n" +
  "context_max=" + (.context_window.context_window_size // 200000 | tostring) + "\n" +
  "context_pct=" + (.context_window.used_percentage // 0 | tostring) + "\n" +
  "context_remaining=" + (.context_window.remaining_percentage // 100 | tostring) + "\n" +
  "total_input=" + (.context_window.total_input_tokens // 0 | tostring) + "\n" +
  "total_output=" + (.context_window.total_output_tokens // 0 | tostring)
')"

# Get Claude Code version
if [ -n "$cc_version_json" ] && [ "$cc_version_json" != "unknown" ]; then
  cc_version="$cc_version_json"
else
  cc_version=$(claude --version 2>/dev/null | head -1 | awk '{print $1}')
  cc_version="${cc_version:-unknown}"
fi

# Cache model name for other tools
mkdir -p "$(dirname "$MODEL_CACHE")" 2>/dev/null
echo "$model_name" >"$MODEL_CACHE" 2>/dev/null

dir_name=$(basename "$current_dir")

# ─────────────────────────────────────────────────────────────────────────────
# COLOR PALETTE (mapped from theme)
# ─────────────────────────────────────────────────────────────────────────────
# Theme colors loaded from $PAI_DIR/themes/<theme>.sh
# These variables map SL_* theme variables to statusline-specific names

# Core reset (from theme or fallback)
RESET="${SL_RESET:-\033[0m}"

# Structural (chrome, labels, separators)
SLATE_300="${SL_TEXT:-\033[38;2;203;213;225m}"
SLATE_400="${SL_SUBTLE:-\033[38;2;148;163;184m}"
SLATE_500="${SL_MUTED:-\033[38;2;100;116;139m}"
SLATE_600="${SL_SEPARATOR:-\033[38;2;71;85;105m}"

# Semantic colors
EMERALD="${SL_SUCCESS:-\033[38;2;74;222;128m}"
ROSE="${SL_ERROR:-\033[38;2;251;113;133m}"

# Rating gradient (from theme)
RATING_10="${SL_RATING_10:-\033[38;2;74;222;128m}"
RATING_8="${SL_RATING_8:-\033[38;2;163;230;53m}"
RATING_7="${SL_RATING_7:-\033[38;2;250;204;21m}"
RATING_6="${SL_RATING_6:-\033[38;2;251;191;36m}"
RATING_5="${SL_RATING_5:-\033[38;2;251;146;60m}"
RATING_4="${SL_RATING_4:-\033[38;2;248;113;113m}"
RATING_LOW="${SL_RATING_LOW:-\033[38;2;239;68;68m}"

# Line 1: Greeting (memory/violet theme)
GREET_PRIMARY="${SL_MEM_PRIMARY:-\033[38;2;167;139;250m}"
GREET_SECONDARY="${SL_MEM_SIGNALS:-\033[38;2;139;92;246m}"
GREET_ACCENT="${SL_MEM_SECONDARY:-\033[38;2;196;181;253m}"

# Line 2: Wielding (info/cyan theme)
WIELD_PRIMARY="${SL_INFO:-\033[38;2;34;211;238m}"
WIELD_SECONDARY="${SL_INFO:-\033[38;2;45;212;191m}"
WIELD_ACCENT="${SL_INFO:-\033[38;2;103;232;249m}"
WIELD_WORKFLOWS="${SL_SUCCESS:-\033[38;2;94;234;212m}"
WIELD_HOOKS="${SL_INFO:-\033[38;2;6;182;212m}"
WIELD_LEARNINGS="${SL_SUCCESS:-\033[38;2;20;184;166m}"

# Line 3: Git (from theme)
# Eldritch theme git colors
GIT_PRIMARY="${SL_GIT_PRIMARY:-\033[38;2;242;101;181m}"   # branch pink #F265B5
GIT_VALUE="${SL_GIT_VALUE:-\033[38;2;242;101;181m}"       # branch pink #F265B5
GIT_DIR="${SL_GIT_DIR:-\033[38;2;4;209;249m}"             # path cyan #04D1F9
GIT_CLEAN="${SL_GIT_CLEAN:-\033[38;2;55;244;153m}"        # git_added green #37F499
GIT_MODIFIED="${SL_GIT_MODIFIED:-\033[38;2;241;252;121m}" # git_modified yellow #F1FC79
GIT_ADDED="${SL_GIT_ADDED:-\033[38;2;4;209;249m}"         # git_untracked cyan #04D1F9
GIT_STASH="${SL_GIT_STASH:-\033[38;2;164;140;242m}"       # purple #A48CF2
GIT_AGE_FRESH="${SL_GIT_AGE_FRESH:-\033[38;2;125;211;252m}"
GIT_AGE_RECENT="${SL_GIT_AGE_RECENT:-\033[38;2;96;165;250m}"
GIT_AGE_STALE="${SL_GIT_AGE_STALE:-\033[38;2;59;130;246m}"
GIT_AGE_OLD="${SL_GIT_AGE_OLD:-\033[38;2;99;102;241m}"

# Line 4: Memory (from theme)
LEARN_PRIMARY="${SL_MEM_PRIMARY:-\033[38;2;167;139;250m}"
LEARN_SECONDARY="${SL_MEM_SECONDARY:-\033[38;2;196;181;253m}"
LEARN_WORK="${SL_MEM_WORK:-\033[38;2;192;132;252m}"
LEARN_SIGNALS="${SL_MEM_SIGNALS:-\033[38;2;139;92;246m}"
LEARN_RESEARCH="${SL_MEM_RESEARCH:-\033[38;2;129;140;248m}"
LEARN_SESSIONS="${SL_MEM_SESSIONS:-\033[38;2;99;102;241m}"

# Line 5: Learning Signal
SIGNAL_LABEL="${SL_INFO:-\033[38;2;56;189;248m}"
SIGNAL_COLOR="${SL_INFO:-\033[38;2;96;165;250m}"
SIGNAL_PERIOD="${SL_LEARN_PERIOD:-\033[38;2;148;163;184m}"
LEARN_LABEL="${SL_LEARN_LABEL:-\033[38;2;21;128;61m}"

# Line 6: Context (from theme)
CTX_PRIMARY="${SL_CTX_PRIMARY:-\033[38;2;129;140;248m}"
CTX_SECONDARY="${SL_CTX_SECONDARY:-\033[38;2;165;180;252m}"
CTX_ACCENT="${SL_CTX_SECONDARY:-\033[38;2;139;92;246m}"
CTX_BUCKET_EMPTY="${SL_CTX_EMPTY:-\033[38;2;75;82;95m}"
CACHE_COLOR="${SL_CACHE:-\033[38;2;164;140;242m}" # Lovecraft Purple #A48CF2

# Line 7: Quote (from theme)
QUOTE_PRIMARY="${SL_QUOTE_PRIMARY:-\033[38;2;252;211;77m}"
QUOTE_AUTHOR="${SL_QUOTE_AUTHOR:-\033[38;2;180;140;60m}"

# PAI Branding (from theme)
PAI_P="${SL_PAI_P:-\033[38;2;30;58;138m}"
PAI_A="${SL_PAI_A:-\033[38;2;59;130;246m}"
PAI_I="${SL_PAI_I:-\033[38;2;147;197;253m}"
PAI_LABEL="${SL_HEADER_LABEL:-\033[38;2;100;116;139m}"
PAI_CITY="${SL_LOCATION:-\033[38;2;147;197;253m}"
PAI_STATE="${SL_MUTED:-\033[38;2;100;116;139m}"
PAI_TIME="${SL_TIME:-\033[38;2;96;165;250m}"
PAI_WEATHER="${SL_WEATHER:-\033[38;2;135;206;235m}"

# ─────────────────────────────────────────────────────────────────────────────
# HELPER FUNCTIONS
# ─────────────────────────────────────────────────────────────────────────────

# Get color for rating value (handles "—" for no data)
get_rating_color() {
  local val="$1"
  [[ "$val" == "—" || -z "$val" ]] && {
    echo "$SLATE_400"
    return
  }
  local rating_int=${val%%.*}
  [[ ! "$rating_int" =~ ^[0-9]+$ ]] && {
    echo "$SLATE_400"
    return
  }

  if [ "$rating_int" -ge 9 ]; then
    echo "$RATING_10"
  elif [ "$rating_int" -ge 8 ]; then
    echo "$RATING_8"
  elif [ "$rating_int" -ge 7 ]; then
    echo "$RATING_7"
  elif [ "$rating_int" -ge 6 ]; then
    echo "$RATING_6"
  elif [ "$rating_int" -ge 5 ]; then
    echo "$RATING_5"
  elif [ "$rating_int" -ge 4 ]; then
    echo "$RATING_4"
  else
    echo "$RATING_LOW"
  fi
}

# Get gradient color for context bar bucket
# Green(74,222,128) → Yellow(250,204,21) → Orange(251,146,60) → Red(239,68,68)
get_bucket_color() {
  local pos=$1 max=$2
  local pct=$((pos * 100 / max))
  local r g b

  if [ "$pct" -le 33 ]; then
    r=$((74 + (250 - 74) * pct / 33))
    g=$((222 + (204 - 222) * pct / 33))
    b=$((128 + (21 - 128) * pct / 33))
  elif [ "$pct" -le 66 ]; then
    local t=$((pct - 33))
    r=$((250 + (251 - 250) * t / 33))
    g=$((204 + (146 - 204) * t / 33))
    b=$((21 + (60 - 21) * t / 33))
  else
    local t=$((pct - 66))
    r=$((251 + (239 - 251) * t / 34))
    g=$((146 + (68 - 146) * t / 34))
    b=$((60 + (68 - 60) * t / 34))
  fi
  printf '\033[38;2;%d;%d;%dm' "$r" "$g" "$b"
}

# Render context bar - gradient progress bar using (potentially scaled) percentage
render_context_bar() {
  local width=$1 pct=$2
  local output="" last_color=""

  # Use percentage (may be scaled to compaction threshold)
  local filled=$((pct * width / 100))
  [ "$filled" -lt 0 ] && filled=0

  # Use spaced buckets only for small widths to improve readability
  local use_spacing=false
  [ "$width" -le 20 ] && use_spacing=true

  for i in $(seq 1 $width 2>/dev/null); do
    if [ "$i" -le "$filled" ]; then
      local color=$(get_bucket_color $i $width)
      last_color="$color"
      output="${output}${color}⛁${RESET}"
      [ "$use_spacing" = true ] && output="${output} "
    else
      output="${output}${CTX_BUCKET_EMPTY}⛁${RESET}"
      [ "$use_spacing" = true ] && output="${output} "
    fi
  done

  output="${output% }"
  echo "$output"
  LAST_BUCKET_COLOR="${last_color:-$EMERALD}"
}

# Calculate optimal bar width to match ENV section visual width (~45 chars)
# Returns buckets that align with the ENV line content length
calc_bar_width() {
  local mode=$1

  # Compact bar to fit learning data on same line
  case "$mode" in
  nano) echo 5 ;;
  micro) echo 6 ;;
  mini) echo 8 ;;
  normal) echo 12 ;; # Slightly longer for visual balance
  esac
}

# ═══════════════════════════════════════════════════════════════════════════════
# LINE 0: PAI BRANDING (location, time, weather)
# ═══════════════════════════════════════════════════════════════════════════════
# NOTE: location_city, location_state, weather_str are populated by PARALLEL PREFETCH

current_time=$(date +"%H:%M")

# Output PAI branding line
# Calculate age display from prefetched last_commit_epoch
if [ "$is_git_repo" = "true" ] && [ -n "$last_commit_epoch" ]; then
  now_epoch=$(date +%s)
  age_seconds=$((now_epoch - last_commit_epoch))
  age_minutes=$((age_seconds / 60))
  age_hours=$((age_seconds / 3600))
  age_days=$((age_seconds / 86400))

  if [ "$age_minutes" -lt 1 ]; then
    age_display="now"
    age_color="$GIT_AGE_FRESH"
  elif [ "$age_hours" -lt 1 ]; then
    age_display="${age_minutes}m"
    age_color="$GIT_AGE_FRESH"
  elif [ "$age_hours" -lt 24 ]; then
    age_display="${age_hours}h"
    age_color="$GIT_AGE_RECENT"
  elif [ "$age_days" -lt 7 ]; then
    age_display="${age_days}d"
    age_color="$GIT_AGE_STALE"
  else
    age_display="${age_days}d"
    age_color="$GIT_AGE_OLD"
  fi
fi

# Combined ENV + Git line
case "$MODE" in
nano)
  printf "${SLATE_600}──  ${RESET}${PAI_P}▲${RESET} ${PAI_A}Atlas${RESET} ${SLATE_400}${PAI_VERSION}${RESET} ${SLATE_600} ───────────${RESET}\n"
  printf "${GIT_DIR}${dir_name}${RESET}"
  [ "$is_git_repo" = true ] && printf " ${GIT_VALUE}${branch}${RESET}"
  printf " ${SLATE_400}\xee\xb8\x9b${SLATE_300}${skills_count}${RESET}"
  [ "$cache_total" -gt 0 ] && printf " ${SLATE_600}│${RESET} ${CACHE_COLOR}⁂${RESET} ${cache_color}${cache_hit_rate}%%${RESET}"
  printf "\n"
  ;;
micro)
  printf "${SLATE_600}──  ${RESET}${PAI_P}▲${RESET} ${PAI_A}Atlas${RESET} ${SLATE_400}${PAI_VERSION}${RESET} ${SLATE_600} ──────────────────${RESET}\n"
  printf "${SLATE_400}\xee\xb8\x8d${RESET} ${PAI_A}${model_name}${RESET} ${SLATE_600}│${RESET} ${GIT_DIR}${dir_name}${RESET}"
  if [ "$is_git_repo" = true ]; then
    printf " ${GIT_VALUE}${branch}${RESET}"
    [ -n "$age_display" ] && printf " ${age_color}${age_display}${RESET}"
  fi
  printf " ${SLATE_600}│${RESET} ${SLATE_400}\xee\xb8\x9b${SLATE_300}${skills_count}${RESET}"
  [ "$cache_total" -gt 0 ] && printf " ${SLATE_600}│${RESET} ${CACHE_COLOR}⁂${RESET} ${cache_color}${cache_hit_rate}%%${RESET}"
  printf "\n"
  ;;
mini)
  printf "${SLATE_600}──  ${RESET}${PAI_P}▲${RESET} ${PAI_A}Atlas${RESET} ${SLATE_400}${PAI_VERSION}${RESET} ${SLATE_600} ────────────────────────────────────────${RESET}\n"
  printf "${SLATE_400}\xee\xb8\x8d${RESET} ${PAI_A}${model_name}${RESET} ${SLATE_600}│${RESET} ${GIT_PRIMARY}\xf3\xb0\x9d\xb0${RESET} ${GIT_DIR}${dir_name}${RESET}"
  if [ "$is_git_repo" = true ]; then
    printf " ${SLATE_600}│${RESET} ${GIT_PRIMARY}\xef\x84\xa6${RESET} ${GIT_VALUE}${branch}${RESET}"
    [ -n "$age_display" ] && printf " ${age_color}${age_display}${RESET}"
  fi
  printf " ${SLATE_600}│${RESET} ${WIELD_ACCENT}\xee\xb8\x9b${RESET}${SLATE_300}${skills_count}${RESET} ${WIELD_WORKFLOWS}\xef\x94\xae${RESET}${SLATE_300}${workflows_count}${RESET}"
  [ "$cache_total" -gt 0 ] && printf " ${SLATE_600}│${RESET} ${CACHE_COLOR}⁂${RESET} ${cache_color}${cache_hit_rate}%%${RESET}"
  printf "\n"
  ;;
normal)
  printf "${SLATE_600}──  ${RESET}${PAI_P}▲${RESET} ${PAI_A}Atlas${RESET} ${SLATE_400}${PAI_VERSION}${RESET} ${SLATE_600} ─────────────────────────────────────────────────────────${RESET}\n"
  printf "${SLATE_400}\xee\xb8\x8d${RESET} ${PAI_A}${model_name}${RESET} ${SLATE_600}│${RESET} ${GIT_PRIMARY}\xf3\xb0\x9d\xb0${RESET} ${GIT_DIR}${dir_name}${RESET}"
  if [ "$is_git_repo" = true ]; then
    printf " ${SLATE_600}│${RESET} ${GIT_PRIMARY}\xef\x84\xa6${RESET} ${GIT_VALUE}${branch}${RESET}"
    [ -n "$age_display" ] && printf " ${SLATE_600}│${RESET} ${SLATE_400}\xf3\xb0\xa5\x94${RESET} ${age_color}${age_display}${RESET}"
  fi
  printf " ${SLATE_600}│${RESET} ${WIELD_ACCENT}\xee\xb8\x9b${RESET} ${SLATE_300}${skills_count}${RESET} ${WIELD_WORKFLOWS}\xef\x94\xae${RESET} ${SLATE_300}${workflows_count}${RESET} ${WIELD_HOOKS}\xf3\xb0\x9b\xa2${RESET} ${SLATE_300}${hooks_count}${RESET}"
  [ "$cache_total" -gt 0 ] && printf " ${SLATE_600}│${RESET} ${CACHE_COLOR}⁂${RESET} ${cache_color}${cache_hit_rate}%%${RESET}"
  printf "\n"
  ;;
esac
printf "${SLATE_600}─────────────────────────────────────────────────────────────────────────${RESET}\n"

# ═══════════════════════════════════════════════════════════════════════════════
# LINE 2: CONTEXT + LEARNING (combined)
# ═══════════════════════════════════════════════════════════════════════════════

# Context display - scale to compaction threshold if configured
context_max="${context_max:-200000}"

# Read compaction threshold from settings (default 100 = no scaling)
COMPACTION_THRESHOLD=$(jq -r '.contextDisplay.compactionThreshold // 100' "$SETTINGS_FILE" 2>/dev/null)
COMPACTION_THRESHOLD="${COMPACTION_THRESHOLD:-100}"

# Get raw percentage from Claude Code
raw_pct="${context_pct%%.*}" # Remove decimals
[ -z "$raw_pct" ] && raw_pct=0

# Scale percentage: if threshold is 62, then 62% raw = 100% displayed
if [ "$COMPACTION_THRESHOLD" -lt 100 ] && [ "$COMPACTION_THRESHOLD" -gt 0 ]; then
  display_pct=$((raw_pct * 100 / COMPACTION_THRESHOLD))
  [ "$display_pct" -gt 100 ] && display_pct=100
else
  display_pct="$raw_pct"
fi

# Color based on scaled percentage
if [ "$display_pct" -ge 80 ]; then
  pct_color="$ROSE"
elif [ "$display_pct" -ge 60 ]; then
  pct_color='\033[38;2;251;146;60m'
elif [ "$display_pct" -ge 40 ]; then
  pct_color='\033[38;2;251;191;36m'
else
  pct_color="$EMERALD"
fi

bar_width=$(calc_bar_width "$MODE")

# --- Learning computation (needed before output) ---
LEARNING_CACHE="$PAI_DIR/MEMORY/STATE/learning-cache.sh"
LEARNING_CACHE_TTL=30

has_ratings=false
if [ -f "$RATINGS_FILE" ] && [ -s "$RATINGS_FILE" ]; then
  now=$(date +%s)
  cache_valid=false
  if [ -f "$LEARNING_CACHE" ]; then
    cache_mtime=$(stat -f %m "$LEARNING_CACHE" 2>/dev/null || echo 0)
    ratings_mtime=$(stat -f %m "$RATINGS_FILE" 2>/dev/null || echo 0)
    cache_age=$((now - cache_mtime))
    [ "$cache_mtime" -gt "$ratings_mtime" ] && [ "$cache_age" -lt "$LEARNING_CACHE_TTL" ] && cache_valid=true
  fi

  if [ "$cache_valid" = true ]; then
    source "$LEARNING_CACHE"
  else
    eval "$(jq -rs --argjson now "$now" '
      def to_epoch:
        (capture("(?<sign>[-+])(?<h>[0-9]{2}):(?<m>[0-9]{2})$") // {sign: "+", h: "00", m: "00"}) as $tz |
        gsub("[-+][0-9]{2}:[0-9]{2}$"; "Z") | gsub("\\.[0-9]+"; "") | fromdateiso8601 |
        . + (if $tz.sign == "-" then 1 else -1 end) * (($tz.h | tonumber) * 3600 + ($tz.m | tonumber) * 60);
      [.[] | select(.rating != null) | . + {epoch: (.timestamp | to_epoch)}] |
      ($now - 900) as $q15_start | ($now - 3600) as $hour_start | ($now - 86400) as $today_start |
      ($now - 604800) as $week_start | ($now - 2592000) as $month_start |
      (map(select(.epoch >= $q15_start) | .rating) | if length > 0 then (add / length | . * 10 | floor / 10 | tostring) else "—" end) as $q15_avg |
      (map(select(.epoch >= $hour_start) | .rating) | if length > 0 then (add / length | . * 10 | floor / 10 | tostring) else "—" end) as $hour_avg |
      (map(select(.epoch >= $today_start) | .rating) | if length > 0 then (add / length | . * 10 | floor / 10 | tostring) else "—" end) as $today_avg |
      (map(select(.epoch >= $week_start) | .rating) | if length > 0 then (add / length | . * 10 | floor / 10 | tostring) else "—" end) as $week_avg |
      (map(select(.epoch >= $month_start) | .rating) | if length > 0 then (add / length | . * 10 | floor / 10 | tostring) else "—" end) as $month_avg |
      length as $total |
      (last | .rating | tostring) as $latest |
      "q15_avg=\($q15_avg | @sh)\nhour_avg=\($hour_avg | @sh)\ntoday_avg=\($today_avg | @sh)\n" +
      "week_avg=\($week_avg | @sh)\nmonth_avg=\($month_avg | @sh)\nlatest=\($latest | @sh)\ntotal_count=\($total)"
    ' "$RATINGS_FILE" 2>/dev/null)"

    cat >"$LEARNING_CACHE" <<CACHE_EOF
q15_avg='$q15_avg'
hour_avg='$hour_avg'
today_avg='$today_avg'
week_avg='$week_avg'
month_avg='$month_avg'
latest='$latest'
total_count=$total_count
CACHE_EOF
  fi

  [ "$total_count" -gt 0 ] 2>/dev/null && has_ratings=true
  # Get colors for ratings
  Q15_COLOR=$(get_rating_color "${q15_avg:-5}")
  HOUR_COLOR=$(get_rating_color "${hour_avg:-5}")
  TODAY_COLOR=$(get_rating_color "${today_avg:-5}")
  WEEK_COLOR=$(get_rating_color "${week_avg:-5}")
  MONTH_COLOR=$(get_rating_color "${month_avg:-5}")
fi

# --- Combined Learning + Context output ---
case "$MODE" in
nano)
  bar=$(render_context_bar $bar_width $display_pct)
  printf "${LEARN_LABEL}✿${RESET}"
  [ "$has_ratings" = true ] && printf " ${SIGNAL_PERIOD}1d:${RESET}${TODAY_COLOR}${today_avg}${RESET}"
  printf " ${SLATE_600}│${RESET} ${bar} ${pct_color}${display_pct}%%${RESET}\n"
  ;;
micro)
  bar=$(render_context_bar $bar_width $display_pct)
  printf "${LEARN_LABEL}✿${RESET}"
  if [ "$has_ratings" = true ]; then
    printf " ${SIGNAL_PERIOD}1h:${RESET}${HOUR_COLOR}${hour_avg}${RESET}"
    printf " ${SIGNAL_PERIOD}1d:${RESET}${TODAY_COLOR}${today_avg}${RESET}"
  fi
  printf " ${SLATE_600}│${RESET} ${bar} ${pct_color}${display_pct}%%${RESET}\n"
  ;;
mini)
  bar=$(render_context_bar $bar_width $display_pct)
  printf "${LEARN_LABEL}\xf3\xb0\x9b\xa8${RESET}"
  if [ "$has_ratings" = true ]; then
    printf " ${SIGNAL_PERIOD}1h:${RESET}${HOUR_COLOR}${hour_avg}${RESET}"
    printf " ${SIGNAL_PERIOD}1d:${RESET}${TODAY_COLOR}${today_avg}${RESET}"
    printf " ${SIGNAL_PERIOD}1w:${RESET}${WEEK_COLOR}${week_avg}${RESET}"
  fi
  printf " ${SLATE_600}│${RESET} ${bar} ${pct_color}${display_pct}%%${RESET}\n"
  ;;
normal)
  bar=$(render_context_bar $bar_width $display_pct)
  printf "${LEARN_LABEL}\xf3\xb0\x9b\xa8${RESET}"
  if [ "$has_ratings" = true ]; then
    printf " ${SIGNAL_PERIOD}15m:${RESET}${Q15_COLOR}${q15_avg}${RESET}"
    printf " ${SIGNAL_PERIOD}1h:${RESET}${HOUR_COLOR}${hour_avg}${RESET}"
    printf " ${SIGNAL_PERIOD}1d:${RESET}${TODAY_COLOR}${today_avg}${RESET}"
    printf " ${SIGNAL_PERIOD}1w:${RESET}${WEEK_COLOR}${week_avg}${RESET}"
    printf " ${SIGNAL_PERIOD}1mo:${RESET}${MONTH_COLOR}${month_avg}${RESET}"
  fi
  printf " ${SLATE_600}│${RESET} ${bar} ${pct_color}${display_pct}%%${RESET}\n"
  ;;
esac

# ═══════════════════════════════════════════════════════════════════════════════
# LINE 7: QUOTE (normal mode only)
# ═══════════════════════════════════════════════════════════════════════════════

if [ "$MODE" = "normal" ]; then
  printf "${SLATE_600}─────────────────────────────────────────────────────────────────────────${RESET}\n"

  # Refresh quote if stale (>30s)
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
    author_suffix="\" —${quote_author}"
    author_len=${#author_suffix}
    quote_len=${#quote_text}
    max_line=72

    # Full display: ✦ "quote text" —Author
    full_len=$((quote_len + author_len + 4)) # 4 for ✦ "

    if [ "$full_len" -le "$max_line" ]; then
      # Fits on one line
      printf "${QUOTE_PRIMARY}✦${RESET} ${SLATE_400}\"${quote_text}\"${RESET} ${QUOTE_AUTHOR}—${quote_author}${RESET}\n"
    else
      # Need to wrap - target ~10 words (55-60 chars) on first line
      # Line 1 gets: "✦ \"" (4) + text
      line1_text_max=60 # ~10 words worth

      # Only wrap if there's substantial content left for line 2
      min_line2=12

      # Target: put ~60 chars on line 1
      target_line1=$line1_text_max
      [ "$target_line1" -gt "$quote_len" ] && target_line1=$((quote_len - min_line2))

      # Find word boundary near target
      first_part="${quote_text:0:$target_line1}"
      remaining="${quote_text:$target_line1}"

      # If we're not at a space, find the last space in first_part
      if [ -n "$remaining" ] && [ "${remaining:0:1}" != " " ]; then
        # Find last space position
        temp="$first_part"
        last_space_pos=0
        pos=0
        while [ $pos -lt ${#temp} ]; do
          [ "${temp:$pos:1}" = " " ] && last_space_pos=$pos
          pos=$((pos + 1))
        done
        if [ $last_space_pos -gt 10 ]; then
          first_part="${quote_text:0:$last_space_pos}"
        fi
      fi

      second_part="${quote_text:${#first_part}}"
      second_part="${second_part# }" # trim leading space

      # Only wrap if second part is substantial (more than just a few words)
      if [ ${#second_part} -lt 10 ]; then
        # Too little for line 2, just print on one line (may overflow slightly)
        printf "${QUOTE_PRIMARY}✦${RESET} ${SLATE_400}\"${quote_text}\"${RESET} ${QUOTE_AUTHOR}—${quote_author}${RESET}\n"
      else
        printf "${QUOTE_PRIMARY}✦${RESET} ${SLATE_400}\"${first_part}${RESET}\n"
        printf "  ${SLATE_400}${second_part}\"${RESET} ${QUOTE_AUTHOR}—${quote_author}${RESET}\n"
      fi
    fi
  fi
fi

