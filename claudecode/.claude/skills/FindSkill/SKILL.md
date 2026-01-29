---
name: find-skill
description: Search the skills.sh registry for agent skills matching a query. USE WHEN find skill, search skill, discover skill, is there a skill for, skill for X, need a skill.
argument-hint: "[query]"
---

# Find Skill

Search the open agent skills ecosystem for skills matching your query.

## Usage

```
/find-skill wordpress security
/find-skill react animation
/find-skill deployment cloudflare
```

## Execution

### Step 1: Parse the Query

The user's query is: `$ARGUMENTS`

If no arguments are provided, ask the user what kind of skill they're looking for.

### Step 2: Search the Registry

Run the search using the skills CLI:

```bash
bunx skills find $ARGUMENTS
```

### Step 3: Present Results

Show the user what was found in a clear table format:

| Skill | Source | Description |
|-------|--------|-------------|
| name | owner/repo | what it does |

Include the install command for each result.

### Step 4: Offer Installation

Ask the user which skills they want to install. When they confirm, run:

```bash
bunx skills add <owner/repo@skill> -a claude-code -a opencode -a gemini-cli
```

**Scope decision:** Ask the user whether to install globally (`-g`) or per-project (default).

### Step 5: Fallback

If `bunx skills find` returns no results:

1. Try alternative search terms (synonyms, related concepts)
2. Check these known registries via `bunx skills add <repo> --list`:
   - `vercel-labs/agent-skills` - React, Next.js, web design (4 skills)
   - `anthropics/skills` - Documents, frontend, MCP, testing (17 skills)
   - `cloudflare/skills` - Workers, Wrangler, D1, R2, Agents SDK (7 skills)
   - `coreyhaines31/marketingskills` - SEO, copywriting, CRO, content (25 skills)
   - `addyosmani/web-quality-skills` - Lighthouse, a11y, Core Web Vitals (6 skills)
   - `supabase/agent-skills` - Postgres best practices (1 skill)
   - `yusukebe/hono-skill` - Hono framework (1 skill)
   - `ibelick/ui-skills` - UI baseline, a11y, metadata, motion perf (4 skills)
3. If still nothing found, suggest creating a custom skill with `bunx skills init`
