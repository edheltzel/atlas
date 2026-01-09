# Atlas

Personal AI Infrastructure for Claude Code.

## Overview

Atlas is a modular infrastructure layer for Claude Code that provides:

- **Voice System** - ElevenLabs TTS with 10 personality voices
- **Skills** - Reusable capabilities (CORE, Algorithm, DeepPlan, Art, Agents, Browser, Prompting, CreateSkill)
- **Hooks** - Session lifecycle management and event capture
- **Commands** - 21 slash commands under the `/atlas:` namespace
- **Observability** - Real-time WebSocket dashboard for monitoring
- **MEMORY System** - Structured history capture and state tracking
- **Bundle System** - Portable configurations for export/import across machines
- **Security** - Path-level protection via patterns.yaml with BLOCK/WARN/AUDIT severity levels

## Structure

```
atlas/
├── .claude/              # Claude Code configuration
│   ├── commands/atlas/   # Slash commands (/atlas:*)
│   ├── hooks/            # TypeScript lifecycle hooks
│   ├── skills/           # Modular skill definitions (11 skills)
│   │   ├── Algorithm/    # Universal execution engine (ISC tracking)
│   │   ├── CORE/         # Core identity and context
│   │   └── DeepPlan/     # Persistent planning system
│   ├── Bundles/          # Portable configuration packages
│   │   ├── Atlas-Standard/   # Complete installation bundle
│   │   └── tools/            # Export/import utilities
│   ├── MEMORY/           # History and state (runtime)
│   │   ├── History/      # Immutable event archive
│   │   ├── Learning/     # Phase-based learnings
│   │   └── State/        # Real-time state
│   ├── security/         # Security patterns and validation config
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

| Command | Description |
|---------|-------------|
| `/atlas:help` | Show all commands |
| `/atlas:status` | System health check |
| `/atlas:algorithm [action]` | Universal execution engine with ISC tracking |
| `/atlas:deep-plan <task>` | Persistent planning system |
| `/atlas:voice <name>` | Switch voice personality |
| `/atlas:art <task>` | Visual content generation |
| `/atlas:agents <task>` | Custom agent composition |
| `/atlas:browser <task>` | Web automation |
| `/atlas:sync-docs [scope]` | Sync documentation files |
| `/atlas:bundle [action]` | Bundle management (list, export, info) |

See `/atlas:help` for full command reference.

## Philosophy

- First-person voice ("I" not "the system")
- TypeScript over Python
- bun (NEVER npm/yarn/pnpm)
- Markdown over HTML

## License

Private - not yet open source.
