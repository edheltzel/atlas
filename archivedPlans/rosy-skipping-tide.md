# Plan: Git Worktrees for Atlas

## Overview
Set up git worktrees for the atlas submodule with worktrees stored at `~/Developer/Atlas-worktrees/<branch-name>/`.

## Key Context
- Atlas is a **git submodule** of `~/.dotfiles`
- Submodule git data lives at `~/.dotfiles/.git/modules/atlas`
- Worktree commands run from within `~/.dotfiles/atlas/`
- Parent dotfiles uses `CLAUDE.md` → `AGENTS.md` pattern; atlas lacks this

---

## Implementation Steps

### 1. Create Worktree Directory
```bash
mkdir -p ~/Developer/Atlas-worktrees
```

### 2. Clean Up Stale Worktree Reference
Parent dotfiles has a prunable worktree from previous attempt:
```bash
cd ~/.dotfiles && git worktree prune
```

### 3. Create Atlas Documentation Structure

**Create `~/.dotfiles/atlas/CLAUDE.md`:**
```markdown
# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

**See [AGENTS.md](AGENTS.md) for all repository documentation.**
```

**Create `~/.dotfiles/atlas/AGENTS.md`** with:
- Repository overview
- Worktree workflow documentation
- Build/development commands

### 4. Update `.stow-local-ignore`

Add pattern to exclude new docs from stow:
```
CLAUDE\.md
AGENTS\.md
```

---

## Worktree Workflow (to document)

**Create worktree:**
```bash
cd ~/.dotfiles/atlas
git worktree add ~/Developer/Atlas-worktrees/<branch> -b <branch>
```

**List worktrees:**
```bash
git worktree list
```

**Remove worktree:**
```bash
git worktree remove ~/Developer/Atlas-worktrees/<branch>
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `~/Developer/Atlas-worktrees/` | Create directory |
| `~/.dotfiles/atlas/CLAUDE.md` | Create (pointer to AGENTS.md) |
| `~/.dotfiles/atlas/AGENTS.md` | Create with worktree docs |
| `~/.dotfiles/atlas/.stow-local-ignore` | Add CLAUDE.md, AGENTS.md |

---

## Verification

1. Create test worktree: `git worktree add ~/Developer/Atlas-worktrees/test -b test`
2. Verify with `git worktree list`
3. Remove test: `git worktree remove ~/Developer/Atlas-worktrees/test && git branch -d test`
