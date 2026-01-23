# Atlas

Personal AI infrastructure for managing multiple AI coding tool configurations using GNU Stow.

## Overview

Atlas symlinks dotfiles/configs to their expected system locations:

- `claudecode/.claude/` → `~/.claude/` (Claude Code)
- `opencode/.config/opencode/` → `~/.config/opencode/` (OpenCode)

Based on [PAI (Personal AI Infrastructure)](https://github.com/danielmiessler/Personal_AI_Infrastructure) by Daniel Miessler.

## Quick Start

```bash
# Install Atlas (creates symlinks)
make install

# Or manually stow packages
make stow pkg=claudecode
make stow pkg=opencode
```

## Package Structure

```
atlas/
├── claudecode/               # Claude Code package
│   └── .claude/
│       ├── skills/           # 24+ skill modules
│       ├── hooks/            # Lifecycle event handlers
│       ├── Commands/         # Slash commands (/commit, /push, etc.)
│       ├── Observability/    # Agent monitoring dashboard
│       ├── VoiceServer/      # TTS notification server
│       └── MEMORY/           # Persistent state
│
└── opencode/                 # OpenCode package
    └── .config/opencode/
        ├── agent/
        ├── command/
        └── skill/
```

## Observability Dashboard

Real-time monitoring dashboard for Claude Code agent activity.

### Features

- Live event timeline with auto-scroll
- Multi-agent swim lanes
- Activity intensity visualization
- Event filtering (agent, type, session)
- Theme customization
- Background task monitoring

### Quick Start

**Via Slash Command:**
```
/observability start   # Start dashboard
/observability open    # Start and open browser
/observability stop    # Stop dashboard
```

**Via MenuBarApp (macOS):**

Install the native menu bar app for convenient dashboard control:

```bash
cd claudecode/.claude/Observability/MenuBarApp
./build.sh
```

This installs `Observability.app` to `/Applications/`. Features:
- Menu bar status indicator (eye icon)
- Start/Stop/Restart controls
- Open Dashboard button
- **Launch at Login** toggle

**Manual:**
```bash
~/.claude/Observability/manage.sh start
open http://localhost:5172
```

### Architecture

| Component | Port | Description |
|-----------|------|-------------|
| Server | 4000 | Bun WebSocket server, watches `~/.claude/projects/` |
| Client | 5172 | Vue 3 + Vite dashboard |

See `claudecode/.claude/Observability/CLAUDE.md` for detailed documentation.

## Commands

```bash
make help           # Show all commands
make install        # Bootstrap Atlas
make run            # Symlink all packages
make stow pkg=NAME  # Symlink specific package
make unstow pkg=NAME # Remove specific symlink
make update         # Re-stow all packages
make delete         # Remove all symlinks
make status         # Check symlink status
make deps           # Install dependencies
```

## Requirements

- **GNU Stow** - Symlink farm manager
- **Bun** - JavaScript runtime (for hooks/server)
- **Xcode CLI** - For MenuBarApp build (macOS)

## License

MIT
