# Voice Server

A multi-provider voice notification server for the Personal AI Infrastructure (PAI) system. Supports three TTS providers with automatic fallback.

> **Quick Start**: See [QUICKSTART.md](QUICKSTART.md) for a 5-minute setup guide.

## TTS Providers

| Provider | Quality | Latency | Cost | Offline | Setup |
|----------|---------|---------|------|---------|-------|
| **Kokoro** | Good (neural) | ~200ms | Free | Yes | `voicemode kokoro install` |
| **ElevenLabs** | Excellent (neural) | ~500ms | Paid API | No | Add API key |
| **macOS say** | Basic (system) | ~50ms | Free | Yes | None (built-in) |

### Default Configuration (Open Source Friendly)

Out of the box, the server uses:
1. **Kokoro** as primary (free, local, no API key)
2. **macOS say** as fallback (always available)
3. **ElevenLabs** disabled (opt-in for users with API keys)

## 🚀 Quick Start

### Option 1: Free Local TTS (Kokoro)

```bash
# Install dependencies
brew install ffmpeg portaudio

# Install VoiceMode CLI
pip install voice-mode

# Install and start Kokoro (local TTS)
voicemode kokoro install
voicemode kokoro start

# Verify Kokoro is running
curl http://127.0.0.1:8880/v1/models

# Start VoiceServer
cd ~/.claude/VoiceServer && ./start.sh

# Test
curl -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Kokoro working!"}'
```

### Option 2: Premium Voices (ElevenLabs)

```bash
# Get API key from https://elevenlabs.io
# Add to ~/.claude/.env or ~/.env:
echo "ELEVENLABS_API_KEY=sk-your-key-here" >> ~/.claude/.env

# Enable in settings.json:
# "voiceServer.tts.providers.elevenlabs.enabled": true
# "voiceServer.tts.provider": "elevenlabs"
```

### Option 3: Zero Setup (macOS say)

Works immediately on any Mac. If Kokoro isn't running, falls back to `say` automatically.

## 📡 API Usage

### Send Notification

```bash
curl -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Task completed",
    "voice_id": "kai",
    "voice_enabled": true
  }'
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `message` | string | required | Text to speak |
| `title` | string | "PAI Notification" | Notification title |
| `voice_id` | string | null | Agent name or voice ID |
| `voice_enabled` | boolean | true | Enable voice output |

### Health Check

```bash
curl http://localhost:8888/health | jq
```

Returns provider status:
```json
{
  "status": "healthy",
  "activeProvider": "kokoro",
  "providers": {
    "kokoro": { "enabled": true, "healthy": true },
    "elevenlabs": { "enabled": false, "healthy": false },
    "say": { "enabled": true, "healthy": true }
  },
  "fallbackOrder": ["kokoro", "elevenlabs", "say"]
}
```

## 🎭 Voice Personalities

Each agent has distinct voice mappings for both Kokoro and ElevenLabs:

| Agent | Description | Kokoro Voice | ElevenLabs Voice |
|-------|-------------|--------------|------------------|
| kai | Expressive eager buddy | am_adam | Jamie (Premium) |
| engineer | Battle-scarred leader | am_michael | Marcus (Premium) |
| architect | Strategic, wise | bf_emma | Serena (Premium) |
| designer | Sophisticated critic | af_nicole | Isha (Premium) |
| pentester | Mischievous hacker | bm_george | Oliver (Enhanced) |
| intern | High-energy genius | am_adam | - |

See `voices.json` for full configuration.

## 🔧 Configuration

### settings.json

```json
{
  "voiceServer": {
    "tts": {
      "provider": "kokoro",
      "providers": {
        "elevenlabs": {
          "enabled": false,
          "apiKey": "${ELEVENLABS_API_KEY}",
          "defaultVoiceId": "s3TPKV1kjDlVtZbl4Ksh"
        },
        "kokoro": {
          "enabled": true,
          "endpoint": "http://127.0.0.1:8880/v1",
          "defaultVoice": "af_sky"
        },
        "say": {
          "enabled": true,
          "voice": "Daniel (Enhanced)"
        }
      },
      "fallbackOrder": ["kokoro", "elevenlabs", "say"]
    }
  }
}
```

### Environment Variables

```bash
# ~/.claude/.env or ~/.env
ELEVENLABS_API_KEY=sk-your-key-here  # Optional
PORT=8888                             # Server port
```

## 🛠️ Service Management

```bash
# Start/Stop/Restart
./start.sh
./stop.sh
./restart.sh

# Check status
./status.sh

# View logs
tail -f ~/Library/Logs/pai-voice-server.log
```

## 🐛 Troubleshooting

### Kokoro not working

```bash
# Check if running
curl http://127.0.0.1:8880/v1/models

# Start if not running
voicemode kokoro start

# Reinstall if issues
voicemode kokoro stop
voicemode kokoro install
voicemode kokoro start
```

### Server falls back to macOS say

Check `/health` endpoint to see provider status. Common causes:
- Kokoro not running (start with `voicemode kokoro start`)
- ElevenLabs disabled or API key missing
- Circuit breaker opened after failures (resets after 60s)

### No voice output

```bash
# Test macOS say directly
say "Test voice output"

# Check server health
curl http://localhost:8888/health | jq '.providers'

# Check logs
tail -f ~/Library/Logs/pai-voice-server.log
```

### Port already in use

```bash
lsof -ti :8888 | xargs kill -9
./start.sh
```

## 📁 File Structure

```
~/.claude/VoiceServer/
├── server.ts          # Multi-provider TTS server
├── voices.json        # Agent voice mappings (ElevenLabs + Kokoro)
├── start.sh           # Start server
├── stop.sh            # Stop server
├── restart.sh         # Restart server
├── status.sh          # Check status
├── install.sh         # Full installation
├── uninstall.sh       # Remove service
└── README.md          # This file
```

## 🔐 Security

- **No hardcoded API keys**: Uses environment variables
- **Local only**: Listens on localhost (127.0.0.1)
- **Rate limited**: 10 requests/minute per client
- **CORS restricted**: Only localhost allowed

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

### v2.0.0 (2026-02-01)
- Multi-provider TTS support (Kokoro, ElevenLabs, macOS say)
- Provider abstraction layer
- Per-provider circuit breakers
- Configurable fallback chain
- Kokoro voice personality mappings
- ElevenLabs disabled by default (open source friendly)
