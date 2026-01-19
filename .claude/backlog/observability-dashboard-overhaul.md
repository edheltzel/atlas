# Observability Dashboard Overhaul

**Category:** observability
**Captured:** 2026-01-17

## Description

Transform the current Vue-based observability dashboard into a standalone, LLM-agnostic application. Goals:

1. **Framework migration** - Move from Vue to React/Next.js or Astro
2. **UX improvements** - Tooltips, explanations, better data visualization
3. **Accessibility** - Welcoming for first-time users AND seasoned practitioners
4. **Standalone product** - Eventually break off from Atlas as its own tool
5. **LLM-agnostic** - Support any AI coding agent, not just Claude Code

## Target Platforms

- Claude Code (current)
- OpenAI Codex (any model)
- Factory AI (droids)
- Manus AI
- DeepSeek
- Ollama (local models)

## Technical Requirements

- TypeScript (strict)
- Linting + formatting on every file edit (automated)
- Consistent coding standards enforced
- Use Atlas UI skill for design work
- Architectural decision needed: Next.js vs pure React vs Astro

## Origin

Current observability dashboard works but is tightly coupled to Atlas and Claude Code. The data it surfaces is valuable for anyone doing agentic coding, regardless of their tool choice. Making it universal increases its utility and potential user base.

## Open Questions

- What's the right framework? (Next.js for SSR/routing, Astro for static, pure React for simplicity)
- What data format would be universal across different AI agents?
- How do different agents expose their telemetry/logs?
- What metrics matter most to newcomers vs power users?
- Should it be a desktop app (Electron/Tauri) or web-only?
- What's the MVP feature set for standalone release?

## Related Ideas

- [[atlas-as-claude-code-plugin]] - Both aim for modularity and reduced lock-in
- [[ui-skills-integration]] - Use for frontend development standards
