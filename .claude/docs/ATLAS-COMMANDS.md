# Atlas Commands System

> **For AI Agents, Claude Code Instances, and Automated Tools**
>
> This document provides comprehensive information about the Atlas command system for AI consumption. All commands follow predictable patterns and can be invoked programmatically.

---

## System Overview

**Atlas** is a Personal AI Infrastructure built on Claude Code that provides:
- Voice personality management
- Skill-based delegation
- Real-time observability
- Pack-based modularity
- Stack preference enforcement

The command system exposes 22 slash commands under the `atlas:` namespace.

## Architecture

```
~/.dotfiles/atlas/.claude/commands/atlas/    # Source (git-tracked)
            ↓ (stow)
~/.claude/commands/atlas/                    # Installed (symlinked)
            ↓ (Claude Code)
/atlas:<command>                             # Available slash commands
```

**Key Directories:**
- `~/.claude/hooks/` - Hook scripts (TypeScript, executed by bun)
- `~/.claude/skills/` - Skill definitions (Markdown)
- `~/.claude/observability/` - Real-time dashboard server
- `~/.claude/MEMORY/` - History capture and state tracking

**Runtime:** bun (NOT npm/yarn/pnpm)
**Language:** TypeScript preferred over Python
**Markup:** Markdown preferred over HTML

## Command Reference

### Voice Management

#### `/atlas:voice <personality>`
**Purpose:** Switch active voice personality for TTS output
**Parameters:**
- `<personality>` - Required. One of: default, intern, engineer, architect, researcher, designer, artist, pentester, writer

**Example:**
```
/atlas:voice intern     # Switch to enthusiastic intern personality
/atlas:voice architect  # Switch to deliberate architect personality
```

**Behavior:**
- Executes: `bun run ~/.claude/hooks/lib/voice-controller.ts --personality <name>`
- Personality persists for current session
- Voice characteristics defined in `~/.claude/voice-personalities.json`

#### `/atlas:voices`
**Purpose:** List all configured voice personalities with descriptions
**Parameters:** None

**Output Format:**
```
🎙️  Atlas Voice Personalities

  default      - Professional, expressive - Primary AI assistant
  intern       - Enthusiastic, chaotic energy - eager 176 IQ genius
  engineer     - Wise leader, stable - Fortune 10 principal engineer
  ...
```

---

### Skills

Skills are **auto-discovered** by Claude based on your request. No explicit slash command needed.

**Available Skills:**

| Skill | Trigger Phrases | Domain |
|-------|-----------------|--------|
| Algorithm | "run the algorithm", "structured execution" | ISC-based task execution with phases |
| Art | "create a diagram", "visual content" | Excalidraw-style diagrams, comics |
| Agents | "spawn agents", "custom agents" | Multi-agent orchestration |
| Browser | "screenshot", "verify UI", "web automation" | Browser automation, verification |
| DeepPlan | "plan this complex task", "deep planning" | Persistent file-based planning |
| Prompting | "meta-prompting", "prompt template" | Template generation, optimization |

**How Auto-Discovery Works:**
1. Claude reads each skill's `description` field in `SKILL.md`
2. When your request matches, Claude asks to use the Skill tool
3. The full skill instructions load only after approval

**Example Interactions:**
```
User: "Help me plan this complex authentication system"
→ Claude auto-discovers DeepPlan skill

User: "Create an architecture diagram"
→ Claude auto-discovers Art skill

User: "Run the algorithm on this task"
→ Claude auto-discovers Algorithm skill
```

#### `/atlas:skills`
**Purpose:** List all installed skills
**Output:** Skill name + description from each `SKILL.md`

---

### System Status

#### `/atlas:status`
**Purpose:** Quick system health overview
**Checks:**
- PAI_DIR, DA, PAI_SOURCE_APP, TIME_ZONE environment variables
- Voice server (port 8888)
- Skills directory
- Hooks configuration

**Output Format:**
```
🤖 Atlas System Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 PAI Directory: /Users/ed/.claude
🎯 Assistant: Atlas
🌍 Source App: Atlas
🕐 Timezone: America/New_York

Voice Server:
  ✅ Running on port 8888

Active Skills:
  📚 Skills loaded: 7

Hooks:
  🪝 Hook events configured: 6
```

#### `/atlas:check`
**Purpose:** Comprehensive system health check
**Analysis:**
1. Directory structure validation
2. Configuration integrity (settings.json)
3. Hook system verification
4. Skills system validation
5. Voice system status
6. Custom commands validation
7. Dependency checks (bun, git)

**Output:** Structured report with ✅/⚠️/❌ status codes

#### `/atlas:hooks`
**Purpose:** Show active hook configuration
**Source:** `~/.claude/settings.json`
**Output:** Lists all hook events and their registered handlers

**Example Output:**
```
🪝 Atlas Hooks Configuration

SessionStart:
  • start-voice-server.ts
  • initialize-session.ts
  • load-core-context.ts

PreToolUse:
  • security-validator.ts
```

#### `/atlas:context`
**Purpose:** Show current session context
**Information:**
- Identity (Assistant: Atlas, User: Ed)
- Environment variables
- Active session metadata
- Stack preferences

---

### Observability

#### `/atlas:observability [action]`
**Purpose:** Control real-time monitoring dashboard
**Parameters:**
- `[action]` - Optional. One of: start, stop, restart, status (default: start)

**Requirements:**
- Observability server installed at `~/.claude/observability/`
- kai-observability-server pack

**Behavior:**
- **start:** Launch WebSocket server + Vue dashboard (port 5173)
- **stop:** Shut down server processes
- **restart:** Stop and start in sequence
- **status:** Show running processes

**Dashboard Features:**
- Real-time event streaming via WebSocket
- Multi-agent swim lanes
- Event timeline visualization
- Automatic JSONL ingestion from `~/.claude/history/raw-outputs/`

**Example:**
```
/atlas:observability        # Start dashboard
/atlas:observability stop   # Shut down
```

---

### Stack & Preferences

#### `/atlas:stack-check`
**Purpose:** Verify project follows Atlas stack preferences
**Allowed Tools:** Read, Glob, Grep

**Validation:**
1. Package manager: Check for `bun.lockb` (✅) vs `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml` (❌)
2. Language: Count TypeScript files vs Python files
3. Scripts: Verify `package.json` uses `bun` commands
4. Documentation: Check for `.md` files over `.html`

**Output:** Report violations and suggest corrections

---

### Bundle Management

Bundles are portable configurations for exporting and importing Atlas setups.

#### `/atlas:bundle [action] [args]`
**Purpose:** Manage Atlas bundles for portable configurations
**Allowed Tools:** Read, Write, Bash

**Subcommands:**
| Command | Action |
|---------|--------|
| `/atlas:bundle list` | List available bundles |
| `/atlas:bundle export` | Export current configuration |
| `/atlas:bundle info <name>` | Show bundle details |

**Bundle Location:** `~/.claude/Bundles/`

#### `/atlas:docs [doc]`
**Purpose:** Quick access to Atlas documentation
**Parameters:**
- `[doc]` - Optional. One of: readme, packs, platform, security

**Behavior:**
- Without parameter: Lists available docs
- With parameter: Outputs full document content

---

### Utilities

#### `/atlas:help`
**Purpose:** Show complete command reference
**Output:** Categorized list of all 22 commands with descriptions

#### `/atlas:create-skill <name>`
**Purpose:** Scaffold a new Atlas skill
**Parameters:**
- `<name>` - Required. Skill name (no spaces)

**Process:**
1. Create `~/.claude/skills/<name>/`
2. Generate `SKILL.md` with template structure
3. Register in skills directory
4. Provide usage instructions

**Template Structure:**
```markdown
---
name: SkillName
description: Brief description
---

# SkillName

## When to Use
## Capabilities
## Usage
## Examples
## Technical Details
```

---

## Usage Patterns for AI Agents

### Detecting Available Commands
```bash
# List all atlas commands
ls ~/.claude/commands/atlas:*.md

# Check if specific command exists
[ -f ~/.claude/commands/atlas:observability.md ] && echo "Observability available"
```

### Invoking Commands Programmatically
Commands can be invoked directly in Claude Code sessions:
```
User: /atlas:status
User: /atlas:voice engineer
User: /atlas:observability start
```

### Checking Dependencies
```bash
# Check for required runtime
which bun

# Verify PAI directory
[ -d ~/.claude ] && echo "Atlas installed"

# Check observability server
[ -f ~/.claude/observability/manage.sh ] && echo "Observability ready"
```

### Parsing Command Output
Most commands output structured text with:
- Emoji markers (🤖, 📚, ✅, ❌, ⚠️)
- Section dividers (━━━)
- Labeled fields (Key: Value)

**Pattern Recognition:**
```
✅ = Success/Running
❌ = Failure/Not Found
⚠️ = Warning
📚 = Information
🎯 = Context/Identity
```

---

## Integration Points

### With Skills System
Skills are **auto-discovered** via the `Skill` tool based on request context:
- "create diagram" → Art skill
- "spawn agents" → Agents skill
- "plan complex task" → DeepPlan skill
- "prompt template" → Prompting skill
- "run algorithm" → Algorithm skill
- "browser automation" → Browser skill

### With Hooks System
Commands execute hooks via `bun run`:
- Voice control: `~/.claude/hooks/lib/voice-controller.ts`
- Event capture: `~/.claude/hooks/capture-all-events.ts`
- Session init: `~/.claude/hooks/initialize-session.ts`

### With Observability
Commands can start/stop the WebSocket server:
- Server: `~/.claude/observability/apps/server/`
- Client: `~/.claude/observability/apps/client/`
- Manager: `~/.claude/observability/manage.sh`

---

## Environment Variables

**Required:**
- `PAI_DIR` - Atlas installation directory (usually `~/.claude`)
- `DA` - Digital Assistant name (Atlas)
- `TIME_ZONE` - User timezone (e.g., America/Los_Angeles)

**Optional:**
- `ELEVENLABS_VOICE_*` - Voice IDs for TTS personalities
- `ELEVENLABS_API_KEY` - API key for voice server

---

## Error Handling

### Common Error Patterns

**Command Not Found:**
```
bash: /atlas:foo: No such file or directory
```
→ Command doesn't exist. Use `/atlas:help` to list available commands.

**Dependency Missing:**
```
❌ Observability server not installed
```
→ Check installation: `/atlas:check`

**Runtime Error:**
```
bun: command not found
```
→ Install bun runtime (Atlas dependency)

### Graceful Degradation
Commands check for dependencies before execution:
```bash
if [ -f ~/.claude/observability/manage.sh ]; then
  # Execute command
else
  echo "❌ Not installed"
  echo "To install: /atlas:install <pack>"
fi
```

---

## Security Considerations

### Hook Execution
All hooks run via `bun run` with:
- User-level permissions (no sudo)
- Sandboxed execution environment
- Security validation via `security-validator.ts` hook

### Command Injection Protection
Commands use:
- Parameterized inputs (`$1`, `$2`)
- Quote escaping in shell commands
- Input validation before execution

### File System Access
Commands only access:
- `~/.claude/` - Atlas installation directory
- `~/.dotfiles/atlas/` - Source repository (git-tracked)
- Current working directory (read-only)

---

## Troubleshooting

### Voice Server Not Running
```bash
# Check process
lsof -ti:8888

# Start manually
bun run ~/.claude/voice/server.ts
```

### Skills Not Loading
```bash
# Verify skills directory
ls -la ~/.claude/skills/*/SKILL.md

# Check skill format
cat ~/.claude/skills/CORE/SKILL.md | head -20
```

### Observability Dashboard Won't Start
```bash
# Check installation
~/.claude/observability/manage.sh status

# View logs
tail ~/.claude/observability/apps/server/logs/*.log
```

---

## Version Information

- **Command System Version:** 1.1.0
- **Total Commands:** 22
- **Namespace:** `atlas:`
- **Runtime:** bun
- **Platform:** Claude Code

---

## For Developers

### Adding New Commands

1. Create `.md` file: `.claude/commands/atlas/<name>.md`
2. Add frontmatter:
   ```yaml
   ---
   description: Brief description for autocomplete
   allowed-tools: [Read, Write, Bash]  # Optional
   ---
   ```
3. Document usage with `$ARGUMENTS`, `$1`, `$2`
4. Prefix shell commands with `!`
5. Update `/atlas:help` command
6. Update this file (ATLAS-COMMANDS.md)

### Testing Commands

```bash
# Test locally (before stowing)
cat ~/.dotfiles/atlas/.claude/commands/atlas/<name>.md

# Install via stow
cd ~/.dotfiles && stow atlas

# Verify installation
ls ~/.claude/commands/atlas/<name>.md

# Test in Claude Code
/atlas:<name>
```

### Debugging Commands

```bash
# View command source
cat ~/.claude/commands/atlas:<name>.md

# Check for syntax errors
bash -n <(sed -n '/^!/p' ~/.claude/commands/atlas:<name>.md | sed 's/^!//')

# Trace execution
bash -x <(sed -n '/^!/p' ~/.claude/commands/atlas:<name>.md | sed 's/^!//')
```

---

## Related Documentation

- **User README:** `~/.dotfiles/atlas/README.md`
- **Skills Index:** `~/.claude/skills/skill-index.json`
- **Hook System:** `~/.claude/settings.json`
- **Hooks Documentation:** `~/.claude/docs/HOOKS-SYSTEM.md`
- **Voice System:** `~/.claude/docs/VOICE-SYSTEM.md`

---

**Last Updated:** 2026-01-19
**Maintained By:** Ed
**For AI Agents:** This document is authoritative for Atlas command system integration
