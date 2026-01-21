# Atlas Custom Commands

Custom slash commands for the Atlas Personal AI Infrastructure system.

## Installation

These commands are part of the `ai` stow package. To install:

```bash
cd ~/.dotfiles
make update
```

Commands will be symlinked to `~/.claude/commands/atlas/` and available as `/atlas:<command>` in all Claude Code sessions.

## Available Commands

### Voice Management (2)
| Command | Description |
|---------|-------------|
| `/atlas:voice <name>` | Switch voice personality |
| `/atlas:voices` | List all available voice personalities |

### Skills (1)
Skills are **auto-discovered** - just describe what you need:
- "create diagram" → Art skill
- "spawn agents" → Agents skill
- "plan complex task" → DeepPlan skill

| Command | Description |
|---------|-------------|
| `/atlas:skills` | List all installed skills |

### System Status (4)
| Command | Description |
|---------|-------------|
| `/atlas:status` | Show Atlas system status and health |
| `/atlas:check` | Comprehensive system health check |
| `/atlas:hooks` | Show active hooks configuration |
| `/atlas:context` | Show current session context |

### Observability (1)
| Command | Description |
|---------|-------------|
| `/atlas:observability [action]` | Start/stop/restart observability dashboard |

### Stack & Preferences (1)
| Command | Description |
|---------|-------------|
| `/atlas:stack-check` | Verify project uses Atlas stack preferences |

### Pack Management (2)
| Command | Description |
|---------|-------------|
| `/atlas:pack [action] [name]` | Manage packs - list (default), install |
| `/atlas:docs [doc]` | Access Atlas documentation |

### Utilities (2)
| Command | Description |
|---------|-------------|
| `/atlas:help` | Show all available Atlas commands |
| `/atlas:create-skill <name>` | Create a new Atlas skill |

## Command Structure

Commands follow the `/atlas:<command>` naming convention (matching Anthropic's plugin pattern):

```
commands/
└── atlas/
    ├── help.md          → /atlas:help
    ├── status.md        → /atlas:status
    ├── skills.md        → /atlas:skills
    ├── voice.md         → /atlas:voice
    ├── ...
    └── voices.md        → /atlas:voices
```

## Usage

After installation, commands are available in Claude Code:

```bash
/atlas:help             # Show all commands
/atlas:status           # Check system health
/atlas:voices           # See available voices
/atlas:voice intern     # Switch to intern personality
/atlas:observability    # Start real-time dashboard
```

## Dependencies

Most commands require:
- `bun` runtime
- Atlas hooks directory (`~/.claude/hooks/`)
- Atlas settings (`~/.claude/settings.json`)

Some commands also require:
- PAI repository at `~/Developer/AI/PAI/` (for pack management)
- Voice server running (for voice commands)
- Observability server (for dashboard commands)

## Development

To create a new Atlas command:

1. Create a `.md` file in `ai/.claude/commands/atlas/`
2. Add frontmatter with `description` including usage syntax
3. Use `$ARGUMENTS`, `$1`, `$2` for parameters
4. Prefix bash commands with `!`

Example:
```yaml
---
description: "My command description. Usage: /atlas:mycommand <arg>"
---
```

## See Also

- **Atlas Documentation:** `/atlas:docs`
- **Installed Skills:** `/atlas:skills`
- **Available Packs:** `/atlas:pack`
- **System Status:** `/atlas:status`
