# UI Skills Integration

**Category:** skills
**Captured:** 2026-01-17

## Description

Integrate the ui-skills.com constraint system as an Atlas skill for frontend development. This provides opinionated standards for building interfaces with AI agents.

**Source:** https://www.ui-skills.com/llms.txt

## What UI Skills Provides

1. **Stack requirements** - Tailwind CSS, motion/react for animations, cn utility for class composition
2. **Component standards** - Accessible primitives (Base UI, React Aria, Radix), no mixing systems
3. **Interaction patterns** - AlertDialog for destructive actions, errors adjacent to triggers
4. **Animation rules** - Compositor properties only, 200ms max duration, respect motion preferences
5. **Typography & layout** - Text balancing, fixed z-index scales, performance-aware
6. **Design principles** - No gradients/glow as primary affordances, clear empty states

## Usage Pattern

- `/ui-skills` - Apply constraints broadly to current work
- `/ui-skills <file>` - Review specific file for violations with explanations and fixes

## Origin

Needed for observability dashboard overhaul and any future frontend work. Want consistent, high-quality UI generation from AI.

## Sub-items

### Evaluate Additional Frontend Skills

Research other frontend-focused skills/prompts in the ecosystem. Determine:
- Are they complementary (install as separate skills)?
- Are they overlapping (combine into unified UI skill)?
- What's missing from ui-skills.com that others provide?

**Sources to evaluate:**
- [ui-skills.com](https://www.ui-skills.com/llms.txt) - Constraint-based rules (Tailwind, animations, accessibility)
- [AI-Unleashed/frontend-design-shadcn](https://github.com/AI-Unleashed/Claude-Skills/blob/main/frontend-design-shadcn/SKILL.md) - Design philosophy + shadcn/ui scaffolding
- [Anthropic/frontend-design](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md) - Official Claude Code plugin, design-first approach

**Initial assessment:**
- ui-skills.com = technical constraints (the "how")
- frontend-design skills = creative philosophy (the "what")
- These could be complementary: constraints + philosophy in one unified skill

## Open Questions

- Install as-is or adapt to Atlas skill format?
- Does it conflict with any existing Atlas conventions?
- Should it integrate with the Art skill for visual content?
- How to handle projects that don't use Tailwind?
- What other frontend skill sources exist in the Claude/AI ecosystem?

## Related Ideas

- [[observability-dashboard-overhaul]] - Primary use case for this skill
