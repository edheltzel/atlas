---
description: Create a git commit with smart message
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*)
---

# Git Commit

Create a single git commit with an appropriate message based on staged changes.

## Context

- Current git status: !`git status`
- Current git diff (staged and unstaged changes): !`git diff HEAD`
- Current branch: !`git branch --show-current`
- Recent commits: !`git log --oneline -10`

## Your Task

Based on the above changes, create a single git commit.

1. Stage the relevant changes with `git add`
2. Create a commit with a clear, descriptive message following conventional commits style
3. Include `Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>` at the end

**Commit Message Format:**
```
<type>: <short description>

<optional body explaining what and why>

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Execute all git commands in a single response. Do not use any other tools.
