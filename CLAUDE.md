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
│       ├── skills/       # 38 PAI skills
│       ├── plugins/      # Superpowers + marketplace plugins
│       ├── agents/       # 12 named agent definitions
│       ├── hooks/        # 16 lifecycle event handlers
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

## Integrated Frameworks

Atlas combines patterns from three complementary systems forming a "three-layer stack":

| Layer | Framework | Purpose |
|-------|-----------|---------|
| **Infrastructure** | Atlas/PAI | ISC algorithm, voice, observability, 38 skills |
| **Engineering Discipline** | Superpowers (plugin) | TDD, two-stage review, anti-rationalization |
| **Project Management** | GSD (patterns only) | Context thresholds, model profiles, gates |

### Superpowers Plugin (v4.1.1)

Installed at `~/.claude/plugins/cache/superpowers/`. Provides 14 engineering skills including TDD, systematic debugging, verification-before-completion, and brainstorming.

**Invoke with:** `"use superpowers"`, `"use TDD"`, `"help me debug"`

### GSD Patterns (Native)

Seven patterns implemented natively (no GSD runtime):

- **Context Quality Thresholds** — 0-30% peak, 50%+ triggers delegation
- **Model Profiles** — quality/balanced/budget per-agent model selection
- **Deviation Rules** — Auto-fix bugs, escalate architectural decisions
- **Gray Area Scanning** — Identify ambiguous decisions before planning
- **Goal-Backward Derivation** — Observable → Artifact → Wiring → Link
- **Confirmation Gates** — Approval checkpoints at phase transitions
- **Inline Context Pattern** — @-refs don't cross Task() boundaries

## PAI Reference

Atlas is based on [Personal AI Infrastructure (PAI)](https://github.com/danielmiessler/Personal_AI_Infrastructure) by Daniel Miessler. For coding standards, architecture patterns, and system design reference:

- **Remote:** `github.com/danielmiessler/Personal_AI_Infrastructure`
- **Local:** `~/Developer/AI/PAI` (if cloned)

### Key Directories in claudecode/.claude/

| Directory | Purpose |
|-----------|---------|
| `skills/` | 38 PAI skill modules - each has SKILL.md with "USE WHEN" triggers |
| `plugins/` | Superpowers v4.1.1 (14 engineering skills) + marketplace plugins |
| `hooks/` | 16 TypeScript hooks run via `bun run` at lifecycle events |
| `agents/` | 12 named agent definitions with voice mappings |
| `Commands/` | Slash commands (/commit, /push, /pr, /observability, etc.) |
| `Observability/` | Real-time agent monitoring dashboard (Vue 3 + Bun server) |
| `VoiceServer/` | ElevenLabs/Google TTS server for voice notifications |
| `MEMORY/` | Persistent state, learnings, and session history |
| `USER/` | User-specific configs (name, preferences) |
| `PAISECURITYSYSTEM/` | Security patterns and command validation |

### Observability Dashboard

Monitor agent activity in real-time at `http://localhost:5172`:

```bash
/observability start   # Start dashboard
/observability open    # Start and open browser
```

Or install the macOS MenuBarApp for menu bar control:
```bash
cd claudecode/.claude/Observability/MenuBarApp && ./build.sh
```

See `Observability/CLAUDE.md` for full documentation.

### Skills.sh Integration

Atlas integrates with [skills.sh](https://skills.sh) (Vercel Labs) for community/official agent skills. Two skill types coexist:

- **PAI skills** — Real directories in the Atlas repo, version controlled, managed by Stow
- **skills.sh skills** — Symlinks in `~/.claude/skills/` → `~/.agents/skills/`, managed by `bunx skills`

The `.gitignore` excludes skills.sh symlinks from the repo.

**Stack installer slash commands:**

| Command | Description |
|---------|-------------|
| `/find-skill [query]` | Search skills.sh registry for agent skills |
| `/install-frontend` | Install 16 curated frontend skills (React, Tailwind, shadcn, web quality) |
| `/install-backend` | Install 7 curated backend skills (Hono, Cloudflare, Postgres, Better Auth) |
| `/install-devops` | Install 13 curated DevOps skills (Cloudflare platform, web quality, testing) |

All installers target claude-code, opencode, and gemini-cli simultaneously using `bunx skills add` with `-a` flags.

### Stow Behavior

- `.stow-local-ignore` controls which files are NOT symlinked (README, .git, node_modules, etc.)
- Running `stow claudecode` from atlas/ creates `~/.claude` as symlink to `claudecode/.claude/`
- `stow --delete` removes the symlinks without touching source files

## Package Manager

**Always use `bun`** - never npm/yarn/pnpm. Hooks and scripts are executed with `bun run`.

## Multi-Agent Design

Atlas supports three AI coding agents:

1. **Claude Code** (`claudecode/`) - Anthropic's official CLI
2. **OpenCode** (`opencode/`) - Alternative AI coding tool
3. **Gemini CLI** - Google's CLI (skills.sh managed, not Stow managed)

Claude Code and OpenCode use Stow-based management with separate configuration structures. Gemini CLI receives skills via skills.sh symlinks only.
