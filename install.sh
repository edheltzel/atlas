#!/usr/bin/env bash
#
# Atlas Standalone Installer
# Creates symlinks from atlas repo to ~/.claude and ~/.config/opencode
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🤖 Atlas Installer"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check for bun
if ! command -v bun &> /dev/null; then
    echo "❌ bun is required but not installed."
    echo "   Install: curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

# Create symlinks
echo ""
echo "Creating symlinks..."

# .claude directory
if [ -L "$HOME/.claude" ]; then
    echo "  ⚠️  ~/.claude is already a symlink, skipping"
elif [ -d "$HOME/.claude" ]; then
    echo "  ⚠️  ~/.claude already exists as directory"
    echo "     Backup and remove it first, then re-run"
    exit 1
else
    ln -s "$SCRIPT_DIR/.claude" "$HOME/.claude"
    echo "  ✅ ~/.claude → $SCRIPT_DIR/.claude"
fi

# .config/opencode directory
mkdir -p "$HOME/.config"
if [ -L "$HOME/.config/opencode" ]; then
    echo "  ⚠️  ~/.config/opencode is already a symlink, skipping"
elif [ -d "$HOME/.config/opencode" ]; then
    echo "  ⚠️  ~/.config/opencode already exists as directory"
    echo "     Backup and remove it first, then re-run"
    exit 1
else
    ln -s "$SCRIPT_DIR/.config/opencode" "$HOME/.config/opencode"
    echo "  ✅ ~/.config/opencode → $SCRIPT_DIR/.config/opencode"
fi

# Install dependencies
echo ""
echo "Installing dependencies..."

# Voice server
if [ -f "$SCRIPT_DIR/.claude/voice/package.json" ]; then
    cd "$SCRIPT_DIR/.claude/voice" && bun install
    echo "  ✅ Voice server dependencies"
fi

# Browser skill
if [ -f "$SCRIPT_DIR/.claude/skills/Browser/package.json" ]; then
    cd "$SCRIPT_DIR/.claude/skills/Browser" && bun install
    echo "  ✅ Browser skill dependencies"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Atlas installed successfully!"
echo ""
echo "Start Claude Code to begin using Atlas."
echo "Run /atlas:help for available commands."
