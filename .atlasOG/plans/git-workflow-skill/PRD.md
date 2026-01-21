# Git Workflow Skill - Product Requirements

## Overview

Create a comprehensive Git Workflow skill for Atlas that consolidates and enhances git operations with intelligent context awareness, safety guardrails, and workflow automation.

## Current State Analysis

### What Anthropic Provides (commit-commands plugin)
- `/commit` - Basic commit with auto-generated message
- `/commit-push-pr` - Commit, push, create PR in one step
- `/clean_gone` - Clean up deleted remote branches

### What We Have (OpenCode commands)
- `x-commit.md` - Basic commit workflow for OpenCode
- `x-commit-push.md` - Commit + push workflow for OpenCode

### Gaps
1. No skill-based approach (context, phase guidance, capabilities)
2. No Atlas integration (voice feedback, memory, TELOS alignment)
3. No branch strategy awareness (worktrees, feature branches)
4. No commit message standards (conventional commits, semantic)
5. No pre-commit intelligence (lint fixes, test runs)
6. No release workflow support

---

## Proposed Skill: GitWorkflow

### Skill Structure

```
.claude/skills/GitWorkflow/
├── SKILL.md              # Main skill definition
├── Strategies/
│   ├── ConventionalCommits.md
│   ├── SemanticVersioning.md
│   └── BranchNaming.md
├── Workflows/
│   ├── FeatureBranch.md
│   ├── Worktree.md
│   ├── Hotfix.md
│   └── Release.md
└── Templates/
    ├── commit-message.md
    ├── pr-description.md
    └── release-notes.md
```

### Core Capabilities

#### 1. Smart Commit (`/git:commit` or auto-trigger)

**Enhancements over Anthropic's:**
- Detect project's commit convention (conventional, semantic, custom)
- Check for BREAKING CHANGES and prompt for confirmation
- Run pre-commit checks intelligently (only affected files)
- Integrate with Atlas voice feedback ("Commit created, Ed")
- Log to MEMORY for session continuity

**Workflow:**
```
1. ANALYZE: git status, diff, recent commits
2. DETECT: Project's commit style (read CONTRIBUTING.md, recent commits)
3. CLASSIFY: Change type (feat, fix, docs, refactor, test, chore)
4. SCOPE: Identify affected area (component, module, file)
5. GENERATE: Commit message matching project style
6. VALIDATE: Run pre-commit hooks, handle failures
7. COMMIT: Execute with appropriate flags
8. FEEDBACK: Voice + memory update
```

#### 2. Branch Management (`/git:branch`)

**Capabilities:**
- Create feature branches with naming convention
- Create worktree branches for parallel work
- Switch context with state preservation
- Clean up merged/gone branches
- Show branch dependency tree

**Commands:**
```
/git:branch feature auth-refactor    # Create feature branch
/git:branch worktree hotfix-123      # Create worktree
/git:branch cleanup                  # Remove gone branches
/git:branch list                     # Show branches with status
```

#### 3. PR Workflow (`/git:pr`)

**Enhancements:**
- Read TELOS for project context in PR description
- Analyze ALL commits in branch (not just latest)
- Generate test plan based on changes
- Auto-link related issues
- Support PR templates from `.github/`

**Generated PR Format:**
```markdown
## Summary
[AI-generated from commit analysis + TELOS context]

## Changes
- [Bullet points of what changed]

## Test Plan
- [ ] [Generated test checklist]

## Related
- Closes #123
- Related to #456

---
🤖 Generated with Atlas
```

#### 4. Release Workflow (`/git:release`)

**Capabilities:**
- Semantic version calculation from commits
- Changelog generation
- Tag creation with annotations
- Release notes compilation
- npm/cargo/pip version bumps

#### 5. Safety Guardrails

**Blocked by Default:**
- `git push --force` to main/master
- `git reset --hard` on shared branches
- Committing secrets (detected patterns)
- Large binary files without LFS

**Warnings:**
- Commits without tests for feature changes
- Breaking changes without BREAKING CHANGE footer
- Force pushes to any branch (require confirmation)

---

## Integration Points

### Voice Feedback
```
🎯 COMPLETED: Commit created - "feat(auth): add OAuth2 support"
🔔 AWAITING: PR ready for review - approve push?
```

### Memory Integration
```json
// ~/.claude/MEMORY/State/git-context.json
{
  "currentBranch": "feature/auth-refactor",
  "uncommittedWork": "OAuth2 implementation",
  "lastCommit": "abc1234",
  "prPending": null
}
```

### Security Integration
- Hook into SecurityValidator for dangerous commands
- Credential scanning before commits

---

## Implementation Plan

### Phase 1: Core Skill Definition
- [ ] Create SKILL.md with triggers and capabilities
- [ ] Define commit message strategies
- [ ] Create basic commit workflow

### Phase 2: Branch Management
- [ ] Implement branch creation with conventions
- [ ] Add worktree support
- [ ] Add cleanup command

### Phase 3: PR Workflow
- [ ] Implement PR creation with analysis
- [ ] Add template support
- [ ] Integrate TELOS context

### Phase 4: Release Workflow
- [ ] Semantic version calculation
- [ ] Changelog generation
- [ ] Tag management

### Phase 5: Integration
- [ ] Voice feedback hooks
- [ ] Memory state tracking
- [ ] Security validation

---

## Comparison: Plugin vs Skill Approach

| Aspect | Plugin (Anthropic) | Skill (Atlas) |
|--------|-------------------|---------------|
| Context awareness | None | TELOS, MEMORY, project context |
| Feedback | Text only | Voice + text |
| Customization | Limited | Strategies + templates |
| Safety | Basic | SecurityValidator integration |
| State | Stateless | Memory-backed |
| Branching | Basic | Worktree-aware |
| Conventions | Auto-detect only | Configurable strategies |

---

## Success Criteria

1. `/git:commit` generates appropriate commit messages 95% of time
2. Voice feedback triggers on all git operations
3. No accidental force pushes to protected branches
4. Memory tracks git context across sessions
5. PR descriptions match project quality standards
6. Works with both standard git and worktree workflows

---

## Open Questions

1. Should we replace or supplement the commit-commands plugin?
2. How deep should TELOS integration go? (project goals in PR descriptions?)
3. Should we support git-flow vs trunk-based as configurable strategies?
4. Integration with GitHub Actions / CI feedback?
