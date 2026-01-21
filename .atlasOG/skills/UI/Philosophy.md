# UI Design Philosophy

**Source:** Vercel Web Interface Guidelines

These principles guide design decisions and interaction patterns. Apply them to understand "why" behind UI choices.

---

## Interactions & Accessibility

### Keyboard Operability

- All flows must be keyboard-operable following WAI-ARIA Authoring Patterns
- Every focusable element requires a visible focus ring
- Prefer `:focus-visible` over `:focus` for cleaner mouse UX
- Maintain proper focus traps in modals and dialogs
- Manage focus movement according to accessibility patterns

### Touch Targets

| Context | Minimum Size |
|---------|--------------|
| Desktop | 24px |
| Mobile | 44px |

### Browser Behavior

- **Never** disable browser zoom
- **Never** block paste functionality
- Use `<a>` or `<Link>` for navigation, never buttons or divs with click handlers

### Mobile Considerations

- Input font size must be >=16px to prevent iOS auto-zoom
- Rarely autofocus on mobile (keyboard causes layout shifts)
- Use `touch-action: manipulation` to prevent double-tap zoom

---

## Animations

### Core Principles

- Honor `prefers-reduced-motion` with reduced-motion variants
- Animations clarify cause-and-effect or add intentional delight
- Animations must be interruptible by user input

### Performance

- Prioritize GPU-accelerated properties: `transform`, `opacity`
- Avoid layout-affecting properties: `width`, `height`, `margin`
- **Never** use `transition: all` - explicitly list properties

### SVG Animation

- Apply transforms to `<g>` wrappers
- Use `transform-box: fill-box` for proper origin

---

## Forms

### Labels & Structure

- Every control needs an associated `<label>`
- Show errors adjacent to fields, not in toasts
- Focus the first error on form submit

### Submission Behavior

- Enter key submits single-input forms
- Cmd/Ctrl+Enter submits in textareas
- Keep submit buttons enabled until submission begins
- Show spinner during submission
- Use idempotency keys for safety

### Input Handling

- Allow any input; validate server-side
- Never block keystrokes
- Set proper `autocomplete` attributes
- Use meaningful `name` values
- `spellcheck="false"` for emails, codes, usernames

---

## Layout

### Alignment Principles

- **Optical alignment > geometric precision** - adjust 1px when perception beats geometry
- Every element should intentionally align with grids, baselines, edges, or centers
- Balance contrast between text and adjacent icons through weight/size/color

### Responsive Testing

Test at three breakpoints:
1. Mobile (portrait)
2. Laptop (standard)
3. Ultra-wide (simulate with 50% zoom)

### Safe Areas

- Respect safe areas via CSS `env()` variables for notched devices
- Example: `padding-bottom: env(safe-area-inset-bottom)`

### Layout Methods

- Prefer flexbox/grid over JavaScript measurements
- Avoid layout thrash from DOM reads triggering reflows

---

## Content & Copywriting

### Voice & Tone

- Use active voice
- Action-oriented language
- Frame errors positively - guide users toward solutions

### Capitalization

| Element | Style | Example |
|---------|-------|---------|
| Headings | Title Case | "Create New Project" |
| Buttons | Title Case | "Save Changes" |
| Marketing | Sentence case | "Build amazing things" |

### Formatting

- Prefer `&` over "and"
- Use numerals for counts: "3 items" not "three items"
- Separate numbers and units with non-breaking space: "10 MB"

### Help & Labels

- Include inline help
- Use tooltips as last resort
- Icons must have text labels for assistive technology
- Use semantic HTML before ARIA attributes

---

## Performance

### Response Times

- POST/PATCH/DELETE operations: <500ms
- Provide immediate visual feedback for longer operations

### Rendering

- Minimize re-renders (use React DevTools or React Scan)
- Virtualize large lists (virtua, react-window)
- Use skeletons that match final content dimensions

### Images

- Preload above-the-fold images only
- Lazy-load the rest
- Set explicit dimensions to prevent CLS

### Fonts & Assets

- Preconnect to critical asset domains: `<link rel="preconnect">`
- Subset fonts via unicode-range
- Limit variable axis usage

### Threading

- Offload expensive tasks to Web Workers
- Never block the main thread with heavy computation

---

## URL & State

### Shareable State

- Persist meaningful state in URLs when appropriate
- Use query params for filters, sorts, pagination
- Maintain URL stability for bookmarking

### Navigation

- Use semantic navigation: `<a>`, `<Link>`
- Avoid JavaScript-only navigation for content pages
- Support browser back/forward
