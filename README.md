# Atlas

Personal AI Infrastructure for Claude Code.

> **AI Agents:** Read [CLAUDE.md](CLAUDE.md) for development instructions.

## Overview

Atlas provides modular infrastructure for Claude Code:

- **11 Skills** - Algorithm, DeepPlan, Art, Agents, Browser, Prompting, CORE, CreateSkill, + conversion utilities
- **13 Hooks** - Session lifecycle, voice notifications, security validation
- **22 Commands** - `/atlas:*` namespace
- **Voice System** - ElevenLabs TTS with 10 personality voices
- **Statusline** - Max plan usage tracking with Eldritch theme
- **Observability** - Real-time WebSocket dashboard
- **MEMORY System** - Structured history capture and state tracking
- **Bundle System** - Portable configurations for export/import
- **Security** - Pattern-based protection via PreToolUse hooks

## Quick Start

```bash
# With GNU Stow (recommended)
cd ~/.dotfiles
git submodule add git@github.com:edheltzel/atlas.git atlas
stow atlas

# Standalone
git clone git@github.com:edheltzel/atlas.git
cd atlas && ./install.sh
```

## Requirements

- **bun** - JavaScript runtime
- **Claude Code** - Anthropic CLI

## Key Commands

| Command | Description |
|---------|-------------|
| `/atlas:help` | Show all commands |
| `/atlas:status` | System health check |
| `/atlas:algorithm` | Universal execution engine |
| `/atlas:deep-plan` | Persistent planning |
| `/atlas:voice <name>` | Switch voice personality |
| `/atlas:onDeck` | View active plans |

## Philosophy

- First-person voice ("I" not "the system")
- TypeScript over Python
- bun (NEVER npm/yarn/pnpm)
- Markdown over HTML

## License

Private - not yet open source.
