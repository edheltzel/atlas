# DiscoverPlans Workflow

**Scan for existing plans related to the current project.**

## When to Execute

- On DeepPlan activation (before creating new plans)
- When user says "resume", "continue", or "existing plan"

## Discovery Process

### Step 1: Gather Context

```bash
# Get current project info
pwd                          # Current directory
basename $(pwd)              # Project name
git rev-parse --show-toplevel 2>/dev/null  # Git root
git remote get-url origin 2>/dev/null      # Remote URL
```

### Step 2: Scan Plan Directory

```bash
# List existing plans
ls -la ~/.claude/plans/*.md
```

### Step 3: Search for Matches

Use Grep to find plans mentioning:

1. **Directory path** - Full path or basename
2. **Git repository name** - From remote URL or folder name
3. **Keywords** - From the user's task description

```bash
# Example searches
grep -l "atlas" ~/.claude/plans/*.md
grep -l "/Users/ed/.dotfiles/atlas" ~/.claude/plans/*.md
```

### Step 4: Parse Plan Metadata

For each matching plan, extract:

```yaml
---
project: [project name]
directory: [full path]
created: [date]
status: [in_progress|completed|abandoned]
---
```

### Step 5: Present Options

If matches found, ask user:

```
Found existing plans for this project:

1. **atlas-command-migration.md** (COMPLETED 2026-01-05)
   - Migrated /atlas-* to /atlas:* naming

2. **voice-system-optimization.md** (IN PROGRESS - Phase 2)
   - Voice system latency optimization

Options:
- [Resume] Continue an existing plan
- [Reference] Use as context, start fresh
- [Ignore] Start completely new
```

## Output

Return one of:
- `resume: <plan-path>` - Continue the selected plan
- `reference: <plan-path>` - Load as context only
- `fresh` - Create new plan from scratch
