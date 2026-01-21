# Local Commands

This directory contains **machine-specific commands** that are not tracked in git.

## Purpose

Place commands here that:
- Reference local paths specific to your machine
- Contain personal configurations
- Sync with local repositories or tools

## Usage

Create `.md` files following the standard command format:

```markdown
---
description: "What this command does"
argument-hint: "[optional args]"
---

# Command Name

Instructions for Claude...
```

Commands will be available as `/local:<filename>` (without `.md`).

## Example

A command at `local/sync-pai.md` becomes `/local:sync-pai`.
