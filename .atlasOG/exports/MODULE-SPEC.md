# Atlas Module Specification

Each module is a self-contained directory with a `module.json` manifest.

## module.json Schema

```json
{
  "name": "voice",
  "version": "1.0.0",
  "description": "Voice notifications for task completion",
  "dependencies": [],

  "hooks": {
    "SessionStart": [
      { "command": "bun run $CLAUDE_DIR/hooks/start-voice-server.ts" }
    ],
    "Stop": [
      { "command": "bun run $CLAUDE_DIR/hooks/stop-hook-voice.ts" }
    ]
  },

  "files": [
    { "src": "voice/", "dest": "voice/" },
    { "src": "hooks/", "dest": "hooks/" }
  ],

  "config": {
    "atlas.yaml": {
      "voice": {
        "provider": "elevenlabs",
        "port": 8888
      }
    }
  },

  "env": [
    { "key": "ELEVENLABS_API_KEY", "required": true, "description": "ElevenLabs API key" }
  ],

  "commands": ["voice.md", "voices.md"],

  "postInstall": "cd $CLAUDE_DIR/voice && bun install"
}
```

## Directory Structure

```
exports/modules/{name}/
├── module.json          # Module manifest
├── hooks/               # Hook scripts
├── lib/                 # Shared utilities
├── commands/            # Slash commands
└── {other}/             # Module-specific files
```

## Installation

The wizard reads module.json and:
1. Copies files to ~/.claude/
2. Merges hooks into settings.json
3. Merges config into atlas.yaml
4. Prompts for required env vars
5. Runs postInstall command

## Variables

- `$CLAUDE_DIR` - Resolves to ~/.claude (or custom path)
- `$MODULE_DIR` - Source module directory during install
