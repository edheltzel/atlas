# Accessibility Workflow

Fix accessibility issues in UI code using the fixing-accessibility skill.

## When to Use

- "Fix accessibility"
- "A11y audit"
- "Check accessibility"
- "Make this accessible"
- "Screen reader support"

## Execution Steps

### 1. Load Reference
Read `FixingAccessibility.md` for the 9-priority rule system.

### 2. Identify Scope
Determine what to audit:
- Specific component(s)
- Page or section
- Entire codebase

### 3. Audit by Priority

**Critical (fix first):**
1. **Accessible Names** - Every interactive element has a name
2. **Keyboard Access** - All elements are keyboard accessible
3. **Focus & Dialogs** - Modals trap focus, return it on close

**High:**
4. **Semantics** - Correct HTML elements, heading hierarchy
5. **Forms & Errors** - Errors linked to fields, required states

**Medium-High:**
6. **Announcements** - Dynamic updates use aria-live

**Medium:**
7. **Contrast & States** - Sufficient contrast, visible states

**Low-Medium:**
8. **Media & Motion** - Alt text, reduced motion

**Critical (always):**
9. **Tool Boundaries** - Minimal changes, no scope creep

### 4. Report Issues

For each issue found:
1. Quote the exact problematic code
2. Explain what accessibility barrier it creates
3. Propose the minimal fix
4. Note the priority level

### 5. Apply Fixes

- Make minimal, targeted changes
- Use native semantics before ARIA
- Don't refactor unrelated code
- Test with keyboard navigation

## Output Format

```markdown
## Accessibility Audit Results

### Critical Issues

#### [Issue Name]
**Priority:** 1 - Accessible Names
**File:** `path/to/file.tsx`
**Code:**
```tsx
// Current
<button><XIcon /></button>
```

**Problem:** Icon-only button has no accessible name.

**Fix:**
```tsx
<button aria-label="Close dialog">
  <XIcon aria-hidden="true" />
</button>
```

---

### High Priority Issues
...

### Summary
- Critical: X issues
- High: X issues
- Medium: X issues
- Low: X issues
```

## Quick Checklist

Before finishing, verify:

- [ ] All interactive elements have accessible names
- [ ] All interactive elements are keyboard accessible
- [ ] Modals trap focus and return it on close
- [ ] Heading hierarchy is correct (no skipped levels)
- [ ] Form errors are linked to fields via aria-describedby
- [ ] Dynamic updates are announced (aria-live)
- [ ] Sufficient color contrast
- [ ] Images have appropriate alt text
- [ ] Motion respects prefers-reduced-motion
