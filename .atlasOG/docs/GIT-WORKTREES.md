# Git Worktrees for Atlas

Atlas uses git worktrees for parallel development. Worktrees are stored outside the dotfiles directory.

## Locations

| Location | Purpose |
|----------|---------|
| `~/.dotfiles/atlas/` | Main branch (master) |
| `~/Developer/Atlas-worktrees/<branch>/` | Feature branches |

## Commands

### Create Worktree

```bash
cd ~/.dotfiles/atlas
git worktree add ~/Developer/Atlas-worktrees/<branch-name> -b <branch-name>
```

### List Worktrees

```bash
git worktree list
```

### Remove Worktree

```bash
git worktree remove ~/Developer/Atlas-worktrees/<branch-name>
git branch -d <branch-name>  # Optional: delete branch after merge
```

## Important Notes

- Atlas is a **git submodule** of `~/.dotfiles`
- Worktree commands must run from `~/.dotfiles/atlas/`
- Each worktree is a full working copy with its own branch
- Changes in worktrees can be committed and pushed independently
