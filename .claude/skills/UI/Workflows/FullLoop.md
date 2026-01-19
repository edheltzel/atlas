# Full Loop Workflow

Complete design-implement-verify cycle applying all three systems.

---

## Trigger

- User says `/ui` with no arguments
- User says "full", "complete", "all"
- Default behavior when context detected

## Execution

### Step 1: Detect Context

Determine what the user is working on:

```bash
# Check current file/selection
CONTEXT=$(get_current_context)

# If no context, show help
if [ -z "$CONTEXT" ]; then
  show_quick_help
  exit 0
fi
```

### Step 2: Stack Detection

```bash
bun run $PAI_DIR/skills/UI/Tools/StackDetect.ts
```

Report detected stack:
```
Detected: Tailwind CSS (high confidence)
Constraint set: tailwind
```

### Step 3: Apply Philosophy (Phase 1)

Load and apply Vercel design principles:

```
## Phase 1: Design Philosophy

Applying Vercel guidelines to [context]...

Key principles for this work:
- [Relevant principle 1]
- [Relevant principle 2]
- [Relevant principle 3]

Suggested improvements:
1. [Improvement based on philosophy]
```

**Checkpoint (quick):** "Philosophy applied. Continue to constraints? (Y/n)"

### Step 4: Apply Constraints (Phase 2)

Check against technical constraints:

```
## Phase 2: Technical Constraints

Checking against [constraint set] rules...

Violations found: X
- Line Y: [violation]
- Line Z: [violation]

Auto-fixing safe violations...
- Line Y: [fixed]

Remaining issues needing review: X
```

**Checkpoint (quick):** "Constraints checked. Run review? (Y/n)"

### Step 5: Run Review (Phase 3)

Execute accessibility and design review:

```
## Phase 3: Accessibility Review

Running [rams CLI / manual checklist]...

Score: XX/100
Critical: X | Serious: X | Moderate: X | Minor: X

Top issues:
1. [Issue 1] - Line X
2. [Issue 2] - Line Y
```

### Step 6: Summary & Next Actions

```
## Full Loop Complete

| Phase | Status |
|-------|--------|
| Philosophy | Applied |
| Constraints | X violations (Y fixed) |
| Review | Score: XX/100 |

### Remaining Actions
1. [ ] Fix [issue 1]
2. [ ] Fix [issue 2]
3. [ ] Re-run review to verify

### Quick Commands
- `/ui philosophy` - Revisit design principles
- `/ui constraints` - Re-check technical rules
- `/ui review` - Re-run accessibility review
```

---

## Quick Help (No Context)

When no context is detected:

```
## UI Skill

Frontend development system: Philosophy -> Constraints -> Verification

**Detected Stack:** [Framework] or "No project detected"

### Commands
| Command | Purpose |
|---------|---------|
| `/ui` | Apply all (in component context) |
| `/ui philosophy` | Design principles |
| `/ui constraints` | Technical rules |
| `/ui review <file>` | Accessibility review |

### Design Agent
For full design-implement-verify loop with mockups:
```
/agents design "Create a [component description]"
```

### Resources
- Philosophy.md - Vercel design guidelines
- Constraints.md - ui-skills.com rules
- ReviewChecklist.md - Manual review checklist
```

---

## Voice Notification

On completion:
```
curl -s -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Full UI loop complete. Review score: XX of 100"}'
```

---

## Checkpoint Behavior

**Default (quick):**
- One-line prompts
- Auto-continue on Enter
- Stop on 'n'

**Verbose mode (`--verbose`):**
- Full context at each checkpoint
- Show alternatives considered
- Detailed rationale for suggestions

To enable verbose:
```
/ui full --verbose
```
