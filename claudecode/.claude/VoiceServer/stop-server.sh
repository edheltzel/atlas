#!/bin/bash
# VoiceServer Stop Script
# Usage: ./stop-server.sh [--quiet]

PORT=8888
PID_FILE="/tmp/voice-server.pid"

QUIET=false
[ "$1" = "--quiet" ] && QUIET=true

log() {
  [ "$QUIET" = false ] && echo "$1"
}

# Get PID of process on port
get_pid() {
  lsof -ti:$PORT 2>/dev/null | head -1
}

PID=$(get_pid)

if [ -z "$PID" ]; then
  log "ℹ️  VoiceServer not running on port $PORT"
  rm -f "$PID_FILE"
  exit 0
fi

log "🛑 Stopping VoiceServer (PID: $PID)..."
kill "$PID" 2>/dev/null

# Wait for graceful shutdown (max 3 seconds)
for i in {1..6}; do
  sleep 0.5
  if ! lsof -ti:$PORT >/dev/null 2>&1; then
    log "✅ VoiceServer stopped"
    rm -f "$PID_FILE"
    exit 0
  fi
done

# Force kill if still running
log "⚠️  Force killing..."
kill -9 "$PID" 2>/dev/null || true
rm -f "$PID_FILE"
log "✅ VoiceServer stopped (forced)"
exit 0
