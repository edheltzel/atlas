# Apply Philosophy Workflow

Load Vercel design philosophy and apply to current work.

---

## Trigger

- User says "philosophy", "design thinking", "why", "principles"
- User asks about design decisions or patterns

## Execution

### Step 1: Load Philosophy Context

Read `Philosophy.md` to load design principles:

- Interactions & Accessibility
- Animations
- Forms
- Layout
- Content & Copywriting
- Performance

### Step 2: Analyze Current Context

Determine what the user is working on:

| Context | Focus Area |
|---------|------------|
| Component file | Interactions, accessibility, states |
| Form component | Form principles, validation, labels |
| Animation work | Animation principles, reduced-motion |
| Layout work | Alignment, responsive, safe areas |
| Copy/content | Voice, tone, capitalization |

### Step 3: Apply Relevant Principles

For the identified context, provide guidance from Philosophy.md:

**Example for a Button component:**
```
Applying Vercel Design Philosophy:

INTERACTIONS:
- Ensure button is focusable with visible focus ring
- Touch target >= 24px (44px on mobile)
- Use :focus-visible over :focus

ACCESSIBILITY:
- If icon-only, add aria-label
- Use <button> element, not div with onClick

STATES:
- Define hover, focus, active, disabled states
- Provide visual feedback within 200ms
```

### Step 4: Suggest Improvements

List specific actionable improvements based on philosophy:

```
Suggested Improvements:
1. Add :focus-visible styling for keyboard users
2. Increase padding to meet 44px mobile touch target
3. Add aria-label for icon-only variant
```

---

## Voice Notification

On completion:
```
curl -s -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Design philosophy applied to current context"}'
```

---

## Output Format

```
## Philosophy Review: [Context/Component]

### Principles Applied
- [Principle 1]: [How it applies]
- [Principle 2]: [How it applies]

### Current Status
- [What's already good]

### Suggested Improvements
1. [Specific improvement with rationale]
2. [Specific improvement with rationale]

### Reference
See Philosophy.md for full guidelines.
```
