# UI Skills Constraints

Source: [ui-skills.com](https://www.ui-skills.com/)

---

## Overview

UI Skills is a constraint-based system for building consistent, reliable user interfaces. Rather than leaving UI decisions open-ended, it provides opinionated constraints that guide development.

---

## Stack Constraints

### CSS Framework
**Required:** Tailwind CSS

```tsx
// CORRECT
<div className="flex items-center gap-4 p-4">

// WRONG - raw CSS or other frameworks
<div style={{ display: 'flex' }}>
```

### Animation Library
**Required:** motion/react (formerly Framer Motion)

```tsx
import { motion } from 'motion/react';

<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.15 }}
/>
```

### Class Logic
**Required:** `cn` utility for conditional classes

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
**Choose ONE system and stick with it:**
- Base UI
- React Aria
- Radix

**NEVER mix primitive systems** in the same project.

```tsx
// CORRECT - Radix throughout
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

// WRONG - mixing systems
import { Dialog } from '@headlessui/react';  // Headless UI
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';  // Radix
```

---

## Interaction Constraints

### Destructive Actions
**Required:** AlertDialog for destructive actions

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

### Error Messaging
**Required:** Clear, actionable error messages

```tsx
// CORRECT
<p className="text-red-500">
  Email is required. Please enter a valid email address.
</p>

// WRONG
<p className="text-red-500">Error</p>
```

---

## Animation Constraints

### Compositor Properties Only
**Allowed properties:**
- `transform` (translate, scale, rotate)
- `opacity`

**Forbidden (triggers layout):**
- `width`, `height`
- `top`, `left`, `right`, `bottom`
- `margin`, `padding`
- `font-size`

### Duration Cap
**Maximum:** 200ms for UI interactions

```tsx
// CORRECT
transition={{ duration: 0.15 }}

// WRONG
transition={{ duration: 0.5 }}
```

---

## Typography Constraints

### Text Rendering
```css
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```

### Font Loading
- Preload critical fonts
- Use `font-display: swap`
- Subset via unicode-range when possible

---

## Layout Constraints

### Z-Index Scale
Use a consistent scale:
```css
--z-dropdown: 100;
--z-modal: 200;
--z-popover: 300;
--z-tooltip: 400;
--z-toast: 500;
```

### Sizing Convention
- Use Tailwind spacing scale
- Avoid arbitrary values when possible
- When arbitrary values needed, use consistent increments

---

## Performance Constraints

### Heavy Effects Avoid
- Complex gradients
- Multiple box-shadows
- Blur effects (`backdrop-filter: blur()`)
- Large drop shadows

### Gradients Discourage
- Use solid colors when possible
- If gradient needed, keep it simple (2 colors max)

### Glows Avoid
- No glowing effects
- No neon-style shadows

---

## Design Constraints

### Empty States
**Required:** Design clean, helpful empty states

```tsx
<div className="flex flex-col items-center justify-center py-12">
  <Icon className="h-12 w-12 text-gray-400" />
  <h3 className="mt-4 text-lg font-medium">No items yet</h3>
  <p className="mt-2 text-gray-500">Get started by creating your first item.</p>
  <Button className="mt-4">Create Item</Button>
</div>
```

### Loading States
**Required:** Skeleton loaders that match content structure

```tsx
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
  <div className="h-4 bg-gray-200 rounded w-1/2" />
</div>
```

---

## Review Checklist

When reviewing UI code, check:

- [ ] Uses Tailwind CSS (no raw CSS or other frameworks)
- [ ] Uses motion/react for animations
- [ ] Uses `cn` utility for class logic
- [ ] Uses single primitive system (Radix/React Aria/Base UI)
- [ ] Destructive actions have AlertDialog confirmation
- [ ] Animations use only transform/opacity
- [ ] Animation duration 200ms
- [ ] Clear error messages with actionable guidance
- [ ] Empty states designed
- [ ] Loading states use skeletons
- [ ] Z-index follows consistent scale
- [ ] No heavy effects (complex gradients, blur, glow)
