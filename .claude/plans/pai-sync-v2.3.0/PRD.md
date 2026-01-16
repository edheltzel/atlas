# PAI v2.3.0 Sync - Product Requirements Document

**Version:** 1.0.0
**Date:** 2026-01-16
**Status:** Draft - Pending Review
**Author:** Atlas + Ed

---

## Executive Summary

This PRD defines a comprehensive sync of PAI v2.3.0 features into Atlas. This is treated as a **major overhaul** requiring:

- Detailed evaluation of PAI source files (no assumptions)
- Detailed evaluation of Atlas target codebase (no orphans or conflicts)
- Git worktrees for isolated development per phase
- Comprehensive testing at each phase
- Documentation updates throughout

**Estimated Total Effort:** 20-40 hours across 5 phases

---

## Objectives

### Primary Goals

1. **Continuous Learning System** - Port PAI's flagship v2.3.0 feature (sentiment capture → learning signal → pattern extraction)
2. **Named Agents Enhancement** - Upgrade Atlas codenames to full PAI-style agent personas
3. **Memory System Alignment** - Align Atlas memory structure with PAI's 4-tier model
4. **Status Line Enhancement** - Add learning signal display
5. **TELOS Expansion** - Expand single file to PAI's 10-file structure

### Non-Goals (Explicitly Out of Scope)

- Pack system adoption (Atlas uses modules - different approach, intentional)
- Response format overhaul (Atlas has voice feedback patterns, keep them)
- Security system changes (Atlas has superior 10-tier system)
- Hook library restructure (keep Atlas's existing lib/ structure)

---

## Phase Overview

| Phase | Name | Worktree Branch | Estimated Effort |
|-------|------|-----------------|------------------|
| 0 | Audit & Analysis | `sync/phase-0-audit` | 2-4 hours |
| 1 | Memory Infrastructure | `sync/phase-1-memory` | 4-6 hours |
| 2 | Sentiment Capture Hooks | `sync/phase-2-sentiment` | 6-8 hours |
| 3 | Learning Extraction | `sync/phase-3-learning` | 4-6 hours |
| 4 | Named Agents & Status Line | `sync/phase-4-agents` | 4-6 hours |

---

## Success Criteria

### Phase 0: Audit Complete
- [ ] Complete inventory of PAI v2.3.0 files to sync
- [ ] Complete inventory of Atlas files that will be affected
- [ ] Conflict analysis document produced
- [ ] No assumptions - every file evaluated

### Phase 1: Memory Infrastructure
- [ ] `MEMORY/Learning/Signals/` directory structure exists
- [ ] `ratings.jsonl` schema defined and documented
- [ ] Existing Atlas memory system not broken
- [ ] All memory paths updated in relevant hooks/skills

### Phase 2: Sentiment Capture
- [ ] ExplicitRatingCapture hook works (detects "8", "8 - great work")
- [ ] ImplicitSentimentCapture hook works (AI inference)
- [ ] Both write to `ratings.jsonl` correctly
- [ ] Hooks coordinate (explicit takes priority over implicit)
- [ ] Voice system not disrupted
- [ ] 10+ test cases pass

### Phase 3: Learning Extraction
- [ ] WorkCompletionLearning hook extracts insights at SessionEnd
- [ ] Learning files created in correct category directories
- [ ] Low ratings (< 6) automatically trigger learning capture
- [ ] Existing stop hooks not disrupted

### Phase 4: Agents & Status Line
- [ ] Named agents have full backstories (Engineer, Architect, etc.)
- [ ] Status line shows learning signal with trend
- [ ] Voice IDs correctly mapped
- [ ] TELOS expanded to 10-file structure (optional)

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing voice hooks | Medium | High | Worktree isolation, comprehensive testing |
| Memory path conflicts | Medium | Medium | Full audit in Phase 0 |
| Sentiment hook performance (AI inference) | Low | Medium | Timeout handling, async execution |
| settings.json conflicts | Medium | High | Backup before each phase, incremental merges |
| Orphaned files after refactor | Medium | Low | Explicit file tracking in audit |

---

## Technical Constraints

1. **Runtime:** All hooks must use Bun (never Node.js)
2. **Config:** Use `atlas.yaml` for new config (not settings.json where possible)
3. **Voice:** Must not break existing `🎯 COMPLETED:` / `🔔 AWAITING:` patterns
4. **Security:** New hooks must not bypass security-validator.ts
5. **Memory:** Must use `$PAI_DIR` or `~/.claude` paths consistently

---

## Dependencies

### External Dependencies
- PAI v2.3.0 source at `~/Developer/AI/PAI`
- ElevenLabs API (for sentiment hook - uses inference)
- Anthropic API (for ImplicitSentimentCapture inference)

### Internal Dependencies
- Phase 1 must complete before Phase 2 (memory structure needed)
- Phase 2 must complete before Phase 3 (ratings.jsonl needed)
- Phase 0 audit informs all subsequent phases

---

## Testing Strategy

Each phase has:
1. **Unit Tests** - Individual function/hook tests
2. **Integration Tests** - Hook interaction tests
3. **Manual Tests** - Real session tests with checklist
4. **Regression Tests** - Ensure existing features still work

### Test Environments
- **Worktree:** Isolated development and initial testing
- **Main Branch:** Final integration testing after merge

---

## Rollback Plan

Each phase is a separate PR from a worktree:
1. If issues found post-merge, revert the specific PR
2. Worktrees preserved until phase verified stable (7 days)
3. Full backup of `~/.claude` before Phase 1 begins

---

## Documentation Updates Required

| Document | Update Needed |
|----------|---------------|
| `.claude/docs/HOOKS-SYSTEM.md` | Add new sentiment/learning hooks |
| `.claude/docs/VOICE-SYSTEM.md` | Document any voice changes |
| `CLAUDE.md` | Update if skill count or structure changes |
| `.claude/skills/CORE/SKILL.md` | Add rating patterns documentation |
| `README.md` | Update feature list |

---

## Approval Checklist

- [ ] PRD reviewed by Ed
- [ ] Phase 0 audit completed
- [ ] Each phase plan reviewed before starting
- [ ] Test strategy approved

---

## Related Documents

- [Phase 0: Audit Plan](./phase-0-audit.md)
- [Phase 1: Memory Infrastructure Plan](./phase-1-memory.md)
- [Phase 2: Sentiment Capture Plan](./phase-2-sentiment.md)
- [Phase 3: Learning Extraction Plan](./phase-3-learning.md)
- [Phase 4: Agents & Status Line Plan](./phase-4-agents.md)

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-16 | Initial PRD |
