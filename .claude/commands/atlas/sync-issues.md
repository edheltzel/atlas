---
description: "Sync DeepPlan todos with GitHub Issues. Usage: /atlas:sync-issues [push|pull|status|init]"
---

# Sync GitHub Issues

Synchronize DeepPlan task_plan.md checkboxes with GitHub Issues.

## Usage

`/atlas:sync-issues [command]`

**Commands:**
- `sync` (default) - Two-way sync: push local changes, pull remote changes
- `push` - Push plan items to GitHub issues
- `pull` - Pull issue updates back to plan file
- `status` - Show sync status
- `init` - Initialize repo with required labels

## Arguments

`$ARGUMENTS`

## Workflow

1. **Detect Plan File**
   - Look for `task_plan.md` in current directory
   - Fall back to `.claude/plans/` directory

2. **Detect Repository**
   - Read `git remote get-url origin`
   - Parse GitHub owner/repo

3. **Execute Command**

```bash
# Default: two-way sync
bun run ~/.claude/lib/github-sync/index.ts sync

# Push only
bun run ~/.claude/lib/github-sync/index.ts push

# Pull only
bun run ~/.claude/lib/github-sync/index.ts pull

# Show status
bun run ~/.claude/lib/github-sync/index.ts status

# Initialize (creates labels)
bun run ~/.claude/lib/github-sync/index.ts init
```

## Examples

**Initialize a new repo:**
```
/atlas:sync-issues init
```
Creates `atlas-sync`, `pending`, `in-progress`, `completed` labels.

**Push plan to issues:**
```
/atlas:sync-issues push
```
Creates GitHub issues for unchecked items, closes issues for checked items.

**Pull remote changes:**
```
/atlas:sync-issues pull
```
Updates local checkboxes based on issue state (closed -> checked).

**Check status:**
```
/atlas:sync-issues status
```
Shows sync state, linked repo, and item counts.

## Configuration

Settings in `atlas.yaml`:

```yaml
github_sync:
  enabled: true
  auto_sync_on_session_end: true
  labels:
    sync_marker: atlas-sync
    status_pending: pending
    status_in_progress: in-progress
    status_completed: completed
  project: null
  conflict_strategy: newer_wins
```

## State Storage

Sync state is stored in the plan file's frontmatter:

```yaml
---
project: my-project
github_sync:
  repo: owner/repo
  mappings:
    - step: "Implement feature X"
      issue: 42
      synced_at: 2026-01-12T10:00:00Z
---
```
