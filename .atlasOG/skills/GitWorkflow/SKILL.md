---
name: GitWorkflow
description: Atlas skill for intelligent git operations with convention detection, worktree support, voice feedback, and TELOS integration. USE WHEN commit, branch, PR, release, git workflow, push, merge.
---

# GitWorkflow - Intelligent Git Operations

**Context-aware git workflows with voice feedback, memory tracking, and safety guardrails.**

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `/git:commit` | Smart commit with convention detection |
| `/git:branch` | Branch/worktree management |
| `/git:pr` | Create PR with full analysis |
| `/git:release` | Semantic versioning and changelog |
| `/git:status` | Enhanced status with context |

---

## Core Principles

1. **Detect, don't assume** - Read project conventions from commits, CONTRIBUTING.md, package.json
2. **Worktrees over branches** - Parallel work without stashing
3. **TELOS context** - Connect changes to project goals
4. **Voice feedback** - Confirm operations audibly
5. **Memory tracking** - Resume where you left off

---

## Commit Workflow

### Automatic Convention Detection

The skill detects your project's commit style:

| Convention | Pattern | Example |
|------------|---------|---------|
| Conventional | `type(scope): message` | `feat(auth): add OAuth2` |
| Semantic | `[TYPE] message` | `[FEATURE] Add OAuth2` |
| Imperative | `Verb noun` | `Add OAuth2 support` |
| Custom | From recent commits | Matches existing style |

### Commit Process

```
1. ANALYZE
   - git status (staged + unstaged)
   - git diff (changes to commit)
   - git log -10 (recent commit style)
   - Check CONTRIBUTING.md for conventions

2. CLASSIFY
   - feat: New feature
   - fix: Bug fix
   - docs: Documentation only
   - refactor: Code change (no feature/fix)
   - test: Adding/fixing tests
   - chore: Maintenance tasks

3. SCOPE (if using conventional commits)
   - Detect from file paths
   - auth, api, ui, db, config, etc.

4. GENERATE MESSAGE
   - Match detected convention
   - Focus on WHY not WHAT
   - Include breaking change footer if needed

5. VALIDATE
   - Run pre-commit hooks
   - Check for secrets (patterns below)
   - Verify no large binaries without LFS

6. COMMIT
   - Stage appropriate files
   - Execute commit
   - Handle hook failures (retry once)

7. FEEDBACK
   - Voice: "Commit created, Ed"
   - Update MEMORY state
```

### Secret Detection Patterns

Block commits containing:
```
- API keys: /[A-Za-z0-9_]{20,}/
- AWS: /AKIA[0-9A-Z]{16}/
- Private keys: /-----BEGIN.*PRIVATE KEY-----/
- Passwords in URLs: /://[^:]+:[^@]+@/
- .env files with secrets
- credentials.json, secrets.yaml
```

---

## Branch Management

### Worktree-First Approach

**Why worktrees?**
- No stashing required
- Parallel work on multiple features
- Each branch has its own working directory
- IDE can have multiple windows open

### Commands

```bash
# Create feature worktree
/git:branch worktree feature/auth-refactor

# Creates:
# - Branch: feature/auth-refactor
# - Directory: ../project-auth-refactor/
# - Linked to main repo

# Create hotfix worktree
/git:branch worktree hotfix/security-patch

# List all worktrees
/git:branch list

# Clean up merged worktrees
/git:branch cleanup
```

### Branch Naming Conventions

```
feature/[ticket]-[description]   # feature/AUTH-123-oauth-support
hotfix/[ticket]-[description]    # hotfix/SEC-456-xss-fix
release/v[version]               # release/v2.1.0
experiment/[name]                # experiment/new-cache-strategy
```

---

## PR Workflow

### Full Branch Analysis

Unlike basic PR tools, we analyze ALL commits in the branch:

```
1. Find merge base with main/master
2. Collect all commits since divergence
3. Group by type (features, fixes, refactors)
4. Extract breaking changes
5. Identify related issues from commit messages
```

### TELOS Integration

Pull project context from TELOS:

```markdown
## Summary

Adds OAuth2 authentication support for MyChron user login.

**Project Context:** MyChron - building sustainable income through client work
```

### PR Template

```markdown
## Summary
[AI-generated from commit analysis]

## Changes
- [Grouped by type: features, fixes, etc.]

## Breaking Changes
- [If any, with migration notes]

## Test Plan
- [ ] [Generated from changed files]
- [ ] [Manual testing steps]

## Related
- Closes #[detected from commits]
- Related to #[mentioned issues]

---
Generated with Atlas | [Project] from TELOS
```

---

## Release Workflow

### Semantic Version Calculation

```
MAJOR: Breaking changes (feat! or BREAKING CHANGE footer)
MINOR: New features (feat)
PATCH: Bug fixes (fix)
```

### Release Process

```
1. Calculate version from commits since last tag
2. Generate changelog from commit messages
3. Update version files (package.json, Cargo.toml, etc.)
4. Create annotated tag
5. Generate release notes
6. Push tag to remote
```

---

## Safety Guardrails

### Blocked (No Override)

```bash
git push --force origin main
git push --force origin master
git reset --hard origin/main
git reset --hard origin/master
```

### Warnings (Confirmation Required)

```bash
git push --force origin [any-branch]  # "Force push to feature/x?"
git reset --hard                       # "Discard all local changes?"
git clean -fd                          # "Delete untracked files?"
```

### Automatic Protections

- Credential scanning before every commit
- Large file detection (>10MB without LFS)
- Merge conflict markers in staged files

---

## Voice Feedback Patterns

```
Commit:     "Commit created, Ed. feat auth add OAuth2 support"
Branch:     "Worktree created at project-auth-refactor"
PR:         "Pull request ready. 3 commits, 12 files changed"
Push:       "Pushed to origin. PR link copied to clipboard"
Error:      "Commit blocked. Detected AWS credentials in config file"
```

---

## Memory Integration

### State File: `~/.claude/MEMORY/State/git-context.json`

```json
{
  "currentProject": "/path/to/project",
  "currentBranch": "feature/auth-refactor",
  "worktrees": [
    { "branch": "feature/auth-refactor", "path": "../project-auth-refactor" },
    { "branch": "hotfix/sec-patch", "path": "../project-sec-patch" }
  ],
  "uncommittedWork": "OAuth2 token refresh implementation",
  "lastCommit": {
    "hash": "abc1234",
    "message": "feat(auth): add OAuth2 initial setup",
    "timestamp": "2024-01-19T10:00:00Z"
  },
  "pendingPR": null,
  "convention": "conventional"
}
```

### Session Continuity

On session start, if git-context.json exists:
```
"Resuming work on feature/auth-refactor. Last commit: add OAuth2 initial setup.
Uncommitted work: token refresh implementation."
```

---

## Configuration

### Project-Level: `.claude/git-workflow.json`

```json
{
  "convention": "conventional",
  "scopes": ["auth", "api", "ui", "db"],
  "branchPrefix": "feature/",
  "requireTicket": true,
  "ticketPattern": "[A-Z]+-[0-9]+",
  "protectedBranches": ["main", "master", "production"],
  "prTemplate": ".github/PULL_REQUEST_TEMPLATE.md"
}
```

### Global Defaults: `~/.claude/git-workflow.json`

```json
{
  "defaultConvention": "conventional",
  "voiceFeedback": true,
  "memoryTracking": true,
  "worktreeLocation": "../{project}-{branch}"
}
```

---

## Examples

### Quick Commit
```
User: commit this
Atlas: [Analyzes changes, detects conventional commits]
       [Creates: feat(api): add rate limiting middleware]
       "Commit created, Ed"
```

### Feature Worktree
```
User: /git:branch worktree feature/dark-mode
Atlas: [Creates branch and worktree]
       [Updates memory]
       "Worktree created at ../project-dark-mode. Switching context."
```

### Create PR
```
User: /git:pr
Atlas: [Analyzes 5 commits since main]
       [Pulls TELOS context for MyChron]
       [Generates PR with test plan]
       "Pull request created. Link: github.com/user/repo/pull/123"
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Convention not detected | Add `.claude/git-workflow.json` with explicit convention |
| Worktree creation fails | Ensure parent directory exists, no uncommitted changes |
| PR creation fails | Install `gh` CLI, run `gh auth login` |
| Secret detection false positive | Add pattern to `.gitallowed` |

---

## Related Skills

- **System** - Integrity checks, documentation
- **DeepPlan** - Complex feature planning before branching
- **CORE** - TELOS context for PR descriptions
