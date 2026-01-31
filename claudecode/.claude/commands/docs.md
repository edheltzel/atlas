---
description: Document, process file.
allowed-tools: Read(*), Glob(*), Grep(*), Write(*), Edit(*), Skill(Documents:*)
---

# Documentation

Update or create documentation for the current project.

## Context

- Current directory: !`pwd`
- Git status: !`git status --short`
- Recent changes: !`git diff --stat HEAD~5 2>/dev/null || echo "No recent commits"`

## Arguments

`$ARGUMENTS` can be:
- (empty) — Auto-detect what needs documenting based on recent changes
- `readme` — Update README.md specifically
- `claude` — Update CLAUDE.md specifically
- `all` — Update both README.md and CLAUDE.md
- `<filepath>` — Document a specific file or skill

## Your Task

**Load the Documentation skill for full workflow:**

```
read ~/.claude/skills/Documents/SKILL.md
```

Based on `$ARGUMENTS`, route to the appropriate workflow:

**If empty or `all`:**
1. Analyze recent git changes to understand what was modified
2. Identify which documentation files need updates
3. Update CLAUDE.md with agent-relevant context (what AI needs to know to work with the codebase)
4. Update README.md with human-readable documentation (setup, usage, architecture)

**If `readme`:**
1. Focus on README.md updates only
2. Ensure human-readable format: overview, setup, usage, architecture

**If `claude`:**
1. Focus on CLAUDE.md updates only
2. Ensure agent context: file structures, patterns, conventions, gotchas

**If `<filepath>`:**
1. Document the specified file or directory
2. If it's a skill directory, update its SKILL.md

## Documentation Principles

- **Agent docs (CLAUDE.md):** What does AI need to know? Patterns, conventions, file locations, gotchas.
- **Human docs (README.md):** What does a human need to know? Setup, usage, architecture, quick start.
- **Level of detail:** Comprehensive but not overwhelming. Err toward more detail when uncertain.
- **Don't duplicate:** Reference other docs rather than copying content.
