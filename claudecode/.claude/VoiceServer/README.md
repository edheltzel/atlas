# Voice Server + VoiceMode Integration

Two complementary voice systems for PAI:

| System | Purpose | Port |
|--------|---------|------|
| **VoiceServer** | PAI hook notifications (task complete, agent speak) | 8888 |
| **VoiceMode** | Voice conversations with Claude (`claude converse`) | MCP |

Both use the same local TTS/STT services (Kokoro + Whisper).

---

## 🚀 Complete Setup (Recommended)

### 1. Install VoiceMode CLI

```bash
# Using pipx (recommended for CLI tools)
pipx install voice-mode

# Or with pip
pip install voice-mode
```

### 2. Install Local Services

```bash
# Install Kokoro (TTS - text to speech)
voicemode service install kokoro
voicemode service start kokoro

# Install Whisper (STT - speech to text)
voicemode service install whisper
voicemode service start whisper

# Verify both running
voicemode service status
```

### 3. Register VoiceMode with Claude Code

```bash
# Add VoiceMode as MCP server
claude mcp add --scope user voicemode -- voicemode

# Verify connection
claude mcp list
```

### 4. Start Voice Conversation

```bash
# Voice chat with Claude!
claude converse
```

### 5. (Optional) Enable Auto-Start at Boot

```bash
voicemode service enable kokoro
voicemode service enable whisper
```

---

## 🎙️ Using Voice Mode

### Voice Conversations with Claude

```bash
# Start voice conversation
claude converse

# With specific voice
claude converse --voice af_sky

# Continuous mode (keeps listening)
claude converse --continuous
```

### PAI Notifications (Hooks)

The VoiceServer handles notifications from PAI hooks:

```bash
# Start VoiceServer
cd ~/.claude/VoiceServer && ./start.sh

# Test notification
curl -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message":"Task completed"}'
```

---

## TTS Providers

VoiceServer supports three TTS providers with automatic fallback:

| Provider | Quality | Latency | Cost | Offline |
|----------|---------|---------|------|---------|
| **Kokoro** | Good (neural) | ~200ms | Free | Yes |
| **ElevenLabs** | Excellent (neural) | ~500ms | Paid | No |
| **macOS say** | Basic (system) | ~50ms | Free | Yes |

### Default Configuration

- **Kokoro**: Primary (free, local)
- **macOS say**: Fallback (always available)
- **ElevenLabs**: Disabled (opt-in with API key)

---

## 📡 VoiceServer API

### Send Notification

```bash
curl -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "voice_id": "kai"}'
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

---

## 🎭 Voice Personalities

Each agent has distinct voice mappings:

| Agent | Description | Kokoro Voice |
|-------|-------------|--------------|
| kai | Expressive eager buddy | am_adam |
| engineer | Battle-scarred leader | am_michael |
| architect | Strategic, wise | bf_emma |
| designer | Sophisticated critic | af_nicole |
| pentester | Mischievous hacker | bm_george |
| intern | High-energy genius | am_adam |

See `voices.json` for full configuration including ElevenLabs mappings.

---

## 🔧 Configuration

### settings.json (VoiceServer)

```json
{
  "voiceServer": {
    "tts": {
      "provider": "kokoro",
      "providers": {
        "elevenlabs": {
          "enabled": false,
          "apiKey": "${ELEVENLABS_API_KEY}"
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

### Enable ElevenLabs (Optional)

```bash
# Add API key
echo "ELEVENLABS_API_KEY=sk-your-key" >> ~/.claude/.env

# Enable in settings.json
# "voiceServer.tts.providers.elevenlabs.enabled": true
```

---

## 🛠️ Service Management

### VoiceMode Services

```bash
# Check all services
voicemode service status

# Start/stop individual services
voicemode service start kokoro
voicemode service stop whisper
voicemode service restart kokoro

# View logs
voicemode service logs kokoro

# Enable/disable auto-start
voicemode service enable kokoro
voicemode service disable whisper
```

### VoiceServer (PAI Notifications)

```bash
cd ~/.claude/VoiceServer

./start.sh      # Start server
./stop.sh       # Stop server
./restart.sh    # Restart server
./status.sh     # Check status
```

---

## 🐛 Troubleshooting

### Services not running

```bash
# Check status
voicemode service status

# Restart services
voicemode service restart kokoro
voicemode service restart whisper
```

### `claude converse` not working

```bash
# Verify MCP registration
claude mcp list

# Re-register if needed
claude mcp add --scope user voicemode -- voicemode

# Check services are running
voicemode service status
```

### VoiceServer falls back to macOS say

```bash
# Check Kokoro health
curl http://127.0.0.1:8880/v1/models

# Check VoiceServer sees Kokoro
curl http://localhost:8888/health | jq '.providers.kokoro'

# Restart Kokoro if needed
voicemode service restart kokoro
```

### No audio output

```bash
# Test macOS audio
say "Test"

# Test Kokoro directly
curl -X POST http://127.0.0.1:8880/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{"input": "Hello", "voice": "af_sky"}' \
  --output /tmp/test.mp3 && afplay /tmp/test.mp3
```

---

## 📁 File Structure

```
~/.claude/VoiceServer/          # PAI notification server
├── server.ts                   # Multi-provider TTS server
├── voices.json                 # Agent voice mappings
├── start.sh / stop.sh          # Service scripts
└── README.md                   # This file

~/.voicemode/                   # VoiceMode data
├── services/
│   ├── kokoro/                 # Kokoro TTS service
│   └── whisper/                # Whisper STT service
└── config.yaml                 # VoiceMode configuration

~/.claude.json                  # Claude Code config (MCP servers)
```

---

## 📝 Changelog

### v2.0.0 (2026-02-01)
- Multi-provider TTS support (Kokoro, ElevenLabs, macOS say)
- VoiceMode integration for `claude converse`
- Provider abstraction layer
- Per-provider circuit breakers
- Kokoro voice personality mappings
- ElevenLabs disabled by default (open source friendly)

See [CHANGELOG.md](CHANGELOG.md) for full history.
