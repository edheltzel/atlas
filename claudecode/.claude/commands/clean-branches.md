---
description: Clean up local branches deleted from remote
allowed-tools: Bash(git fetch:*), Bash(git branch:*), Bash(git worktree:*)
---

# Clean Gone Branches

Remove local branches that have been deleted from the remote repository.

## Context

- Local branches with status: !`git branch -v`
- Current worktrees: !`git worktree list`

## Your Task

1. First, fetch and prune remote references:
   ```bash
   git fetch --prune
   ```

2. Identify branches marked as `[gone]` (deleted from remote)

3. For each gone branch:
   - Check if it has an associated worktree
   - Remove the worktree first if it exists: `git worktree remove --force <path>`
   - Delete the branch: `git branch -D <branch>`

4. Report what was cleaned up

**Safety:**
- Never delete the current branch
- Never delete `main` or `master`
- Show what will be deleted before executing

Execute all commands and report results.
