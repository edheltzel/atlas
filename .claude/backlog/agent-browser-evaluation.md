# agent-browser Evaluation

**Category:** skills
**Captured:** 2026-01-19
**Status:** research-needed

## Description

Evaluate agent-browser CLI tool as potential alternative or complement to existing Browser skill.

**URL:** https://agent-browser.dev/

## What It Is

Standalone CLI tool for browser automation designed specifically for AI agents.

- **Architecture:** Rust CLI + Node.js daemon (persistent browser between commands)
- **Install:** `npm install -g agent-browser`
- **Key feature:** Accessibility tree refs (`@e1`, `@e2`) instead of CSS selectors

## Key Differences from Current Browser Skill

| Aspect | Current Browser Skill | agent-browser |
|--------|----------------------|---------------|
| Element selection | CSS selectors | Accessibility refs (@e1, @e2) |
| Session persistence | Per-command | Daemon keeps browser alive |
| CLI commands | 3 (screenshot, verify, open) | 50+ |
| Multi-step interactions | Requires TypeScript API | All via CLI |
| Auth flows | Complex (TypeScript) | Simple (session persists) |

## Potential Benefits

1. **Ref system** - More LLM-friendly than constructing CSS selectors
2. **Session persistence** - Login once, stay logged in across commands
3. **More CLI coverage** - click, fill, select, scroll all via CLI
4. **Purpose-built for agents** - Designed for Claude, Cursor, Copilot, etc.

## Concerns to Investigate

- [ ] Another global npm dependency to manage
- [ ] How reliable is the ref system in practice?
- [ ] Performance comparison (daemon startup vs Playwright spawn)
- [ ] Does it handle all Playwright capabilities?
- [ ] How does snapshot output compare to our accessibility tree?

## Integration Options

1. **Replace** - Swap out Playwright for agent-browser entirely
2. **Complement** - Keep both, use agent-browser for multi-step, Playwright for verification
3. **Wrapper** - Add agent-browser as alternative backend in Browser skill
4. **Separate skill** - Create AgentBrowser skill alongside Browser skill

## Research Tasks

- [ ] Install and test basic commands
- [ ] Test auth flow (login, navigate, verify session)
- [ ] Compare snapshot output to Playwright accessibility tree
- [ ] Benchmark startup time vs current approach
- [ ] Test ref stability across page changes
- [ ] Review source code / GitHub issues

## Links

- Homepage: https://agent-browser.dev/
- GitHub: (find repo)
- Documentation: (find docs)

## Related

- [[Browser skill]] - Current browser automation
- [[UI skill]] - Uses Browser for verification phase
