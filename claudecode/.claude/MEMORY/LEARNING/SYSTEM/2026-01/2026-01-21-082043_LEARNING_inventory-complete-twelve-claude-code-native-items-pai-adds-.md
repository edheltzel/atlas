---
capture_type: LEARNING
timestamp: 2026-01-21 08:20:43 PST
auto_captured: true
tags: [auto-capture]
---

# Quick Learning: Inventory complete. Twelve Claude Code native items, PAI adds eight directories plus twenty-one skills and fifteen hooks.

**Date:** 2026-01-21
**Auto-captured:** Yes (use /capture-learning for detailed narrative)

---

## Summary

Complete inventory of `~/.claude` directory categorized by origin.

## Analysis

N/A

## Actions Taken

N/A

## Results

N/A

## Current Status

Inventory complete

## Next Steps

N/A

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

📋 SUMMARY: Complete inventory of `~/.claude` directory categorized by origin.

---

## **Claude Code (Default/Native)**

These are created/managed by Claude Code CLI:

| Path | Purpose |
|------|---------|
| `cache/` | Internal caching |
| `file-history/` | File edit history (per session) |
| `history.jsonl` | Conversation history |
| `ide/` | IDE integration config |
| `projects/` | Per-project settings |
| `session-env/` | Session environment data |
| `shell-snapshots/` | Shell state snapshots |
| `statsig/` | Feature flags |
| `stats-cache.json` | Stats caching |
| `telemetry/` | Telemetry data |
| `todos/` | Todo persistence |
| `settings.json` | Config file (shared with PAI) |
| `CLAUDE.md` | User instructions (shared with PAI) |

---

## **PAI (Personal AI Infrastructure)**

These are from PAI installation:

### Core Structure
| Path | Purpose |
|------|---------|
| `skills/` | 21 skill modules |
| `hooks/` | 15 lifecycle hooks + handlers + lib |
| `MEMORY/` | Learning, state, voice logs, work items |
| `USER/` | Personal configs (never synced) |
| `PAISECURITYSYSTEM/` | Security patterns |
| `VoiceServer/` | TTS server + menubar app |
| `Observability/` | Agent monitoring dashboard |
| `lib/` | Shared utilities |
| `Plans/` | Plan mode working files |

### PAI Files
| File | Purpose |
|------|---------|
| `install.ts` | PAI installer |
| `INSTALL.md` | Installation docs |
| `.env` | API keys (ElevenLabs, etc.) |
| `statusline-command.sh` | Status line script |

### Skills (21 total)
```
Agents, AnnualReports, Art, BrightData, Browser, CORE,
Council, CreateCLI, CreateSkill, FirstPrinciples, OSINT,
PAIUpgrade, PrivateInvestigator, Prompting, Recon, RedTeam,
Research, System, Telos, THEALGORITHM, UIDesign
```

### Hooks (15 total)
```
AgentOutputCapture, AutoWorkCreation, CheckVersion,
ExplicitRatingCapture, FormatEnforcer, ImplicitSentimentCapture,
LoadContext, QuestionAnswered, SecurityValidator, SessionSummary,
SetQuestionTab, StartupGreeting, StopOrchestrator,
UpdateTabTitle, WorkCompletionLearning
```

---

## **Claude Desktop**

| Path | Purpose |
|------|---------|
| `~/Library/Application Support/Claude/` | Desktop app config (empty/not installed) |

---

## **Shared (Both CC + PAI)**

| Path | Owner | Notes |
|------|-------|-------|
| `settings.json` | PAI extends CC schema | Contains both CC and PAI config |
| `CLAUDE.md` | PAI uses for instructions | CC reads, PAI writes |
| `agents/` | CC native | PAI may use for custom agents |
| `plugins/` | CC native | Currently empty |
| `chrome/` | CC native | Browser integration |
| `debug/` | CC native | Debug output |

---

## Summary Counts

| Category | Items |
|----------|-------|
| **Claude Code native** | ~12 directories/files |
| **PAI additions** | ~8 directories + 21 skills + 15 hooks |
| **Claude Desktop** | Not installed |
| **Shared** | ~5 items |

📊 STATUS: Inventory complete

🗣️ Atlas: Inventory complete. Twelve Claude Code native items, PAI adds eight directories plus twenty-one skills and fifteen hooks.

</details>
