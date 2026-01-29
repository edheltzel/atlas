---
name: install-frontend
description: Install the curated frontend skill stack for a project. React, Next.js, Tailwind, shadcn, design systems, and Anthropic frontend-design. USE WHEN install frontend skills, frontend stack, setup frontend, new frontend project, react project setup.
---

# Install Frontend Stack

Installs the curated frontend development skill stack into the current project for all agents (claude-code, opencode, gemini-cli).

## Curated Skill List

### Core Frontend (vercel-labs/agent-skills)
| Skill | Purpose |
|-------|---------|
| `vercel-react-best-practices` | 40+ React/Next.js performance rules across 8 categories |
| `vercel-composition-patterns` | Compound components, state lifting, scalable architecture |
| `web-design-guidelines` | 100+ rules for accessibility, performance, and UX |

### Design & Implementation (anthropics/skills)
| Skill | Purpose |
|-------|---------|
| `frontend-design` | Production-grade UI implementation, avoids generic AI aesthetics |
| `web-artifacts-builder` | React + Tailwind CSS + shadcn/ui artifact building |

### Video (remotion-dev/skills)
| Skill | Purpose |
|-------|---------|
| `remotion-best-practices` | Best practices for Remotion — video creation in React |

### UI Quality (ibelick/ui-skills)
| Skill | Purpose |
|-------|---------|
| `baseline-ui` | Enforces opinionated UI baseline to prevent AI-generated interface slop |
| `fixing-accessibility` | Fix accessibility issues |
| `fixing-metadata` | Ship correct, complete metadata |
| `fixing-motion-performance` | Fix animation performance issues |

### Web Quality (addyosmani/web-quality-skills)
| Skill | Purpose |
|-------|---------|
| `accessibility` | WCAG 2.1 accessibility audit |
| `best-practices` | Modern web development and security standards |
| `core-web-vitals` | LCP, INP, CLS optimization for search ranking |
| `performance` | Page speed and loading optimization |
| `seo` | Search engine visibility and meta optimization |
| `web-quality-audit` | Comprehensive Lighthouse-based audit |

## Execution

### Step 1: Show the Plan

Display the skill list above and tell the user:

```
Frontend Stack Install Plan

The following skills will be installed to this project for claude-code, opencode, and gemini-cli:

Source: vercel-labs/agent-skills
  - vercel-react-best-practices
  - vercel-composition-patterns
  - web-design-guidelines

Source: anthropics/skills
  - frontend-design
  - web-artifacts-builder

Source: remotion-dev/skills
  - remotion-best-practices

Source: ibelick/ui-skills
  - baseline-ui, fixing-accessibility, fixing-metadata, fixing-motion-performance

Source: addyosmani/web-quality-skills
  - accessibility, best-practices, core-web-vitals, performance, seo, web-quality-audit

Scope: current project (not global). Confirm to proceed.
```

### Step 2: Wait for Confirmation

Do NOT proceed until the user explicitly confirms.

### Step 3: Install Skills

Run these commands sequentially. Report progress after each:

```bash
bunx skills add vercel-labs/agent-skills \
  -a claude-code -a opencode -a gemini-cli \
  --skill vercel-react-best-practices \
  --skill vercel-composition-patterns \
  --skill web-design-guidelines -y
```

```bash
bunx skills add anthropics/skills \
  -a claude-code -a opencode -a gemini-cli \
  --skill frontend-design \
  --skill web-artifacts-builder -y
```

```bash
bunx skills add remotion-dev/skills \
  -a claude-code -a opencode -a gemini-cli \
  --skill remotion-best-practices -y
```

```bash
bunx skills add ibelick/ui-skills \
  -a claude-code -a opencode -a gemini-cli -y
```

```bash
bunx skills add addyosmani/web-quality-skills \
  -a claude-code -a opencode -a gemini-cli -y
```

### Step 4: Search for Additional Skills

After the core install, search for Tailwind, shadcn, and Hero UI skills that may exist:

```bash
bunx skills find tailwind
bunx skills find shadcn
bunx skills find heroui
```

Present any results found and offer to install them.

### Step 5: Verify

Run `bunx skills list` to confirm all skills were installed. Report the final state.

## Notes

- All installs are **per-project** (no `-g` flag)
- Uses `-y` flag after user confirmation to skip redundant CLI prompts
- If any install fails, report the error and continue with remaining skills
- The `-a` flag targets specific agents; `-y` bypasses all interactive prompts
