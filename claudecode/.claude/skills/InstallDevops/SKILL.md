---
name: install-devops
description: USE WHEN install devops skills, devops stack, setup devops, infrastructure skills, deployment skills, cloudflare project setup.
---

# Install DevOps Stack

Installs the curated DevOps and infrastructure skill stack into the current project for all agents (claude-code, opencode, gemini-cli).

## Curated Skill List

### Cloudflare Platform (cloudflare/skills — official)
| Skill | Purpose |
|-------|---------|
| `cloudflare` | Comprehensive Workers, Pages, KV, D1, R2, AI, WAF, DDoS skill |
| `wrangler` | Wrangler CLI for deploying and managing all Cloudflare services |
| `durable-objects` | Stateful coordination, SQLite storage, WebSockets, alarms |
| `web-perf` | Core Web Vitals analysis via Chrome DevTools |
| `agents-sdk` | Building stateful AI agents on Cloudflare |
| `building-mcp-server-on-cloudflare` | Remote MCP servers on Workers with OAuth |

### Web Quality (addyosmani/web-quality-skills)
| Skill | Purpose |
|-------|---------|
| `accessibility` | WCAG 2.1 accessibility audit |
| `best-practices` | Modern web development and security standards |
| `core-web-vitals` | LCP, INP, CLS optimization |
| `performance` | Page speed and loading optimization |
| `seo` | Search engine visibility |
| `web-quality-audit` | Comprehensive Lighthouse-based audit |

### Testing (anthropics/skills)
| Skill | Purpose |
|-------|---------|
| `webapp-testing` | Playwright-based testing for web applications |

## Execution

### Step 1: Show the Plan

Display the skill list above and tell the user:

```
DevOps Stack Install Plan

The following skills will be installed to this project for claude-code, opencode, and gemini-cli:

Source: cloudflare/skills (official)
  - cloudflare, wrangler, durable-objects, web-perf, agents-sdk, building-mcp-server-on-cloudflare

Source: addyosmani/web-quality-skills
  - accessibility, best-practices, core-web-vitals, performance, seo, web-quality-audit

Source: anthropics/skills
  - webapp-testing

Scope: current project (not global). Confirm to proceed.
```

### Step 2: Wait for Confirmation

Do NOT proceed until the user explicitly confirms.

### Step 3: Install Skills

Run these commands sequentially. Report progress after each:

```bash
bunx skills add cloudflare/skills \
  -a claude-code -a opencode -a gemini-cli \
  --skill cloudflare \
  --skill wrangler \
  --skill durable-objects \
  --skill web-perf \
  --skill agents-sdk \
  --skill building-mcp-server-on-cloudflare -y
```

```bash
bunx skills add addyosmani/web-quality-skills \
  -a claude-code -a opencode -a gemini-cli -y
```

```bash
bunx skills add anthropics/skills \
  -a claude-code -a opencode -a gemini-cli \
  --skill webapp-testing -y
```

### Step 4: Search for Additional Skills

After the core install, search for additional DevOps skills:

```bash
bunx skills find github actions
bunx skills find docker
bunx skills find ci cd pipeline
bunx skills find terraform
```

Present any results found and offer to install them.

### Step 5: Verify

Run `bunx skills list` to confirm all skills were installed. Report the final state.

## Notes

- All installs are **per-project** (no `-g` flag)
- Uses `-y` flag after user confirmation to skip redundant CLI prompts
- If any install fails, report the error and continue with remaining skills
- All Cloudflare skills are from the official `cloudflare/skills` repo
- For Cloudflare API operations, also consider the Cloudflare MCP server
