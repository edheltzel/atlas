# Atlas Installation

## Requirements

- **bun** - JavaScript runtime (NOT npm/yarn/pnpm)
- **Claude Code** - Anthropic CLI tool

## With GNU Stow (Recommended)

For dotfiles integration:

```bash
# Add as submodule
cd ~/.dotfiles
git submodule add git@github.com:edheltzel/atlas.git atlas

# Create symlinks
stow atlas

# After changes, restow
make stow pkg=atlas
```

## Standalone

```bash
git clone git@github.com:edheltzel/atlas.git
cd atlas
./install.sh
```

## What Gets Installed

Symlinks created to home directory:

| Source | Target |
|--------|--------|
| `.claude/` | `~/.claude/` |
| `.config/opencode/` | `~/.config/opencode/` |

## Post-Installation

1. Copy `.claude/.env.example` to `.claude/.env`
2. Add your API keys (ELEVENLABS_API_KEY, etc.)
3. Run `/atlas:status` to verify installation

## Updating

```bash
cd ~/.dotfiles/atlas
git pull
make stow pkg=atlas  # If using stow
```
