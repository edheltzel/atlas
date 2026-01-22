# UI Skills Constraints

Source: [ui-skills.com](https://www.ui-skills.com/) | Updated: January 2026

---

## Overview

UI Skills is a constraint-based system for building consistent, reliable user interfaces. Rather than leaving UI decisions open-ended, it provides opinionated constraints that guide development.

**Modular Skills:**
- `baseline-ui` - Core opinionated UI baseline (this file)
- `fixing-accessibility` - Keyboard, labels, focus, semantics
- `fixing-metadata` - Titles, meta, social cards
- `fixing-motion-performance` - Safe, performance-first UI motion

---

## Stack Constraints

### CSS Framework
**Required:** Tailwind CSS defaults unless custom values already exist or are explicitly requested.

```tsx
// CORRECT
<div className="flex items-center gap-4 p-4">

// WRONG - raw CSS or other frameworks
<div style={{ display: 'flex' }}>
```

### Animation Library
**Required:** `motion/react` (formerly Framer Motion) for JavaScript animation.

```tsx
import { motion } from 'motion/react';

<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.15 }}
/>
```

**For entrance/micro-animations:** Use `tw-animate-css` instead.

### Class Logic
**Required:** `cn` utility (`clsx` + `tailwind-merge`) for class logic.

```tsx
import { cn } from '@/lib/utils';

<button className={cn(
  "px-4 py-2 rounded",
  isActive && "bg-blue-500",
  isDisabled && "opacity-50 cursor-not-allowed"
)} />
```

---

## Component Constraints

### Accessible Primitives
**Required:** Use accessible component primitives for anything with keyboard or focus behavior.

**Choose ONE system and stick with it:**
- Base UI (preferred for new projects)
- React Aria
- Radix

**NEVER mix primitive systems** within the same interaction surface.

```tsx
// CORRECT - Radix throughout
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

// WRONG - mixing systems
import { Dialog } from '@headlessui/react';  // Headless UI
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';  // Radix
```

### Icon Buttons
**Required:** Add `aria-label` to icon-only buttons.

```tsx
// CORRECT
<button aria-label="Close dialog">
  <XIcon />
</button>

// WRONG
<button><XIcon /></button>
```

### Keyboard Behavior
**Never hand-code keyboard/focus behavior** unless explicitly requested. Use primitives.

---

## Interaction Constraints

### Destructive Actions
**Required:** Use `AlertDialog` for destructive or irreversible actions.

```tsx
// CORRECT
<AlertDialog>
  <AlertDialogTrigger>Delete</AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
    <AlertDialogAction>Confirm Delete</AlertDialogAction>
    <AlertDialogCancel>Cancel</AlertDialogCancel>
  </AlertDialogContent>
</AlertDialog>

// WRONG - button that deletes without confirmation
<button onClick={handleDelete}>Delete</button>
```

### Loading States
**Required:** Use structural skeletons that mirror final content.

```tsx
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
  <div className="h-4 bg-gray-200 rounded w-1/2" />
</div>
```

### Viewport Height
**Required:** Replace `h-screen` with `h-dvh` (dynamic viewport height).

```tsx
// CORRECT
<div className="h-dvh">

// WRONG
<div className="h-screen">
```

### Safe Areas
**Required:** Respect safe-area insets for fixed positioning.

```css
padding-bottom: env(safe-area-inset-bottom);
```

### Error Display
**Required:** Display errors adjacent to their triggering action.

### Input Behavior
**NEVER block paste** in `<input>` or `<textarea>` elements.

---

## Animation Constraints

### When to Animate
**Never animate without explicit request.** Animation should clarify cause/effect or add deliberate delight.

### Compositor Properties Only
**Allowed:**
- `transform` (translate, scale, rotate)
- `opacity`

**Forbidden (triggers layout):**
- `width`, `height`
- `top`, `left`, `right`, `bottom`
- `margin`, `padding`
- `font-size`

### Duration Cap
**Maximum:** 200ms for interaction feedback.

```tsx
// CORRECT
transition={{ duration: 0.15 }}

// WRONG
transition={{ duration: 0.5 }}
```

### Looping Animations
**Required:** Pause looping animations when off-screen (use IntersectionObserver).

### Reduced Motion
**Required:** Respect `prefers-reduced-motion` preference.

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Typography Constraints

### Text Wrapping
```tsx
// Headings
<h1 className="text-balance">

// Body text
<p className="text-pretty">
```

### Numerical Data
**Required:** Use `tabular-nums` for numerical data alignment.

```tsx
<span className="tabular-nums">1,234.56</span>
```

### Dense Layouts
**Required:** Use `truncate` or `line-clamp` for text in dense layouts.

```tsx
<p className="truncate">Long text that might overflow...</p>
<p className="line-clamp-2">Text limited to two lines...</p>
```

### Letter Spacing
**Don't modify `letter-spacing`** without explicit request.

### Font Rendering
```css
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```

---

## Layout Constraints

### Z-Index Scale
**Required:** Implement fixed z-index scales; no arbitrary values.

```css
--z-dropdown: 100;
--z-modal: 200;
--z-popover: 300;
--z-tooltip: 400;
--z-toast: 500;
```

### Square Elements
**Required:** Use `size-*` for square elements.

```tsx
// CORRECT
<div className="size-8">

// WRONG
<div className="w-8 h-8">
```

### React Patterns
**Avoid `useEffect` for render logic.** Prefer derived state and proper React patterns.

---

## Performance Constraints

### Heavy Effects - Avoid
- Complex gradients
- Multiple box-shadows
- Large blur/backdrop-filter surfaces
- Large drop shadows

### Gradients
- Avoid gradients unless explicitly requested
- **NEVER use purple or multicolor gradients**
- If gradient needed, keep it simple (2 colors max)

### Glows
- No glowing effects as primary affordances
- Leverage Tailwind's default shadow scale instead

---

## Design Constraints

### Empty States
**Required:** Provide one clear action in empty states.

```tsx
<div className="flex flex-col items-center justify-center py-12">
  <Icon className="h-12 w-12 text-gray-400" />
  <h3 className="mt-4 text-lg font-medium">No items yet</h3>
  <p className="mt-2 text-gray-500">Get started by creating your first item.</p>
  <Button className="mt-4">Create Item</Button>
</div>
```

### Accent Colors
**Limit accent colors to one per view.**

---

## Review Checklist

When reviewing UI code, check:

- [ ] Uses Tailwind CSS (no raw CSS or other frameworks)
- [ ] Uses `motion/react` for JS animations, `tw-animate-css` for micro-animations
- [ ] Uses `cn` utility for class logic
- [ ] Uses single primitive system (Radix/React Aria/Base UI)
- [ ] Icon-only buttons have `aria-label`
- [ ] Destructive actions have AlertDialog confirmation
- [ ] Uses `h-dvh` not `h-screen`
- [ ] Respects safe-area insets for fixed elements
- [ ] Never blocks paste in inputs
- [ ] Animations use only transform/opacity
- [ ] Animation duration ≤200ms
- [ ] Looping animations pause off-screen
- [ ] Respects `prefers-reduced-motion`
- [ ] Headings use `text-balance`, body uses `text-pretty`
- [ ] Numerical data uses `tabular-nums`
- [ ] Uses `size-*` for square elements
- [ ] Z-index follows consistent scale
- [ ] No heavy effects (complex gradients, blur, glow)
- [ ] No purple or multicolor gradients
- [ ] One accent color per view
- [ ] Empty states have clear action
