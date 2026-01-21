# UI Skills Integration

**Category:** skills
**Captured:** 2026-01-17
**Updated:** 2026-01-19

## Description

Create a unified Atlas UI skill that integrates three complementary frontend development systems:

1. **Vercel Design Guidelines** - Design philosophy and interaction patterns
2. **ui-skills.com** - Technical implementation constraints
3. **rams.ai** - Automated accessibility and design review

Together these provide a complete frontend development loop: philosophy → constraints → verification.

## Sources

### 1. Vercel Web Interface Guidelines
**URL:** https://vercel.com/design/guidelines
**Role:** The "why" - design philosophy and decision-making

Provides:
- Interaction patterns (keyboard accessibility, focus management)
- Form handling (validation, autofill, error recovery)
- Animation philosophy (performance, reduced-motion)
- Content/copywriting guidelines
- Layout and responsive design principles
- Performance optimization patterns

**LLM Integration:** Has AGENTS.md download and `/web-interface-guidelines` command

### 2. ui-skills.com
**URL:** https://www.ui-skills.com/llms.txt
**Role:** The "how" - technical implementation constraints

Provides:
- Stack requirements (Tailwind CSS, cn utility, accessible primitives)
- Animation rules (compositor properties only, 200ms max, respect prefers-reduced-motion)
- Typography standards (text-balance, text-pretty, tabular-nums)
- Layout constraints (fixed z-index scale, size-* for squares)
- Design token rules (no gradients unless requested, single accent color)
- Performance guards (no useEffect abuse, no backdrop-filter animations)

**LLM Integration:** llms.txt format

### 3. rams.ai
**URL:** https://www.rams.ai/
**Role:** The "verify" - automated review and validation

Provides:
- WCAG 2.1 accessibility compliance checking
- Visual design consistency review
- Color contrast validation (4.5:1 minimum)
- Component state completeness (hover, focus, active)
- Actionable fixes with specific line numbers
- Composite scoring for quality assessment

**LLM Integration:** CLI tool, integrates with Claude Code

## Proposed Skill Structure

```
skills/UI/
├── SKILL.md              # Main skill definition
├── Philosophy/           # Vercel guidelines adapted
│   ├── interactions.md
│   ├── animations.md
│   ├── forms.md
│   └── content.md
├── Constraints/          # ui-skills rules
│   ├── stack.md
│   ├── animation-rules.md
│   ├── typography.md
│   └── layout.md
└── Review/               # rams integration
    └── checklist.md
```

## Usage Patterns

```
/ui                       # Apply all three systems to current work
/ui philosophy            # Focus on Vercel design principles
/ui constraints           # Focus on ui-skills technical rules
/ui review                # Run rams-style accessibility/design review
/ui review <file>         # Review specific file with fixes
```

## Design Agent

A dedicated design agent that orchestrates the full UI development loop.

### Agent Profile

| Attribute | Value |
|-----------|-------|
| **Name** | Designer / UI Agent |
| **Voice** | `designer` personality |
| **Skills** | UI (this skill), Art, Browser |
| **Mode** | Autonomous with checkpoints |

### Workflow: Design → Implement → Verify → Iterate

```
┌──────────────────────────────────────────────────────────────────┐
│                      DESIGN AGENT LOOP                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. DESIGN (Art skill + Vercel philosophy)                       │
│     └─▶ Generate mockup/wireframe                                │
│     └─▶ Apply interaction patterns                               │
│     └─▶ User approval checkpoint                                 │
│                                                                  │
│  2. IMPLEMENT (ui-skills constraints)                            │
│     └─▶ Scaffold with Tailwind + accessible primitives           │
│     └─▶ Enforce animation rules (200ms, compositor only)         │
│     └─▶ Apply typography and layout constraints                  │
│                                                                  │
│  3. VERIFY (Browser skill + rams review)                         │
│     └─▶ Take screenshot of rendered component                    │
│     └─▶ Run WCAG 2.1 accessibility check                         │
│     └─▶ Validate color contrast, focus states                    │
│     └─▶ Check component state completeness                       │
│                                                                  │
│  4. ITERATE                                                      │
│     └─▶ Fix violations with line-specific changes                │
│     └─▶ Re-verify until passing                                  │
│     └─▶ Final screenshot for confirmation                        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Agent Invocation

```
# Spawn design agent for component work
/agents design "Create a settings panel with dark mode toggle"

# Or via Agents skill
Use the Agents skill to spawn a design agent for this task
```

### Checkpoints

The agent pauses for user approval at:
1. **After mockup** - "Does this design direction work?"
2. **After implementation** - "Ready to verify?"
3. **After review** - "These issues found, proceed with fixes?"

### Integration with Agents Skill

Add as preset in Agents skill configuration:

```yaml
presets:
  design:
    name: "Design Agent"
    voice: designer
    skills: [UI, Art, Browser]
    workflow: design-implement-verify
    checkpoints: [mockup, implementation, review]
```

## Implementation Notes

- All three sources are LLM-friendly (llms.txt, AGENTS.md formats)
- No conflicts between systems - they address different layers
- rams.ai is a CLI tool - could be installed as optional dependency
- Skill should work standalone even without rams CLI
- Design agent requires Art and Browser skills as dependencies

## Open Questions

- Should rams be a hard dependency or optional enhancement?
- How to handle projects not using Tailwind? (fallback constraints?)
- What's the right default behavior for `/ui` with no args?
- Should design agent be a preset in Agents skill or standalone command?
- How verbose should checkpoint prompts be? (quick approval vs detailed review)
- Should the agent auto-fix trivial violations or always ask?

## Related Ideas

- [[observability-dashboard-overhaul]] - Primary use case for this skill
