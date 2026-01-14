# Fresh Claude Code Install + Voice

How to start fresh with Claude Code and add only the voice system.

## Step 1: Backup Current Voice Config

If you have voice settings you want to preserve:

```bash
# Backup your API keys
cp ~/.claude/.env ~/claude-env-backup.txt

# Backup voice config
cp ~/.claude/atlas.yaml ~/claude-atlas-backup.yaml

# Note your ElevenLabs voice IDs if custom
```

## Step 2: Remove Existing Config

```bash
# Remove entire Claude config (nuclear option)
rm -rf ~/.claude

# Or selectively remove Atlas additions
rm -rf ~/.claude/voice
rm -rf ~/.claude/hooks
rm -rf ~/.claude/lib
rm -rf ~/.claude/skills
rm -rf ~/.claude/commands
rm ~/.claude/atlas.yaml
rm ~/.claude/settings.json
```

## Step 3: Fresh Claude Code

Claude Code will recreate `~/.claude/` on first run with default settings.

```bash
# Start fresh Claude Code session
claude
```

This creates a minimal `~/.claude/settings.json`.

## Step 4: Install Voice System

```bash
# Navigate to the voice export directory
cd /path/to/voice-standalone

# Run installer
./install.sh
```

## Step 5: Configure API Key

```bash
# Create .env file
echo "ELEVENLABS_API_KEY=your_key_here" > ~/.claude/.env
```

## Step 6: Verify

```bash
# Test voice server
cd ~/.claude/voice && bun run server.ts &

# Test it works
curl http://localhost:8888/health

# Send test notification
curl -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello Ed, voice is working"}'
```

## What You Get

After fresh install + voice:

```
~/.claude/
├── settings.json     # Minimal: just voice hooks
├── .env              # Your API key
├── atlas.yaml        # Voice configuration
├── voice/            # Voice server
├── hooks/            # Voice hooks only
└── lib/              # Config utilities
```

No skills, no commands, no observability - just voice.

## If You Want to Restore Full Atlas Later

The voice system is designed to be modular. You can add back other Atlas components later by copying them from the atlas repo or re-running the full Atlas installer.
