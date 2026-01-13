# Task Management Rules

**Load when:** User mentions tasks, issues, todos, backlog, tickets.

---

## DeepPlan is Default

When Ed mentions any of these, use DeepPlan:
- "add a task", "create an issue", "new todo"
- "we need to do X", "let's track this"
- "add to the backlog", "create a ticket"

## The Flow

```
DeepPlan creates → task_plan.md → auto-syncs to → GitHub Issues
```

## Behavior

1. **Creating tasks** → Use DeepPlan to create/update `task_plan.md`
2. **Checking tasks** → Read `.claude/plans/*.md` and show status
3. **Completing tasks** → Mark checkbox `[x]` in plan file
4. **Sync happens automatically** - push on session end, pull on session start

## Quick Commands

- `/atlas:sync-issues status` - Check sync state
- `/atlas:sync-issues push` - Force push to GitHub
- `/atlas:sync-issues pull` - Force pull from GitHub

## Critical Rule

**Never create standalone GitHub issues** - always go through DeepPlan so tasks stay tracked locally.
