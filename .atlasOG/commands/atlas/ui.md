---
description: "Frontend development system with philosophy, constraints, and accessibility review. Usage: /atlas:ui [philosophy|constraints|review] [file]"
---

# UI Skill

Frontend development system integrating Vercel design philosophy, technical constraints, and accessibility review.

## Arguments

$ARGUMENTS

## Routing

Based on arguments, invoke the appropriate UI skill workflow:

| Argument | Workflow | Description |
|----------|----------|-------------|
| (none) | FullLoop | Apply all systems to current context |
| `philosophy` | ApplyPhilosophy | Vercel design principles |
| `constraints` | ApplyConstraints | ui-skills.com technical rules |
| `review [file]` | Review | Accessibility and design review |

## Execution

Use the Skill tool to invoke: `Skill("UI")`

Pass arguments to determine workflow routing.

## Quick Reference

**Philosophy (why):**
- Keyboard operability (WAI-ARIA)
- 44px touch targets mobile
- prefers-reduced-motion respect

**Constraints (how):**
- transform/opacity only for animation
- h-dvh not h-screen
- 200ms max for feedback

**Review (verify):**
- WCAG 2.1 compliance
- 4.5:1 color contrast
- Component state completeness

## Design Agent

For full design-implement-verify loop with mockups:

```
/agents design "Create a [component description]"
```

Spawns The UI Designer agent with Art, UI, and Browser skills.
