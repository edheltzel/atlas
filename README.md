# Atlas

Personal AI Infrastructure for Claude Code.

## Overview

Atlas is a modular infrastructure layer for Claude Code that provides:

- **Voice System** - ElevenLabs TTS with 10 personality voices
- **Skills** - Reusable capabilities (Art, Agents, Browser, Prompting, CORE)
- **Hooks** - Session lifecycle management and event capture
- **Commands** - 18 slash commands under the `/atlas:` namespace
- **Observability** - Real-time WebSocket dashboard for monitoring

## Structure

```
atlas/
├── .claude/              # Claude Code configuration
│   ├── commands/atlas/   # Slash commands (/atlas:*)
│   ├── hooks/            # TypeScript lifecycle hooks
│   ├── skills/           # Modular skill definitions
│   ├── voice/            # ElevenLabs voice server
│   ├── observability/    # Vue dashboard (client/server)
│   └── docs/             # Documentation
└── .config/opencode/     # OpenCode AI configuration
```

## Installation

### With GNU Stow (recommended for dotfiles)

```bash
# Clone as submodule in your dotfiles
cd ~/.dotfiles
git submodule add git@github.com:edheltzel/atlas.git atlas

# Stow to create symlinks
stow atlas
```

### Standalone

```bash
# Clone and run install script
git clone git@github.com:edheltzel/atlas.git
cd atlas
./install.sh
```

## Requirements

- **bun** - JavaScript runtime (NOT npm/yarn/pnpm)
- **Claude Code** - Anthropic's CLI tool

## Commands

| Command                 | Description               |
| ----------------------- | ------------------------- |
| `/atlas:help`           | Show all commands         |
| `/atlas:status`         | System health check       |
| `/atlas:voice <name>`   | Switch voice personality  |
| `/atlas:art <task>`     | Visual content generation |
| `/atlas:agents <task>`  | Custom agent composition  |
| `/atlas:browser <task>` | Web automation            |

See `/.claude/docs/ATLAS-COMMANDS.md` for full reference.

## Philosophy

- First-person voice ("I" not "the system")
- TypeScript over Python
- bun (NEVER npm/yarn/pnpm)
- Markdown over HTML

## References, Credits and Inspiration

This project is heavily inspired by:

- [PAI](https://github.com/danielmiessler/Personal_AI_Infrastructure)
- [Always On AI Assistant](https://github.com/disler/always-on-ai-assistant)
