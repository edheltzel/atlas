# Claude Code Voice System

Standalone voice notification system for Claude Code. Speaks task completions using ElevenLabs or Google Cloud TTS.

## Quick Install

```bash
./install.sh
```

This copies the voice system to `~/.claude/` and merges hooks into your existing settings.

## What It Does

- Speaks "The task is completed, Ed. {summary}" when responses contain `🎯 COMPLETED: ...`
- Speaks "Need your direction, Ed" when responses contain `🔔 AWAITING: ...`
- Auto-starts voice server on session start
- Caches audio for fast playback of repeated phrases

## Files Installed

```
~/.claude/
├── voice/              # Voice server
│   ├── server.ts       # HTTP server (port 8888)
│   └── lib/            # Cache, prosody
├── hooks/              # Claude Code hooks
│   ├── start-voice-server.ts
│   ├── stop-hook-voice.ts
│   └── lib/            # Shared utilities
├── lib/                # Config loader
├── atlas.yaml          # Configuration
└── .env                # API keys (you create this)
```

## Configuration

### 1. API Key (Required)

Create `~/.claude/.env`:

```env
ELEVENLABS_API_KEY=your_key_here
```

Or for Google Cloud TTS (free tier: 4M chars/month):

```env
GOOGLE_API_KEY=your_key_here
```

### 2. Voice Settings (Optional)

Edit `~/.claude/atlas.yaml`:

```yaml
voice:
  provider: elevenlabs  # or 'google'
  port: 8888
  default_volume: 0.8
  voices:
    default: "s3TPKV1kjDlVtZbl4Ksh"  # ElevenLabs voice ID
```

## Usage

Include these patterns in your responses to trigger voice:

```
🎯 COMPLETED: Task finished successfully
```

```
🔔 AWAITING: Which approach should I use?
```

## Manual Server Control

```bash
# Start server
cd ~/.claude/voice && bun run server.ts

# Check health
curl http://localhost:8888/health

# Test notification
curl -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "message": "Hello Ed"}'
```

## Uninstall

```bash
rm -rf ~/.claude/voice ~/.claude/hooks ~/.claude/lib
# Then remove voice hooks from ~/.claude/settings.json
```

## Requirements

- [Bun](https://bun.sh) runtime
- macOS (afplay) or Linux (mpg123/mpv)
- ElevenLabs or Google Cloud API key
