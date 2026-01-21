# InitializePlan Workflow

**Create the 3-file planning structure for a new task.**

## When to Execute

- After DiscoverPlans returns `fresh`
- User explicitly requests new plan
- No existing plans match current project

## Initialization Steps

### Step 1: Create task_plan.md

Location: Current working directory

```markdown
---
project: [project-name]
directory: [full-path]
created: [ISO-date]
status: in_progress
---

# Task: [User's Task Description]

## Overview

[Brief summary of what we're building/doing]

## Phases

### Phase 1: Research & Discovery
- [ ] Understand current state
- [ ] Identify key files and patterns
- [ ] Document constraints

### Phase 2: Design
- [ ] Define approach
- [ ] Get user approval
- [ ] Identify edge cases

### Phase 3: Implementation
- [ ] [Specific implementation steps]
- [ ] [Based on task requirements]

### Phase 4: Verification
- [ ] Test functionality
- [ ] Verify requirements met
- [ ] Clean up

## Status Updates

- [timestamp]: Plan created, starting Phase 1
```

### Step 2: Create notes.md

Location: Current working directory

```markdown
# Research Notes

## Project Context

- **Directory:** [path]
- **Task:** [description]
- **Started:** [date]

## Findings

[Research results will be added here]

## Decisions Made

[Key decisions and rationale]

## Errors Encountered

[Errors and resolutions for pattern learning]
```

### Step 3: Sync with TodoWrite

Call TodoWrite with the phases:

```json
{
  "todos": [
    {"content": "Phase 1: Research & Discovery", "status": "in_progress", "activeForm": "Researching and discovering"},
    {"content": "Phase 2: Design", "status": "pending", "activeForm": "Designing approach"},
    {"content": "Phase 3: Implementation", "status": "pending", "activeForm": "Implementing solution"},
    {"content": "Phase 4: Verification", "status": "pending", "activeForm": "Verifying results"}
  ]
}
```

### Step 4: Register in ~/.claude/plans/

Create a reference plan in the central directory:

```bash
# Create reference with meaningful name
# Format: [project]-[task-summary].md
```

```markdown
---
project: [name]
directory: [path]
created: [date]
status: in_progress
local_plan: [path-to-task_plan.md]
---

# [Task Description]

Reference to local plan at: [path]/task_plan.md
```

## Output

Confirm creation:

```
Created DeepPlan structure:
- task_plan.md (4 phases, 12 steps)
- notes.md (ready for research)
- Synced to TodoWrite (4 todos)
- Registered in ~/.claude/plans/

Starting Phase 1: Research & Discovery
```
