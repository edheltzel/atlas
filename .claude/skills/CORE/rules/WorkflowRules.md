# Workflow Rules

**Load when:** Starting implementation work, building features, fixing bugs.

---

## Before Starting Work

1. **Read CLAUDE.md and AGENTS.md** - Project-specific workflows, git strategy, conventions
2. **Check git workflow** - Does this project use worktrees, feature branches, or direct commits?
3. **Understand scope** - Is this a quick fix (direct commit OK) or feature work (branch/worktree)?
4. **Check for existing plans** - Look for in-progress plans before starting new work

## Plans

Plans are stored in project-local directories, following Anthropic's best practices.

**Discovery order (check in this order):**
1. `<project>/.claude/plans/` - Project-specific plans (preferred)
2. `~/.claude/plans/` - Global plans (fallback)

**When creating plans:** Save to the project's `.claude/plans/` directory, not global.

**When checking queue:** Check project-local plans first for relevant work.
