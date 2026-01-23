---
description: Commit all changes and push to remote
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*), Bash(git push:*), Bash(git branch:*)
---

# Git Commit and Push

Create a commit and push to the remote repository.

## Context

- Current git status: !`git status`
- Current git diff (staged and unstaged changes): !`git diff HEAD`
- Current branch: !`git branch --show-current`
- Remote tracking: !`git branch -vv | grep "^\*"`
- Recent commits: !`git log --oneline -5`

## Your Task

1. Stage all relevant changes with `git add`
2. Create a commit with a clear, descriptive message
3. Push to the remote (set upstream if needed with `-u origin <branch>`)

**Commit Message Format:**
```
<type>: <short description>

<optional body explaining what and why>

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Execute all git commands in a single response. Do not use any other tools.
