---
capture_type: LEARNING
timestamp: 2026-01-21 08:27:24 PST
auto_captured: true
tags: [auto-capture]
---

# Quick Learning: Research complete. Plan created with gitignore for sensitive files and migration steps with rollback.

**Date:** 2026-01-21
**Auto-captured:** Yes (use /capture-learning for detailed narrative)

---

## Summary

Researched and created migration plan based on official docs and community best practices.

## Analysis

Key findings from research:

## Actions Taken

Created `Plans/migrate-claude-to-repo.md` with complete steps

## Results

Plan includes .gitignore template, migration steps, rollback plan, verification checklist

## Current Status

Ready for review

## Next Steps

Review plan at `Plans/migrate-claude-to-repo.md` and approve to proceed

---

## Notes

This is an automatically captured learning moment. For a more detailed narrative with:
- The full problem-solving journey
- What we initially thought vs. what was true
- Detailed troubleshooting steps
- Comprehensive lesson learned

Use: `/capture-learning` to create a full learning document.

---

## Full Response

<details>
<summary>Click to view full response</summary>

📋 SUMMARY: Researched and created migration plan based on official docs and community best practices.

🔍 ANALYSIS: Key findings from research:

**❌ MUST EXCLUDE (Sensitive)**
| File/Dir | Reason |
|----------|--------|
| `.env` | API keys |
| `history.jsonl` | Conversation history with potential secrets |
| `settings.local.json` | Contains tokens ([known security issue](https://github.com/anthropics/claude-code/issues/13106)) |
| `MEMORY/` | Session captures, personal context |
| `USER/` | Personal configs, private patterns |

**❌ MUST EXCLUDE (Ephemeral)**
| File/Dir | Reason |
|----------|--------|
| `cache/`, `file-history/`, `session-env/` | Session-specific |
| `statsig/`, `telemetry/`, `stats-cache.json` | Analytics/cache |
| `todos/`, `projects/`, `debug/`, `ide/`, `plans/` | Runtime state |
| `shell-snapshots/` | Shell state |

**✅ SAFE TO VERSION**
| File/Dir | Reason |
|----------|--------|
| `skills/`, `hooks/`, `lib/` | PAI code |
| `PAISECURITYSYSTEM/` | Base security (not USER tier) |
| `VoiceServer/`, `Observability/` | Code (not logs) |
| `settings.json` | Config (sanitize sensitive values) |
| `CLAUDE.md`, `install.ts` | Docs/scripts |
| `agents/`, `plugins/`, `chrome/` | Definitions |

⚡ ACTIONS: Created `Plans/migrate-claude-to-repo.md` with complete steps

✅ RESULTS: Plan includes .gitignore template, migration steps, rollback plan, verification checklist

📊 STATUS: Ready for review

➡️ NEXT: Review plan at `Plans/migrate-claude-to-repo.md` and approve to proceed

**Sources:**
- [Claude Code Settings Docs](https://code.claude.com/docs/en/settings)
- [GitHub Issue #13106 - Sensitive tokens](https://github.com/anthropics/claude-code/issues/13106)
- [ZacheryGlass .gitignore example](https://github.com/ZacheryGlass/.claude/blob/master/.gitignore)
- [Claude Code Showcase](https://github.com/ChrisWiles/claude-code-showcase)

🗣️ Atlas: Research complete. Plan created with gitignore for sensitive files and migration steps with rollback.

</details>
