---
description: "Show current project plans with active phases and pending items. Usage: /atlas:onDeck"
---

# On Deck - Project Plans Dashboard

Display plans from the current project's `.claude/plans/` directory.

## Instructions

1. **Find plans** in `$CWD/.claude/plans/` directory (current project only)
   - Include both DeepPlan files (`*task_plan.md`) and standard plan files (`*.md`)
   - Skip `*.notes.md` files (they're companion files, not plans)

2. **Parse each plan file** and extract:
   - **Plan name**: From YAML frontmatter `project` field, or derive from filename
   - **Status**: From frontmatter `status` field, or detect from `## Status:` line (look for "COMPLETED" or "✅")
   - **Active phase**: First `### Phase` section containing unchecked items (`- [ ]`)
   - **Pending items**: Up to 3 unchecked items (`- [ ]`) from the active phase

3. **Display format** - Concise table:

```
📋 ON DECK - Project Plans

┌─────────────────────┬─────────────────┬────────────────────────────────┐
│ Plan                │ Active Phase    │ Next Actions (max 3)           │
├─────────────────────┼─────────────────┼────────────────────────────────┤
│ feature-auth        │ Phase 2: API    │ • Create endpoint              │
│                     │                 │ • Add validation               │
│                     │                 │ • Write tests                  │
├─────────────────────┼─────────────────┼────────────────────────────────┤
│ voice-optimization  │ ✅ Completed    │ —                              │
└─────────────────────┴─────────────────┴────────────────────────────────┘
```

4. **Rules**:
   - Plans with no unchecked items show "✅ Completed" in Active Phase column
   - If no plans exist, display: "No plans found in .claude/plans/"
   - Sort active plans first, completed plans last
   - Truncate long phase names and action items to fit table

5. **Do NOT** create, modify, or suggest changes to plans - this is read-only
