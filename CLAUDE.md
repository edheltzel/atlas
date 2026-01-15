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
│   ├── skills/           # 12 skill definitions
│   ├── hooks/            # 13 lifecycle hooks
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
| Git worktrees | `.claude/docs/GIT-WORKTREES.md` |
| Hooks system | `.claude/docs/HOOKS-SYSTEM.md` |
| Installation | `.claude/docs/INSTALLATION.md` |

---

## Skills Quick Index (12 Skills)

| Skill | Purpose | Path |
|-------|---------|------|
| Algorithm | Universal execution engine with ISC, Phases, Capabilities | `.claude/skills/Algorithm/` |
| CORE | Identity, context, TELOS (auto-loads) | `.claude/skills/CORE/` |
| DeepPlan | Persistent planning system | `.claude/skills/DeepPlan/` |
| Art | Visual content generation | `.claude/skills/Art/` |
| Agents | Custom agent composition | `.claude/skills/Agents/` |
| Browser | Web automation with persistent sessions | `.claude/skills/Browser/` |
| Prompting | Meta-prompting templates | `.claude/skills/Prompting/` |
| CreateSkill | Skill creation utility | `.claude/skills/CreateSkill/` |
| Upgrades | Monitor Anthropic ecosystem (30+ sources), YouTube channels | `.claude/skills/Upgrades/` |

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
