# Vercel Web Interface Guidelines

Source: [vercel.com/design/guidelines](https://vercel.com/design/guidelines) | Updated: January 2026

---

## Core Philosophy

"Interfaces succeed because of hundreds of choices." These guidelines cover interactions, animations, layout, content, forms, performance, and design.

---

## Interactions

### Keyboard Accessibility
- All flows must work via keyboard
- Follow WAI-ARIA patterns
- Visible focus rings (`:focus-visible` preferred over `:focus`)
- Set `:focus-within` for grouped controls
- Focus traps for modals
- Proper focus restoration after dialogs close

### Hit Targets
- Visual targets under 24px should expand to 24px minimum
- 44px minimum on mobile/touch devices
- No dead zones: if part of a control looks interactive, it should be interactive

### Mobile Inputs
- Font size 16px minimum to prevent iOS auto-zoom
- Respect browser zoom entirely (never disable)
- Hydration-safe inputs: must not lose focus or value after hydration

### Input Behavior
- **Never disable paste** in `<input>` or `<textarea>`
- Loading buttons: show indicator while keeping original label
- Minimum loading-state duration: 150-300ms show-delay, 300-500ms minimum visible time

### State & Navigation
- URL as state: enables sharing, refresh, and Back/Forward navigation
- Deep-link everything: filters, tabs, pagination, expanded panels, `useState`
- Scroll positions persist on Back/Forward
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
touch-action: manipulation;        /* Prevent double-tap zoom */
-webkit-tap-highlight-color: intentional-color;
```

### Tooltips & Overlays
- Delay first tooltip in a group; subsequent peers have no delay
- Set `overscroll-behavior: contain` for modals/drawers

### Autofocus
- Desktop screens with single primary input should autofocus
- Rarely autofocus on mobile due to keyboard-induced layout shift

### Links & Navigation
- Use `<a>` or `<Link>` for navigation (enables Cmd/Ctrl+Click, middle-click, right-click)
- Ellipsis for further input & loading: "Rename...", "Loading...", "Saving..."

### Drag Interactions
- Disable text selection and apply `inert` while an element is dragged

### Announcements
- Use polite `aria-live` for toasts and inline validation

### Keyboard Shortcuts
- Internationalize for non-QWERTY layouts
- Show platform-specific symbols

---

## Animations

### Motion Preferences
```css
@media (prefers-reduced-motion: reduce) {
  /* Provide reduced variants */
}
```

### Implementation Preference (in order)
1. CSS Transitions/Animations
2. Web Animations API
3. JavaScript libraries (motion/react)

### GPU-Accelerated Properties ONLY
**Allowed:**
- `transform`
- `opacity`

**Avoid (causes layout):**
- `width`, `height`
- `top`, `left`, `right`, `bottom`
- `margin`, `padding`

### Animation Rules
- Only animate when clarifying cause/effect or adding deliberate delight
- Animations must be interruptible
- Input-driven (no autoplay)
- Maximum duration: 200ms for UI interactions
- Correct transform origin: anchor motion to where it "physically" starts

### Transition Syntax
```css
/* WRONG */
transition: all 0.3s;

/* CORRECT - explicitly list properties */
transition: transform 150ms ease-out, opacity 150ms ease-out;
```

### Easing
- Choose easing based on what changes (size, distance, trigger)

### SVG Transforms
- Apply CSS transforms/animations to `<g>` wrappers
- Set `transform-box: fill-box; transform-origin: center;` to avoid Safari bugs

---

## Layout & Content

### Optical Alignment
- Optical alignment beats geometry
- Adjust ±1px when perception requires it
- Every element aligns intentionally (grid, baseline, edge, or optical center)

### Balance
- When text and icons sit side-by-side, adjust weight, size, spacing, or color to prevent clashing

### Responsive Coverage
- Verify on mobile, laptop, and ultra-wide
- Zoom out to 50% for ultra-wide simulation

### Safe Areas
- Account for notches and insets with safe-area CSS variables
```css
padding-bottom: env(safe-area-inset-bottom);
```

### Scrollbars
- Render only useful scrollbars
- Fix overflow issues to prevent unwanted scrollbars

### CSS Over JS
- Let the browser size things
- Prefer flex/grid/intrinsic layout over JS measurement
- Avoid layout thrash by letting CSS handle flow, wrapping, and alignment

### Skeleton Loading
- Stable skeletons mirror final content exactly
- Prevent layout shift (CLS)

### Design All States
- Empty state
- Sparse state (few items)
- Dense state (many items)
- Error state
- Loading state

### Typography
- Curly quotes: ' ' " " (not ' ' " ")
- Tabular numbers for data columns: `font-variant-numeric: tabular-nums`
- Proper ellipsis character: … (not ...)
- Avoid widows/orphans
- Handle user-generated content across length variations
- Use non-breaking spaces for glued terms: "10&nbsp;MB"

### Anchored Headings
- Set `scroll-margin-top` for headers when linking to sections

---

## Forms

### Submit Behavior
- Enter key submits single-control forms
- Cmd/Ctrl+Enter in textareas

### Labels
- Every control needs a `<label>` associated
- Use `for` attribute or wrap input in label
- Clicking label focuses the associated control

### Validation
- Show errors next to fields
- Focus first error on submit
- Don't block typing validate and provide feedback instead
- Don't pre-disable submit buttons; allow submitting incomplete forms to surface validation
- Trim input values (handle text replacements adding whitespace)

### Autofill
- Meaningful `name` attributes
- Proper `autocomplete` values
- Password manager compatibility
- 2FA compatibility
- Don't trigger password managers for non-auth fields: use `autocomplete="off"` or specific tokens

### Input Types
- Correct `type` and `inputmode` for better keyboards
- Disable spellcheck for emails, codes, usernames

### Placeholders
- End with ellipsis to signal emptiness
- Use example value or pattern: "+1 (123) 456-7890", "sk-012345679..."

### Unsaved Changes
- Warn before navigation when data could be lost

### Platform-Specific
- Windows `<select>`: explicitly set `background-color` and `color` for dark mode

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

### Hidden Decoration
- `aria-hidden="true"` for decorative elements
- Don't ship the schema: visual layouts may omit visible labels, but accessible names exist

### Locale Awareness
- Format dates, times, currencies per locale
- Prefer `Accept-Language` header and `navigator.languages` over IP/GPS

### Brand Resources
- Right-click nav logo to surface brand assets

---

## Performance

### Testing
- Test on iOS Low Power Mode
- Test on macOS Safari
- Test with throttled network and CPU
- Disable extensions that add overhead

### Rendering
- Minimize re-renders
- Track with React DevTools or React Scan
- Make re-renders fast when they occur

### Lists
- Virtualize large lists (virtua library)
- Or use `content-visibility: auto`

### Inputs
- Prefer uncontrolled inputs (lower keystroke cost)
- Make controlled loops cheap

### Network
- Latency budget: POST/PATCH/DELETE under 500ms
- Lazy-load non-critical images
- Preload fonts for critical text
- Preconnect to asset origins

### Layout
- Batch reads/writes
- Avoid unnecessary reflows/repaints
- Set explicit image dimensions (no CLS)
- Move expensive work to Web Workers

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
- Child border-radius ≤ parent border-radius
- Concentric alignment for nested elements

### Colors
- Hue consistency on non-neutral backgrounds
- APCA preferred over WCAG 2 for perceptual contrast
- Interactions increase contrast: `:hover`, `:active`, `:focus`
- Color-blind-friendly palettes for charts

### Browser Integration
```html
<meta name="theme-color" content="#ffffff">
```
```css
html { color-scheme: dark; } /* For proper scrollbar contrast */
```

### Anti-Aliasing
- Scaling text can change smoothing
- Prefer animating a wrapper instead of text
- Use `translateZ(0)` or `will-change: transform` if artifacts persist

### Gradients
- Avoid gradient banding: use background images instead of CSS masks for dark fades

---

## Copywriting

### Voice
- Active voice: "Install the CLI" not "The CLI will be installed"
- Action-oriented, second-person language
- Error messages guide solutions, not just state problems

### Formatting
- Title Case for headings/buttons (Chicago style)
- Sentence case on marketing pages
- Prefer `&` over "and"
- Use numerals for counts: "8 deployments" not "eight deployments"
- Separate numbers from units with non-breaking space: "10 MB" not "10MB"
- Consistent currency: 0 or 2 decimal places, never mix

### Labels
- Specific and clear
- Avoid ambiguity like "Continue" (continue what?)
- "Save API Key" not "Continue"

### Placeholders
- Strings: `YOUR_API_TOKEN_HERE`
- Numbers: `0123456789`

### Positive Framing
- Default to positive language even for errors
- "Something went wrong—try again or contact support" not "Your deployment failed"

---

## Agent Integration

For AI coding assistants, Vercel provides:

- `/web-interface-guidelines` command for reviewing UI code
- Supports: Claude Code, Cursor, Windsurf, Gemini CLI, OpenCode, Antigravity
- Add AGENTS.md to your project so agents apply these guidelines during generation

---

## Review Checklist

When reviewing UI code against Vercel guidelines:

### Interactions
- [ ] Keyboard accessible (WAI-ARIA patterns)
- [ ] Visible focus rings (`:focus-visible`)
- [ ] Hit targets ≥24px (44px mobile)
- [ ] Input font ≥16px on mobile
- [ ] Never blocks paste
- [ ] URL-based state where appropriate
- [ ] Destructive actions have confirmation or undo

### Animations
- [ ] Respects `prefers-reduced-motion`
- [ ] Uses only `transform` and `opacity`
- [ ] Duration ≤200ms for UI interactions
- [ ] No `transition: all`
- [ ] Animations are interruptible

### Layout
- [ ] Optical alignment over geometric
- [ ] All states designed (empty, sparse, dense, error, loading)
- [ ] Skeleton loaders match content structure
- [ ] Safe areas respected

### Forms
- [ ] Every control has a label
- [ ] Errors shown next to fields
- [ ] Proper autocomplete values
- [ ] Enter submits single-control forms

### Performance
- [ ] Tested on iOS Low Power Mode
- [ ] Re-renders minimized
- [ ] Large lists virtualized
- [ ] Images have explicit dimensions
- [ ] Fonts preloaded

### Design
- [ ] Layered shadows (ambient + direct)
- [ ] Border radius follows parent/child rule
- [ ] Theme color set appropriately
- [ ] Color-blind-friendly charts
