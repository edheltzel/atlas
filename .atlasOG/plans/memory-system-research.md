# PAI Memory System - Deep Research Plan

**Status:** RESEARCH COMPLETE
**Created:** 2026-01-19
**Phase:** Analysis & Gap Identification

---

## Executive Summary

The PAI Memory System is a three-tier persistent memory architecture designed to capture, synthesize, and archive operational data across Claude Code sessions. This research maps every file interaction, documents the intended vs actual implementation, and identifies gaps.

---

## Architecture Overview

### Three-Tier Memory Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    PAI MEMORY SYSTEM                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TIER 1: CAPTURE (Hot)                                         │
│  ├── State/          Real-time operational state               │
│  │   ├── active-work.json      Current task                    │
│  │   ├── algorithm-stats.json  Execution statistics            │
│  │   ├── algorithm-streak.json Consecutive compliance          │
│  │   └── agent-sessions.json   Session→agent mapping           │
│  │                                                              │
│  └── Work/           Per-task execution traces                 │
│      └── {task}/                                                │
│          ├── current-isc.json  ISC table state                 │
│          ├── Work.md           Goal and result                 │
│          ├── TRACE.jsonl       Decision trace                  │
│          └── Output/           Deliverables                    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TIER 2: SYNTHESIS (Warm)                                      │
│  ├── Learning/       Phase-organized insights                  │
│  │   ├── OBSERVE/                                               │
│  │   ├── THINK/                                                 │
│  │   ├── PLAN/                                                  │
│  │   ├── BUILD/                                                 │
│  │   ├── EXECUTE/                                               │
│  │   ├── VERIFY/                                                │
│  │   ├── ALGORITHM/                                             │
│  │   ├── SYSTEM/                                                │
│  │   └── Signals/ratings.jsonl                                 │
│  │                                                              │
│  └── Signals/        Pattern detection                         │
│      ├── failures.jsonl    VERIFY failures                     │
│      ├── loopbacks.jsonl   Phase regressions                   │
│      ├── patterns.jsonl    Aggregated anomalies                │
│      └── sentiment.jsonl   User satisfaction                   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TIER 3: APPLICATION (Cold)                                    │
│  ├── History/        Categorized archives                      │
│  │   ├── raw/YYYY-MM/        All events (JSONL)               │
│  │   ├── research/YYYY-MM/   Research outputs                  │
│  │   ├── decisions/YYYY-MM/  Architecture decisions            │
│  │   ├── learnings/YYYY-MM/  Learning artifacts                │
│  │   ├── sessions/YYYY-MM/   Session summaries                 │
│  │   └── execution/YYYY-MM/  Execution logs                    │
│  │                                                              │
│  ├── SECURITY/YYYY/MM/   Security event logs                   │
│  └── cache/              Cached patterns/rules                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Interaction Map

### Hooks That WRITE to Memory (8 hooks)

| Hook | Trigger | Write Path | Data Type |
|------|---------|------------|-----------|
| `initialize-session.ts` | SessionStart | `.current-session` | JSON marker |
| `capture-all-events.ts` | All events | `History/raw/YYYY-MM/*.jsonl` | JSONL stream |
| `capture-all-events.ts` | Task tool | `State/agent-sessions.json` | JSON mapping |
| `capture-history.ts` | All events | `History/{category}/YYYY-MM/` | Categorized JSONL |
| `capture-session-summary.ts` | SessionEnd | `History/sessions/YYYY-MM/` | Markdown |
| `stop-hook.ts` | Stop | `History/learnings/` or `sessions/` | Markdown |
| `subagent-stop-hook.ts` | SubagentStop | `History/research/` or `decisions/` | Markdown |

### Hooks That READ from Memory (4 hooks)

| Hook | Read Path | Purpose |
|------|-----------|---------|
| `load-core-context.ts` | `State/active-work.json` | Inject current task |
| `stop-hook-voice.ts` | `State/current-personality.txt` | Voice personality |
| `subagent-stop-hook-voice.ts` | `State/current-personality.txt` | Agent voice |
| `capture-session-summary.ts` | `History/raw-outputs/` | Build summary |

### Algorithm Skill Tools That Use Memory (4 tools)

| Tool | Read Path | Write Path |
|------|-----------|------------|
| `ISCManager.ts` | `Work/current-isc.json` | `Work/current-isc.json` |
| `AlgorithmDisplay.ts` | `State/algorithm-state.json`, `Work/current-isc.json` | `State/algorithm-state.json` |
| `RalphLoopExecutor.ts` | `State/ralph-loop.local.md` | `State/ralph-loop.local.md` |

---

## Data Flow Diagram

```
┌──────────────────┐
│   User Prompt    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     ┌─────────────────────────────┐
│  SessionStart    │────▶│ load-core-context.ts        │
│  (3 hooks)       │     │ • Reads State/active-work   │
└────────┬─────────┘     │ • Reads TELOS.md            │
         │               │ • Injects context           │
         ▼               └─────────────────────────────┘
┌──────────────────┐
│  Tool Execution  │
└────────┬─────────┘
         │
         ├──────────────▶ security-validator.ts (PreToolUse)
         │                • Blocks dangerous commands
         │                • Reads security/patterns.yaml
         │
         ├──────────────▶ capture-all-events.ts (All events)
         │                • Writes History/raw/YYYY-MM/*.jsonl
         │                • Updates State/agent-sessions.json
         │
         └──────────────▶ capture-history.ts (All events)
                          • Categorizes and routes events
                          • Writes to History/{category}/
         │
         ▼
┌──────────────────┐     ┌─────────────────────────────┐
│  Stop Event      │────▶│ stop-hook.ts                │
│  (Main Agent)    │     │ • Detects learning moments  │
└────────┬─────────┘     │ • Writes learnings/sessions │
         │               └─────────────────────────────┘
         │
         └──────────────▶ stop-hook-voice.ts
                          • Reads transcript
                          • Reads State/current-personality
                          • Announces completion
         │
         ▼
┌──────────────────┐     ┌─────────────────────────────┐
│  SubagentStop    │────▶│ subagent-stop-hook.ts       │
│  Event           │     │ • Routes by agent type      │
└────────┬─────────┘     │ • Writes research/decisions │
         │               └─────────────────────────────┘
         │
         ▼
┌──────────────────┐     ┌─────────────────────────────┐
│  SessionEnd      │────▶│ capture-session-summary.ts  │
└──────────────────┘     │ • Reads raw events          │
                         │ • Writes session summary    │
                         └─────────────────────────────┘
```

---

## Complete File Inventory

### State Files (Tier 1 - Hot)

| File | Purpose | Format | Updated By |
|------|---------|--------|------------|
| `State/active-work.json` | Current task | JSON | Algorithm tools |
| `State/algorithm-stats.json` | Execution stats | JSON | Algorithm tools |
| `State/algorithm-streak.json` | Compliance streak | JSON | Algorithm tools |
| `State/agent-sessions.json` | Session mapping | JSON | capture-all-events |
| `State/current-personality.txt` | Voice personality | Text | Manual/skill |
| `State/ralph-loop.local.md` | Ralph loop state | Markdown | RalphLoopExecutor |

### Signal Files (Tier 2 - Warm)

| File | Purpose | Format | Updated By |
|------|---------|--------|------------|
| `Signals/failures.jsonl` | VERIFY failures | JSONL | Algorithm (designed) |
| `Signals/loopbacks.jsonl` | Phase regressions | JSONL | Algorithm (designed) |
| `Signals/patterns.jsonl` | Weekly patterns | JSONL | Aggregation (designed) |
| `Signals/sentiment.jsonl` | User sentiment | JSONL | Hooks |
| `Learning/Signals/ratings.jsonl` | User ratings | JSONL | Rating capture |

### History Files (Tier 3 - Cold)

| Directory | Purpose | Format | Updated By |
|-----------|---------|--------|------------|
| `History/raw/YYYY-MM/` | All events | JSONL | capture-all-events |
| `History/research/YYYY-MM/` | Research outputs | Markdown | subagent-stop-hook |
| `History/decisions/YYYY-MM/` | Architecture decisions | Markdown | subagent-stop-hook |
| `History/learnings/YYYY-MM/` | Learning artifacts | Markdown | stop-hook |
| `History/sessions/YYYY-MM/` | Session summaries | Markdown | capture-session-summary |
| `History/execution/YYYY-MM/` | Execution logs | Markdown | subagent-stop-hook |

### Security Files

| File | Purpose | Format | Updated By |
|------|---------|--------|------------|
| `SECURITY/YYYY/MM/security-*.jsonl` | Security events | JSONL | security-validator |
| `cache/security-patterns.json` | Cached rules | JSON | Security system |

---

## Implementation Gap Analysis

### DESIGNED but NOT IMPLEMENTED

| Feature | Documented In | Status | Gap |
|---------|---------------|--------|-----|
| `failures.jsonl` writes | MEMORYSYSTEM.md | Empty file | No hook writes VERIFY failures |
| `loopbacks.jsonl` writes | MEMORYSYSTEM.md | Empty file | No hook detects phase regressions |
| `patterns.jsonl` aggregation | MEMORYSYSTEM.md | Empty file | No weekly aggregation job |
| Per-task Work directories | MEMORYSYSTEM.md | Partial | ISCManager uses flat `current-isc.json` |
| Learning curation criteria | MEMORYSYSTEM.md | Not enforced | stop-hook doesn't filter quality |
| Retention policies | MEMORYSYSTEM.md | Not implemented | No cleanup/archival automation |

### IMPLEMENTED but NOT DOCUMENTED

| Feature | Location | Status |
|---------|----------|--------|
| `agent-sessions.json` | capture-all-events.ts | Works, not in docs |
| `current-personality.txt` | prosody-enhancer.ts | Works, not in docs |
| Categorized history routing | capture-history.ts | Works, minimal docs |

### Path Inconsistencies

| Issue | Details |
|-------|---------|
| `history/` vs `MEMORY/History/` | Some hooks use `history/`, others use `MEMORY/History/` |
| `$PAI_DIR` vs `~/.claude` | Inconsistent base path references |
| Symlink complexity | User `~/.claude/MEMORY/` symlinks to atlas `.claude/MEMORY/` |

---

## Recommendations

### Priority 1: Fix Signal Writes

1. **Add VERIFY failure capture** - Hook into Algorithm VERIFY phase to write `failures.jsonl`
2. **Add loopback detection** - Track phase transitions, log regressions to `loopbacks.jsonl`
3. **Implement aggregation** - Weekly cron/hook to aggregate patterns

### Priority 2: Standardize Paths

1. **Define canonical `MEMORY_DIR`** environment variable
2. **Update all hooks** to use consistent path resolution
3. **Document symlink strategy** clearly

### Priority 3: Implement Retention

1. **Add cleanup job** for rolling retention (30/90 day windows)
2. **Implement archival** to compress old months
3. **Add recovery snapshots** for critical state files

### Priority 4: Enhance Learning Quality

1. **Add quality criteria** to stop-hook learning detection
2. **Implement deduplication** for similar learnings
3. **Add tagging/categorization** beyond phase-based organization

---

## Related Documentation

- `MEMORYSYSTEM.md` - Design specification
- `THEHOOKSYSTEM.md` - Hook architecture
- `PAISYSTEMARCHITECTURE.md` - Founding principles
- `BACKUPS.md` - Backup strategies

---

## Notes

This research identified the Memory System as **partially implemented**:
- Core capture functionality works well
- Synthesis tier (signals, learning curation) is incomplete
- Retention/archival automation is missing
- Path inconsistencies create confusion

The three-tier model is sound but needs implementation work to match the design.
