# Atlas

Personal AI Infrastructure for Claude Code.

> **AI Agents:** Read [CLAUDE.md](CLAUDE.md) for development instructions.

## What is Atlas?

Atlas extends [Claude Code](https://docs.anthropic.com/en/docs/claude-code) with modular capabilities:

| Module | What it does |
|--------|--------------|
| **voice** | Speaks task completions aloud (ElevenLabs/Google TTS) |
| **core** | Loads your identity and preferences at session start |
| **security** | Blocks dangerous commands (rm -rf, reverse shells, etc.) |
| **observability** | Real-time dashboard showing what Claude is doing |
| **statusline** | Shows git branch, model, and usage in your terminal |
| **tab-titles** | Updates terminal tab titles based on project |
| **skills** | Algorithm, Art, Browser automation, Agents, and more |
| **commands** | 20+ slash commands (`/atlas:help`, `/atlas:status`, etc.) |

## Prerequisites

1. **Claude Code** - [Install from Anthropic](https://docs.anthropic.com/en/docs/claude-code)
2. **Bun** - [Install from bun.sh](https://bun.sh)
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

## Installation

### Option 1: Interactive Wizard (Recommended)

```bash
# Clone the repo
git clone https://github.com/edheltzel/atlas.git
cd atlas

# Run the wizard - select which modules to install
./exports/wizard.sh
```

The wizard shows all available modules and lets you pick what you want.

### Option 2: Install Specific Modules

```bash
git clone https://github.com/edheltzel/atlas.git
cd atlas

# Install only what you need
./exports/wizard.sh --install voice core security

# See all available modules
./exports/wizard.sh --list
```

### Option 3: Full Install (Everything)

```bash
git clone https://github.com/edheltzel/atlas.git
cd atlas
./install.sh
```

### Option 4: With GNU Stow (for dotfiles users)

```bash
cd ~/.dotfiles
git submodule add https://github.com/edheltzel/atlas.git atlas
stow atlas
```

## Configuration

### Voice (Optional)

To enable voice notifications, add your API key to `~/.claude/.env`:

```bash
# For ElevenLabs (recommended)
echo "ELEVENLABS_API_KEY=your_key_here" >> ~/.claude/.env

# Or for Google Cloud TTS (free tier: 4M chars/month)
echo "GOOGLE_API_KEY=your_key_here" >> ~/.claude/.env
```

### Identity

Edit `~/.claude/skills/CORE/SKILL.md` to customize your AI's name and personality.

## Usage

After installation, start Claude Code normally:

```bash
claude
```

Atlas loads automatically. Try these commands:

| Command | What it does |
|---------|--------------|
| `/atlas:help` | Show all available commands |
| `/atlas:status` | Check system health |
| `/atlas:algorithm` | Run structured task execution |
| `/atlas:voice engineer` | Switch voice personality |

## Adding/Removing Modules Later

```bash
# Add a module
./exports/wizard.sh --install observability

# From within Claude Code
/atlas:modules
```

## Troubleshooting

**Voice not working?**
- Check `~/.claude/.env` has your API key
- Run `curl http://localhost:8888/health` to test the voice server

**Hooks not running?**
- Ensure bun is installed: `bun --version`
- Check `~/.claude/settings.json` has the hook configurations

**Module not loading?**
- Run `/atlas:status` to check what's installed
- Re-run the wizard to reinstall: `./exports/wizard.sh`

## License

Private - not yet open source.
