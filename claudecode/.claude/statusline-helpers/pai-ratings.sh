#!/bin/bash
# PAI ratings helper - outputs learning signal averages
# Reads from learning-cache.sh or computes from ratings.jsonl

PAI_DIR="${PAI_DIR:-$HOME/.claude}"
RATINGS_FILE="$PAI_DIR/MEMORY/LEARNING/SIGNALS/ratings.jsonl"
LEARNING_CACHE="$PAI_DIR/MEMORY/STATE/learning-cache.sh"
LEARNING_CACHE_TTL=30

# Color a rating value - exact gradient from original statusline
color_rating() {
  local val="$1"
  [ "$val" = "—" ] && printf '\033[38;2;148;163;184m—\033[0m' && return  # SLATE_400
  local int="${val%%.*}"
  if [ "$int" -ge 9 ] 2>/dev/null; then
    printf '\033[38;2;74;222;128m%s\033[0m' "$val"   # RATING_10 emerald
  elif [ "$int" -ge 8 ] 2>/dev/null; then
    printf '\033[38;2;163;230;53m%s\033[0m' "$val"   # RATING_8 lime
  elif [ "$int" -ge 7 ] 2>/dev/null; then
    printf '\033[38;2;250;204;21m%s\033[0m' "$val"   # RATING_7 yellow
  elif [ "$int" -ge 6 ] 2>/dev/null; then
    printf '\033[38;2;251;191;36m%s\033[0m' "$val"   # RATING_6 amber
  elif [ "$int" -ge 5 ] 2>/dev/null; then
    printf '\033[38;2;251;146;60m%s\033[0m' "$val"   # RATING_5 orange
  elif [ "$int" -ge 4 ] 2>/dev/null; then
    printf '\033[38;2;248;113;113m%s\033[0m' "$val"  # RATING_4 rose
  else
    printf '\033[38;2;239;68;68m%s\033[0m' "$val"    # RATING_LOW red
  fi
}

# Check cache validity
cache_valid=false
now=$(date +%s)
if [ -f "$LEARNING_CACHE" ]; then
  cache_mtime=$(stat -f %m "$LEARNING_CACHE" 2>/dev/null || echo 0)
  ratings_mtime=$(stat -f %m "$RATINGS_FILE" 2>/dev/null || echo 0)
  cache_age=$((now - cache_mtime))
  [ "$cache_mtime" -gt "$ratings_mtime" ] && [ "$cache_age" -lt "$LEARNING_CACHE_TTL" ] && cache_valid=true
fi

if [ "$cache_valid" = true ]; then
  source "$LEARNING_CACHE"
else
  if [ -f "$RATINGS_FILE" ]; then
    eval "$(jq -rs --argjson now "$now" '
      def to_epoch:
        (capture("(?<sign>[-+])(?<h>[0-9]{2}):(?<m>[0-9]{2})$") // {sign: "+", h: "00", m: "00"}) as $tz |
        gsub("[-+][0-9]{2}:[0-9]{2}$"; "Z") | gsub("\\.[0-9]+"; "") | fromdateiso8601 |
        . + (if $tz.sign == "-" then 1 else -1 end) * (($tz.h | tonumber) * 3600 + ($tz.m | tonumber) * 60);
      [.[] | select(.rating != null) | . + {epoch: (.timestamp | to_epoch)}] |
      ($now - 900) as $q15 | ($now - 3600) as $h | ($now - 86400) as $d |
      ($now - 604800) as $w | ($now - 2592000) as $mo |
      (map(select(.epoch >= $q15) | .rating) | if length > 0 then (add / length | . * 10 | floor / 10 | tostring) else "—" end) as $q15_avg |
      (map(select(.epoch >= $h) | .rating) | if length > 0 then (add / length | . * 10 | floor / 10 | tostring) else "—" end) as $hour_avg |
      (map(select(.epoch >= $d) | .rating) | if length > 0 then (add / length | . * 10 | floor / 10 | tostring) else "—" end) as $today_avg |
      (map(select(.epoch >= $w) | .rating) | if length > 0 then (add / length | . * 10 | floor / 10 | tostring) else "—" end) as $week_avg |
      (map(select(.epoch >= $mo) | .rating) | if length > 0 then (add / length | . * 10 | floor / 10 | tostring) else "—" end) as $month_avg |
      "q15_avg=\($q15_avg | @sh)\nhour_avg=\($hour_avg | @sh)\ntoday_avg=\($today_avg | @sh)\nweek_avg=\($week_avg | @sh)\nmonth_avg=\($month_avg | @sh)"
    ' "$RATINGS_FILE" 2>/dev/null)"

    # Update cache
    cat >"$LEARNING_CACHE" <<EOF
q15_avg='${q15_avg:-—}'
hour_avg='${hour_avg:-—}'
today_avg='${today_avg:-—}'
week_avg='${week_avg:-—}'
month_avg='${month_avg:-—}'
EOF
  fi
fi

# Default fallbacks
q15_avg="${q15_avg:-—}"
hour_avg="${hour_avg:-—}"
today_avg="${today_avg:-—}"
week_avg="${week_avg:-—}"
month_avg="${month_avg:-—}"

# Output with ANSI colors per rating value
printf '\033[38;2;148;163;184m15m:\033[0m'
color_rating "$q15_avg"
printf ' \033[38;2;148;163;184m1h:\033[0m'
color_rating "$hour_avg"
printf ' \033[38;2;148;163;184m1d:\033[0m'
color_rating "$today_avg"
printf ' \033[38;2;148;163;184m1w:\033[0m'
color_rating "$week_avg"
printf ' \033[38;2;148;163;184m1mo:\033[0m'
color_rating "$month_avg"
