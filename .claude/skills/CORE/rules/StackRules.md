# Stack Preferences

**Load when:** Writing code, choosing tools, setting up projects.

---

## Language Priority

| Priority | Language | Use Case |
|----------|----------|----------|
| 1 | TypeScript | Primary for all new code |
| 2 | Python | Data science, ML, when required |

## Package Managers

| Language | Use | Never Use |
|----------|-----|-----------|
| JavaScript/TypeScript | bun | npm, yarn, pnpm |
| Python | uv | pip, pip3 |

## Runtime

- **JavaScript Runtime:** Bun
- **Serverless:** Cloudflare Workers

## Markup

- **Markdown** for all content, docs, notes
- **YAML** for configuration, frontmatter
- **JSON** for API responses, data
- **Never** use HTML for basic content

## Code Style

- Prefer explicit over clever
- No unnecessary abstractions
- Comments only where logic isn't self-evident
- Error messages should be actionable
