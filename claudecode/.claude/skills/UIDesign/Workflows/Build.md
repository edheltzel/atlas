# Build Workflow

Build UI components following UI Skills constraints and Vercel design guidelines.

## Trigger
- "build component"
- "create UI"
- "implement interface"
- "make a [component]"

## Execution

### 1. Load Context Files

```bash
# Load constraint systems
Read ~/.claude/skills/UIDesign/UISkillsConstraints.md
Read ~/.claude/skills/UIDesign/VercelGuidelines.md
```

### 2. Understand Requirements

Before building, clarify:
- Component purpose and behavior
- Required states (loading, empty, error, success)
- Accessibility requirements
- Animation needs
- Responsive behavior

### 3. Select Primitives

If component needs accessible primitives:

```tsx
// Use Radix (or project's chosen system)
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
```

**Check existing project** for which primitive system is in use. Never mix.

### 4. Build Component

**Required structure:**

```tsx
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

interface ComponentProps {
  // Explicit props with types
}

export function Component({ ...props }: ComponentProps) {
  return (
    // Tailwind classes only
    // cn() for conditional logic
    // motion for JS animations (tw-animate-css for micro-animations)
  );
}
```

**Animation pattern:**

```tsx
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -10 }}
  transition={{ duration: 0.15 }}  // ≤200ms
/>
```

**Focus states:**

```tsx
className={cn(
  "outline-none",
  "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
)}
```

**Icon buttons:**

```tsx
<button aria-label="Close dialog">
  <XIcon aria-hidden="true" />
</button>
```

### 5. Design All States

Every component must handle:

**Loading State (with minimum duration):**
```tsx
{isLoading && (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4" />
  </div>
)}
```

**Empty State (with clear action):**
```tsx
{items.length === 0 && (
  <div className="flex flex-col items-center justify-center py-12">
    <Icon className="h-12 w-12 text-gray-400" />
    <h3 className="mt-4 text-lg font-medium">No items yet</h3>
    <p className="mt-2 text-gray-500">Get started by creating your first item.</p>
    <Button className="mt-4">Create Item</Button>
  </div>
)}
```

**Error State (adjacent to trigger):**
```tsx
{error && (
  <p className="text-red-500 text-sm mt-1">
    {error.message}. Please try again.
  </p>
)}
```

### 6. Accessibility Checklist

Before completing:
- [ ] Keyboard navigable
- [ ] Focus visible (`:focus-visible`) and trapped (for modals)
- [ ] `aria-label` for icon-only buttons
- [ ] Proper heading hierarchy (no skipped levels)
- [ ] Form errors linked via `aria-describedby`
- [ ] Dynamic updates announced with `aria-live`
- [ ] Respects `prefers-reduced-motion`

### 7. Responsive Check

- [ ] Works on mobile (44px touch targets)
- [ ] Font 16px+ on mobile inputs (prevent iOS zoom)
- [ ] Uses `h-dvh` not `h-screen`
- [ ] Safe-area insets for fixed elements
- [ ] No horizontal scroll
- [ ] Breakpoints make sense

### 8. Performance Check

- [ ] Animations use only `transform` and `opacity`
- [ ] No `transition: all`
- [ ] Large lists virtualized (virtua or content-visibility)
- [ ] Images have explicit dimensions
- [ ] No layout read/write interleaving

## Output Requirements

- Complete, working component code
- TypeScript types included
- All states implemented
- Follows project conventions
- Includes usage example

## Related Workflows

After building, consider:
- **Review**: `Workflows/Review.md` - Verify against all constraints
- **Accessibility audit**: `Workflows/Accessibility.md` - Deep a11y check
- **Motion audit**: `Workflows/MotionPerformance.md` - Animation performance
