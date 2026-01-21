#!/bin/bash
# Claude Code Voice System Installer
# Installs voice notifications to ~/.claude/

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="$HOME/.claude"

echo "Installing Claude Code Voice System..."
echo "Target: $CLAUDE_DIR"
echo ""

# Create directories
mkdir -p "$CLAUDE_DIR/voice/lib"
mkdir -p "$CLAUDE_DIR/hooks/lib"
mkdir -p "$CLAUDE_DIR/lib"

# Copy voice server
echo "Copying voice server..."
cp -r "$SCRIPT_DIR/voice/"* "$CLAUDE_DIR/voice/"

# Copy hooks
echo "Copying hooks..."
cp "$SCRIPT_DIR/hooks/start-voice-server.ts" "$CLAUDE_DIR/hooks/"
cp "$SCRIPT_DIR/hooks/stop-hook-voice.ts" "$CLAUDE_DIR/hooks/"
cp "$SCRIPT_DIR/hooks/subagent-stop-hook-voice.ts" "$CLAUDE_DIR/hooks/"
cp -r "$SCRIPT_DIR/hooks/lib/"* "$CLAUDE_DIR/hooks/lib/"

# Copy lib
echo "Copying lib..."
cp -r "$SCRIPT_DIR/lib/"* "$CLAUDE_DIR/lib/"

# Copy config template (if not exists)
if [ ! -f "$CLAUDE_DIR/atlas.yaml" ]; then
  echo "Creating atlas.yaml config..."
  cp "$SCRIPT_DIR/atlas.yaml" "$CLAUDE_DIR/"
fi

# Install dependencies
echo ""
echo "Installing dependencies..."
cd "$CLAUDE_DIR/voice" && bun install

# Merge settings.json
echo ""
if [ -f "$CLAUDE_DIR/settings.json" ]; then
  echo "Found existing settings.json"
  echo "Add these hooks to your settings.json manually:"
  echo ""
  cat "$SCRIPT_DIR/settings-hooks.json"
  echo ""
else
  echo "Creating settings.json..."
  cp "$SCRIPT_DIR/settings.json" "$CLAUDE_DIR/"
fi

echo ""
echo "Installation complete!"
echo ""
echo "Next steps:"
echo "1. Create ~/.claude/.env with your API key:"
echo "   ELEVENLABS_API_KEY=your_key_here"
echo ""
echo "2. Test the voice server:"
echo "   cd ~/.claude/voice && bun run server.ts"
echo ""
echo "3. Start a new Claude Code session to auto-start voice"
