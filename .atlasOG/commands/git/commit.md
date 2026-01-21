---
description: "Create a git commit with intelligent convention detection"
---

# Git Commit

Create a git commit with automatic convention detection and voice feedback.

**Skill Reference:** Read `.claude/skills/GitWorkflow/SKILL.md` for full context.

## Workflow

### Phase 1: Analyze Current State

Run these commands in parallel:

```bash
git status
git diff
git diff --cached
git log --oneline -10
```

Also check for:
- `.claude/git-workflow.json` (project config)
- `CONTRIBUTING.md` (commit guidelines)
- Recent commit message patterns

### Phase 2: Detect Convention

From recent commits, identify the pattern:

| Convention | Pattern | Example |
|------------|---------|---------|
| Conventional | `type(scope): message` | `feat(auth): add OAuth2` |
| Semantic | `[TYPE] message` | `[FEATURE] Add OAuth2` |
| Imperative | `Verb noun` | `Add OAuth2 support` |

Default to **Conventional Commits** if no clear pattern.

### Phase 3: Classify Changes

Analyze the diff to determine:

1. **Type**: feat, fix, docs, refactor, test, chore, etc.
2. **Scope**: From file paths (auth, api, ui, db, etc.)
3. **Breaking**: Any breaking changes? (API removals, interface changes)

### Phase 4: Generate Message

Create a commit message that:
- Matches the detected convention
- Focuses on WHY not WHAT
- Uses imperative mood ("add" not "added")
- Includes scope if using conventional commits
- Adds `BREAKING CHANGE:` footer if needed

### Phase 5: Validate

Before committing, check for:
- Secrets/credentials in staged files
- Large binary files (>10MB)
- Merge conflict markers

If issues found, STOP and report.

### Phase 6: Execute

```bash
git add [appropriate files]
git commit -m "$(cat <<'EOF'
[generated message]

Co-Authored-By: Atlas <noreply@anthropic.com>
EOF
)"
git status
```

If pre-commit hooks fail and modify files, retry ONCE.

### Phase 7: Feedback

End with voice feedback pattern:

```
🎯 COMPLETED: Commit created - "[type](scope): [description]"
```

## Arguments

`$ARGUMENTS` - Optional: specific files to commit, or commit message override

## Examples

```
/commit                           # Auto-detect and commit all changes
/commit src/auth/                 # Commit only auth changes
/commit -m "custom message"       # Use provided message
```

## Safety

- NEVER commit files matching: `.env`, `credentials.*`, `secrets.*`, `*.pem`, `*.key`
- NEVER use `--no-verify` unless explicitly requested
- ALWAYS include Co-Authored-By attribution
