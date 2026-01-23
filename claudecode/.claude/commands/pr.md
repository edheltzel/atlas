---
description: Commit, push, and create a pull request
allowed-tools: Bash(git checkout:*), Bash(git add:*), Bash(git status:*), Bash(git commit:*), Bash(git push:*), Bash(git branch:*), Bash(gh pr create:*)
---

# Git Pull Request

Create a new branch (if on main), commit changes, push, and create a pull request.

## Context

- Current git status: !`git status`
- Current git diff (staged and unstaged changes): !`git diff HEAD`
- Current branch: !`git branch --show-current`
- Recent commits: !`git log --oneline -5`

## Your Task

1. **If on main/master**: Create a new feature branch with a descriptive name
2. Stage all relevant changes with `git add`
3. Create a commit with a clear, descriptive message
4. Push to the remote with `-u origin <branch>` to set upstream
5. Create a pull request using `gh pr create`

**Commit Message Format:**
```
<type>: <short description>

<optional body explaining what and why>

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

**PR Format:**
```bash
gh pr create --title "<type>: <description>" --body "$(cat <<'EOF'
## Summary
- <bullet points of changes>

## Test plan
- [ ] <verification steps>

🤖 Generated with Claude Code
EOF
)"
```

Execute all commands in a single response. Return the PR URL when complete.
