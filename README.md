# Atlas

Personal AI infrastructure for managing multiple AI coding tool configurations using GNU Stow.

## Overview

Atlas symlinks dotfiles/configs to their expected system locations:

- `claudecode/.claude/` → `~/.claude/` (Claude Code)
- `opencode/.config/opencode/` → `~/.config/opencode/` (OpenCode)

Supports three AI coding agents: **Claude Code**, **OpenCode**, and **Gemini CLI**.

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
│       ├── skills/           # 35+ skill modules (PAI + skills.sh)
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

## Skills.sh Integration

Atlas integrates with [skills.sh](https://skills.sh) (by Vercel Labs) for installing community and official agent skills. Skills.sh is a package manager for the open [Agent Skills](https://agentskills.io) ecosystem.

### How It Works

Atlas uses a **hybrid approach**:
- **PAI skills** (CORE, Algorithm, etc.) are real directories in the Atlas repo, managed by Stow
- **skills.sh skills** are symlinks in `~/.claude/skills/` pointing to `~/.agents/skills/`, installed via `bunx skills`
- `.gitignore` excludes skills.sh symlinks so they don't pollute the repo

### Stack Installer Commands

Install curated skill bundles for any project with one command:

| Command | Skills | Sources |
|---------|--------|---------|
| `/install-frontend` | 16 skills | vercel-labs, anthropics, addyosmani, ibelick, remotion-dev |
| `/install-backend` | 7 skills | yusukebe (Hono), cloudflare, supabase, better-auth, anthropics |
| `/install-devops` | 13 skills | cloudflare (official), addyosmani, anthropics |
| `/find-skill [query]` | Search | skills.sh registry + known repos |

All installers target three agents simultaneously (claude-code, opencode, gemini-cli), show the skill list before installing, and wait for confirmation.

### Manual Usage

```bash
# Search for skills
bunx skills find <query>

# Install a specific skill
bunx skills add <owner/repo> --skill <name> -a claude-code -a opencode -a gemini-cli

# Install globally (all projects)
bunx skills add <owner/repo> --skill <name> -g -y

# List installed skills
bunx skills list -g

# Check for updates
bunx skills check
```

### Adding Skills to .gitignore

After installing new skills.sh skills globally, add their names to `.gitignore` under the `# skills.sh managed skills` section so they don't appear in `git status`.

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
