# Review Workflow

Review UI code against UI Skills constraints and Vercel design guidelines.

## Trigger
- "review UI"
- "check interface"
- "audit components"
- "review this component"

## Execution

### 1. Load Context Files

```bash
# Load constraint systems
Read ~/.claude/skills/UIDesign/UISkillsConstraints.md
Read ~/.claude/skills/UIDesign/VercelGuidelines.md
```

**For specialized audits, also load:**
- Accessibility issues: `FixingAccessibility.md`
- Animation issues: `FixingMotionPerformance.md`
- SEO/metadata issues: `FixingMetadata.md`

### 2. Identify Target

Determine what to review:
- Specific file(s) mentioned by user
- Component directory
- Entire frontend codebase

### 3. Review Against Constraints

**UI Skills Constraints Check:**
- [ ] Uses Tailwind CSS (no raw CSS)
- [ ] Uses `motion/react` for JS animations, `tw-animate-css` for micro-animations
- [ ] Uses `cn` utility for class logic
- [ ] Single primitive system (Radix/React Aria/Base UI)
- [ ] Icon-only buttons have `aria-label`
- [ ] AlertDialog for destructive actions
- [ ] Uses `h-dvh` not `h-screen`
- [ ] Respects safe-area insets
- [ ] Never blocks paste in inputs
- [ ] Animations: transform/opacity only
- [ ] Animation duration ≤200ms
- [ ] Looping animations pause off-screen
- [ ] Respects `prefers-reduced-motion`
- [ ] Headings use `text-balance`, body uses `text-pretty`
- [ ] Numerical data uses `tabular-nums`
- [ ] Uses `size-*` for square elements
- [ ] Consistent z-index scale
- [ ] No heavy effects (blur, glow, complex gradients)
- [ ] No purple or multicolor gradients
- [ ] One accent color per view
- [ ] Empty states have clear action

**Vercel Guidelines Check:**
- [ ] Keyboard accessible (WAI-ARIA patterns)
- [ ] Focus states visible (`:focus-visible`)
- [ ] Hit targets ≥24px (44px mobile)
- [ ] Font size 16px+ on mobile (prevent iOS zoom)
- [ ] Never blocks paste
- [ ] Hydration-safe inputs
- [ ] Minimum loading duration (150-300ms delay, 300-500ms visible)
- [ ] URL-based state where appropriate
- [ ] Destructive actions have confirmation or undo
- [ ] GPU-accelerated properties only
- [ ] Explicit transition properties (no `transition: all`)
- [ ] Animation implementation preference: CSS > Web Animations > JS
- [ ] Form labels associated
- [ ] Semantic HTML before ARIA
- [ ] Image dimensions explicit
- [ ] Layered shadows (2+ layers)
- [ ] Optical alignment considered
- [ ] Large lists virtualized

### 4. Report Findings

**Format:**

```markdown
## UI Review: [Component/File Name]

### Issues Found

**Critical (must fix):**
1. [Issue] - [Location] - [Fix]

**Warnings (should fix):**
1. [Issue] - [Location] - [Fix]

**Suggestions (nice to have):**
1. [Suggestion] - [Location]

### Passed Checks
- [List of passing checks]

### Summary
[X] issues found: [Y] critical, [Z] warnings
```

## Output Requirements

- List specific file paths and line numbers when possible
- Provide concrete fix examples, not just descriptions
- Prioritize issues by impact (accessibility > performance > style)
- Group related issues together

## Related Workflows

For deep dives into specific areas:
- **Accessibility audit**: Use `Workflows/Accessibility.md`
- **Animation performance**: Use `Workflows/MotionPerformance.md`
- **SEO/metadata**: Use `Workflows/Metadata.md`
