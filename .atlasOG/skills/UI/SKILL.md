---
name: UI
description: Frontend development system integrating Vercel design philosophy, technical constraints, and accessibility review. USE WHEN UI design, frontend patterns, component styling, accessibility review, design systems, OR /ui command.
---

# UI - Frontend Development System

Complete frontend development loop: Philosophy -> Constraints -> Verification.

## Three Integrated Systems

| System | Role | Source |
|--------|------|--------|
| **Vercel Design Guidelines** | Philosophy ("why") | `Philosophy.md` |
| **ui-skills.com** | Constraints ("how") | `Constraints.md` |
| **rams.ai** | Verification ("verify") | `ReviewChecklist.md` |

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **ApplyPhilosophy** | "philosophy", "design thinking", "why" | `Workflows/ApplyPhilosophy.md` |
| **ApplyConstraints** | "constraints", "technical", "how" | `Workflows/ApplyConstraints.md` |
| **Review** | "review", "verify", "check" | `Workflows/Review.md` |
| **FullLoop** | (default), "full", "complete" | `Workflows/FullLoop.md` |

## Quick Reference

### Vercel Philosophy Highlights

- Keyboard operability (WAI-ARIA patterns)
- `prefers-reduced-motion` respect
- Touch targets: 44px mobile, 24px desktop
- Optical alignment > geometric precision
- Active voice, Title Case headings

### ui-skills Constraint Highlights

- Tailwind + `cn` utility (clsx + tailwind-merge)
- Animation: `transform`/`opacity` only, 200ms max
- `h-dvh` not `h-screen`, fixed z-index scale
- One accent color per view
- No gradients unless requested

### Review Targets

- WCAG 2.1 compliance
- Color contrast 4.5:1 minimum
- Component state completeness (hover, focus, active)

## Examples

**Example 1: Apply design philosophy**
```
User: "/ui philosophy"
-> Loads Vercel design guidelines
-> Applies to current component context
-> Suggests interaction patterns, accessibility improvements
```

**Example 2: Check constraints**
```
User: "/ui constraints"
-> Detects project stack (Tailwind, etc.)
-> Loads appropriate constraint set
-> Reviews code against technical rules
```

**Example 3: Full review**
```
User: "/ui review src/components/Button.tsx"
-> Runs rams CLI (if available) or manual checklist
-> Reports accessibility score
-> Suggests specific fixes with line numbers
```

**Example 4: Default behavior**
```
User: "/ui"
-> Detects current context
-> Shows detected stack and quick help
-> Applies philosophy + constraints to active work
```

## Stack Detection

The skill auto-detects your UI stack from `package.json`:

| Detected | Constraint Set |
|----------|----------------|
| Tailwind CSS | Full ui-skills rules |
| CSS Modules | Scoped styles approach |
| Vanilla CSS | Custom properties |
| Unknown | Universal (framework-agnostic) |

See `Data/ConstraintSets.yaml` for full configurations.

## Design Agent Integration

Use with The UI Designer agent for full design-implement-verify loop:

```
/agents design "Create a settings panel with dark mode toggle"
```

The agent orchestrates: Art (mockups) -> UI (implementation) -> Browser (verification)
