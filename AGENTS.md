# Agent Guidelines - Atlas Repository

This file provides guidance to AI coding agents when working with this repository.

## Repository Overview

Atlas is the **Personal AI Infrastructure (PAI)** for Claude Code and OpenCode. It provides skills, hooks, commands, voice system, and observability dashboard.

**Key Components:**
- **Skills** - Modular capabilities (CORE, Art, Agents, Browser, Prompting, DeepPlan)
- **Hooks** - TypeScript session lifecycle management
- **Commands** - 18 slash commands under `/atlas:*` namespace
- **Voice** - ElevenLabs TTS with 18 voice configurations (8 hook + 10 agent)
- **Observability** - Real-time Vue dashboard
- **Config** - Centralized settings in `atlas.yaml` (voice IDs, provider, features)

## Git Worktrees

Atlas uses git worktrees for parallel development. Worktrees are stored outside the dotfiles directory.

**Location:** `~/Developer/Atlas-worktrees/<branch-name>/`

**Main branch:** `~/.dotfiles/atlas/` (master)

### Creating a Worktree

```bash
cd ~/.dotfiles/atlas
git worktree add ~/Developer/Atlas-worktrees/<branch-name> -b <branch-name>
```

### Listing Worktrees

```bash
git worktree list
```

### Removing a Worktree

```bash
git worktree remove ~/Developer/Atlas-worktrees/<branch-name>
git branch -d <branch-name>  # Optional: delete branch after merge
```

### Worktree Notes

- Atlas is a **git submodule** of `~/.dotfiles`
- Worktree commands must run from `~/.dotfiles/atlas/`
- Each worktree is a full working copy with its own branch
- Changes in worktrees can be committed and pushed independently

## Directory Structure

```
atlas/
├── .claude/
│   ├── atlas.yaml         # Main config (voice IDs, settings)
│   ├── commands/atlas/    # Slash commands (/atlas:*)
│   ├── skills/            # Skill definitions
│   ├── hooks/             # TypeScript lifecycle hooks
│   ├── lib/               # Config loader and types
│   ├── voice/             # ElevenLabs TTS server
│   ├── observability/     # Vue dashboard
│   ├── plans/             # DeepPlan persistent plans
│   └── docs/              # Documentation
├── .config/opencode/      # OpenCode configuration
├── .stow-local-ignore     # GNU Stow ignore patterns
└── install.sh             # Standalone installer
```

## Commands

### Development

```bash
# Restow after changes (from ~/.dotfiles)
make stow pkg=atlas

# Run voice server
cd ~/.claude/voice && bun run server.ts

# Run observability dashboard
cd ~/.claude/observability && bun run dev
```

### Atlas Slash Commands

Run `/atlas:help` in Claude Code to see all available commands.

## Code Style

- **Language:** TypeScript preferred
- **Package Manager:** bun (NEVER npm/yarn/pnpm)
- **Runtime:** Bun
- **Markup:** Markdown for documentation

## Installation

Atlas is installed as a stow package within the dotfiles repository:

```bash
# From ~/.dotfiles
make stow pkg=atlas
```

Symlinks to:
- `~/.claude/` - Claude Code configuration
- `~/.config/opencode/` - OpenCode configuration
