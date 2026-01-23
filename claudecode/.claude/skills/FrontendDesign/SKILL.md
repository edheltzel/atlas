---
name: FrontendDesign
description: Create distinctive, production-grade frontend interfaces with high design quality. USE WHEN user asks to build web components, pages, or applications. Generates creative, polished code that avoids generic AI aesthetics.
---

# FrontendDesign

Create distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

**Source:** [Anthropic Claude Code Plugin](https://github.com/anthropics/claude-code/tree/main/plugins/frontend-design)

## Customization

**Before executing, check for user customizations at:**
`~/.claude/skills/CORE/USER/SKILLCUSTOMIZATIONS/FrontendDesign/`

If this directory exists, load and apply any PREFERENCES.md, configurations, or resources found there. These override default behavior. If the directory does not exist, proceed with skill defaults.

## Voice Notification

**When executing, do BOTH:**

1. **Send voice notification**:
   ```bash
   curl -s -X POST http://localhost:8888/notify \
     -H "Content-Type: application/json" \
     -d '{"message": "Running the FrontendDesign skill for distinctive UI creation"}' \
     > /dev/null 2>&1 &
   ```

2. **Output text notification**:
   ```
   Running the **FrontendDesign** skill...
   ```

## Design Thinking

Before coding, understand the context and commit to a **BOLD** aesthetic direction:

| Question | Purpose |
|----------|---------|
| **Purpose** | What problem does this interface solve? Who uses it? |
| **Tone** | Pick an extreme aesthetic (see options below) |
| **Constraints** | Technical requirements (framework, performance, accessibility) |
| **Differentiation** | What makes this UNFORGETTABLE? What's the one thing someone will remember? |

### Aesthetic Directions

Choose one and execute with precision:

- Brutally minimal
- Maximalist chaos
- Retro-futuristic
- Organic/natural
- Luxury/refined
- Playful/toy-like
- Editorial/magazine
- Brutalist/raw
- Art deco/geometric
- Soft/pastel
- Industrial/utilitarian

**CRITICAL**: Bold maximalism and refined minimalism both work—the key is intentionality, not intensity.

## Frontend Aesthetics Guidelines

### Typography

Choose fonts that are **beautiful, unique, and interesting**:
- Pair a distinctive display font with a refined body font
- Unexpected, characterful font choices

**NEVER use:** Inter, Roboto, Arial, system fonts, or any generic defaults

### Color & Theme

- Commit to a cohesive aesthetic
- Use CSS variables for consistency
- Dominant colors with sharp accents outperform timid, evenly-distributed palettes

**NEVER use:** Purple gradients on white backgrounds, or other clichéd AI color schemes

### Motion

- Use animations for effects and micro-interactions
- Prioritize CSS-only solutions for HTML
- Use Motion library for React when available
- Focus on high-impact moments: one well-orchestrated page load with staggered reveals creates more delight than scattered micro-interactions
- Use scroll-triggering and hover states that surprise

### Spatial Composition

- Unexpected layouts
- Asymmetry
- Overlap
- Diagonal flow
- Grid-breaking elements
- Generous negative space OR controlled density

### Backgrounds & Visual Details

Create atmosphere and depth:
- Gradient meshes
- Noise textures
- Geometric patterns
- Layered transparencies
- Dramatic shadows
- Decorative borders
- Custom cursors
- Grain overlays

## Anti-Patterns (NEVER DO)

| Anti-Pattern | Why It's Bad |
|--------------|--------------|
| Inter, Roboto, Arial, system fonts | Generic, forgettable |
| Purple gradients on white | Clichéd AI aesthetic |
| Predictable layouts | Cookie-cutter, no character |
| Space Grotesk everywhere | Overused, convergent choice |
| Solid color backgrounds | Lacks depth and atmosphere |
| Scattered micro-interactions | Less impactful than orchestrated moments |

## Implementation Standards

Match complexity to vision:

| Vision | Implementation |
|--------|----------------|
| **Maximalist** | Elaborate code, extensive animations, layered effects |
| **Minimalist** | Restraint, precision, careful spacing, subtle details |

Elegance comes from executing the vision well.

## Integration with UIDesign

This skill focuses on **creative direction**. For implementation constraints, defer to the **UIDesign** skill:

- Animation caps (200ms max for interactions)
- GPU-only transforms
- Accessibility requirements (WCAG)
- Stack constraints (Tailwind, Radix/React Aria)

**Workflow:** FrontendDesign inspires → UIDesign constrains → Result is distinctive AND correct.

## Examples

**Example 1: Dashboard request**
```
User: "Build a dashboard for a music streaming app"
--> Choose aesthetic: Editorial/magazine meets vinyl-era warmth
--> Typography: Migra + Cabinet Grotesk
--> Colors: Deep charcoal, amber accents, cream highlights
--> Motion: Staggered card reveals on load, vinyl-spin hover states
--> Implement with attention to every detail
```

**Example 2: Landing page request**
```
User: "Create a landing page for an AI security startup"
--> Choose aesthetic: Brutalist/raw meets cyberpunk edge
--> Typography: Monument Extended + JetBrains Mono
--> Colors: Pure black, electric cyan, warning red accents
--> Motion: Glitch effects on hover, terminal-style text reveals
--> Grid-breaking hero with diagonal slashes
```

**Example 3: Settings panel**
```
User: "Design a settings panel with dark mode"
--> Choose aesthetic: Luxury/refined
--> Typography: Söhne + Söhne Mono
--> Colors: Rich obsidian, gold toggles, subtle gradients
--> Motion: Smooth 150ms transitions, satisfying toggle clicks
--> Meticulous spacing, optical alignment
```

---

Remember: Claude is capable of extraordinary creative work. Don't hold back—show what can truly be created when thinking outside the box and committing fully to a distinctive vision.
