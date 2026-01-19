# UI Technical Constraints

**Source:** ui-skills.com

These rules enforce technical implementation standards. Apply them to know "how" to build correctly.

---

## Stack Requirements

### CSS Framework

- **MUST** use Tailwind CSS defaults unless custom values exist or are explicitly requested
- **MUST** use `cn` utility (`clsx` + `tailwind-merge`) for class logic

### Animation Libraries

| Use Case | Library |
|----------|---------|
| JavaScript animation | `motion/react` (formerly framer-motion) |
| Entrance/micro animations | `tw-animate-css` |

---

## Component Primitives

### Primitive Selection

Priority order when choosing accessible primitives:

1. Existing project primitives
2. Base UI
3. React Aria
4. Radix

### Rules

- **MUST** use accessible component primitives for anything with keyboard/focus behavior
- **NEVER** mix primitive systems within the same interaction surface
- **NEVER** rebuild keyboard or focus behavior by hand unless explicitly requested

### Icon Buttons

- **MUST** add `aria-label` to icon-only buttons

---

## Interaction Patterns

### Destructive Actions

- **MUST** use `AlertDialog` for destructive or irreversible actions

### Loading States

- **SHOULD** use structural skeletons for loading states
- Skeletons should match final content dimensions

### Fixed Elements

- **MUST** respect `safe-area-inset` for fixed elements
- Example: `pb-[env(safe-area-inset-bottom)]`

### Error Display

- **MUST** show errors next to where the action happens
- Never use toast-only error display for form validation

### Input Security

- **NEVER** block paste in `input` or `textarea` elements

### Viewport Height

- **NEVER** use `h-screen`
- **MUST** use `h-dvh` (dynamic viewport height)

---

## Animation Constraints

### Allowed Properties

Only animate compositor properties:

- `transform` (translate, scale, rotate)
- `opacity`

### Forbidden Properties

**NEVER** animate layout properties:

- `width`, `height`
- `top`, `left`, `right`, `bottom`
- `margin`, `padding`

### Paint Properties

**SHOULD** avoid animating (except for small, local UI):

- `background`
- `color`

### Timing

| Use Case | Max Duration |
|----------|--------------|
| Interaction feedback | 200ms |
| Entrance animations | 300ms |
| Complex transitions | 500ms |

### Easing

- **SHOULD** use `ease-out` for entrances
- **SHOULD** use `ease-in-out` for state changes

### Performance

- **MUST** pause looping animations when off-screen
- **SHOULD** respect `prefers-reduced-motion`
- **NEVER** animate large images or full-screen surfaces
- **NEVER** animate large `blur()` or `backdrop-filter` surfaces

### Will-Change

- **NEVER** apply `will-change` outside an active animation

### Necessity

- **NEVER** add animation unless explicitly requested

---

## Typography

### Text Wrapping

| Element | Class |
|---------|-------|
| Headings | `text-balance` |
| Body/paragraphs | `text-pretty` |

### Numeric Data

- **MUST** use `tabular-nums` for data tables, counters, prices

### Dense Layouts

- **SHOULD** use `truncate` or `line-clamp` for dense UI

### Letter Spacing

- **NEVER** modify `letter-spacing` (`tracking-*`) unless explicitly requested

---

## Layout

### Z-Index Scale

- **MUST** use a fixed z-index scale
- **NEVER** use arbitrary `z-*` values

Standard scale:
```
z-0:    Base content
z-10:   Elevated cards
z-20:   Dropdowns
z-30:   Fixed headers
z-40:   Modals
z-50:   Toasts/notifications
```

### Square Elements

- **SHOULD** use `size-*` for squares instead of `w-*` + `h-*`

---

## Performance

### Blur Effects

- **NEVER** animate large `blur()` or `backdrop-filter` surfaces

### Render Logic

- **NEVER** use `useEffect` for anything that can be expressed as render logic

### Examples

```tsx
// BAD: useEffect for derived state
const [fullName, setFullName] = useState('');
useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);

// GOOD: Compute during render
const fullName = `${firstName} ${lastName}`;
```

---

## Design Principles

### Gradients

- **NEVER** use gradients unless explicitly requested
- **NEVER** use purple or multicolor gradients

### Visual Affordances

- **NEVER** use glow effects as primary affordances

### Shadows

- **SHOULD** use Tailwind CSS default shadow scale unless explicitly requested

### Empty States

- **MUST** give empty states one clear next action

### Color Strategy

- **SHOULD** limit accent color usage to one per view
- **SHOULD** use existing theme or Tailwind CSS color tokens before introducing new ones

---

## Auto-Fix Safe List

These violations can be automatically fixed:

| Pattern | Fix |
|---------|-----|
| `h-screen` | Replace with `h-dvh` |
| Missing `text-balance` on headings | Add class |
| Missing `tabular-nums` on data | Add class |
| `w-8 h-8` (square) | Replace with `size-8` |

These require user approval:

- Color changes (design decisions)
- Heading hierarchy changes (semantic)
- Animation timing changes (UX decisions)
