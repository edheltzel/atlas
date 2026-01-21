# Review Workflow

Run accessibility and design review using rams CLI or manual checklist.

---

## Trigger

- User says "review", "verify", "check", "audit"
- User provides a file path: `/ui review src/components/Button.tsx`

## Execution

### Step 1: Determine Target

Parse target from user input or use current context:

```bash
TARGET="${1:-$(current_file)}"
```

### Step 2: Check for rams CLI

```bash
if command -v rams &> /dev/null; then
  echo "rams CLI available - using automated review"
  REVIEW_MODE="automated"
else
  echo "rams CLI not found - using manual checklist"
  REVIEW_MODE="manual"
fi
```

### Step 3a: Automated Review (rams available)

```bash
# Run rams review
rams "$TARGET" --format json > /tmp/rams-review.json

# Parse results
SCORE=$(jq '.score' /tmp/rams-review.json)
CRITICAL=$(jq '.issues | map(select(.severity == "critical")) | length' /tmp/rams-review.json)
SERIOUS=$(jq '.issues | map(select(.severity == "serious")) | length' /tmp/rams-review.json)
```

### Step 3b: Manual Review (rams unavailable)

Load `ReviewChecklist.md` and evaluate manually:

**WCAG 2.1 Checks:**
- [ ] Images have alt text
- [ ] Buttons have accessible names
- [ ] Focus indicators visible
- [ ] Heading hierarchy correct

**Visual Design Checks:**
- [ ] Color contrast >= 4.5:1
- [ ] Component states defined
- [ ] Responsive at all breakpoints

**Technical Checks:**
- [ ] No h-screen (use h-dvh)
- [ ] Only transform/opacity animated
- [ ] prefers-reduced-motion respected

### Step 4: Calculate Score

**Scoring formula:**
```
Base: 100 points
- Critical issue: -15 points each
- Serious issue: -10 points each
- Moderate issue: -5 points each
- Minor issue: -2 points each
```

### Step 5: Generate Report

```markdown
## UI Review: Button.tsx

**Score:** 82/100
**Critical:** 0
**Serious:** 2
**Moderate:** 1

### Issues Found

| Issue | Line | Severity | Fix |
|-------|------|----------|-----|
| Missing aria-label on icon button | 24 | Serious | Add aria-label="Close" |
| Low contrast on disabled state | 45 | Serious | Use text-gray-500 instead of text-gray-300 |
| Missing text-balance on heading | 12 | Moderate | Add text-balance class |

### Auto-Fixable
- [ ] Line 12: Add text-balance

### Requires Approval
- [ ] Line 45: Color change (design decision)
```

### Step 6: Offer Auto-Fix

If auto-fixable issues exist:

```
Found 1 auto-fixable issue. Apply fix? (Y/n)
```

---

## Voice Notification

On completion:
```
curl -s -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Review complete. Score: 82 of 100. 2 serious issues found"}'
```

---

## Output Format

```
## UI Review: [Target]

**Score:** XX/100
**Review Mode:** [Automated (rams) / Manual Checklist]

### Summary
| Severity | Count |
|----------|-------|
| Critical | X |
| Serious | X |
| Moderate | X |
| Minor | X |

### Issues

[Table of issues with line numbers and fixes]

### Recommendations

1. [Priority fix 1]
2. [Priority fix 2]

### Next Steps
- [ ] Fix critical/serious issues
- [ ] Re-run review to verify
```

---

## rams Installation

If user wants automated review:

```bash
curl -fsSL https://rams.ai/install | bash
```

Then re-run `/ui review` for automated scoring.
