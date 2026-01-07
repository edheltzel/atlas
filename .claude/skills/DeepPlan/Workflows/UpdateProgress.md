# UpdateProgress Workflow

**Update plan files and sync with TodoWrite as work progresses.**

## When to Execute

- After completing a phase step
- When encountering errors (log to notes.md)
- When making key decisions
- When discovering important findings

## Update Types

### 1. Complete a Step

**Trigger:** Task step finished successfully

**Actions:**

1. Read current task_plan.md
2. Mark checkbox complete: `- [ ]` → `- [x]`
3. Add status update with timestamp
4. Update TodoWrite to reflect progress

```markdown
### Phase 2: Design
- [x] Define approach
- [ ] Get user approval  ← Now in progress
```

```
## Status Updates

- 2026-01-07 15:30: Completed "Define approach" in Phase 2
```

### 2. Complete a Phase

**Trigger:** All steps in phase complete

**Actions:**

1. Mark all phase steps complete
2. Add phase completion status
3. Update TodoWrite: mark phase complete, start next
4. Trigger ReviewGoals before starting next phase

```markdown
## Status Updates

- 2026-01-07 16:00: Phase 2 (Design) COMPLETED
- 2026-01-07 16:01: Starting Phase 3 (Implementation)
```

### 3. Log Research Finding

**Trigger:** Discovered important information

**Actions:**

1. Append to notes.md under ## Findings
2. Include source and relevance

```markdown
## Findings

### Authentication Patterns
- Found existing auth middleware at `src/middleware/auth.ts`
- Uses JWT with 24h expiry
- Relevant to: Phase 3 implementation
```

### 4. Log Error

**Trigger:** Encountered an error or failure

**Actions:**

1. Append to notes.md under ## Errors Encountered
2. Include error details, cause, and resolution
3. Mark as pattern to avoid

```markdown
## Errors Encountered

### TypeScript Module Resolution
- **Error:** Cannot find module './utils'
- **Cause:** Missing file extension in import
- **Resolution:** Use explicit `.js` extension
- **Pattern:** Always use explicit extensions in ESM
```

### 5. Record Decision

**Trigger:** Made significant implementation choice

**Actions:**

1. Append to notes.md under ## Decisions Made
2. Include rationale and alternatives considered

```markdown
## Decisions Made

### JWT vs Session Tokens
- **Decision:** Use JWT for stateless auth
- **Rationale:** Aligns with existing patterns, better for scaling
- **Alternatives:** Session tokens (rejected: requires Redis)
```

## Sync Protocol

After any update:

1. **Save files** - Ensure task_plan.md and notes.md are written
2. **Update TodoWrite** - Reflect current phase/step status
3. **Confirm update** - Brief message showing what changed

```
Updated task_plan.md:
- Marked "Define approach" complete
- Now on: "Get user approval" (Phase 2, step 2 of 3)
```
