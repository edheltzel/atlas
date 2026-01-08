# Plan: Add DeepPlan Skill with Slash Command

## Summary

Add a new `DeepPlan` skill implementing the Manus AI "planning-with-files" pattern - using filesystem as persistent memory to combat context volatility and goal drift during complex multi-step tasks.

## Problem Being Solved

AI agents struggle with:
- **Context volatility** - task tracking disappears on context resets
- **Goal drift** - after many tool calls, original objectives fade
- **Hidden failures** - errors aren't tracked, causing repeated mistakes
- **No persistence** - everything in active context, nothing stored

## The Solution: 3-File System + Existing Plan Discovery

| File | Purpose |
|------|---------|
| `task_plan.md` | Master tracking with phases, checkboxes, status |
| `notes.md` | Research findings, intermediate results, errors |
| `[deliverable].md` | Final output document |

**Key mechanism:** Re-reading `task_plan.md` before major decisions keeps goals in attention window.

## Additional Feature: Existing Plan Discovery

On activation, DeepPlan checks `~/.claude/plans/` for existing plans related to the current project:

**Discovery logic:**
1. Get current working directory and git repo name
2. Scan `~/.claude/plans/*.md` for plans mentioning:
   - Current directory path or basename
   - Git repository name
   - Keywords from the task description
3. Present matching plans to user with option to:
   - **Resume** - Continue an existing plan
   - **Reference** - Use as context but start fresh
   - **Ignore** - Start completely new

**Plan association storage:**
Each plan file includes frontmatter with project context:
```yaml
---
project: atlas
directory: /Users/ed/.dotfiles/atlas
created: 2026-01-07
status: in_progress
---
```

This allows quick filtering without parsing full content.

## Files to Create

### 1. Slash Command
**Path:** `~/.dotfiles/atlas/.claude/commands/atlas/deep-plan.md`

```yaml
---
description: "Manus AI-inspired deep planning for complex tasks. Usage: /atlas:deep-plan <task>"
---
```

Delegates to DeepPlan skill via Skill tool.

### 2. Skill Directory Structure

```
~/.dotfiles/atlas/.claude/skills/DeepPlan/
├── SKILL.md                    # Main skill definition
├── Tools/                      # (empty initially, per convention)
└── Workflows/
    ├── DiscoverPlans.md        # Find existing plans for current project
    ├── InitializePlan.md       # Create the 3 planning files
    ├── UpdateProgress.md       # Mark tasks complete, add findings
    └── ReviewGoals.md          # Re-read plan before decisions
```

### 3. SKILL.md Content

**Frontmatter:**
```yaml
---
name: DeepPlan
description: Manus AI-inspired persistent planning system. USE WHEN complex multi-step task, research project, extended implementation, OR need goal anchoring. Uses filesystem as memory with 3-file structure.
---
```

**Core behavior:**
1. On activation, create `task_plan.md` with phases/checkboxes
2. Store findings in `notes.md` (not context)
3. Re-read `task_plan.md` before major decisions
4. Log errors to `notes.md` for pattern avoidance
5. Sync progress to TodoWrite for visibility

### 4. Integration with TodoWrite

**How it integrates (not replaces):**
- DeepPlan creates/updates files for **persistence**
- TodoWrite shows progress for **visibility** in session
- When DeepPlan updates `task_plan.md`, it also calls TodoWrite
- If session resets, DeepPlan re-reads files and restores todos

**Flow:**
```
/atlas:deep-plan "Build auth system"
  → Creates task_plan.md with phases
  → Calls TodoWrite with same phases
  → During work: updates both files AND todos
  → On session restart: reads files, rebuilds todos
```

## Implementation Steps

### Phase 1: Create Slash Command
- [ ] Create `~/.dotfiles/atlas/.claude/commands/atlas/deep-plan.md`
- [ ] Add YAML frontmatter with Manus AI description
- [ ] Add delegation to DeepPlan skill

### Phase 2: Create Skill Structure
- [ ] Create `~/.dotfiles/atlas/.claude/skills/DeepPlan/` directory
- [ ] Create `Tools/` directory (empty)
- [ ] Create `Workflows/` directory

### Phase 3: Write SKILL.md
- [ ] Write frontmatter with USE WHEN triggers
- [ ] Document 3-file system
- [ ] Add workflow routing table
- [ ] Add examples section
- [ ] Document TodoWrite integration

### Phase 4: Create Workflows
- [ ] `Workflows/DiscoverPlans.md` - Scan ~/.claude/plans/ for existing project plans
- [ ] `Workflows/InitializePlan.md` - Creates the 3 planning files
- [ ] `Workflows/UpdateProgress.md` - Updates progress + syncs todos
- [ ] `Workflows/ReviewGoals.md` - Re-reads plan before decisions

### Phase 5: Test & Verify
- [ ] Run `/atlas:skills` to verify skill appears
- [ ] Test `/atlas:deep-plan "test task"` creates files
- [ ] Test plan discovery finds existing atlas plans in ~/.claude/plans/
- [ ] Verify TodoWrite integration works
- [ ] Test goal re-reading behavior

## Critical Files

| File | Action |
|------|--------|
| `~/.dotfiles/atlas/.claude/commands/atlas/deep-plan.md` | Create |
| `~/.dotfiles/atlas/.claude/skills/DeepPlan/SKILL.md` | Create |
| `~/.dotfiles/atlas/.claude/skills/DeepPlan/Workflows/DiscoverPlans.md` | Create |
| `~/.dotfiles/atlas/.claude/skills/DeepPlan/Workflows/InitializePlan.md` | Create |
| `~/.dotfiles/atlas/.claude/skills/DeepPlan/Workflows/UpdateProgress.md` | Create |
| `~/.dotfiles/atlas/.claude/skills/DeepPlan/Workflows/ReviewGoals.md` | Create |
