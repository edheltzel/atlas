---
name: install-backend
description: Install the curated backend skill stack for a project. Bun, Hono, Cloudflare Workers, D1, Postgres, SQLite. USE WHEN install backend skills, backend stack, setup backend, new backend project, api project setup, hono project, cloudflare workers project.
---

# Install Backend Stack

Installs the curated backend development skill stack into the current project for all agents (claude-code, opencode, gemini-cli).

## Curated Skill List

### Framework (yusukebe/hono-skill)
| Skill | Source | Purpose |
|-------|--------|---------|
| `hono` | `yusukebe/hono-skill` | Hono framework best practices (by Hono creator) |

### Platform (cloudflare/skills — official)
| Skill | Source | Purpose |
|-------|--------|---------|
| `cloudflare` | `cloudflare/skills` | Comprehensive Workers, Pages, KV, D1, R2 platform skill |
| `wrangler` | `cloudflare/skills` | Wrangler CLI for deployment and development |

### Database (supabase/agent-skills)
| Skill | Source | Purpose |
|-------|--------|---------|
| `supabase-postgres-best-practices` | `supabase/agent-skills` | Postgres optimization, 8 categories, prioritized by impact |

### Authentication (better-auth/skills)
| Skill | Source | Purpose |
|-------|--------|---------|
| `better-auth-best-practices` | `better-auth/skills` | Better Auth TypeScript authentication framework integration |
| `create-auth-skill` | `better-auth/skills` | Create auth layers in TypeScript/JavaScript apps using Better Auth |

### Testing (anthropics/skills)
| Skill | Source | Purpose |
|-------|--------|---------|
| `webapp-testing` | `anthropics/skills` | Playwright-based UI and API testing |

## Execution

### Step 1: Show the Plan

Display the skill list above and tell the user:

```
Backend Stack Install Plan

The following skills will be installed to this project for claude-code, opencode, and gemini-cli:

Source: yusukebe/hono-skill
  - hono

Source: cloudflare/skills (official)
  - cloudflare
  - wrangler

Source: supabase/agent-skills
  - supabase-postgres-best-practices

Source: better-auth/skills
  - better-auth-best-practices
  - create-auth-skill

Source: anthropics/skills
  - webapp-testing

Scope: current project (not global). Confirm to proceed.
```

### Step 2: Wait for Confirmation

Do NOT proceed until the user explicitly confirms.

### Step 3: Install Skills

Run these commands sequentially. Report progress after each:

```bash
bunx skills add yusukebe/hono-skill \
  -a claude-code -a opencode -a gemini-cli \
  --skill hono -y
```

```bash
bunx skills add cloudflare/skills \
  -a claude-code -a opencode -a gemini-cli \
  --skill cloudflare \
  --skill wrangler -y
```

```bash
bunx skills add supabase/agent-skills \
  -a claude-code -a opencode -a gemini-cli \
  --skill supabase-postgres-best-practices -y
```

```bash
bunx skills add better-auth/skills \
  -a claude-code -a opencode -a gemini-cli \
  --skill better-auth-best-practices \
  --skill create-auth-skill -y
```

```bash
bunx skills add anthropics/skills \
  -a claude-code -a opencode -a gemini-cli \
  --skill webapp-testing -y
```

### Step 4: Search for Additional Skills

After the core install, search for additional backend skills:

```bash
bunx skills find bun
bunx skills find d1 sqlite
bunx skills find api best practices
```

Present any results found and offer to install them.

### Step 5: Verify

Run `bunx skills list` to confirm all skills were installed. Report the final state.

## Notes

- All installs are **per-project** (no `-g` flag)
- Uses `-y` flag after user confirmation to skip redundant CLI prompts
- If any install fails, report the error and continue with remaining skills
- The Hono skill is by Yusuke Wada (Hono creator) — authoritative source
- Cloudflare skills are from the official `cloudflare/skills` repo
