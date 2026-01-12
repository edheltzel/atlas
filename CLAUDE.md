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
├── .claude/
│   ├── commands/atlas/   # 22 slash commands (/atlas:*)
│   ├── skills/           # 12 skill definitions
│   ├── hooks/            # 13 TypeScript lifecycle hooks
│   ├── lib/              # Shared utilities (config, usage tracker)
│   ├── security/         # Protection patterns
│   ├── Bundles/          # Portable configurations
│   ├── MEMORY/           # History and state (runtime)
│   ├── voice/            # ElevenLabs TTS server
│   ├── observability/    # Vue dashboard
│   └── docs/             # Extended documentation
├── .config/opencode/     # OpenCode configuration
└── install.sh            # Standalone installer
```

### Critical Rules

1. Skills auto-load via Skill tool - read SKILL.md in skill directory first
2. Hooks run via `bun run` - never npm/yarn
3. Run `/atlas:help` for available commands

---

## Reference Documentation

**Load ONLY when working on related tasks:**

### Development Tasks

| When Working On | Read This |
|-----------------|-----------|
| Adding/modifying commands | `.claude/docs/ATLAS-COMMANDS.md` |
| Voice system configuration | `.claude/docs/VOICE-SYSTEM.md` |
| Security patterns/hooks | `.claude/security/README.md` |
| Bundle export/import | `.claude/Bundles/README.md` |
| Any specific skill | `.claude/skills/{SkillName}/SKILL.md` |

### Infrastructure Tasks

| When Working On | Read This |
|-----------------|-----------|
| Git worktrees | `.claude/docs/GIT-WORKTREES.md` |
| Hooks system | `.claude/docs/HOOKS-SYSTEM.md` |
| Installation | `.claude/docs/INSTALLATION.md` |

---

## Skills Quick Index

| Skill | Purpose | Path |
|-------|---------|------|
| Algorithm | Universal execution engine (ISC) | `.claude/skills/Algorithm/` |
| CORE | Identity and context (auto-loads) | `.claude/skills/CORE/` |
| DeepPlan | Persistent planning system | `.claude/skills/DeepPlan/` |
| Art | Visual content generation | `.claude/skills/Art/` |
| Agents | Custom agent composition | `.claude/skills/Agents/` |
| Browser | Web automation | `.claude/skills/Browser/` |
| Prompting | Meta-prompting templates | `.claude/skills/Prompting/` |
| CreateSkill | Skill creation utility | `.claude/skills/CreateSkill/` |
| UISkills | UI constraints for agents | `.claude/skills/UISkills/` |
