---
description: "Cleans up all git branches marked as [gone] (branches that have been deleted on the remote but still exist locally), including removing associated worktrees."
---

# Clean Gone Branches

Remove local branches that have been deleted from the remote, including their associated worktrees.

**Skill Reference:** Read `.claude/skills/GitWorkflow/SKILL.md` for full context.

## Workflow

### Phase 1: Fetch and Prune

```bash
git fetch --prune
```

This updates remote tracking and marks deleted branches as `[gone]`.

### Phase 2: Identify Gone Branches

```bash
git branch -vv
```

Look for branches with `[gone]` status:

```
  feature/old-feature abc1234 [origin/feature/old-feature: gone] Last commit message
* main                def5678 [origin/main] Current commit
```

### Phase 3: Check Worktrees

```bash
git worktree list
```

Identify worktrees associated with gone branches.

### Phase 4: Remove Worktrees First

For each gone branch with a worktree:

```bash
git worktree remove --force [worktree-path]
```

Worktrees MUST be removed before the branch can be deleted.

### Phase 5: Delete Branches

For each gone branch:

```bash
git branch -D [branch-name]
```

### Phase 6: Report

Summarize what was cleaned:

```
Removed worktrees:
  - /path/to/project-old-feature

Deleted branches:
  - feature/old-feature
  - feature/another-merged

No cleanup needed for:
  - main (protected)
  - develop (still on remote)
```

### Phase 7: Feedback

```
🎯 COMPLETED: Cleaned [N] branches and [M] worktrees
```

Or if nothing to clean:

```
🎯 COMPLETED: No stale branches found
```

## Safety

- NEVER delete the current branch
- NEVER delete protected branches (main, master, develop, production)
- ALWAYS remove worktrees before deleting associated branches
- ALWAYS report what was deleted

## Arguments

`$ARGUMENTS` - Optional: `--dry-run` to preview without deleting

## Examples

```
/clean_gone              # Clean all gone branches
/clean_gone --dry-run    # Preview what would be cleaned
```
