# Diverged Files from Upstream PAI

Files in this list have been intentionally modified from the upstream PAI repository and should NOT be blindly overwritten during sync.

## How to Sync Safely

When syncing with upstream PAI (`~/Developer/AI/PAI`):

1. **Review this file first** - Check what's diverged and why
2. **Use selective sync** - Don't copy diverged files, or merge manually
3. **Check upstream changes** - See if upstream has improvements we want to merge

```bash
# Compare diverged files with upstream
diff ~/.claude/VoiceServer/server.ts ~/Developer/AI/PAI/.claude/VoiceServer/server.ts

# If upstream has changes we want, merge manually
```

---

## Diverged Files

### VoiceServer/server.ts

**Reason:** Added ElevenLabs SDK with circuit breaker and macOS fallback

**Changes:**
- ElevenLabs SDK integration (replaces raw fetch)
- 10-second timeout to prevent multi-minute hangs
- Circuit breaker pattern (opens after 1 failure, 60s reset)
- macOS `say` command fallback for instant local TTS
- Full voice settings support (style, speed, use_speaker_boost)

**Dependencies added:**
- `VoiceServer/package.json` - elevenlabs SDK dependency
- `VoiceServer/bun.lock` - lockfile

**Date:** 2026-01-27
**Commit:** 314fde5

---

### VoiceServer/package.json (NEW)

**Reason:** Required for ElevenLabs SDK dependency

Not in upstream - created for local SDK integration.

---

## Files Safe to Sync

Everything NOT listed above can be safely synced from upstream PAI.

---

## Merge Strategy

When upstream PAI updates VoiceServer:

1. **Check if they added SDK support** - If yes, compare implementations
2. **Check if they added timeout/fallback** - If yes, merge their approach with ours
3. **If no overlap** - Keep our version, it's strictly better

The key features to preserve:
- 10s timeout (prevents hanging)
- Circuit breaker (fast fallback)
- macOS say fallback (works without API credits)
