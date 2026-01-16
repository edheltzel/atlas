# Phase 0: Audit & Analysis Plan

**Branch:** `sync/phase-0-audit`
**Estimated Effort:** 2-4 hours
**Dependencies:** None (this is first)
**Deliverable:** Audit report with file inventories and conflict analysis

---

## Objective

Perform comprehensive audit of both PAI v2.3.0 and Atlas codebases to:
1. Identify exactly what PAI files need to be synced
2. Identify exactly what Atlas files will be affected
3. Document conflicts, overlaps, and orphan risks
4. Create authoritative file lists for subsequent phases

**Critical Rule:** NO ASSUMPTIONS. Every file must be explicitly evaluated.

---

## Worktree Setup

```bash
# Create worktree
cd /Users/ed/.dotfiles/atlas
git worktree add ../atlas-sync-phase-0 -b sync/phase-0-audit

# Work in the worktree
cd ../atlas-sync-phase-0
```

---

## Tasks

### Task 0.1: PAI v2.3.0 Sentiment System Inventory

**Goal:** Document every PAI file related to sentiment/learning capture.

**Files to Audit:**

| PAI File | Purpose | Sync Decision | Notes |
|----------|---------|---------------|-------|
| `hooks/ExplicitRatingCapture.hook.ts` | Detect "8" ratings | SYNC | Core feature |
| `hooks/ImplicitSentimentCapture.hook.ts` | AI sentiment inference | SYNC | Core feature |
| `hooks/WorkCompletionLearning.hook.ts` | Session-end insights | SYNC | Core feature |
| `hooks/lib/learning-utils.ts` | Learning categorization | EVALUATE | May conflict with Atlas lib |
| `hooks/lib/time.ts` | PST timestamps | EVALUATE | Atlas may have equivalent |
| `hooks/lib/identity.ts` | DA/Principal names | EVALUATE | Atlas has different approach |
| `MEMORY/LEARNING/SIGNALS/` | Directory structure | CREATE | New in Atlas |
| `skills/CORE/Tools/Inference.ts` | AI inference helper | EVALUATE | Check Atlas equivalent |

**Audit Checklist:**
- [ ] Read each file completely (not just skim)
- [ ] Document all imports and dependencies
- [ ] Document all file paths used
- [ ] Document all environment variables used
- [ ] Note any hardcoded values that need changing

---

### Task 0.2: PAI v2.3.0 Agent System Inventory

**Goal:** Document PAI's named agent structure.

**Files to Audit:**

| PAI File | Purpose | Sync Decision | Notes |
|----------|---------|---------------|-------|
| `agents/Engineer.md` | Full agent persona | SYNC | Has backstory, voice ID |
| `agents/Architect.md` | Full agent persona | SYNC | Has backstory, voice ID |
| `agents/Designer.md` | Full agent persona | SYNC | Has backstory, voice ID |
| `agents/Artist.md` | Full agent persona | SYNC | Has backstory, voice ID |
| `agents/QATester.md` | Full agent persona | SYNC | Has backstory, voice ID |
| `agents/Pentester.md` | Full agent persona | SYNC | Has backstory, voice ID |
| `agents/Intern.md` | Full agent persona | SYNC | Has backstory, voice ID |
| `agents/ClaudeResearcher.md` | Research agent | EVALUATE | May not need |
| `agents/GeminiResearcher.md` | Research agent | EVALUATE | May not need |
| `agents/CodexResearcher.md` | Research agent | EVALUATE | May not need |
| `agents/GrokResearcher.md` | Research agent | EVALUATE | May not need |
| `skills/Agents/SKILL.md` | Agent factory skill | COMPARE | Atlas has equivalent |
| `skills/Agents/Tools/AgentFactory.ts` | Factory code | COMPARE | Atlas has equivalent |
| `skills/Agents/Data/Traits.yaml` | Trait definitions | COMPARE | Atlas has equivalent |

**Audit Checklist:**
- [ ] Document each agent's model assignment (haiku/sonnet/opus)
- [ ] Document each agent's voice ID
- [ ] Document each agent's permission set
- [ ] Compare with Atlas's existing AgentPersonalities.md
- [ ] Identify naming conflicts (codenames vs named agents)

---

### Task 0.3: PAI v2.3.0 Memory Structure Inventory

**Goal:** Document PAI's memory directory structure.

**Current PAI Structure:**
```
MEMORY/
├── SESSIONS/           # Session transcripts
├── SIGNALS/            # Was separate, now under LEARNING/
├── LEARNINGS/          # Phase-organized insights
│   ├── SIGNALS/        # ratings.jsonl lives here now
│   │   └── ratings.jsonl
│   ├── ALGORITHM/      # Algorithm-phase learnings
│   ├── SYSTEM/         # System learnings
│   └── {YYYY-MM}/      # Monthly directories
├── RESEARCH/           # Topic artifacts
└── PAISYSTEMUPDATES/   # How PAI improved itself
```

**Audit Checklist:**
- [ ] Confirm exact directory structure in PAI v2.3 release
- [ ] Document `ratings.jsonl` schema completely
- [ ] Identify what directories Atlas already has
- [ ] Plan directory creation/migration

---

### Task 0.4: Atlas Current State Inventory

**Goal:** Document Atlas files that will be affected by sync.

**Files to Audit:**

| Atlas File | Current Purpose | Sync Impact | Risk |
|------------|-----------------|-------------|------|
| `.claude/hooks/` | 13 hooks | Adding 3 new | Medium |
| `.claude/hooks/lib/` | Shared utilities | May need new utils | Low |
| `.claude/MEMORY/` | State/Work/Learning | Restructuring | High |
| `.claude/MEMORY/Learning/` | Phase learnings | Adding Signals/ | Medium |
| `.claude/settings.json` | Hook registration | Adding hooks | Medium |
| `.claude/skills/Agents/` | Agent skill | Expanding agents | Medium |
| `.claude/skills/Agents/AgentPersonalities.md` | Codenames | Replacing with full agents | High |
| `.claude/voice/` | TTS server | May need updates | Low |
| `.claude/lib/config-loader.ts` | Config loading | May need updates | Low |

**Audit Checklist:**
- [ ] List all 13 current hooks with their events
- [ ] Document current MEMORY structure completely
- [ ] Document current Agents skill structure
- [ ] Document current voice system integration
- [ ] Identify potential breaking changes

---

### Task 0.5: Dependency Analysis

**Goal:** Map all dependencies between components.

**Questions to Answer:**

1. **Hook Dependencies:**
   - What lib files does each new PAI hook import?
   - Which of those exist in Atlas already?
   - Which need to be created?

2. **Path Dependencies:**
   - What paths are hardcoded in PAI hooks?
   - Do they use `$PAI_DIR` or hardcoded `~/.claude`?
   - Are paths compatible with Atlas conventions?

3. **Config Dependencies:**
   - What settings.json entries do new hooks need?
   - What atlas.yaml entries do new hooks need?
   - Any new environment variables?

4. **Runtime Dependencies:**
   - Does ImplicitSentimentCapture need Anthropic API access?
   - What model does it use for inference?
   - What's the inference timeout?

---

### Task 0.6: Conflict Analysis

**Goal:** Identify all conflicts and create resolution plan.

**Conflict Categories:**

1. **Naming Conflicts:**
   - PAI uses `identity.ts` for DA name, Atlas uses `config-loader.ts`
   - PAI agents use full names, Atlas uses codenames

2. **Path Conflicts:**
   - PAI `MEMORY/LEARNING/SIGNALS/` vs Atlas `MEMORY/Learning/Signals/` (case?)
   - Verify case sensitivity on macOS

3. **Hook Event Conflicts:**
   - Do new UserPromptSubmit hooks conflict with existing?
   - Hook execution order matters for sentiment capture

4. **Voice ID Conflicts:**
   - PAI agents have voice IDs in agent files
   - Atlas agents have voice IDs in atlas.yaml
   - Need unified approach

---

### Task 0.7: Create Authoritative File Lists

**Goal:** Produce definitive lists for subsequent phases.

**Deliverables:**

1. **files-to-create.md** - New files to add to Atlas
2. **files-to-modify.md** - Existing Atlas files to update
3. **files-to-delete.md** - Atlas files that become orphans (if any)
4. **files-to-copy.md** - PAI files to copy directly
5. **files-to-adapt.md** - PAI files needing modification for Atlas

---

## Testing

### Audit Verification Tests

| Test | Expected Result |
|------|-----------------|
| All PAI sentiment files read | No "TODO" or "check later" in audit |
| All Atlas affected files listed | Complete inventory |
| Dependency map complete | No missing imports identified |
| Conflict resolution documented | Each conflict has resolution plan |

---

## Exit Criteria

Phase 0 is complete when:

- [ ] All 7 tasks completed with documentation
- [ ] Authoritative file lists created
- [ ] Conflict analysis complete with resolutions
- [ ] No assumptions - every decision has file evidence
- [ ] Phase 1-4 plans can proceed with confidence

---

## Output Artifacts

| Artifact | Location |
|----------|----------|
| PAI Sentiment Inventory | `audit/pai-sentiment-inventory.md` |
| PAI Agents Inventory | `audit/pai-agents-inventory.md` |
| PAI Memory Inventory | `audit/pai-memory-inventory.md` |
| Atlas Affected Files | `audit/atlas-affected-files.md` |
| Dependency Map | `audit/dependency-map.md` |
| Conflict Analysis | `audit/conflict-analysis.md` |
| Authoritative File Lists | `audit/file-lists/` |

---

## Notes

- This phase produces NO code changes to Atlas
- This phase is research and documentation only
- All subsequent phases depend on this audit
- Take time to be thorough - rushed audit = broken sync
