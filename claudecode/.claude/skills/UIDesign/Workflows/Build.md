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
# Load both constraint systems
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
    // motion for animations
  );
}
```

**Animation pattern:**

```tsx
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -10 }}
  transition={{ duration: 0.15 }}  // 150ms max
/>
```

**Focus states:**

```tsx
className={cn(
  "outline-none",
  "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
)}
```

### 5. Design All States

Every component must handle:

**Loading State:**
```tsx
{isLoading && (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4" />
  </div>
)}
```

**Empty State:**
```tsx
{items.length === 0 && (
  <div className="text-center py-12">
    <p className="text-gray-500">No items yet</p>
    <Button>Add First Item</Button>
  </div>
)}
```

**Error State:**
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
- [ ] Focus visible and trapped (for modals)
- [ ] ARIA labels for icon buttons
- [ ] Role attributes where needed
- [ ] Screen reader announcements for dynamic content

### 7. Responsive Check

- [ ] Works on mobile (44px touch targets)
- [ ] Font 16px+ on mobile inputs
- [ ] No horizontal scroll
- [ ] Breakpoints make sense

## Output Requirements

- Complete, working component code
- TypeScript types included
- All states implemented
- Follows project conventions
- Includes usage example
