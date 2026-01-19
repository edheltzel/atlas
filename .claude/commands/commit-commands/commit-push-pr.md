---
description: "Commit, push, and open a PR with full branch analysis"
---

# Commit, Push, and Create PR

Complete workflow: commit current changes, push to remote, and create a pull request with intelligent analysis.

**Skill Reference:** Read `.claude/skills/GitWorkflow/SKILL.md` for full context.

## Workflow

### Phase 1: Analyze State

Run in parallel:

```bash
git status
git diff
git diff --cached
git branch --show-current
git log --oneline -10
git remote -v
```

Determine:
- Current branch name
- Whether branch exists on remote
- Base branch (main or master)

### Phase 2: Commit (if needed)

If there are uncommitted changes:
1. Follow the commit workflow from `/commit`
2. Stage and commit with appropriate message

If already committed, skip to Phase 3.

### Phase 3: Analyze Full Branch

**CRITICAL:** Analyze ALL commits in the branch, not just the latest.

```bash
# Find merge base
git merge-base HEAD origin/main || git merge-base HEAD origin/master

# Get all commits since divergence
git log [merge-base]..HEAD --oneline

# Get full diff for PR
git diff [merge-base]..HEAD --stat
```

Group commits by type:
- Features (feat)
- Fixes (fix)
- Refactors (refactor)
- Other

### Phase 4: Gather Context

Check for TELOS project context:
- Read `~/.claude/skills/CORE/USER/TELOS.md`
- Find active project matching current repo
- Extract project goal/context for PR description

Check for PR template:
- `.github/PULL_REQUEST_TEMPLATE.md`
- `.github/pull_request_template.md`

### Phase 5: Push

```bash
# Push with upstream tracking
git push -u origin [branch-name]
```

If push fails due to remote changes:
```bash
git pull --rebase origin [branch-name]
git push -u origin [branch-name]
```

### Phase 6: Create PR

Use GitHub CLI:

```bash
gh pr create --title "[title]" --body "$(cat <<'EOF'
## Summary

[AI-generated summary from commit analysis]

**Project:** [TELOS context if available]

## Changes

### Features
- [List features]

### Fixes
- [List fixes]

### Other
- [List other changes]

## Test Plan

- [ ] [Generated test items based on changed files]
- [ ] Manual verification of [key functionality]

## Related

- Closes #[detected issues]
- Related to #[mentioned issues]

---

[X] commits | [Y] files changed | +[additions] -[deletions]

Generated with [Atlas](https://github.com/edwinhern/atlas)
EOF
)"
```

### Phase 7: Feedback

```
🎯 COMPLETED: PR created - [PR URL]
```

## Arguments

`$ARGUMENTS` - Optional: PR title override, or `--draft` for draft PR

## Examples

```
/commit-push-pr                    # Full workflow
/commit-push-pr --draft            # Create as draft PR
/commit-push-pr "Custom PR title"  # Override title
```

## Safety

- NEVER force push to main/master
- ALWAYS analyze full branch history (not just latest commit)
- ALWAYS include test plan in PR description
- ALWAYS attribute to Atlas

## Requirements

- GitHub CLI (`gh`) must be installed and authenticated
- Repository must have a GitHub remote
