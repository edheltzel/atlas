# UI Review Checklist

Manual accessibility and design review when rams CLI is unavailable.

---

## WCAG 2.1 Accessibility

### Images & Media

- [ ] All images have `alt` text (or `alt=""` for decorative)
- [ ] Complex images have extended descriptions
- [ ] Videos have captions/transcripts

### Interactive Elements

- [ ] All buttons have accessible names
- [ ] Icon-only buttons have `aria-label`
- [ ] Links have descriptive text (not "click here")
- [ ] Custom controls use proper ARIA roles

### Keyboard Navigation

- [ ] All interactive elements are focusable
- [ ] Focus order is logical
- [ ] Focus indicators are visible
- [ ] No keyboard traps (except intentional modals)

### Forms

- [ ] All inputs have associated labels
- [ ] Required fields are indicated
- [ ] Error messages are associated with fields
- [ ] Autocomplete attributes are set

### Structure

- [ ] Heading hierarchy is correct (h1 -> h2 -> h3)
- [ ] Landmarks are used (`main`, `nav`, `footer`)
- [ ] Skip links available for repeated content
- [ ] Language is set (`lang` attribute)

---

## Visual Design

### Color Contrast

| Element | Minimum Ratio |
|---------|---------------|
| Normal text | 4.5:1 |
| Large text (18px+ or 14px+ bold) | 3:1 |
| UI components | 3:1 |

### Component States

- [ ] Hover state defined
- [ ] Focus state defined (visible ring)
- [ ] Active/pressed state defined
- [ ] Disabled state defined (if applicable)
- [ ] Loading state defined (if applicable)

### Responsive

- [ ] Mobile layout works (375px)
- [ ] Tablet layout works (768px)
- [ ] Desktop layout works (1280px)
- [ ] No horizontal scroll at any breakpoint

### Dark Mode (if applicable)

- [ ] Colors meet contrast in dark mode
- [ ] Images/icons visible in dark mode
- [ ] No harsh white elements

---

## Technical Constraints

### Tailwind (if using)

- [ ] No `h-screen` (use `h-dvh`)
- [ ] `text-balance` on headings
- [ ] `text-pretty` on body text
- [ ] `tabular-nums` on numeric data
- [ ] `size-*` for square elements
- [ ] Fixed z-index scale (no arbitrary values)

### Animation

- [ ] Only `transform`/`opacity` animated
- [ ] Duration <= 200ms for feedback
- [ ] `prefers-reduced-motion` respected
- [ ] No `transition: all`

### Performance

- [ ] No `useEffect` for derived state
- [ ] No `will-change` on static elements
- [ ] No animated backdrop-filter

---

## Scoring Guide

| Score | Meaning |
|-------|---------|
| 90-100 | Excellent - ship it |
| 80-89 | Good - minor issues |
| 70-79 | Fair - several issues to address |
| 60-69 | Poor - significant problems |
| <60 | Failing - major rework needed |

### Severity Weights

| Severity | Point Deduction | Examples |
|----------|-----------------|----------|
| Critical | -15 | Missing keyboard access, no focus indicators |
| Serious | -10 | Low contrast, missing alt text |
| Moderate | -5 | Heading hierarchy issues, missing states |
| Minor | -2 | Suboptimal Tailwind usage |

---

## Report Format

```
## UI Review: [Component/File Name]

**Score:** XX/100
**Critical Issues:** X
**Serious Issues:** X
**Moderate Issues:** X

### Issues Found

| Issue | Line | Severity | Fix |
|-------|------|----------|-----|
| [Description] | [Line #] | [Severity] | [Suggested fix] |

### Auto-Fixable

The following can be automatically applied:
- [ ] Issue 1
- [ ] Issue 2

### Requires Approval

The following need design decisions:
- [ ] Issue 3
- [ ] Issue 4
```

---

## rams CLI Integration

When rams CLI is available, run:

```bash
rams <file> --format json
```

Output integrates with this checklist for automated scoring.

### Installation

```bash
curl -fsSL https://rams.ai/install | bash
```

### Check Availability

```bash
command -v rams &> /dev/null && echo "rams available" || echo "using manual checklist"
```
