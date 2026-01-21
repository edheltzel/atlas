# Atlas - AI Agent Guidelines

Personal AI Infrastructure for Claude Code.

## Quick Reference

### Code Style

- **Language:** TypeScript preferred
- **Package Manager:** bun (NEVER npm/yarn/pnpm)
- **Runtime:** Bun
- **Markup:** Markdown for documentation

### Directory Structure

```
atlas/
├── .claude/              # Installed components
│   ├── commands/atlas/   # Slash commands (/atlas:*)
│   ├── skills/           # 23 skill definitions
│   ├── hooks/            # 19 lifecycle hooks
│   ├── lib/              # Shared utilities
│   ├── security/         # Protection patterns
│   ├── voice/            # TTS server
│   ├── observability/    # Vue dashboard
│   └── MEMORY/           # Persistent memory system
│       ├── State/        # active-work.json, algorithm-stats.json
│       ├── Work/         # Per-task traces
│       ├── Learning/     # Insights by Algorithm phase
│       ├── Signals/      # failures.jsonl, patterns.jsonl
│       └── sessions/     # Session summaries
├── exports/              # MODULAR SYSTEM
│   ├── wizard.sh         # Interactive installer
│   ├── merge-hooks.ts    # Hook merger utility
│   └── modules/          # 8 independent modules
└── install.sh            # Full installer
```

### Critical Rules

1. Skills auto-load via Skill tool - read SKILL.md in skill directory first
2. Hooks run via `bun run` - never npm/yarn
3. Run `/atlas:help` for available commands
4. **Modules are independent** - install only what you need

---

## Modular Installation

Atlas is fully modular. Install individual components:

```bash
# Interactive wizard
./exports/wizard.sh

# Non-interactive
./exports/wizard.sh --install voice core security

# List available modules
./exports/wizard.sh --list
```

Each module has a `module.json` manifest. See `exports/MODULE-SPEC.md` for format.

### Uninstallation

```bash
# Preview what would be removed
./exports/uninstall.sh --dry-run

# Uninstall (moves user data to ~/safeToRemoveAtlas/)
./exports/uninstall.sh

# Uninstall without confirmation
./exports/uninstall.sh --force

# Full removal including user data
./exports/uninstall.sh --purge
```

Detects installation mode (stow, symlink, or file copy) automatically.

---

## Reference Documentation

**Load ONLY when working on related tasks:**

### Development Tasks

| When Working On | Read This |
|-----------------|-----------|
| Module system | `exports/MODULE-SPEC.md` |
| Adding/modifying commands | `.claude/docs/ATLAS-COMMANDS.md` |
| Voice system configuration | `.claude/docs/VOICE-SYSTEM.md` |
| Security patterns/hooks | `.claude/security/README.md` |
| Any specific skill | `.claude/skills/{SkillName}/SKILL.md` |

### Infrastructure Tasks

| When Working On | Read This |
|-----------------|-----------|
| Git workflow | `.claude/skills/GitWorkflow/SKILL.md` |
| Git worktrees | `.claude/docs/GIT-WORKTREES.md` |
| Hooks system | `.claude/docs/HOOKS-SYSTEM.md` |
| Installation | `.claude/docs/INSTALLATION.md` |

### Git Commands

| Command | Purpose |
|---------|---------|
| `/git:commit` | Intelligent commit with convention detection |
| `/git:commit-push-pr` | Full workflow: commit, push, and create PR |
| `/git:clean_gone` | Remove branches deleted from remote (including worktrees) |

---

## Skills Quick Index (24 Skills)

### Core Skills

| Skill | Purpose | Path |
|-------|---------|------|
| CORE | Identity, context, TELOS (auto-loads) | `.claude/skills/CORE/` |
| Algorithm | Universal execution engine with ISC, Phases, Capabilities | `.claude/skills/Algorithm/` |
| DeepPlan | Persistent planning system | `.claude/skills/DeepPlan/` |
| GitWorkflow | Intelligent git with conventions, worktrees, voice | `.claude/skills/GitWorkflow/` |
| Telos | Life OS and project analysis | `.claude/skills/Telos/` |
| System | System maintenance, integrity checks, documentation | `.claude/skills/System/` |

### Creation & Development

| Skill | Purpose | Path |
|-------|---------|------|
| Agents | Custom agent composition | `.claude/skills/Agents/` |
| Art | Visual content generation | `.claude/skills/Art/` |
| Browser | Web automation with persistent sessions | `.claude/skills/Browser/` |
| CreateSkill | Skill creation utility | `.claude/skills/CreateSkill/` |
| CreateCLI | CLI generation | `.claude/skills/CreateCLI/` |
| Prompting | Meta-prompting templates | `.claude/skills/Prompting/` |

### Research & Intelligence

| Skill | Purpose | Path |
|-------|---------|------|
| Research | Comprehensive research and analysis | `.claude/skills/Research/` |
| OSINT | Open source intelligence gathering | `.claude/skills/OSINT/` |
| Recon | Security reconnaissance | `.claude/skills/Recon/` |
| RedTeam | Adversarial analysis with 32 agents | `.claude/skills/RedTeam/` |
| FirstPrinciples | First principles analysis | `.claude/skills/FirstPrinciples/` |
| Council | Multi-agent debate system | `.claude/skills/Council/` |

### Specialized Tools

| Skill | Purpose | Path |
|-------|---------|------|
| AnnualReports | Annual security report aggregation | `.claude/skills/AnnualReports/` |
| BrightData | Progressive URL scraping | `.claude/skills/BrightData/` |
| Upgrades | Monitor Anthropic ecosystem (30+ sources) | `.claude/skills/Upgrades/` |

### Migration Utilities

| Skill | Purpose | Path |
|-------|---------|------|
| converting-claude-subagents | Convert subagents to OpenCode format | `.claude/skills/converting-claude-subagents/` |
| converting-slash-commands | Convert commands to OpenCode format | `.claude/skills/converting-slash-commands/` |
| creating-claude-skills | Guide for creating Claude Skills | `.claude/skills/creating-claude-skills/` |

### CORE Skill Structure

```
CORE/
├── SKILL.md          # Main skill definition (auto-loads)
├── USER/             # Personal context
│   ├── TELOS.md      # Life goals (loads at session start)
│   ├── ABOUTME.md, BASICINFO.md
│   └── PAISECURITYSYSTEM/
├── SYSTEM/           # Architecture docs
│   ├── PAISYSTEMARCHITECTURE.md  # 15 Founding Principles
│   ├── MEMORYSYSTEM.md
│   └── SKILLSYSTEM.md
└── Workflows/
```

### Algorithm Skill Structure (PAI v2.1.0)

```
Algorithm/
├── SKILL.md          # Main skill definition
├── Data/             # Capability definitions
├── Phases/           # Build, Execute, Learn, Observe, Plan, Think, Verify
├── Reference/        # CapabilityMatrix, EffortMatrix, ISCFormat
└── Tools/            # 7 TypeScript tools
    ├── AlgorithmDisplay.ts
    ├── CapabilityLoader.ts
    ├── CapabilitySelector.ts
    ├── EffortClassifier.ts
    ├── ISCManager.ts
    ├── RalphLoopExecutor.ts
    └── TraitModifiers.ts
```
