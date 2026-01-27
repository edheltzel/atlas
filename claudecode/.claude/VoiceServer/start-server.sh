#!/bin/bash
# VoiceServer Startup Script
# Shared between Claude Code and OpenCode
# Usage: ./start-server.sh [--check-only] [--quiet]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT=8888
LOG_FILE="/tmp/voice-server.log"
PID_FILE="/tmp/voice-server.pid"

# Parse arguments
CHECK_ONLY=false
QUIET=false
for arg in "$@"; do
  case $arg in
    --check-only) CHECK_ONLY=true ;;
    --quiet) QUIET=true ;;
  esac
done

log() {
  if [ "$QUIET" = false ]; then
    echo "$1"
  fi
}

# Check if server is already running on port
is_running() {
  lsof -ti:$PORT >/dev/null 2>&1
}

# Check if server responds to health check
is_healthy() {
  curl -s --max-time 2 "http://localhost:$PORT/health" >/dev/null 2>&1
}

# Get PID of process on port
get_pid() {
  lsof -ti:$PORT 2>/dev/null | head -1
}

# Main logic
if is_running; then
  if is_healthy; then
    log "✅ VoiceServer already running on port $PORT (PID: $(get_pid))"
    exit 0
  else
    log "⚠️  Port $PORT in use but server not responding - killing stale process"
    kill -9 "$(get_pid)" 2>/dev/null || true
    sleep 1
  fi
fi

# Exit if only checking
if [ "$CHECK_ONLY" = true ]; then
  log "❌ VoiceServer not running on port $PORT"
  exit 1
fi

# Start the server
log "🚀 Starting VoiceServer on port $PORT..."
cd "$SCRIPT_DIR"

# Start in background, redirect output to log
nohup bun run server.ts > "$LOG_FILE" 2>&1 &
SERVER_PID=$!
echo $SERVER_PID > "$PID_FILE"

# Wait for server to be ready (max 5 seconds)
for i in {1..10}; do
  sleep 0.5
  if is_healthy; then
    log "✅ VoiceServer started successfully (PID: $SERVER_PID)"
    exit 0
  fi
done

# Startup failed
log "❌ VoiceServer failed to start - check $LOG_FILE"
cat "$LOG_FILE" | tail -20
exit 1
