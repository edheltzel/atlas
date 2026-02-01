# Changelog

All notable changes to the VoiceServer will be documented in this file.

## [2.0.0] - 2026-02-01

### Added
- **Multi-provider TTS support** - Three providers: Kokoro (local), ElevenLabs (cloud), macOS say (system)
- **Provider abstraction layer** - `TTSProvider` interface for extensibility
- **KokoroProvider class** - Local neural TTS via VoiceMode CLI
- **Per-provider circuit breakers** - Independent failure tracking per provider
- **Configurable fallback chain** - Priority order in `settings.json`
- **Health endpoint improvements** - Reports all provider statuses and health
- **Kokoro voice personality mappings** - Per-agent voice configs in `voices.json`
- **Environment variable support** - `${ELEVENLABS_API_KEY}` syntax in config

### Changed
- **Default provider**: Kokoro (was ElevenLabs) - open source friendly
- **ElevenLabs**: Disabled by default (opt-in for users with API keys)
- **Config schema**: New `voiceServer.tts.providers` section in settings.json
- **Health response**: Now includes provider status, active provider, fallback order

### Migration from v1.x
Existing configs continue to work. To use multi-provider:

1. Install Kokoro:
   ```bash
   pip install voice-mode
   voicemode kokoro install
   voicemode kokoro start
   ```

2. Update settings.json (optional - defaults work):
   ```json
   {
     "voiceServer": {
       "tts": {
         "provider": "kokoro",
         "providers": {
           "kokoro": { "enabled": true },
           "elevenlabs": { "enabled": false },
           "say": { "enabled": true }
         }
       }
     }
   }
   ```

### Technical Notes
- Kokoro endpoint: `http://127.0.0.1:8880/v1`
- Kokoro uses OpenAI-compatible `/audio/speech` API
- Circuit breaker: 1 failure triggers open, 60s reset
- VoiceMode CLI: `voicemode kokoro install/start/stop`

---

## [1.1.0] - Previous Release

### Features
- ElevenLabs SDK integration with 10s timeout
- Circuit breaker pattern for fast fallback
- macOS `say` command fallback
- Agent personality voice mappings
- Rate limiting (10 req/min)
- CORS restricted to localhost

### Configuration
- API key from `~/.claude/.env` or `~/.env`
- Default voice ID configurable
- macOS fallback voice in settings.json

---

## [1.0.0] - Initial Release

### Features
- Basic ElevenLabs TTS
- HTTP notification endpoint
- macOS notification display
- LaunchAgent service management
