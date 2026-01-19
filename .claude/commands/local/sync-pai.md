---
description: "Sync PAI repository to Atlas"
argument-hint: "[check|sync|diff]"
---

# Sync PAI to Atlas

Synchronize Personal AI Infrastructure (PAI) releases into Atlas.

## Source Repository
- **Path:** `~/Developer/AI/PAI`
- **Branch:** Always use `main` (latest)
- **GitHub:** https://github.com/danielmiessler/Personal_AI_Infrastructure

## Arguments
$ARGUMENTS

## Workflow

### Step 1: Fetch Latest PAI
```bash
cd ~/Developer/AI/PAI && git fetch origin main && git checkout main && git pull
```

### Step 2: Check PAI Version
```bash
cd ~/Developer/AI/PAI && git log --oneline -5 && git describe --tags --always
```

### Step 3: Compare Packs

For each PAI Pack, compare against Atlas:

| PAI Pack | Atlas Location | Check |
|----------|----------------|-------|
| `pai-algorithm-skill/src/skills/THEALGORITHM/` | `~/.claude/skills/Algorithm/` | Tools, Phases, Reference, Data |
| `pai-browser-skill/` | `~/.claude/skills/Browser/` | index.ts, Tools/ |
| `pai-core-install/src/skills/CORE/` | `~/.claude/skills/CORE/` | USER/, SYSTEM/ (NOT SKILL.md) |
| `pai-agents-skill/src/skills/Agents/` | `~/.claude/skills/Agents/` | Tools/, Data/, Workflows/ |
| `pai-art-skill/src/skills/Art/` | `~/.claude/skills/Art/` | SKILL.md, Data/ |
| `pai-prompting-skill/src/skills/Prompting/` | `~/.claude/skills/Prompting/` | Standards.md, Templates/ |
| `pai-hook-system/src/hooks/` | `~/.claude/hooks/` | Core hooks only |
| `pai-voice-system/src/voice/` | `~/.claude/voice/` | server.ts |

### Step 4: For Each Difference Found

Ask:
1. **What changed?** (diff or new file)
2. **How does it benefit Atlas?** (new feature, bug fix, improvement)
3. **Any conflicts with local customizations?**
4. **Sync this? [Yes/No/Skip]**

### Step 5: Preserve Local Customizations

**NEVER overwrite these Atlas-only files:**
- `~/.claude/skills/CORE/SKILL.md` - Ed/Atlas identity
- `~/.claude/skills/CORE/rules/*` - Modular rules architecture
- `~/.claude/hooks/sync-issues-*.ts` - GitHub sync
- `~/.claude/hooks/lib/github-sync/` - GitHub library
- `~/.claude/hooks/lib/timestamps.ts` - Timestamp utils
- `~/.claude/lib/config-loader.ts` - YAML voice config
- `~/.claude/settings.json` - Hook configuration

### Step 6: Path Translation

When copying files from PAI:
- Replace `$PAI_DIR/skills/THEALGORITHM/` → `~/.claude/skills/Algorithm/`
- Replace `$PAI_DIR/skills/` → `~/.claude/skills/`
- Replace `$PAI_DIR/MEMORY/` → `~/.claude/MEMORY/`
- Replace `$PAI_DIR/` → `~/.claude/`

## Commands

### check (default)
Compare PAI main vs Atlas and list differences:
```bash
# For each pack, compare directory contents
diff -rq ~/Developer/AI/PAI/Packs/pai-algorithm-skill/src/skills/THEALGORITHM/Tools/ ~/.claude/skills/Algorithm/Tools/
```

### diff
Show detailed diffs for specific files:
```bash
diff ~/Developer/AI/PAI/Packs/pai-algorithm-skill/src/skills/THEALGORITHM/SKILL.md ~/.claude/skills/Algorithm/SKILL.md
```

### sync
Interactive sync with prompts for each change.

## Quick Reference Commands

```bash
# Check for new files in PAI Algorithm
ls ~/Developer/AI/PAI/Packs/pai-algorithm-skill/src/skills/THEALGORITHM/Tools/
ls ~/.claude/skills/Algorithm/Tools/

# Compare specific file
diff ~/Developer/AI/PAI/Packs/pai-browser-skill/Tools/Browse.ts ~/.claude/skills/Browser/Tools/Browse.ts

# Check PAI release notes
cd ~/Developer/AI/PAI && git log --oneline v2.1.0..main

# Copy a file with path translation
cp ~/Developer/AI/PAI/Packs/pai-algorithm-skill/src/skills/THEALGORITHM/NewFile.ts ~/.claude/skills/Algorithm/NewFile.ts
```

## Benefits Tracking

When syncing, document what each change provides:

| Feature | Benefit |
|---------|---------|
| CapabilityLoader | Load capabilities by effort level |
| CapabilitySelector | Auto-select capabilities for ISC rows |
| RalphLoopExecutor | Persistent iteration loops |
| TraitModifiers | Map effort to AgentFactory traits |
| PAISECURITYSYSTEM | Comprehensive security patterns |
| Browse.ts v1.2.0 | Debug-first browser automation |
| BrowserSession.ts | Persistent browser sessions |
