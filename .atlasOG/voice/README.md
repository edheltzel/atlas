# Atlas Voice System

ElevenLabs TTS voice notification system for Claude Code hooks.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Stop Hook     │────▶│  Voice Server   │────▶│   ElevenLabs    │
│ (main agent)    │     │  (port 8888)    │     │      TTS        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              ▲
┌─────────────────┐           │
│ SubagentStop    │───────────┘
│    Hook         │
└─────────────────┘
```

## Voice Behavior

### Main Agent (Stop Hook)
- **Only speaks** when response contains explicit `🎯 COMPLETED:` pattern
- **Silent otherwise** to avoid overlap with subagent announcements
- Format: "The task is completed, Ed. {details}"

### Subagents (SubagentStop Hook)
- Speaks when any subagent completes a Task
- Uses agent-specific voice and codename
- Format: "{Codename} completed {message}"

## Agent Codenames

| Agent Type | Codename | Voice |
|------------|----------|-------|
| explore | Scout | - |
| plan | Strategist | - |
| general-purpose | Atlas | - |
| claude-code-guide | Mentor | - |
| default | Agent Zero | - |
| intern | Rookie | Enthusiastic |
| engineer | Tesla | Wise leader |
| architect | Keystone | Deliberate |
| researcher | Einstein | Measured |
| designer | Apollo | Measured |
| artist | Picasso | Chaotic |
| pentester | Sphinx | Chaotic |
| writer | Graphite | Expressive |

## Setup

```bash
cd ~/.claude/voice
bun install
```

## Running

```bash
# Start voice server
bun run server.ts

# Or with hot reload
bun --hot server.ts
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PAI_VOICE_SERVER` | `http://localhost:8888/notify` | Voice server endpoint |
| `ELEVENLABS_API_KEY` | - | ElevenLabs API key (required) |
| `TTS_PROVIDER` | `elevenlabs` | TTS provider (`elevenlabs` or `google`) |

## Triggering Voice

Include `🎯 COMPLETED:` pattern in your response:

```
🎯 COMPLETED: Task finished successfully
```

For subagents, include agent type:

```
🎯 COMPLETED: [AGENT:writer] Documentation updated
```

## Files

- `server.ts` - Voice notification server
- `lib/prosody-enhancer.ts` - Speech prosody and voice mapping
- `lib/voice-controller.ts` - Voice personality switcher
