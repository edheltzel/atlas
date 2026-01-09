# Atlas-Standard Bundle

The complete Atlas Personal AI Infrastructure bundle.

## What's Included

### Skills (11 total)

| Skill | Type | Description |
|-------|------|-------------|
| **CORE** | Required | Identity, preferences, response format |
| **Algorithm** | Required | Universal execution engine with ISC tracking |
| **DeepPlan** | Required | Persistent planning system |
| **Agents** | Included | Dynamic agent composition from traits |
| **Art** | Included | Visual content generation |
| **Browser** | Included | Web automation and verification |
| **Prompting** | Included | Meta-prompting and templates |
| **CreateSkill** | Included | Skill creation utilities |

### Hooks

| Hook | Purpose |
|------|---------|
| `initialize-session.ts` | Session startup |
| `load-core-context.ts` | Load CORE skill context |
| `security-validator.ts` | Command security |
| `capture-history.ts` | Event capture to MEMORY |
| `stop-hook-voice.ts` | Voice on task completion |

### Commands (20+)

All `/atlas:*` commands including:
- `/atlas:algorithm` - THE ALGORITHM execution
- `/atlas:deep-plan` - Persistent planning
- `/atlas:agents` - Agent composition
- `/atlas:browser` - Web automation
- `/atlas:sync-docs` - Documentation sync

### Infrastructure

| Component | Port | Description |
|-----------|------|-------------|
| Voice Server | 8888 | ElevenLabs TTS with 10 personalities |
| Observability | 4000 | Real-time monitoring dashboard |
| MEMORY System | - | History, Learning, State, Signals |

## Installation

This bundle is the default Atlas installation. It's installed via:

```bash
# From ~/.dotfiles
make stow pkg=atlas
```

## Exporting

To export this bundle configuration:

```bash
bun run ~/.claude/Bundles/tools/export-bundle.ts --name "MyAtlas"
```

## Verification

After installation, verify with:

```bash
# Check skills
ls ~/.claude/skills/

# Check hooks
ls ~/.claude/hooks/

# Check commands
ls ~/.claude/commands/atlas/

# Test voice server
curl http://localhost:8888/health
```

## Customization

The bundle can be customized by:
1. Adding skills to `~/.claude/skills/`
2. Adding hooks to `~/.claude/hooks/`
3. Modifying `atlas.yaml` for configuration

## Version History

### 1.0.0 (2026-01-09)
- Initial bundle definition
- 11 skills, 6 hooks, 20+ commands
- Voice and observability infrastructure
- MEMORY system for history tracking
