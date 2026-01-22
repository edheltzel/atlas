# Fixing Motion Performance

Source: [ui-skills.com/skills/fixing-motion-performance](https://www.ui-skills.com/skills/fixing-motion-performance) | Updated: January 2026

---

## Overview

This skill helps fix motion and animation performance issues in UI code. The goal is safe, performance-first UI motion that doesn't cause jank, layout thrashing, or poor user experience.

**Priority Order:** Address critical issues first (Never Patterns), then work down the priority list.

---

## Priority 1: Never Patterns (Critical)

These patterns cause severe performance issues and must be avoided.

### Rules
- **Never** interleave layout reads and writes in the same frame
- **Never** animate layout continuously on large or meaningful surfaces
- **Never** drive animation from `scrollTop`, `scrollY`, or scroll events
- **Never** use `requestAnimationFrame` loops without a stop condition
- **Never** combine multiple animation systems that each measure or mutate layout

### Examples
```tsx
// WRONG - layout thrashing (read/write interleaving)
elements.forEach(el => {
  const height = el.offsetHeight; // READ
  el.style.height = height + 10 + 'px'; // WRITE
});

// CORRECT - batch reads, then writes
const heights = elements.map(el => el.offsetHeight); // All READs
elements.forEach((el, i) => {
  el.style.height = heights[i] + 10 + 'px'; // All WRITEs
});

// WRONG - scroll event driving animation
window.addEventListener('scroll', () => {
  element.style.transform = `translateY(${window.scrollY * 0.5}px)`;
});

// CORRECT - use Scroll Timeline or IntersectionObserver
```

---

## Priority 2: Choose the Mechanism (Critical)

Select the right animation approach for the job.

### Rules
- Prioritize `transform` and `opacity` for motion work
- Reserve JS-driven animation for interactions requiring it
- Paint or layout animation acceptable only on small, isolated surfaces
- One-shot effects are generally safer than continuous motion
- Consider downgrading technique rather than removing motion

### Hierarchy
1. **CSS Transitions/Animations** - simplest, most performant
2. **Web Animations API** - more control, still performant
3. **JS Libraries (motion/react)** - most control, use carefully

### Examples
```tsx
// PREFERRED - CSS for simple transitions
<button className="transition-transform duration-150 hover:scale-105">

// ACCEPTABLE - motion/react for complex interactions
<motion.div
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.15 }}
/>

// AVOID - animating layout properties
<motion.div animate={{ width: 200 }} /> // Triggers layout
```

---

## Priority 3: Measurement (High)

Measure once, then animate with compositor properties.

### Rules
- Measure once, then animate via `transform` or `opacity`
- Batch all DOM reads before writes
- **Never** read layout repeatedly during an animation
- Use FLIP-style transitions for layout-like effects
- Consolidate measurement and write operations

### FLIP Pattern
```tsx
// FLIP: First, Last, Invert, Play
function flipAnimate(element, newState) {
  // FIRST - capture initial position
  const first = element.getBoundingClientRect();

  // Apply state change
  applyNewState(element, newState);

  // LAST - capture final position
  const last = element.getBoundingClientRect();

  // INVERT - calculate difference
  const deltaX = first.left - last.left;
  const deltaY = first.top - last.top;

  // Apply inverse transform (no transition yet)
  element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

  // PLAY - animate to final position
  requestAnimationFrame(() => {
    element.style.transition = 'transform 150ms ease-out';
    element.style.transform = '';
  });
}
```

---

## Priority 4: Scroll (High)

Handle scroll-linked motion without polling.

### Rules
- Favor Scroll or View Timelines for scroll-linked motion
- Use `IntersectionObserver` for visibility management and pausing
- **Never** poll scroll position for animation
- Halt animations when off-screen
- Ensure scroll-linked motion doesn't trigger continuous layout/paint on large surfaces

### Examples
```tsx
// CORRECT - Scroll Timeline (CSS)
@keyframes reveal {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.scroll-reveal {
  animation: reveal linear;
  animation-timeline: view();
  animation-range: entry 0% entry 100%;
}

// CORRECT - IntersectionObserver for visibility
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate');
    } else {
      entry.target.classList.remove('animate'); // Pause when off-screen
    }
  });
});

// WRONG - polling scroll position
setInterval(() => {
  const scroll = window.scrollY;
  element.style.opacity = Math.min(scroll / 500, 1);
}, 16);
```

---

## Priority 5: Paint (Medium-High)

Limit paint-heavy animations to small, isolated elements.

### Rules
- Paint animation permitted only on small, isolated elements
- Avoid paint-heavy property animation on large containers
- **Never** animate CSS variables for transform, opacity, or position
- **Never** animate inherited CSS variables
- Scope animated variables locally

### Examples
```tsx
// WRONG - animating CSS variable globally
:root {
  --bg-color: #fff;
}
.animated {
  background: var(--bg-color);
  transition: --bg-color 0.3s; // Causes repaint on all descendants
}

// CORRECT - animate on the element directly
.animated {
  background: #fff;
  transition: background 0.15s;
}

// CORRECT - small isolated element
.small-indicator {
  width: 8px;
  height: 8px;
  animation: pulse 1s infinite; // OK - small surface
}
```

---

## Priority 6: Layers (Medium)

Manage GPU layers intentionally.

### Rules
- Compositor motion requires explicit layer promotion
- Use `will-change` temporarily and precisely
- Minimize promoted layer count and size
- Validate with browser DevTools when performance matters

### Examples
```tsx
// CORRECT - temporary will-change
element.style.willChange = 'transform';
element.addEventListener('transitionend', () => {
  element.style.willChange = 'auto'; // Remove after animation
}, { once: true });

// WRONG - permanent will-change on many elements
.card {
  will-change: transform; // Don't do this on many elements
}

// CORRECT - promote only during interaction
.card:hover {
  will-change: transform;
}
```

---

## Priority 7: Blur & Filters (Medium)

Use blur effects sparingly and only on small surfaces.

### Rules
- Keep blur animation small (8px or less)
- Use blur only for short, one-time effects
- **Never** animate blur continuously or on large surfaces
- Prefer opacity and translate before blur

### Examples
```tsx
// ACCEPTABLE - small, one-time blur
.modal-backdrop {
  backdrop-filter: blur(4px);
  transition: opacity 0.15s; // Animate opacity, not blur
}

// WRONG - large continuous blur animation
.hero-background {
  animation: blur-pulse 2s infinite;
}
@keyframes blur-pulse {
  0%, 100% { filter: blur(0px); }
  50% { filter: blur(20px); } // Large blur, continuous - BAD
}
```

---

## Priority 8: View Transitions (Low)

Reserve View Transitions for navigation-level changes.

### Rules
- Reserve for navigation-level changes (page transitions)
- Avoid for interaction-heavy UI
- Avoid when interruption or cancellation is required
- Treat size changes as potentially layout-triggering

### Examples
```tsx
// CORRECT - page navigation
document.startViewTransition(() => {
  navigateToNewPage();
});

// WRONG - using for micro-interactions
button.addEventListener('click', () => {
  document.startViewTransition(() => {
    toggleDropdown(); // Too small for View Transition
  });
});
```

---

## Priority 9: Tool Boundaries (Critical)

When fixing motion performance, stay focused.

### Rules
- **Never** migrate or rewrite animation libraries unless explicitly requested
- Apply rules within the existing animation system
- Never partially migrate APIs or mix styles within components

---

## Review Approach

When reviewing code for motion performance:

1. **Check for Never Patterns first** (Priority 1)
2. **Identify layout-triggering animations**
3. **Look for scroll event handlers**
4. **Check for large blur/filter animations**
5. **Propose minimal fixes using existing tools**

### Quick Audit Checklist

- [ ] No layout read/write interleaving
- [ ] No scroll event polling for animation
- [ ] rAF loops have stop conditions
- [ ] Animations use transform/opacity only
- [ ] Scroll effects use Scroll Timeline or IntersectionObserver
- [ ] Off-screen animations are paused
- [ ] will-change is temporary and targeted
- [ ] Blur effects are small (≤8px) and brief
- [ ] No large surfaces with continuous paint animation
- [ ] View Transitions only for navigation
