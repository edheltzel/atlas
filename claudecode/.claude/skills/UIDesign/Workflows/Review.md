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
# Load both constraint systems
Read ~/.claude/skills/UIDesign/UISkillsConstraints.md
Read ~/.claude/skills/UIDesign/VercelGuidelines.md
```

### 2. Identify Target

Determine what to review:
- Specific file(s) mentioned by user
- Component directory
- Entire frontend codebase

### 3. Review Against Constraints

**UI Skills Constraints Check:**
- [ ] Uses Tailwind CSS (no raw CSS)
- [ ] Uses motion/react for animations
- [ ] Uses `cn` utility for class logic
- [ ] Single primitive system (Radix/React Aria/Base UI)
- [ ] AlertDialog for destructive actions
- [ ] Animations: transform/opacity only
- [ ] Animation duration 200ms max
- [ ] Clear, actionable error messages
- [ ] Empty states designed
- [ ] Skeleton loading states
- [ ] Consistent z-index scale
- [ ] No heavy effects (blur, glow, complex gradients)

**Vercel Guidelines Check:**
- [ ] Keyboard accessible
- [ ] Focus states visible (`:focus-visible`)
- [ ] Hit targets 24px minimum (44px mobile)
- [ ] Font size 16px+ (prevent iOS zoom)
- [ ] `prefers-reduced-motion` respected
- [ ] GPU-accelerated properties only
- [ ] Explicit transition properties (no `transition: all`)
- [ ] Form labels associated
- [ ] Semantic HTML before ARIA
- [ ] Image dimensions explicit
- [ ] Layered shadows (2+ layers)
- [ ] Optical alignment considered

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
