# ReviewGoals Workflow

**Re-read plan files to anchor goals before major decisions.**

## When to Execute

- Before starting a new phase
- Before making architectural decisions
- When feeling uncertain about direction
- After extended work (50+ tool calls)
- When user asks about original goals

## The Goal Drift Problem

During long sessions with many tool calls, the original task objectives can fade from the attention window. This leads to:

- Scope creep
- Unnecessary features
- Misaligned decisions
- Wasted effort

## Review Process

### Step 1: Read task_plan.md

```bash
# Read the master plan
cat task_plan.md
```

Focus on:
- **Original task description** in the header
- **Current phase** and its goals
- **Remaining steps** to completion
- **Status updates** for context

### Step 2: Read notes.md

```bash
# Read accumulated knowledge
cat notes.md
```

Focus on:
- **Key findings** relevant to current decision
- **Errors to avoid** (pattern learning)
- **Previous decisions** and their rationale

### Step 3: Check Alignment

Before proceeding, verify:

| Question | Source |
|----------|--------|
| Does this align with the original task? | task_plan.md header |
| Is this the right phase to do this? | Current phase section |
| Have we considered relevant findings? | notes.md Findings |
| Are we repeating a past mistake? | notes.md Errors |

### Step 4: Confirm or Redirect

**If aligned:** Proceed with confidence

```
Reviewed plan. Current decision aligns with:
- Original goal: "Build authentication system"
- Current phase: "Phase 3: Implementation"
- Relevant finding: "Existing JWT pattern in middleware"

Proceeding with JWT implementation.
```

**If misaligned:** Redirect and document

```
Goal check flagged misalignment:
- Original goal: "Build authentication system"
- Current action: "Refactoring database schema"
- Issue: Database changes not in scope

Redirecting back to auth implementation.
Logged to notes.md for awareness.
```

## Automatic Triggers

The skill should automatically trigger ReviewGoals:

1. **Phase transitions** - Always review before starting new phase
2. **Major decisions** - When about to make irreversible changes
3. **Long sessions** - After ~50 tool calls without review
4. **Uncertainty** - When hesitating or feeling lost

## Output Format

```
--- Goal Review ---
Task: [Original task from plan header]
Phase: [Current phase name] ([N of M] complete)
Focus: [What should happen next]
Alignment: [Confirmed/Redirected]
---------------
```
