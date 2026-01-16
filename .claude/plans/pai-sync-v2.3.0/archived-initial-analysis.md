# PAI v2.3.0 → Atlas Sync Analysis

**Date:** 2026-01-16
**PAI Version:** v2.3.0 (skipped v2.2.0)
**Atlas Version:** v0.1.0 (tagged today)

---

## Executive Summary

PAI v2.3.0 introduces a **Continuous Learning System** as its flagship feature—capturing user feedback (explicit ratings + implicit sentiment) and using it to improve over time. This is the main area where Atlas can benefit from syncing or recreating features.

---

## Feature Comparison Matrix

| Feature Area | PAI v2.3.0 | Atlas v0.1.0 | Gap |
|--------------|-----------|--------------|-----|
| **Skills** | 20 skills | 12 skills | Atlas has less but similar core |
| **Named Agents** | 11 with full backstories | Codenames only | **HIGH** |
| **Algorithm/ISC** | THEALGORITHM (7 phases, ISC) | Algorithm (identical) | None |
| **Hook System** | 14 hooks | 13 hooks | Minor |
| **Memory System** | 4-tier (SESSIONS/SIGNALS/LEARNINGS/RESEARCH) | 3-tier (State/Work/Learning) | **MEDIUM** |
| **Voice System** | ElevenLabs + fallback | ElevenLabs + Google | None |
| **Security** | `.pai-protected.json` | 10-tier `patterns.yaml` | None (Atlas better) |
| **Observability** | Vue dashboard | Vue dashboard | None |
| **Modular Install** | 23 Packs | 8 Modules | Different approach |
| **Sentiment Capture** | Explicit + Implicit hooks | **MISSING** | **HIGH** |
| **ratings.jsonl** | Unified learning signal | **MISSING** | **HIGH** |
| **Learning Extraction** | WorkCompletionLearning hook | **MISSING** | **HIGH** |
| **Status Line** | Learning signal display | Basic | **MEDIUM** |
| **TELOS Templates** | 10 files (MISSION, GOALS, etc.) | TELOS.md only | **LOW** |

---

## PAI v2.3.0 NEW Features (Not in Atlas)

### 1. Continuous Learning System (HIGHEST PRIORITY)

The flagship v2.3 feature—Atlas should prioritize this.

**Components:**

#### a) ExplicitRatingCapture Hook
- **Event:** UserPromptSubmit
- **Function:** Detects when user types "8" or "8 - great work"
- **Output:** Writes to `MEMORY/LEARNING/SIGNALS/ratings.jsonl`
- **Auto-capture:** Low ratings (< 6) trigger learning capture
- **Location:** `hooks/ExplicitRatingCapture.hook.ts`

#### b) ImplicitSentimentCapture Hook
- **Event:** UserPromptSubmit
- **Function:** Uses AI inference (Sonnet) to detect sentiment from natural language
- **Examples:** "This is amazing!" → 9.0, "What the fuck?" → 1-2
- **Output:** Same `ratings.jsonl` with `source: "implicit"`
- **Location:** `hooks/ImplicitSentimentCapture.hook.ts`

#### c) WorkCompletionLearning Hook
- **Event:** SessionEnd
- **Function:** Extracts insights from completed work to LEARNING directory
- **Output:** `MEMORY/LEARNING/{category}/{YYYY-MM}/` markdown files
- **Location:** `hooks/WorkCompletionLearning.hook.ts`

#### d) ratings.jsonl (Unified Signal)
```jsonl
{"timestamp":"2026-01-15T22:30:00Z","rating":8.0,"type":"explicit","context":"refactor"}
{"timestamp":"2026-01-15T22:35:00Z","rating":9.0,"type":"implicit","sentiment":0.9,"context":"bug fix"}
```

#### e) Status Line Learning Display
- Shows real-time learning score: `Learning: 8.5↑`
- Trend indicators: ↑ improving, ↓ declining, → stable
- 4-mode responsive display (nano/micro/mini/normal)

### 2. Full Named Agents (MEDIUM PRIORITY)

PAI has 11 agents with complete personas:
- **Architect** - PhD distributed systems, Fortune 10 background, opus model
- **Engineer** - Principal engineer, TDD advocate, sonnet model
- **Designer** - UX/UI specialist, accessibility expert
- **Artist** - Visual content, prompt engineering
- **QATester** - Browser automation, verification
- **Pentester** - Security testing, ethical boundaries
- **Intern** - High-agency generalist, haiku model
- **4 Research Agents** - Claude, Gemini, Codex, Grok personalities

Atlas has codenames but not full backstories. Consider adopting PAI's approach.

### 3. "Euphoric Surprise" Philosophy (LOW PRIORITY)

PAI's north star: "Results so thorough, thoughtful, and effective that you're genuinely surprised and delighted."

This is more philosophical but could inform response quality expectations.

---

## Overlapping Features (Already Synced)

These are nearly identical and don't need sync:

1. **Algorithm Skill** - Both have 7 phases, ISC tracking, effort classification
2. **CORE Skill** - Identity, response format, context loading
3. **Voice System** - Both use ElevenLabs with similar architecture
4. **Hook System** - Same lifecycle events (SessionStart, Stop, SubagentStop, etc.)
5. **Memory System** - Similar 3-tier structure (though PAI has 4)
6. **Security** - Both have command validation (Atlas actually has better 10-tier)
7. **Observability** - Both have Vue dashboards

---

## Recommended Sync Plan

### Phase 1: Continuous Learning (HIGH PRIORITY)

**Effort:** 2-4 hours

1. **Create ExplicitRatingCapture hook**
   - Copy PAI's pattern detection regex
   - Write to `MEMORY/Learning/Signals/ratings.jsonl`
   - Add to `settings.json` for UserPromptSubmit

2. **Create ImplicitSentimentCapture hook**
   - Port sentiment system prompt from PAI
   - Use inference with Sonnet model
   - Coordinate with explicit capture (defer if explicit detected)

3. **Create ratings.jsonl structure**
   - Add `MEMORY/Learning/Signals/` directory
   - Define entry schema

4. **Add WorkCompletionLearning hook**
   - Trigger on SessionEnd
   - Extract insights from work directory to LEARNING

### Phase 2: Enhanced Status Line (MEDIUM PRIORITY)

**Effort:** 1-2 hours

1. Update `statusline-command.sh` to show learning signal
2. Calculate rolling average from ratings.jsonl
3. Add trend indicators (↑ ↓ →)

### Phase 3: Named Agents Expansion (MEDIUM PRIORITY)

**Effort:** 2-3 hours

1. Review PAI's `agents/Engineer.md`, `Architect.md`, etc.
2. Port full backstories to Atlas's agent definitions
3. Add model assignments (opus for Architect, haiku for Intern)
4. Ensure voice IDs map correctly

### Phase 4: TELOS Templates (LOW PRIORITY)

**Effort:** 1 hour

PAI has 10 TELOS files:
- MISSION.md, GOALS.md, PROJECTS.md, BELIEFS.md, FRAMES.md
- WISDOM.md, CHALLENGES.md, PROBLEMS.md, IDEAS.md, STATUS.md

Consider expanding Atlas's `TELOS.md` to this structure.

---

## Architectural Differences (Keep As-Is)

These are intentional divergences—no need to sync:

| Area | PAI | Atlas | Recommendation |
|------|-----|-------|----------------|
| **Module System** | 23 Packs (markdown files) | 8 Modules (directories) | Keep Atlas's approach |
| **Security** | `.pai-protected.json` | `patterns.yaml` (10-tier) | Keep Atlas's approach |
| **Identity Config** | `settings.json` | `atlas.yaml` | Keep Atlas's approach |
| **Hook Libraries** | `hooks/lib/identity.ts` | `hooks/lib/shared-voice.ts` | Keep both approaches |

---

## Files to Create/Modify

### New Files
```
.claude/hooks/explicit-rating-capture.ts    # Port from PAI
.claude/hooks/implicit-sentiment-capture.ts # Port from PAI
.claude/hooks/work-completion-learning.ts   # Port from PAI
.claude/MEMORY/Learning/Signals/ratings.jsonl # New signal file
```

### Modified Files
```
.claude/settings.json                      # Add new hooks
.claude/statusline/statusline-command.sh   # Add learning display
.claude/skills/Agents/AgentPersonalities.md # Expand with backstories
```

---

## Summary

**v2.3.0 Key Innovation:** Continuous Learning System (sentiment capture → ratings → learning → system improvement)

**Atlas Priority Actions:**
1. **HIGH:** Port sentiment capture hooks (ExplicitRatingCapture, ImplicitSentimentCapture)
2. **HIGH:** Create ratings.jsonl signal infrastructure
3. **MEDIUM:** Add WorkCompletionLearning for session-end insights
4. **MEDIUM:** Enhance status line with learning indicator
5. **LOW:** Expand named agents with full backstories
6. **LOW:** Expand TELOS to 10-file structure

**Estimated Total Effort:** 6-10 hours for full sync

---

## Questions for Ed

1. Do you want to prioritize the sentiment capture system first?
2. Should we create a v0.2.0 milestone for these features?
3. Any PAI features you explicitly DON'T want to sync?
