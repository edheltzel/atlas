---
project: atlas-config-file
directory: /Users/ed/.dotfiles/atlas
created: 2026-01-08
status: completed
---

# Task: Implement Atlas Configuration File System

## Objective

Separate configuration concerns:
- **`.env`** - API keys and secrets ONLY
- **`atlas.yaml`** - Non-sensitive settings (voice IDs, preferences, behavior)

---

## Phases

### Phase 1: Create Config Schema and File

**Goal:** Define the config structure and create initial files

- [x] Create `atlas.yaml` config file structure
- [x] Create `atlas.example.yaml` template
- [x] Define TypeScript types for config
- [x] Add Zod schema for validation

**Files:**
- NEW: `.claude/atlas.yaml`
- NEW: `.claude/atlas.example.yaml`
- NEW: `.claude/lib/config.ts` (types + schema)

### Phase 2: Create Config Loader

**Goal:** Bun-native config loading with validation

- [x] Create `loadConfig()` function with YAML parsing
- [x] Implement secret loading from `.env` (API keys only)
- [x] Add config merging logic
- [x] Add validation with clear error messages
- [x] Support config hot-reload (optional)

**Files:**
- NEW: `.claude/lib/config-loader.ts`

### Phase 3: Update Voice Server

**Goal:** Migrate voice server to new config system

- [x] Replace manual `.env` parsing with config loader
- [x] Move voice ID lookups to config
- [x] Update voice personality resolution
- [x] Maintain backward compatibility (transitional)
- [x] Add deprecation warnings for old `.env` voice IDs

**Files:**
- MODIFY: `.claude/voice/server.ts`
- MODIFY: `.claude/voice-personalities.json` (simplify)

### Phase 4: Update Hooks

**Goal:** Migrate hooks to use config loader

- [x] Update `voice-controller.ts` to use config
- [x] Update `shared-voice.ts` to use config
- [x] Update any other hooks reading config values
- [x] Consolidate config access patterns

**Note:** Hooks delegate to voice server which now handles config. Minimal changes needed.

**Files:**
- MODIFY: `.claude/hooks/lib/voice-controller.ts`
- MODIFY: `.claude/hooks/lib/shared-voice.ts`

### Phase 5: Simplify .env

**Goal:** Clean up .env to secrets-only

- [x] Update `.env.example` to show only secrets
- [x] Document migration path for existing users
- [x] Add config validation that warns about old patterns

**Files:**
- MODIFY: `.claude/.env.example`
- MODIFY: Docs (VOICE-SYSTEM.md, etc.)

### Phase 6: Documentation & Testing

**Goal:** Complete documentation and verification

- [x] Document new config structure
- [x] Add config validation to health check
- [x] Test voice system with new config
- [x] Test backward compatibility
- [ ] Update `/atlas:status` to show config source (optional enhancement)

**Files:**
- MODIFY: `.claude/docs/VOICE-SYSTEM.md`
- MODIFY: `.claude/commands/atlas/status.md`

---

## Config File Structure

### atlas.yaml (Full Example)

```yaml
# Atlas Configuration
# Non-sensitive settings - DO NOT put API keys here

# Identity settings
identity:
  name: Atlas
  timezone: America/Los_Angeles

# Voice system configuration
voice:
  # TTS provider: "elevenlabs" or "google"
  provider: elevenlabs

  # Default personality to use
  default_personality: pai

  # Voice server port
  port: 8888

  # Volume (0.0 - 1.0)
  default_volume: 0.8

  # Voice IDs per personality
  # Get these from ElevenLabs dashboard or Google Cloud Console
  voices:
    default: "s3TPKV1kjDlVtZbl4Ksh"
    pai: "your_pai_voice_id"
    engineer: "your_engineer_voice_id"
    architect: "your_architect_voice_id"
    researcher: "your_researcher_voice_id"
    designer: "your_designer_voice_id"
    artist: "your_artist_voice_id"
    pentester: "your_pentester_voice_id"
    writer: "your_writer_voice_id"
    intern: "your_intern_voice_id"

  # Google TTS settings (when provider: google)
  google:
    voice: "en-US-Neural2-J"
    speaking_rate: 1.0
    pitch: 0.0

# Observability dashboard
observability:
  enabled: true
  port: 3000

# Feature flags
features:
  voice_enabled: true
  observability_enabled: true
```

### .env (Simplified)

```bash
# Atlas Secrets - API Keys Only
# Non-sensitive settings go in atlas.yaml

# ElevenLabs API Key (required for elevenlabs provider)
ELEVENLABS_API_KEY=your_api_key_here

# Google Cloud API Key (required for google provider)
GOOGLE_API_KEY=your_api_key_here
```

---

## TypeScript Types

```typescript
// .claude/lib/config.ts

interface AtlasConfig {
  identity: {
    name: string;
    timezone: string;
  };
  voice: {
    provider: 'elevenlabs' | 'google';
    default_personality: string;
    port: number;
    default_volume: number;
    voices: Record<string, string>;
    google?: {
      voice: string;
      speaking_rate: number;
      pitch: number;
    };
  };
  observability: {
    enabled: boolean;
    port: number;
  };
  features: {
    voice_enabled: boolean;
    observability_enabled: boolean;
  };
}

interface AtlasSecrets {
  ELEVENLABS_API_KEY?: string;
  GOOGLE_API_KEY?: string;
}
```

---

## Backward Compatibility Strategy

1. **Transitional Period:**
   - Config loader checks both `atlas.yaml` AND `.env` for voice IDs
   - Prefer `atlas.yaml`, fall back to `.env`
   - Log deprecation warning when using `.env` for non-secrets

2. **Migration Helper:**
   - Add `/atlas:migrate-config` command to auto-generate `atlas.yaml` from current `.env`

3. **Grace Period:**
   - Support old format for 2-3 months
   - Clear migration documentation

---

## Success Criteria

- [ ] `.env` contains ONLY API keys (ELEVENLABS_API_KEY, GOOGLE_API_KEY)
- [ ] All voice IDs configurable in `atlas.yaml`
- [ ] Voice system works identically to current behavior
- [ ] Config validation with helpful error messages
- [ ] Backward compatibility for existing setups
- [ ] Clear documentation for migration

---

## Status Updates

- 2026-01-08 15:44: Initial plan created from codebase exploration
- 2026-01-08 16:30: Implementation complete
  - Created `atlas.yaml` config structure
  - Created config loader with Zod validation
  - Updated voice server to use new config
  - Simplified `.env.example` to secrets-only
  - Updated VOICE-SYSTEM.md documentation
  - Backward compatibility: legacy .env voice IDs still work with deprecation warning
