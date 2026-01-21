# Vercel Web Interface Guidelines

Source: [vercel.com/design/guidelines](https://vercel.com/design/guidelines)

---

## Core Philosophy

"Interfaces succeed because of hundreds of choices." These guidelines cover interactions, animations, layout, content, forms, performance, and design.

---

## Interactions

### Keyboard Accessibility
- All flows must work via keyboard
- Follow WAI-ARIA patterns
- Visible focus rings (`:focus-visible` preferred)
- Focus traps for modals
- Proper focus restoration after dialogs close

### Hit Targets
- Visual targets under 24px should expand to 24px minimum
- 44px minimum on mobile/touch devices

### Mobile Inputs
- Font size 16px minimum to prevent iOS auto-zoom
- Respect browser zoom entirely (never disable)

### State Persistence
- URL-based state enables sharing, refresh, and navigation
- User should be able to share their current view

### Optimistic Updates
- Update UI immediately on likely success
- Reconcile with server response
- Show loading states for uncertain operations

### Destructive Actions
- Require confirmation OR provide undo
- Safe recovery window for mistakes
- Never auto-execute destructive operations

### Touch Optimization
```css
touch-action: manipulation;
-webkit-tap-highlight-color: intentional-color;
```

---

## Animations

### Motion Preferences
```css
@media (prefers-reduced-motion: reduce) {
  /* Provide reduced variants */
}
```

### GPU-Accelerated Properties ONLY
**Allowed:**
- `transform`
- `opacity`

**Avoid (causes layout):**
- `width`, `height`
- `top`, `left`, `right`, `bottom`
- `margin`, `padding`

### Animation Rules
- Animate only when clarifying cause/effect or adding deliberate delight
- Animations must be interruptible
- Input-driven (no autoplay)
- Maximum duration: 200ms for UI interactions

### Transition Syntax
```css
/* WRONG */
transition: all 0.3s;

/* CORRECT */
transition: transform 150ms ease-out, opacity 150ms ease-out;
```

---

## Layout & Content

### Optical Alignment
- Optical alignment beats geometry
- Adjust 1px when perception requires it
- Every element aligns intentionally

### Skeleton Loading
- Stable skeletons mirror final content
- Prevent layout shift (CLS)

### Design All States
- Empty state
- Sparse state (few items)
- Dense state (many items)
- Error state
- Loading state

### Typography
- Curly quotes: ' ' " " (not ' ' " ")
- Tabular numbers for data columns
- Proper ellipsis character: (not ...)
- Avoid widows/orphans
- Handle user-generated content across length variations

---

## Forms

### Submit Behavior
- Enter key submits single-control forms
- Cmd/Ctrl+Enter in textareas

### Labels
- Every control needs a `<label>` associated
- Use `for` attribute or wrap input in label

### Validation
- Show errors next to fields
- Focus first error on submit
- Don't block typing validate and provide feedback instead
- Don't pre-disable submit buttons

### Autofill
- Meaningful `name` attributes
- Proper `autocomplete` values
- Password manager compatibility
- 2FA compatibility

---

## Content Accessibility

### Help Text
- Inline help preferred
- Tooltips as last resort

### Page Titles
- Accurate titles reflecting current context
- Update on navigation

### Icons
- Icons need labels
- Convey meaning for non-sighted users
- `aria-label` for icon-only buttons

### Semantic HTML
- Use semantic HTML before ARIA
- Hierarchical headings (h1 > h2 > h3)
- "Skip to content" link

### Locale Awareness
- Format dates, times, currencies per locale
- Respect `Accept-Language` header

---

## Performance

### Testing
- Test on iOS Low Power Mode
- Test on macOS Safari
- Test with throttled network

### Rendering
- Minimize re-renders
- Track with React DevTools or React Scan
- Virtualize large lists

### Network
- Latency budget: POST/PATCH/DELETE under 500ms
- Lazy-load non-critical images
- Preload fonts for critical text
- Preconnect to asset origins

### Main Thread
- Move expensive work to Web Workers
- Avoid main-thread blocking
- Set explicit image dimensions

---

## Design Details

### Shadows
- Layered shadows mimicking ambient + direct light
- Minimum two shadow layers
```css
box-shadow:
  0 1px 2px rgba(0,0,0,0.05),  /* ambient */
  0 4px 8px rgba(0,0,0,0.10);  /* direct */
```

### Borders
- Semi-transparent borders improve edge clarity
```css
border: 1px solid rgba(0,0,0,0.1);
```

### Border Radius
- Child border-radius parent border-radius
- Concentric alignment for nested elements

### Colors
- Hue consistency on non-neutral backgrounds
- APCA preferred over WCAG 2 for perceptual contrast
- Interactions increase contrast: `:hover`, `:active`, `:focus`

### Browser Integration
```html
<meta name="theme-color" content="#ffffff">
```
```css
html { color-scheme: dark; }
```

---

## Copywriting

### Voice
- Active voice: "Install the CLI" not "The CLI will be installed"
- Action-oriented, second-person language
- Error messages guide solutions, not just state problems

### Formatting
- Title Case for headings/buttons (Chicago style)
- Sentence case on marketing
- Prefer `&` over "and"
- Use numerals for counts
- Separate numbers from units with non-breaking space

### Labels
- Specific and clear
- Avoid ambiguity like "Continue" (continue what?)
