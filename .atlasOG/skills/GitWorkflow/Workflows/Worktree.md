# Worktree Workflow

## Why Worktrees?

| Traditional Branches | Worktrees |
|---------------------|-----------|
| Single working directory | Multiple working directories |
| Must stash/commit to switch | Switch by changing directories |
| One context at a time | Parallel contexts |
| IDE shows one branch | IDE can have multiple windows |

## Directory Structure

```
~/projects/
├── myproject/                 # Main worktree (main branch)
│   ├── .git/                  # Git directory (shared)
│   └── src/
├── myproject-auth-refactor/   # Feature worktree
│   ├── .git -> ../myproject/.git  # Linked
│   └── src/
└── myproject-hotfix/          # Hotfix worktree
    ├── .git -> ../myproject/.git
    └── src/
```

## Creating Worktrees

### Feature Worktree

```bash
# From main repo
cd ~/projects/myproject

# Create worktree with new branch
git worktree add ../myproject-auth-refactor -b feature/auth-refactor

# Or from existing branch
git worktree add ../myproject-existing-feature feature/existing
```

### Naming Convention

```
{project}-{branch-suffix}

Examples:
- myproject-auth-refactor     (from feature/auth-refactor)
- myproject-hotfix-123        (from hotfix/123)
- myproject-experiment-cache  (from experiment/cache)
```

## Working with Worktrees

### List All Worktrees

```bash
git worktree list

# Output:
# /Users/ed/projects/myproject              abc1234 [main]
# /Users/ed/projects/myproject-auth         def5678 [feature/auth-refactor]
# /Users/ed/projects/myproject-hotfix       ghi9012 [hotfix/sec-patch]
```

### Switch Context

```bash
# Just change directories
cd ../myproject-auth-refactor

# Open in IDE
code ../myproject-auth-refactor
```

### Remove Worktree

```bash
# After merging, remove worktree
git worktree remove ../myproject-auth-refactor

# Force remove (uncommitted changes)
git worktree remove --force ../myproject-auth-refactor

# Prune stale worktrees
git worktree prune
```

## Best Practices

### 1. Keep Main Clean

Main worktree should always be on `main`/`master`:
```bash
# Don't develop on main worktree
cd ~/projects/myproject
git checkout main  # Always main here
```

### 2. One Feature Per Worktree

```bash
# Good: Isolated features
myproject-auth/
myproject-payments/
myproject-ui-refresh/

# Bad: Multiple features in one worktree
myproject-various-changes/  # Don't do this
```

### 3. Clean Up Regularly

```bash
# After PR merged
git worktree remove ../myproject-auth-refactor
git branch -d feature/auth-refactor
git fetch --prune
```

### 4. Shared Dependencies

Node modules, virtual envs, etc. are per-worktree:
```bash
# Each worktree needs its own install
cd ../myproject-auth-refactor
bun install  # Separate node_modules
```

## Memory Tracking

Git context tracks active worktrees:

```json
{
  "worktrees": [
    {
      "branch": "feature/auth-refactor",
      "path": "/Users/ed/projects/myproject-auth-refactor",
      "created": "2024-01-19T10:00:00Z",
      "lastAccessed": "2024-01-19T14:30:00Z"
    }
  ]
}
```

## Common Issues

### Worktree Locked

```bash
# Error: 'path' is locked
git worktree unlock ../myproject-auth

# Then remove
git worktree remove ../myproject-auth
```

### Branch Already Checked Out

```bash
# Error: 'feature/x' is already checked out at '/path'
# Solution: Remove existing worktree first
git worktree remove /path/to/existing
```

### Stale Worktree Reference

```bash
# If directory deleted but worktree still registered
git worktree prune
```

## Integration with PR Workflow

```bash
# 1. Create feature worktree
/git:branch worktree feature/auth

# 2. Develop in worktree
cd ../myproject-auth
# ... make changes ...

# 3. Commit (from worktree)
/git:commit

# 4. Create PR (from worktree)
/git:pr

# 5. After merge, cleanup
cd ../myproject
/git:branch cleanup
```
