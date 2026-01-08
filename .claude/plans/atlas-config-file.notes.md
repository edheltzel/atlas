# Research Notes: Atlas Configuration System

## Current State Analysis

### Configuration Sources (Current)

| Source | Purpose | Location |
|--------|---------|----------|
| `.env` | API keys + Voice IDs | `$PAI_DIR/.env` |
| `voice-personalities.json` | Voice settings with templated IDs | `.claude/voice-personalities.json` |
| `settings.json` | Hooks, env vars, permissions | `.claude/settings.json` |
| `state/current-personality.txt` | Runtime voice state | `$PAI_DIR/state/` |

### What's Currently in .env

```
# Secrets (should stay in .env)
ELEVENLABS_API_KEY=xxx
GOOGLE_API_KEY=xxx

# Non-secrets (should move to config)
DA=Atlas
TIME_ZONE=America/New_York
TTS_PROVIDER=elevenlabs
ELEVENLABS_VOICE_DEFAULT=xxx
ELEVENLABS_VOICE_PAI=xxx
ELEVENLABS_VOICE_ENGINEER=xxx
# ... 9 voice IDs total
```

### Voice System Architecture

1. **Voice Server** (`voice/server.ts`):
   - Loads `.env` manually at startup (lines 22-33)
   - Reads `voice-personalities.json` for voice settings
   - Uses template variable substitution (`${ELEVENLABS_VOICE_PAI}`)
   - Falls back to hardcoded default voice ID

2. **Voice Controller** (`hooks/lib/voice-controller.ts`):
   - Manages personality state persistence
   - Writes to `state/current-personality.txt`

3. **Voice Personalities JSON Structure**:
   ```json
   {
     "default_volume": 0.8,
     "voices": {
       "pai": {
         "voice_id": "${ELEVENLABS_VOICE_PAI}",
         "stability": 0.38,
         "similarity_boost": 0.75,
         "description": "..."
       }
     }
   }
   ```

### Problems with Current Approach

1. **Mixed concerns**: Voice IDs (not secrets) in `.env` with API keys (secrets)
2. **Template substitution**: Requires parsing `${VAR}` in JSON, complex
3. **Scattered config**: Settings in 3+ places
4. **No validation**: No schema for config values
5. **Manual parsing**: Server parses `.env` line-by-line

---

## Config File Format Options

### Option A: YAML (Recommended)

**Pros:**
- Human-readable, comments supported
- Standard in DevOps/config world
- Native support in Bun via `bun-types`

**Cons:**
- Requires parser (small overhead)

### Option B: JSON

**Pros:**
- Native JavaScript support
- No parser needed
- Already used for voice-personalities.json

**Cons:**
- No comments
- Verbose

### Option C: TOML

**Pros:**
- Simple, readable
- Good for nested config

**Cons:**
- Less familiar
- Requires parser

**Decision:** YAML for primary config (atlas.yaml), keeping JSON for voice-specific settings

---

## Proposed Config Structure

### atlas.yaml (new)
```yaml
# Atlas Configuration
# Non-sensitive settings that define behavior

identity:
  name: Atlas
  timezone: America/Los_Angeles

voice:
  provider: elevenlabs  # google | elevenlabs
  default_personality: pai
  port: 8888

  # Voice IDs per personality (moved from .env)
  voices:
    default: "s3TPKV1kjDlVtZbl4Ksh"
    pai: "voice_id_here"
    engineer: "voice_id_here"
    # ...

observability:
  enabled: true
  port: 3000
```

### .env (simplified)
```bash
# SECRETS ONLY
ELEVENLABS_API_KEY=xxx
GOOGLE_API_KEY=xxx
```

---

## Implementation Considerations

### Config Loading Order
1. Load `atlas.yaml` for base config
2. Load `.env` for secrets only
3. Merge at runtime

### Backward Compatibility
- Check for voice IDs in both `.env` and config
- Prefer config, fall back to .env
- Deprecation warning if IDs in .env

### Bun-Native Loading
```typescript
import { parse } from 'yaml';

const configPath = join(paiDir, 'atlas.yaml');
const config = parse(await Bun.file(configPath).text());
```

### Validation
- Use Zod for runtime schema validation
- Fail fast with clear error messages

---

## Files to Modify

| File | Change |
|------|--------|
| `voice/server.ts` | Load config from YAML, keep .env for secrets only |
| `voice-personalities.json` | Remove templated voice_ids, reference config |
| `.env.example` | Simplify to secrets only |
| NEW: `atlas.yaml` | Primary config file |
| NEW: `atlas.example.yaml` | Example config |
| Hooks | Update to read from config |

---

## Migration Path

1. Create `atlas.yaml` with current values
2. Update server to read from both (transitional)
3. Deprecation warnings for old approach
4. Document new config structure
5. Remove old approach after transition period
