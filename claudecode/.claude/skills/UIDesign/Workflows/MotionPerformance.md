# Motion Performance Workflow

Fix animation and motion performance issues using the fixing-motion-performance skill.

## When to Use

- "Fix animation"
- "Motion performance"
- "Animation audit"
- "Janky scroll"
- "Animation is slow"
- "Fix jank"

## Execution Steps

### 1. Load Reference
Read `FixingMotionPerformance.md` for the 9-priority rule system.

### 2. Identify Symptoms

Common performance symptoms:
- Janky/stuttering animations
- Slow scroll performance
- Dropped frames
- High CPU during animation
- Layout thrashing in DevTools

### 3. Audit by Priority

**Critical (Never Patterns):**
1. Layout read/write interleaving
2. Continuous layout animation on large surfaces
3. Scroll event polling for animation
4. rAF loops without stop conditions
5. Multiple animation systems conflicting

**Critical (Mechanism):**
2. Wrong animation approach for the job

**High (Measurement):**
3. Repeated DOM reads during animation

**High (Scroll):**
4. Scroll polling instead of Scroll Timeline/IntersectionObserver

**Medium-High (Paint):**
5. Paint animation on large surfaces

**Medium (Layers):**
6. Improper layer promotion (will-change abuse)

**Medium (Blur):**
7. Large or continuous blur effects

**Low (View Transitions):**
8. View Transitions for micro-interactions

**Critical (always):**
9. Tool Boundaries - Don't migrate animation libraries

### 4. Report Issues

For each issue found:
1. Quote the exact problematic code
2. Explain why it causes performance issues
3. Propose the minimal fix
4. Suggest testing approach

### 5. Apply Fixes

- Work within the existing animation system
- Prefer compositor properties (transform, opacity)
- Use FLIP pattern for layout-like effects
- Add IntersectionObserver for off-screen pausing

## Output Format

```markdown
## Motion Performance Audit Results

### Critical Issues (Never Patterns)

#### Layout Thrashing
**Priority:** 1 - Never Patterns
**File:** `path/to/file.tsx`
**Code:**
```tsx
// Current - interleaved reads/writes
elements.forEach(el => {
  const height = el.offsetHeight;
  el.style.height = height + 10 + 'px';
});
```

**Problem:** Reading and writing layout in the same loop causes forced reflows.

**Fix:**
```tsx
// Batch reads, then writes
const heights = elements.map(el => el.offsetHeight);
elements.forEach((el, i) => {
  el.style.height = heights[i] + 10 + 'px';
});
```

---

### Summary
- Never Patterns: X issues
- Mechanism issues: X issues
- Scroll issues: X issues
- Paint issues: X issues
```

## Quick Checklist

Before finishing, verify:

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

## Testing Recommendations

1. **Chrome DevTools Performance tab** - Record during animation
2. **Rendering tab** - Enable "Paint flashing" and "Layout Shift Regions"
3. **Layers panel** - Check promoted layers
4. **CPU throttling** - Test at 4x/6x slowdown
5. **iOS Low Power Mode** - Real device testing
