# Fixing Accessibility

Source: [ui-skills.com/skills/fixing-accessibility](https://www.ui-skills.com/skills/fixing-accessibility) | Updated: January 2026

---

## Overview

This skill helps fix accessibility issues in UI code. Invoke with `/fixing-accessibility` to apply constraints or `/fixing-accessibility <file>` to review specific files.

**Priority Order:** Address critical issues first, then work down the priority list.

---

## Priority 1: Accessible Names (Critical)

Every interactive control must have an accessible name.

### Rules
- Icon-only buttons require `aria-label` or `aria-labelledby`
- All inputs, selects, and textareas must be labeled
- Links need meaningful text content
- Decorative icons should use `aria-hidden="true"`

### Examples
```tsx
// CORRECT - icon button with label
<button aria-label="Close dialog">
  <XIcon aria-hidden="true" />
</button>

// CORRECT - input with label
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// WRONG - no accessible name
<button><XIcon /></button>
<input type="email" />
```

---

## Priority 2: Keyboard Access (Critical)

All interactive elements must be keyboard accessible.

### Rules
- Never use `div` or `span` as buttons without full keyboard support
- All interactive elements must be Tab-reachable
- Focus visibility required for keyboard users
- Avoid `tabindex` values greater than 0
- Escape key should close dialogs or overlays

### Examples
```tsx
// CORRECT - native button
<button onClick={handleClick}>Submit</button>

// WRONG - div as button (missing keyboard support)
<div onClick={handleClick}>Submit</div>

// If you must use a div, add full keyboard support:
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
>
  Submit
</div>
```

---

## Priority 3: Focus and Dialogs (Critical)

Modal dialogs require proper focus management.

### Rules
- Modals must trap focus during display
- Return focus to the trigger element on close
- Set initial focus inside dialog components
- Prevent unexpected page scrolling when opening dialogs

### Examples
```tsx
// CORRECT - using Radix Dialog (handles focus automatically)
<Dialog.Root>
  <Dialog.Trigger asChild>
    <button>Open</button>
  </Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content>
      <Dialog.Title>Dialog Title</Dialog.Title>
      {/* Focus trapped here, returned on close */}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

---

## Priority 4: Semantics (High)

Use semantic HTML correctly.

### Rules
- Prefer native HTML elements over role-based alternatives
- Required ARIA attributes must accompany any role usage
- Lists use `ul`/`ol` with `li` children
- Don't skip heading hierarchy levels (h1 > h2 > h3, not h1 > h3)
- Tables use `th` for header cells

### Examples
```tsx
// CORRECT - semantic structure
<nav>
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/about">About</a></li>
  </ul>
</nav>

<article>
  <h1>Main Title</h1>
  <section>
    <h2>Section Title</h2>
    <h3>Subsection</h3>
  </section>
</article>

// WRONG - skipped heading level
<h1>Title</h1>
<h3>Should be h2</h3>
```

---

## Priority 5: Forms and Errors (High)

Form errors must be properly associated and announced.

### Rules
- Link error messages to fields via `aria-describedby`
- Announce required fields with `aria-required="true"`
- Set `aria-invalid="true"` on invalid fields
- Associate helper text with inputs
- Explain why submit actions are disabled

### Examples
```tsx
// CORRECT - error linked to field
<label htmlFor="email">Email</label>
<input
  id="email"
  type="email"
  aria-invalid={hasError}
  aria-describedby={hasError ? "email-error" : undefined}
/>
{hasError && (
  <span id="email-error" role="alert">
    Please enter a valid email address
  </span>
)}

// CORRECT - required field
<label htmlFor="name">
  Name <span aria-hidden="true">*</span>
</label>
<input id="name" aria-required="true" />
```

---

## Priority 6: Announcements (Medium-High)

Dynamic content changes must be announced to screen readers.

### Rules
- Critical form errors should use `aria-live="polite"` or `role="alert"`
- Loading states need `aria-busy="true"` or status text
- Toasts shouldn't be the sole method for critical information
- Expandable controls require `aria-expanded` and `aria-controls`

### Examples
```tsx
// CORRECT - live region for updates
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>

// CORRECT - expandable control
<button
  aria-expanded={isOpen}
  aria-controls="panel-content"
  onClick={() => setIsOpen(!isOpen)}
>
  {isOpen ? 'Collapse' : 'Expand'}
</button>
<div id="panel-content" hidden={!isOpen}>
  Panel content here
</div>

// CORRECT - loading state
<div aria-busy={isLoading}>
  {isLoading ? <Spinner /> : <Content />}
</div>
```

---

## Priority 7: Contrast and States (Medium)

Visual states must be perceivable by all users.

### Rules
- Maintain sufficient contrast for text and icons (WCAG AA minimum)
- Provide keyboard alternatives for hover-only interactions
- Don't rely on color alone for disabled states
- Replace focus outlines only with visible alternatives

### Examples
```tsx
// CORRECT - disabled state with multiple cues
<button
  disabled
  className="opacity-50 cursor-not-allowed"
  aria-disabled="true"
>
  Submit (requires selection)
</button>

// CORRECT - visible focus ring
<button className="focus-visible:ring-2 focus-visible:ring-blue-500">
  Click me
</button>
```

---

## Priority 8: Media and Motion (Low-Medium)

Media content must be accessible and motion must be safe.

### Rules
- Images need appropriate alt text (meaningful or empty string for decorative)
- Videos with speech should include captions
- Respect `prefers-reduced-motion` for non-essential animations
- Avoid auto-playing sound media

### Examples
```tsx
// CORRECT - meaningful alt text
<img src="chart.png" alt="Sales increased 25% in Q4 2024" />

// CORRECT - decorative image
<img src="decorative-border.png" alt="" />

// CORRECT - reduced motion
<motion.div
  animate={{ opacity: 1 }}
  transition={{
    duration: prefersReducedMotion ? 0 : 0.15
  }}
/>
```

---

## Priority 9: Tool Boundaries (Critical)

When fixing accessibility issues, maintain focus and minimize changes.

### Rules
- Make minimal, targeted changes
- Use native semantics before adding ARIA
- Don't refactor unrelated code
- Avoid library migrations unless explicitly requested

---

## Review Approach

When reviewing code for accessibility:

1. **Address critical issues first** (Priorities 1-3)
2. **Quote exact problematic code**
3. **Explain the failure** (what accessibility barrier it creates)
4. **Propose minimal fixes** (smallest change that resolves the issue)

### Quick Audit Checklist

- [ ] All interactive elements have accessible names
- [ ] All interactive elements are keyboard accessible
- [ ] Modals trap focus and return it on close
- [ ] Heading hierarchy is correct (no skipped levels)
- [ ] Form errors are linked to fields
- [ ] Dynamic updates are announced
- [ ] Sufficient color contrast
- [ ] Images have appropriate alt text
- [ ] Motion respects user preferences
