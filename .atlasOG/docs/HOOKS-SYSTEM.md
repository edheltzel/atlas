# Atlas Hooks System

TypeScript lifecycle hooks executed via bun. All hooks are in `~/.claude/hooks/`.

## Session Hooks

| Hook | Event | Purpose |
|------|-------|---------|
| `initialize-session.ts` | SessionStart | Create session marker, set terminal title |
| `load-core-context.ts` | SessionStart | Inject CORE skill context |
| `start-voice-server.ts` | SessionStart | Start ElevenLabs TTS server |

## Stop Hooks

| Hook | Event | Purpose |
|------|-------|---------|
| `stop-hook.ts` | Stop | Main agent completion handling |
| `stop-hook-voice.ts` | Stop | Voice notification for completions |
| `subagent-stop-hook.ts` | SubagentStop | Subagent completion handling |
| `subagent-stop-hook-voice.ts` | SubagentStop | Subagent voice notification |

## Capture Hooks

| Hook | Event | Purpose |
|------|-------|---------|
| `capture-all-events.ts` | PreToolUse, PostToolUse, Stop | Complete event audit trail |
| `capture-history.ts` | Multiple | Categorized history for MEMORY system |
| `capture-session-summary.ts` | SessionEnd | Generate session summary |

## Utility Hooks

| Hook | Event | Purpose |
|------|-------|---------|
| `security-validator.ts` | PreToolUse | Block dangerous commands per patterns.yaml |
| `update-tab-titles.ts` | Multiple | Update terminal tab titles |
| `test-security.ts` | — | Security testing utility |

## Configuration

Hooks are registered in `~/.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [
      { "command": "bun run $PAI_DIR/hooks/start-voice-server.ts" },
      { "command": "bun run $PAI_DIR/hooks/initialize-session.ts" },
      { "command": "bun run $PAI_DIR/hooks/load-core-context.ts" }
    ],
    "PreToolUse": [
      { "command": "bun run $PAI_DIR/hooks/security-validator.ts" }
    ],
    "Stop": [
      { "command": "bun run $PAI_DIR/hooks/stop-hook-voice.ts" }
    ]
  }
}
```

## Running Hooks Manually

```bash
bun run ~/.claude/hooks/<hook-name>.ts
```

## Shared Libraries

Hook utilities in `~/.claude/hooks/lib/`:
- `shared-voice.ts` - Voice notification helpers
- `voice-controller.ts` - Voice server communication
- `metadata-extraction.ts` - Agent metadata parsing
- `observability.ts` - Dashboard event sending
