---
name: UIDesign
description: UI design system combining UI Skills constraints with Vercel design guidelines. USE WHEN building UI, reviewing interfaces, creating components, frontend design, web interfaces, accessibility review, animation guidelines, form design, or layout work.
---

# UIDesign

Constraint-based UI design system combining [UI Skills](https://www.ui-skills.com/) with [Vercel Design Guidelines](https://vercel.com/design/guidelines).

## Customization

**Before executing, check for user customizations at:**
`~/.claude/skills/CORE/USER/SKILLCUSTOMIZATIONS/UIDesign/`

If this directory exists, load and apply any PREFERENCES.md, configurations, or resources found there. These override default behavior. If the directory does not exist, proceed with skill defaults.

## Voice Notification

**When executing a workflow, do BOTH:**

1. **Send voice notification**:
   ```bash
   curl -s -X POST http://localhost:8888/notify \
     -H "Content-Type: application/json" \
     -d '{"message": "Running the WORKFLOWNAME workflow from the UIDesign skill"}' \
     > /dev/null 2>&1 &
   ```

2. **Output text notification**:
   ```
   Running the **WorkflowName** workflow from the **UIDesign** skill...
   ```

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **Review** | "review UI", "check interface", "audit components" | `Workflows/Review.md` |
| **Build** | "build component", "create UI", "implement interface" | `Workflows/Build.md` |

## Quick Reference

### Stack Constraints (UI Skills)
- **CSS:** Tailwind CSS only
- **Animation:** motion/react for animations
- **Utilities:** `cn` utility for class logic
- **Primitives:** Base UI, React Aria, or Radix (never mix)

### Core Principles (Vercel)
- Keyboard accessible (WAI-ARIA patterns)
- Honor `prefers-reduced-motion`
- GPU-accelerated animations only (`transform`, `opacity`)
- Optical alignment over geometric

**Full Documentation:**
- Vercel guidelines: `VercelGuidelines.md`
- UI Skills constraints: `UISkillsConstraints.md`

## Examples

**Example 1: Review existing UI code**
```
User: "Review the login form for accessibility"
--> Invokes Review workflow
--> Checks against Vercel accessibility guidelines
--> Checks against UI Skills constraints
--> Returns issues with specific fixes
```

**Example 2: Build a new component**
```
User: "Build a modal dialog component"
--> Invokes Build workflow
--> Uses Radix primitives (per UI Skills)
--> Applies Vercel interaction patterns
--> Returns accessible, animated component
```

**Example 3: Quick constraint check**
```
User: "Is this animation okay? transition: all 0.5s"
--> Direct answer (no workflow needed)
--> NO: Never use `transition: all`, explicitly list properties
--> NO: 500ms exceeds 200ms animation cap
--> Fix: `transition: transform 150ms, opacity 150ms`
```
