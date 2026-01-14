# Atlas

Personal AI Infrastructure for Claude Code.

> **AI Agents:** Read [CLAUDE.md](CLAUDE.md) for development instructions.

## Overview

Atlas is a **fully modular** extension system for Claude Code. Install only what you need:

| Module | Description |
|--------|-------------|
| **voice** | TTS notifications (ElevenLabs/Google) |
| **core** | Identity & session context |
| **security** | Command validation & protection |
| **observability** | Real-time WebSocket dashboard |
| **statusline** | Git/model statusline |
| **tab-titles** | Dynamic terminal titles |
| **skills** | Algorithm, Art, Browser, Agents, etc. |
| **commands** | `/atlas:*` slash commands |

## Quick Start

### Modular Install (Recommended)

```bash
git clone git@github.com:edheltzel/atlas.git
cd atlas

# Interactive wizard - choose what to install
./exports/wizard.sh

# Or install specific modules
./exports/wizard.sh --install voice core security
```

### Full Install

```bash
# With GNU Stow
cd ~/.dotfiles
git submodule add git@github.com:edheltzel/atlas.git atlas
stow atlas

# Standalone
./install.sh
```

## Requirements

- **bun** - JavaScript runtime
- **Claude Code** - Anthropic CLI

## Module Management

```bash
# List available modules
./exports/wizard.sh --list

# Add a module after install
./exports/wizard.sh --install observability

# Use /atlas:modules command in Claude Code
/atlas:modules
```

## Key Commands

| Command | Description |
|---------|-------------|
| `/atlas:help` | Show all commands |
| `/atlas:status` | System health check |
| `/atlas:modules` | Manage installed modules |
| `/atlas:algorithm` | Universal execution engine |
| `/atlas:voice <name>` | Switch voice personality |
| `/atlas:onDeck` | View active plans |

## Philosophy

- First-person voice ("I" not "the system")
- TypeScript over Python
- bun (NEVER npm/yarn/pnpm)
- Markdown over HTML
- **Modular by default** - install only what you need

## License

Private - not yet open source.
