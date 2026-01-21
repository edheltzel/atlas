# Apply Constraints Workflow

Load technical constraints and validate current code.

---

## Trigger

- User says "constraints", "technical", "how", "rules"
- User asks about implementation details or best practices

## Execution

### Step 1: Detect Stack

Run stack detection to determine constraint set:

```bash
bun run $PAI_DIR/skills/UI/Tools/StackDetect.ts
```

Expected output:
```json
{
  "detected": "tailwind",
  "confidence": "high",
  "indicators": ["tailwindcss in dependencies", "tailwind.config.ts exists"]
}
```

### Step 2: Load Constraint Set

Based on detection, load from `Data/ConstraintSets.yaml`:

| Detection | Constraint Set |
|-----------|----------------|
| tailwindcss | `tailwind` |
| *.module.css | `css-modules` |
| styled-components | `styled-components` |
| No framework | `vanilla-css` |
| Unknown | `universal` |

### Step 3: Scan for Violations

Check current code against loaded constraints:

**Tailwind-specific checks:**
```
- h-screen usage (should be h-dvh)
- Animated layout properties
- Missing text-balance on headings
- Missing tabular-nums on data
- Arbitrary z-index values
- w-X h-X instead of size-X
```

**Universal checks:**
```
- Animated width/height/margin/padding
- Animation duration > 200ms for feedback
- Missing prefers-reduced-motion
- useEffect for derived state
```

### Step 4: Report Violations

Format violations with line numbers and fixes:

```
## Constraint Violations Found

| Line | Violation | Rule | Fix |
|------|-----------|------|-----|
| 24 | h-screen | Use h-dvh | Replace with h-dvh |
| 45 | animate-height | Compositor only | Use transform/opacity |
| 67 | z-[999] | Fixed scale | Use z-50 |
```

### Step 5: Auto-Fix Safe Violations

For safe auto-fixes (from ConstraintSets.yaml):

```bash
# Preview changes
echo "Auto-fixing safe violations:"
echo "- Line 24: h-screen -> h-dvh"
echo "- Line 67: z-[999] -> z-50"

# Apply with user confirmation
```

---

## Voice Notification

On completion:
```
curl -s -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Constraint check complete. Found X violations, Y auto-fixable"}'
```

---

## Output Format

```
## Constraint Check: [File/Component]

**Stack Detected:** [Framework]
**Constraint Set:** [Set name]

### Violations

| Line | Issue | Severity | Auto-Fix |
|------|-------|----------|----------|
| [#] | [Description] | [Critical/Serious/Moderate/Minor] | [Yes/No] |

### Auto-Fixable (Safe)
The following will be automatically applied:
- [ ] Line X: [change]
- [ ] Line Y: [change]

### Requires Review
The following need your decision:
- [ ] Line Z: [change] - Reason: [why approval needed]

### Summary
- Total violations: X
- Auto-fixable: Y
- Need review: Z
```
