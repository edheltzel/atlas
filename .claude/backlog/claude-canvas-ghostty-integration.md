# Claude Canvas / Ghostty Integration

**Category:** core / modules
**Captured:** 2026-01-17

## Description

Investigate claude-canvas (TUI toolkit that gives Claude Code its own display) and explore extending it to support Ghostty terminal panes/tabs instead of tmux.

**Source:** https://github.com/dvdsgl/claude-canvas

## What Claude Canvas Does

- TUI toolkit for Claude Code - spawns interactive terminal interfaces
- Use cases: emails, calendars, flight bookings, rich displays
- Currently uses tmux for pane splitting
- TypeScript + Bun stack
- Installs as Claude Code plugin (`/plugin install canvas@claude-canvas`)
- Proof-of-concept, currently unsupported by author

## Goals

1. **Investigate** - Understand the architecture and how panes are spawned
2. **Ghostty support** - Replace/extend tmux dependency with Ghostty panes/tabs
3. **Contribution path** - Either:
   - Fork and maintain Atlas-specific version
   - Create PR upstream to add Ghostty as terminal backend option
4. **Utilities** - Identify additional utilities we could build on this foundation

## Why Ghostty Instead of tmux

- Native terminal experience (no tmux session management overhead)
- Better integration with macOS
- Ghostty's pane/tab API if available
- Cleaner user experience for those not using tmux

## Open Questions

- Does Ghostty have a programmatic API for pane/tab control?
- What's the abstraction layer in claude-canvas for tmux? (easy to swap?)
- Is the project actively maintained? Worth PRing or forking?
- What utilities would we build on top of this?
- How does this interact with Atlas's current terminal workflow?

## Related Ideas

- [[atlas-as-claude-code-plugin]] - Both involve Claude Code plugin ecosystem
