# Atlas Voice System

> Text-to-speech notifications with personality-driven voice delivery

## Overview

The Atlas voice system provides spoken notifications when Claude Code completes tasks. It supports multiple TTS providers (ElevenLabs, Google Cloud TTS) and allows switching between different voice personalities.

## Configuration Structure

Atlas uses a two-file configuration approach:

| File | Purpose |
|------|---------|
| `atlas.yaml` | Non-sensitive settings (voice IDs, provider, port) |
| `.env` | Secrets only (API keys) |

This separation ensures sensitive credentials are kept separate from general configuration.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Claude Code Session                          │
│                                                                   │
│  Task completes → Hook fires → Extract message → Send to server  │
└──────────────────────────────┬────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Hooks (bun scripts)                            │
├─────────────────────────────────────────────────────────────────┤
│  stop-hook-voice.ts         → Main agent completion              │
│  subagent-stop-hook-voice.ts → Subagent completion               │
│                                                                   │
│  lib/voice-controller.ts    → CLI for /atlas:voice command       │
│  lib/shared-voice.ts        → Common notification utilities      │
└──────────────────────────────┬────────────────────────────────────┘
                               │ HTTP POST /notify
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                Voice Server (port 8888)                          │
│                ~/.claude/voice/server.ts                         │
├─────────────────────────────────────────────────────────────────┤
│  • Loads config from atlas.yaml                                  │
│  • Loads secrets from .env (API keys only)                       │
│  • Calls TTS API (ElevenLabs or Google)                         │
│  • Plays audio (afplay on macOS, mpg123/mpv on Linux)           │
│  • Shows desktop notification                                    │
└─────────────────────────────────────────────────────────────────┘
```

## Configuration

### 1. Atlas Config (`~/.claude/atlas.yaml`)

All non-sensitive settings live here:

```yaml
# Identity settings
identity:
  name: Atlas
  timezone: America/Los_Angeles

# Voice system configuration
voice:
  # TTS provider: "elevenlabs" or "google"
  provider: elevenlabs

  # Default personality when none specified
  default_personality: default

  # Voice server port
  port: 8888

  # Default volume (0.0 - 1.0)
  default_volume: 0.8

  # Voice IDs per personality
  # Get from ElevenLabs dashboard or Google Cloud Console
  voices:
    # Fallback voice
    default: "your_default_voice_id"

    # Hook personalities
    engineer: "your_engineer_voice_id"
    architect: "your_architect_voice_id"
    researcher: "your_researcher_voice_id"
    designer: "your_designer_voice_id"
    artist: "your_artist_voice_id"
    pentester: "your_pentester_voice_id"
    writer: "your_writer_voice_id"
    intern: "your_intern_voice_id"

    # Agent trait voices (can share IDs with hook personalities)
    authoritative: "your_engineer_voice_id"
    professional: "your_engineer_voice_id"
    warm: "your_designer_voice_id"
    gentle: "your_designer_voice_id"
    energetic: "your_intern_voice_id"
    dynamic: "your_artist_voice_id"
    academic: "your_researcher_voice_id"
    sophisticated: "your_architect_voice_id"
    intense: "your_pentester_voice_id"
    gritty: "your_pentester_voice_id"

  # Google TTS settings (when provider: google)
  google:
    voice: en-US-Neural2-J
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

### 2. Secrets (`~/.claude/.env`)

API keys only:

```bash
# ElevenLabs API Key
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Google Cloud API Key
GOOGLE_API_KEY=your_google_api_key_here
```

### 3. Voice Personalities (`~/.claude/voice-personalities.json`)

Defines voice characteristics (prosody settings) per personality:

```json
{
  "default_volume": 0.8,
  "voices": {
    "default": {
      "voice_name": "Default",
      "stability": 0.38,
      "similarity_boost": 0.75,
      "description": "Professional, expressive - primary AI assistant"
    },
    "intern": {
      "voice_name": "Intern",
      "stability": 0.30,
      "similarity_boost": 0.85,
      "description": "Enthusiastic, chaotic energy - eager 176 IQ genius"
    }
  }
}
```

**Parameters:**
- `stability` (0.0-1.0): Lower = more expressive/chaotic, Higher = more stable
- `similarity_boost` (0.0-1.0): How close to the original voice clone

## Voice Personalities

Atlas supports 18 voice configurations: 8 hook personalities and 10 agent trait voices.

### Hook Personalities (Session Hooks)

| Voice Name   | Archetype    | Energy     | Description                       |
| ------------ | ------------ | ---------- | --------------------------------- |
| `default`    | professional | expressive | Primary AI assistant              |
| `engineer`   | wise-leader  | stable     | Fortune 10 principal engineer     |
| `architect`  | wise-leader  | stable     | PhD-level system designer         |
| `researcher` | analyst      | measured   | Comprehensive research specialist |
| `designer`   | critic       | measured   | Exacting UX/UI specialist         |
| `artist`     | enthusiast   | chaotic    | Visual content creator            |
| `pentester`  | enthusiast   | chaotic    | Offensive security specialist     |
| `writer`     | professional | expressive | Content creation specialist       |
| `intern`     | enthusiast   | chaotic    | Eager 176 IQ genius               |

### Agent Trait Voices (AgentFactory)

Used by the Agents skill for dynamic agent composition:

| Trait Voice     | Maps To    | Description                    |
| --------------- | ---------- | ------------------------------ |
| `authoritative` | engineer   | Commanding, confident delivery |
| `professional`  | engineer   | Business-appropriate tone      |
| `warm`          | designer   | Friendly, approachable         |
| `gentle`        | designer   | Soft, calming delivery         |
| `energetic`     | intern     | High-energy, enthusiastic      |
| `dynamic`       | artist     | Expressive, varied inflection  |
| `academic`      | researcher | Scholarly, precise             |
| `sophisticated` | architect  | Refined, eloquent              |
| `intense`       | pentester  | Serious, focused               |
| `gritty`        | pentester  | Raw, no-nonsense               |

## Commands

### Switch Voice Personality

```bash
/atlas:voice <personality>
```

**Example:**
```bash
/atlas:voice intern    # Switch to intern voice
/atlas:voice default   # Back to default
```

### List All Personalities

```bash
/atlas:voices
```

## TTS Providers

### ElevenLabs (Default)
- High quality voices
- Voice cloning support
- ~10,000 characters/month free tier
- Best for: Custom voice personalities

### Google Cloud TTS
- Lower quality but more generous free tier
- 4M characters/month (Standard), 1M (Neural2)
- No voice cloning
- Best for: High volume usage

**To switch providers:**

In `atlas.yaml`:
```yaml
voice:
  provider: google  # or elevenlabs
```

## API Request Format

Send POST requests to `http://localhost:8888/notify`:

```json
{
  "message": "Task completed successfully",
  "personality": "intern",
  "title": "Optional title",
  "voice_enabled": true
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `message` | string | Yes | Text to speak (max 500 chars) |
| `personality` | string | No | Personality name from atlas.yaml (e.g., "intern", "gritty") |
| `voice_id` | string | No | Direct ElevenLabs voice ID (overrides personality) |
| `title` | string | No | Notification title (default: "PAI Notification") |
| `voice_enabled` | boolean | No | Enable TTS (default: true) |

**Voice Resolution Order:**
1. `voice_id` - Direct voice ID if provided
2. `voice_name` - Alias for voice_id
3. `personality` - Looked up from `config.voice.voices[personality]`
4. Default voice - Falls back to `config.voice.voices.default`

**Example with curl:**
```bash
curl -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  --data-raw '{"message":"Hello from the intern","personality":"intern"}'
```

## How It Works

1. **Task completes** - SessionStop or SubagentStop hook fires
2. **Hook reads transcript** - Extracts the completion message
3. **POST to server** - `{ message, personality, voice_enabled: true }`
4. **Server resolves voice** - Looks up personality in `atlas.yaml` voices
5. **TTS generation** - Calls ElevenLabs or Google TTS API
6. **Audio plays** - Via system audio player (afplay/mpg123/mpv)

## Troubleshooting

### Check Voice Server Health

```bash
curl http://localhost:8888/health
```

Response includes:
- Config source path
- Active TTS provider
- API key status
- Configured voice count
- Cache statistics

### Voice Server Not Running

**Start manually:**
```bash
bun run ~/.claude/voice/server.ts
```

### No Audio Playing

**macOS:** Ensure `afplay` is available (built-in)

**Linux:** Install audio player:
```bash
# Ubuntu/Debian
sudo apt install mpg123
# or
sudo apt install mpv
```

### API Key Issues

**ElevenLabs:**
```bash
# Check key is set
grep ELEVENLABS_API_KEY ~/.claude/.env

# Test API directly
curl -H "xi-api-key: YOUR_KEY" https://api.elevenlabs.io/v1/user
```

**Google:**
```bash
# Ensure Cloud Text-to-Speech API is enabled
# Check key
grep GOOGLE_API_KEY ~/.claude/.env
```

## Adding New Personalities

1. **Create ElevenLabs voice** (or use existing)
2. **Add to `atlas.yaml`:**
   ```yaml
   voice:
     voices:
       newpersonality: "your_voice_id_here"
   ```
3. **Add to `voice-personalities.json`:**
   ```json
   "newpersonality": {
     "voice_name": "New Personality",
     "stability": 0.5,
     "similarity_boost": 0.75,
     "description": "Description here"
   }
   ```
4. **Update `voice-controller.ts`** - add to `VALID_PERSONALITIES` array

## Key Files Reference

| File                                       | Purpose                                |
| ------------------------------------------ | -------------------------------------- |
| `~/.claude/atlas.yaml`                     | Main config (voice IDs, provider, etc)|
| `~/.claude/.env`                           | API keys only                          |
| `~/.claude/voice-personalities.json`       | Voice prosody settings                 |
| `~/.claude/voice/server.ts`                | HTTP server handling TTS requests      |
| `~/.claude/state/current-personality.txt`  | Persists selected personality          |
| `~/.claude/hooks/stop-hook-voice.ts`       | Voice notification on main agent stop  |
| `~/.claude/hooks/subagent-stop-hook-voice.ts` | Voice notification on subagent stop |
| `~/.claude/hooks/lib/voice-controller.ts`  | CLI for switching personalities        |
| `~/.claude/lib/config.ts`                  | Config schema and types                |
| `~/.claude/lib/config-loader.ts`           | Config loading logic                   |

## Migration from .env Voice IDs

If you have voice IDs in your `.env` file (old approach), they will continue to work. The config loader supports backward compatibility:

1. It checks `atlas.yaml` first for voice IDs
2. Falls back to `.env` if not found in config
3. Logs a deprecation warning when using `.env` for voice IDs

To migrate:
1. Copy voice IDs from `.env` to `atlas.yaml` under `voice.voices`
2. Remove `ELEVENLABS_VOICE_*` entries from `.env`
3. Keep only API keys in `.env`
