# Atlas as Claude Code Plugin

**Category:** core / modules
**Captured:** 2026-01-17

## Description

Transform Atlas from a standalone configuration system into a proper Claude Code plugin. This would allow Atlas and its modules to be enabled/disabled cleanly, making it easy to test other Claude Code frameworks, tools, and utilities without being locked into Atlas's approach.

## Origin

Desire to explore the Claude Code plugin ecosystem while maintaining Atlas's modular architecture. Avoid painting into a corner with hard dependencies.

**Tools to test:**
- AgentOS
- Ralph Wiggum
- BMAD Method
- Taskmaster
- Spec-kit
- PAI (fresh install, not synced)

**Goal:** Zero friction, plug-and-play. Full swap between Atlas and other tools - not just coexistence.

## Open Questions

- What is the current Claude Code plugin specification/format?
- How do plugins interact with hooks, skills, and commands?
- Can individual Atlas modules become sub-plugins?
- What's the migration path from current structure to plugin format?
- How would enable/disable work for nested modules?
- What does "disable Atlas" actually mean? (remove from settings.json? rename CLAUDE.md?)

## Related Ideas

- [[observability-dashboard-overhaul]] - Both aim for modularity and reduced lock-in
- [[claude-canvas-ghostty-integration]] - Another Claude Code plugin to evaluate/extend
