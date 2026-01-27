# VoiceServer Port to OpenCode - Detailed Plan

## Executive Summary

Port the Claude Code VoiceServer (ElevenLabs SDK + circuit breaker + macOS fallback) to work with OpenCode. The voice server itself is **tool-agnostic** - we just need an OpenCode plugin to call it.

---

## Architecture Decision

### Shared Server Model (Recommended)

```
┌─────────────────┐     ┌─────────────────┐
│   Claude Code   │     │    OpenCode     │
│   (hooks.ts)    │     │  (plugin.ts)    │
└────────┬────────┘     └────────┬────────┘
         │                       │
         │   HTTP POST /notify   │
         └──────────┬────────────┘
                    ▼
         ┌──────────────────────┐
         │    VoiceServer       │
         │   (port 8888)        │
         │                      │
         │  • ElevenLabs SDK    │
         │  • 10s timeout       │
         │  • Circuit breaker   │
         │  • macOS fallback    │
         └──────────────────────┘
```

**Why shared?**
- Single source of truth for voice logic
- Both tools benefit from improvements
- One process to manage
- Already works with Claude Code

---

## Hook/Event Comparison

### Claude Code Hooks → OpenCode Events

| CC Hook | CC Purpose | OC Event | OC Status | Notes |
|---------|-----------|----------|-----------|-------|
| `SessionStart` | Startup greeting | `session.created` | ✅ **MATCH** | Direct equivalent |
| `SessionEnd` | Session cleanup | `session.deleted` | ✅ **MATCH** | Direct equivalent |
| `Stop` | Agent completed work | `session.idle` | ✅ **BETTER** | OC detects idle automatically |
| `UserPromptSubmit` | User sends message | `tui.prompt.append` | ✅ **MATCH** | Slightly different name |
| `PreToolUse` | Before tool execution | `tool.execute.before` | ✅ **MATCH** | Direct equivalent |
| `PostToolUse` | After tool execution | `tool.execute.after` | ✅ **MATCH** | Direct equivalent |
| `SubagentStop` | Subagent completed | ❌ **NONE** | ⚠️ **PAIN POINT** | No subagent events |

### OpenCode Events NOT in Claude Code

| OC Event | Purpose | Opportunity |
|----------|---------|-------------|
| `session.compacted` | Context compaction occurred | Could notify user |
| `session.status` | Status changes | Fine-grained tracking |
| `message.updated` | AI response streaming | Real-time feedback |
| `permission.asked` | Permission requested | "Need your approval" voice |
| `permission.replied` | Permission answered | Acknowledgment |
| `todo.updated` | Task list changed | Progress tracking |
| `lsp.client.diagnostics` | LSP errors | "Found X type errors" |
| `file.edited` | File was modified | Confirmation voice |
| `experimental.chat.system.transform` | Modify system prompt | Inject context |

---

## Pain Points & Missing Features

### 🔴 Critical Pain Points

1. **No SubagentStop equivalent**
   - CC notifies when background agents complete
   - OC has no subagent event system
   - **Workaround:** Poll task tool status? Use `session.idle` as proxy?

2. **No startupCatchphrase config**
   - CC has `daidentity.startupCatchphrase` in settings.json
   - OC has no personality config section
   - **Workaround:** Hardcode in plugin or create custom config

3. **No voiceId config in opencode.json**
   - CC has `daidentity.voiceId` and full voice settings
   - OC has no voice configuration schema
   - **Workaround:** Use env vars or separate config file

### 🟡 Moderate Pain Points

4. **Different config paradigm**
   - CC: JSON in settings.json with `$schema` validation
   - OC: JSON + plugins + file-based commands
   - **Impact:** Must maintain separate configs

5. **No `{env:VAR}` in plugin code**
   - OC config supports `{env:VAR}` substitution
   - Plugins must use `process.env.VAR` directly
   - **Impact:** Minor - just different syntax

6. **Plugin debugging**
   - OC plugins run in separate context
   - Console.log may not surface clearly
   - **Impact:** Development friction

### 🟢 Minor Pain Points

7. **File locations differ**
   - CC: `~/.claude/`
   - OC: `~/.config/opencode/`
   - **Impact:** Just path differences, not blocking

8. **No skill-trigger equivalent**
   - CC skills auto-load via Skill tool triggers
   - OC skills are lazy-loaded but no keyword triggers
   - **Impact:** Voice commands would differ

---

## Implementation Tasks

### Phase 1: Foundation (Can Start Now)

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1.1 Verify VoiceServer compatibility                                   │
├────────────────────────────────────────────────────────────────────────┤
│ • Confirm server works from external curl calls                        │
│ • Test that any process can call POST /notify                          │
│ • Verify .env loading works for both ~/.claude/.env and ~/.env         │
│ Dependencies: None                                                     │
│ Effort: 15 min                                                         │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ 1.2 Create shared startup script                                       │
├────────────────────────────────────────────────────────────────────────┤
│ • Script to start VoiceServer if not running                           │
│ • Check port 8888, start if free                                       │
│ • Can be called by both CC hooks and OC plugins                        │
│ Dependencies: 1.1                                                      │
│ Effort: 30 min                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### Phase 2: Basic OC Plugin

```
┌────────────────────────────────────────────────────────────────────────┐
│ 2.1 Create voice-notification plugin skeleton                          │
├────────────────────────────────────────────────────────────────────────┤
│ Path: ~/.config/opencode/plugins/voice-notification.ts                 │
│ • Export Plugin type                                                   │
│ • Basic event handler structure                                        │
│ • HTTP client helper for voice server                                  │
│ Dependencies: Phase 1                                                  │
│ Effort: 30 min                                                         │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ 2.2 Implement session.created handler                                  │
├────────────────────────────────────────────────────────────────────────┤
│ • Startup greeting: "OpenCode session started"                         │
│ • Read voice config from env or config file                            │
│ • Call VoiceServer /notify endpoint                                    │
│ Dependencies: 2.1                                                      │
│ Effort: 20 min                                                         │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ 2.3 Implement session.idle handler                                     │
├────────────────────────────────────────────────────────────────────────┤
│ • Task completion: "Task completed"                                    │
│ • Debounce to avoid repeated notifications                             │
│ Dependencies: 2.1                                                      │
│ Effort: 20 min                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### Phase 3: Enhanced Features

```
┌────────────────────────────────────────────────────────────────────────┐
│ 3.1 Implement permission.asked handler                                 │
├────────────────────────────────────────────────────────────────────────┤
│ • "Waiting for your approval"                                          │
│ • Matches existing audio-feedback.js behavior                          │
│ Dependencies: 2.1                                                      │
│ Effort: 15 min                                                         │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ 3.2 Add voice configuration support                                    │
├────────────────────────────────────────────────────────────────────────┤
│ • Read from ~/.config/opencode/voice.json or env vars                  │
│ • Support voiceId, stability, similarity_boost, etc.                   │
│ • Fall back to defaults                                                │
│ Dependencies: 2.2                                                      │
│ Effort: 30 min                                                         │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ 3.3 Implement tool.execute.after for tests                             │
├────────────────────────────────────────────────────────────────────────┤
│ • Detect test commands (npm test, bun test, pytest, etc.)              │
│ • "Tests completed" or "Tests failed" based on result                  │
│ Dependencies: 2.1                                                      │
│ Effort: 30 min                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### Phase 4: Parity & Polish

```
┌────────────────────────────────────────────────────────────────────────┐
│ 4.1 Auto-start VoiceServer from plugin                                 │
├────────────────────────────────────────────────────────────────────────┤
│ • Check if server running on startup                                   │
│ • Start server in background if not                                    │
│ • Handle startup failures gracefully                                   │
│ Dependencies: 1.2, 2.1                                                 │
│ Effort: 45 min                                                         │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ 4.2 Create /voice command for manual notifications                     │
├────────────────────────────────────────────────────────────────────────┤
│ Path: ~/.config/opencode/commands/voice.md                             │
│ • /voice "message" - speak arbitrary text                              │
│ • Uses VoiceServer endpoint                                            │
│ Dependencies: Phase 2                                                  │
│ Effort: 20 min                                                         │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ 4.3 Remove duplicate audio-feedback.js                                 │
├────────────────────────────────────────────────────────────────────────┤
│ • Migrate functionality to voice-notification.ts                       │
│ • Remove old plugin                                                    │
│ • Update any references                                                │
│ Dependencies: Phase 3                                                  │
│ Effort: 15 min                                                         │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ 4.4 Document the setup                                                 │
├────────────────────────────────────────────────────────────────────────┤
│ • Update opencode README                                               │
│ • Document env vars needed                                             │
│ • Add troubleshooting guide                                            │
│ Dependencies: All above                                                │
│ Effort: 30 min                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Voice Configuration Strategy

### Option A: Shared Config (Recommended)

Use the existing `~/.claude/settings.json` voice config for both tools:

```typescript
// In OC plugin
const settingsPath = join(homedir(), '.claude', 'settings.json');
const settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));
const voiceConfig = settings.daidentity.voice;
const voiceId = settings.daidentity.voiceId;
```

**Pros:** Single source of truth, no duplication
**Cons:** OC depends on CC directory structure

### Option B: Env Variables

```bash
# ~/.config/opencode/.env or system env
VOICE_ID=Ioq2c1GJee5RyqeoBIH3
VOICE_STABILITY=0.35
VOICE_SIMILARITY_BOOST=0.8
```

**Pros:** Tool-independent
**Cons:** Duplication, harder to manage

### Option C: OC-Specific Config

```json
// ~/.config/opencode/voice.json
{
  "voiceId": "Ioq2c1GJee5RyqeoBIH3",
  "stability": 0.35,
  "similarity_boost": 0.8,
  "startupCatchphrase": "Bentley here, ready to go."
}
```

**Pros:** OC-native
**Cons:** Config drift risk

**Recommendation:** Start with Option A (shared), since both tools are managed by Atlas.

---

## Plugin Code Template

```typescript
// ~/.config/opencode/plugins/voice-notification.ts
import type { Plugin } from "@opencode-ai/plugin"
import { readFileSync, existsSync } from "fs"
import { join } from "path"
import { homedir } from "os"

const VOICE_SERVER = 'http://localhost:8888/notify'

// Load voice config from Claude Code settings (shared)
function loadVoiceConfig() {
  const settingsPath = join(homedir(), '.claude', 'settings.json')
  if (!existsSync(settingsPath)) {
    return { voiceId: 'AXdMgz6evoL7OPd7eU12', catchphrase: 'OpenCode ready.' }
  }

  try {
    const settings = JSON.parse(readFileSync(settingsPath, 'utf-8'))
    return {
      voiceId: settings.daidentity?.voiceId || 'AXdMgz6evoL7OPd7eU12',
      catchphrase: settings.daidentity?.startupCatchphrase || 'OpenCode ready.',
      voice: settings.daidentity?.voice || {}
    }
  } catch {
    return { voiceId: 'AXdMgz6evoL7OPd7eU12', catchphrase: 'OpenCode ready.' }
  }
}

async function notify(message: string, voiceId?: string) {
  const config = loadVoiceConfig()
  try {
    await fetch(VOICE_SERVER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        voice_id: voiceId || config.voiceId,
        title: 'OpenCode'
      })
    })
  } catch (e) {
    // Voice server not running - silent fail
    console.log('[voice] Server not available:', (e as Error).message)
  }
}

let lastIdleTime = 0
const IDLE_DEBOUNCE_MS = 5000

export default: Plugin = async ({ $ }) => {
  const config = loadVoiceConfig()

  return {
    event: async ({ event }) => {
      switch (event.type) {
        case 'session.created':
          await notify(config.catchphrase)
          break

        case 'session.idle':
          // Debounce to avoid repeated notifications
          const now = Date.now()
          if (now - lastIdleTime > IDLE_DEBOUNCE_MS) {
            lastIdleTime = now
            await notify('Task completed.')
          }
          break

        case 'permission.asked':
          await notify('Waiting for your approval.')
          break
      }
    },

    tool: {
      after: async (tool, args, result) => {
        // Notify on test completions
        if (tool.name === 'bash') {
          const cmd = args.command || ''
          if (cmd.includes('test') || cmd.includes('jest') || cmd.includes('pytest')) {
            const success = result?.exitCode === 0
            await notify(success ? 'Tests passed.' : 'Tests failed.')
          }
        }
      }
    }
  }
}
```

---

## Testing Plan

### Manual Tests

1. **Session Start**
   ```bash
   opencode  # Should hear startup catchphrase
   ```

2. **Task Completion**
   ```bash
   # In opencode, run a simple task
   # Should hear "Task completed" when idle
   ```

3. **Permission Request**
   ```bash
   # Trigger a permission-required action
   # Should hear "Waiting for your approval"
   ```

4. **Test Command**
   ```bash
   # Run: npm test
   # Should hear "Tests passed" or "Tests failed"
   ```

5. **Fallback Test**
   ```bash
   # Stop VoiceServer, verify macOS `say` works
   kill $(lsof -ti:8888)
   # Trigger notification - should hear macOS voice
   ```

---

## Migration Checklist

- [ ] Phase 1 complete (foundation)
- [ ] Phase 2 complete (basic plugin)
- [ ] Phase 3 complete (enhanced features)
- [ ] Phase 4 complete (parity & polish)
- [ ] Remove old audio-feedback.js
- [ ] Document in opencode README
- [ ] Test all notification types
- [ ] Verify VoiceServer shared between CC and OC

---

## Timeline Estimate

| Phase | Tasks | Status |
|-------|-------|--------|
| Phase 1 | Foundation | Not started |
| Phase 2 | Basic plugin | Not started |
| Phase 3 | Enhanced features | Not started |
| Phase 4 | Parity & polish | Not started |

**Total estimated effort:** ~5 hours of focused work

---

## Decision Points

1. **Shared vs separate config?** → Recommend shared (Option A)
2. **Keep audio-feedback.js?** → Remove after migration
3. **Different voice for OC?** → User preference - currently "Bentley" vs "Atlas"
4. **Auto-start server?** → Yes, with graceful failure

---

## References

- [OpenCode Plugins Guide](https://opencode.ai/docs/plugins/)
- [OpenCode Events List](https://opencode.ai/docs/plugins/#available-hooks)
- [VoiceServer Source](~/.claude/VoiceServer/server.ts)
- [Claude Code Hooks Config](~/.claude/settings.json)
