---
description: Start, stop, or check the observability dashboard
allowed-tools: Bash(~/.claude/Observability/manage.sh:*), Bash(lsof:*), Bash(open:*)
---

# Observability Dashboard

Manage the PAI Observability Dashboard for monitoring agent activity.

## Context

- Dashboard URL: http://localhost:5172
- Server API: http://localhost:4000
- Current status: !`lsof -Pi :4000 -sTCP:LISTEN -t >/dev/null 2>&1 && echo "Running" || echo "Stopped"`

## Arguments

`$ARGUMENTS` can be:
- `start` - Start the dashboard (detached)
- `stop` - Stop the dashboard
- `restart` - Restart the dashboard
- `status` - Check if running
- `open` - Start if needed and open in browser
- (empty) - Default to `open`

## Your Task

Based on `$ARGUMENTS`:

**If `start` or empty/`open`:**
1. Check if already running
2. If not running, start with: `~/.claude/Observability/manage.sh start-detached`
3. If `open` or empty, also run: `open http://localhost:5172`

**If `stop`:**
1. Run: `~/.claude/Observability/manage.sh stop`

**If `restart`:**
1. Run: `~/.claude/Observability/manage.sh stop`
2. Run: `~/.claude/Observability/manage.sh start-detached`
3. Open browser: `open http://localhost:5172`

**If `status`:**
1. Run: `~/.claude/Observability/manage.sh status`

Report the result concisely.
