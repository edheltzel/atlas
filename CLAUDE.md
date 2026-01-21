# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Atlas?

Atlas is a personal AI infrastructure that manages configurations for multiple AI coding tools using GNU Stow. It symlinks dotfiles/configs to their expected locations:

- `claudecode/.claude/` → `~/.claude/` (Claude Code configuration)
- `opencode/.config/opencode/` → `~/.config/opencode/` (OpenCode configuration)

## Build & Development Commands

```bash
# Show all available commands
make help

# Bootstrap Atlas (run installer script)
make install

# Symlink all packages with Stow
make run

# Add a specific package
make stow pkg=claudecode
make stow pkg=opencode

# Remove a specific package
make unstow pkg=claudecode

# Update/restow all packages
make update

# Remove all symlinks
make delete

# Check symlink status
make status

# Install dependencies (voice server, browser skill)
make deps
```

## Architecture

### Stow Package Structure

Each top-level directory is a "stow package" that mirrors the target filesystem structure:

```
atlas/
├── claudecode/           # Stow package → symlinks to ~/
│   └── .claude/          # Claude Code config dir
│       ├── skills/       # 24 skills (CORE, Algorithm, etc.)
│       ├── hooks/        # Lifecycle event handlers
│       ├── VoiceServer/  # TTS notification server
│       ├── MEMORY/       # Persistent memory system
│       └── settings.json # Configuration
│
└── opencode/             # Stow package → symlinks to ~/
    └── .config/opencode/ # OpenCode config dir
        ├── agent/        # Agent definitions
        ├── command/      # Slash commands
        ├── skill/        # Skills
        └── opencode.json # Configuration
```

## PAI Reference

Atlas is based on [Personal AI Infrastructure (PAI)](https://github.com/danielmiessler/Personal_AI_Infrastructure) by Daniel Miessler. For coding standards, architecture patterns, and system design reference:

- **Remote:** `github.com/danielmiessler/Personal_AI_Infrastructure`
- **Local:** `~/Developer/AI/PAI` (if cloned)

### Key Directories in claudecode/.claude/

| Directory | Purpose |
|-----------|---------|
| `skills/` | 24 skill modules - each has SKILL.md that auto-loads via Skill tool |
| `hooks/` | TypeScript hooks run via `bun run` at lifecycle events |
| `VoiceServer/` | ElevenLabs/Google TTS server for voice notifications |
| `MEMORY/` | Persistent state, learnings, and session history |
| `agents/` | Named agent definitions with voice mappings |
| `USER/` | User-specific configs (name, preferences) |
| `PAISECURITYSYSTEM/` | Security patterns and command validation |

### Stow Behavior

- `.stow-local-ignore` controls which files are NOT symlinked (README, .git, node_modules, etc.)
- Running `stow claudecode` from atlas/ creates `~/.claude` as symlink to `claudecode/.claude/`
- `stow --delete` removes the symlinks without touching source files

## Package Manager

**Always use `bun`** - never npm/yarn/pnpm. Hooks and scripts are executed with `bun run`.

## Two-Tool Design

Atlas supports two AI coding assistants simultaneously:

1. **Claude Code** (`claudecode/`) - Anthropic's official CLI
2. **OpenCode** (`opencode/`) - Alternative AI coding tool

Both share the same Stow-based management but have separate configuration structures.
