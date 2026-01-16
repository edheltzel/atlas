# Phase 4: Named Agents & Status Line Plan

**Branch:** `sync/phase-4-agents`
**Estimated Effort:** 4-6 hours
**Dependencies:** Phase 3 learning extraction complete
**Deliverable:** Full agent personas, status line with learning signal, optional TELOS expansion

---

## Objective

Complete the sync with enhancements:
1. Named agents with full PAI-style backstories (not just codenames)
2. Status line showing learning signal with trend (e.g., `Learning: 8.5↑`)
3. Optional: Expand TELOS to 10-file structure

---

## Worktree Setup

```bash
# Create worktree
cd /Users/ed/.dotfiles/atlas
git worktree add ../atlas-sync-phase-4 -b sync/phase-4-agents

# Work in the worktree
cd ../atlas-sync-phase-4
```

---

## Pre-Phase Checklist

Before starting, verify:
- [ ] Phase 3 merged to master
- [ ] ratings.jsonl being populated correctly
- [ ] Learning files being created
- [ ] Phase 0 audit for agents reviewed

---

## Tasks

### Task 4.1: Audit PAI Named Agents

**Goal:** Document all PAI agent definitions for porting.

**PAI Files to Review:**
- `agents/Architect.md`
- `agents/Engineer.md`
- `agents/Designer.md`
- `agents/Artist.md`
- `agents/QATester.md`
- `agents/Pentester.md`
- `agents/Intern.md`

**For Each Agent Document:**

| Attribute | Value |
|-----------|-------|
| Name | |
| Model | haiku/sonnet/opus |
| Color | |
| Voice ID | |
| Permissions | |
| Backstory Summary | |
| Key Traits | |
| Special Instructions | |

**Checklist:**
- [ ] All 7 core agents documented
- [ ] Model assignments noted
- [ ] Voice IDs extracted
- [ ] Permission sets documented

---

### Task 4.2: Audit Atlas Current Agent System

**Goal:** Understand what needs to change in Atlas.

**Files to Check:**
- `.claude/skills/Agents/AgentPersonalities.md` - Current codenames
- `.claude/skills/Agents/SKILL.md` - Agent skill definition
- `.claude/skills/Agents/Data/Traits.yaml` - Trait definitions
- `.claude/voice/lib/prosody-enhancer.ts` - Voice mapping
- `atlas.yaml` - Voice configuration

**Document:**
- Current agent codename → voice mapping
- How agents are currently launched
- Where agent definitions live
- Conflicts with PAI agent names

**Checklist:**
- [ ] Current system documented
- [ ] Migration path planned
- [ ] Breaking changes identified

---

### Task 4.3: Create Named Agent Definitions

**Goal:** Create full agent persona files for Atlas.

**Directory:** `.claude/agents/`

**Create Files:**

1. **Engineer.md**
```markdown
---
name: Engineer
description: Elite principal engineer with Fortune 10 and Bay Area experience. TDD advocate.
model: sonnet
color: blue
voiceId: [from atlas.yaml]
permissions:
  allow:
    - "Bash"
    - "Read(*)"
    - "Write(*)"
    - "Edit(*)"
    - "Grep(*)"
    - "Glob(*)"
    - "TodoWrite(*)"
---

# Engineer Agent

## Core Identity

You are an elite principal/staff engineer with:
- Fortune 10 Enterprise Experience
- Premier Bay Area Background (Google, Meta, Netflix-level)
- Deep Expertise in distributed systems, high-performance architecture
- Test-Driven Philosophy: TDD is non-negotiable

## Key Behaviors

1. **Test-First Imperative** - NO CODE BEFORE TESTS
2. **Strategic Planning** - Use /plan mode for non-trivial tasks
3. **Browser Validation** - ALWAYS verify web apps visually

## Output Format

Always include voice notification:
```
🎯 COMPLETED: [12 words max summary]
```
```

2. **Architect.md** - PhD distributed systems, opus model
3. **Designer.md** - UX/UI specialist, sonnet model
4. **Intern.md** - High-agency generalist, haiku model
5. **QATester.md** - Browser automation, haiku model
6. **Pentester.md** - Security specialist, opus model
7. **Artist.md** - Visual content, opus model

**Checklist:**
- [ ] All 7 agent files created
- [ ] Frontmatter complete (model, voice, permissions)
- [ ] Backstories adapted for Atlas
- [ ] Voice notification patterns included
- [ ] Ed referenced (not Daniel)

---

### Task 4.4: Update Agent Skill to Use Named Agents

**Goal:** Modify Agents skill to reference new agent definitions.

**Update:** `.claude/skills/Agents/SKILL.md`

Add section:
```markdown
## Named Agents

Atlas includes 7 named agents with persistent identities:

| Agent | Model | Specialty |
|-------|-------|-----------|
| Engineer | sonnet | Implementation, TDD |
| Architect | opus | System design |
| Designer | sonnet | UX/UI |
| Intern | haiku | Research, grunt work |
| QATester | haiku | Testing, verification |
| Pentester | opus | Security |
| Artist | opus | Visual content |

### Using Named Agents

To invoke a named agent:
```
Use the Engineer agent to implement this feature with TDD.
```

The agent's full persona and instructions are in `.claude/agents/{Name}.md`.
```

**Checklist:**
- [ ] Named agents documented in skill
- [ ] Usage examples provided
- [ ] AgentPersonalities.md updated or deprecated

---

### Task 4.5: Update Voice Mapping

**Goal:** Ensure voice IDs correctly map to named agents.

**Update:** `atlas.yaml`

```yaml
voice:
  provider: elevenlabs
  port: 8888
  voices:
    default: "voice-id-default"
    # Named agents
    engineer: "voice-id-engineer"
    architect: "voice-id-architect"
    designer: "voice-id-designer"
    intern: "voice-id-intern"
    qatester: "voice-id-qa"
    pentester: "voice-id-pentester"
    artist: "voice-id-artist"
```

**Checklist:**
- [ ] All named agents have voice IDs
- [ ] Voice IDs match ElevenLabs account
- [ ] Voice hooks can resolve agent → voice

---

### Task 4.6: Implement Status Line Learning Display

**Goal:** Update status line to show learning signal.

**File:** `.claude/statusline/statusline-command.sh` (or equivalent)

**Add Learning Display:**

```bash
#!/bin/bash
# Status line with learning signal

# Get learning signal
get_learning_signal() {
  local ratings_file="$HOME/.claude/MEMORY/Learning/Signals/ratings.jsonl"

  if [[ ! -f "$ratings_file" ]]; then
    echo ""
    return
  fi

  # Get last 10 ratings
  local ratings=$(tail -10 "$ratings_file" 2>/dev/null | jq -r '.rating' 2>/dev/null)

  if [[ -z "$ratings" ]]; then
    echo ""
    return
  fi

  # Calculate average
  local sum=0
  local count=0
  while read -r rating; do
    if [[ -n "$rating" && "$rating" != "null" ]]; then
      sum=$((sum + rating))
      count=$((count + 1))
    fi
  done <<< "$ratings"

  if [[ $count -eq 0 ]]; then
    echo ""
    return
  fi

  local avg=$(echo "scale=1; $sum / $count" | bc)

  # Calculate trend (compare first half to second half)
  local trend="→"
  if [[ $count -ge 4 ]]; then
    # Simple trend detection
    local first_half=$(echo "$ratings" | head -$((count / 2)) | awk '{s+=$1} END {print s/NR}')
    local second_half=$(echo "$ratings" | tail -$((count / 2)) | awk '{s+=$1} END {print s/NR}')
    local diff=$(echo "$second_half - $first_half" | bc)

    if (( $(echo "$diff > 0.5" | bc -l) )); then
      trend="↑"
    elif (( $(echo "$diff < -0.5" | bc -l) )); then
      trend="↓"
    fi
  fi

  echo "Learning: ${avg}${trend}"
}

# Build status line
learning=$(get_learning_signal)

if [[ -n "$learning" ]]; then
  echo "$learning"
fi
```

**Display Modes (from PAI):**

| Mode | Width | Display |
|------|-------|---------|
| nano | <35 | `8.5↑` |
| micro | 35-54 | `Learning: 8.5↑` |
| mini | 55-79 | `Learning: 8.5↑ │ Ed` |
| normal | 80+ | Full display |

**Checklist:**
- [ ] Learning signal calculation implemented
- [ ] Trend detection working
- [ ] Multiple display modes supported
- [ ] Graceful fallback if no ratings

---

### Task 4.7: Optional - Expand TELOS Structure

**Goal:** Expand single TELOS.md to 10-file PAI structure.

**Current:** `.claude/skills/CORE/USER/TELOS.md`

**PAI Structure:**
```
CORE/USER/TELOS/
├── MISSION.md      # Life mission and purpose
├── GOALS.md        # Current goals across life areas
├── PROJECTS.md     # Active projects with status
├── BELIEFS.md      # Core beliefs guiding decisions
├── FRAMES.md       # Mental models and frameworks
├── WISDOM.md       # Lessons learned, principles
├── CHALLENGES.md   # Current obstacles
├── PROBLEMS.md     # Problems you're solving
├── IDEAS.md        # Ideas worth exploring
└── STATUS.md       # Current state summary
```

**Migration Options:**

1. **Full Migration** - Create all 10 files, migrate content from TELOS.md
2. **Gradual Migration** - Keep TELOS.md, add others as needed
3. **Skip** - Keep current structure (valid option)

**If Migrating:**
- [ ] Create TELOS/ directory
- [ ] Split TELOS.md content into appropriate files
- [ ] Update CORE skill to load from new location
- [ ] Update load-core-context.ts hook

**Checklist:**
- [ ] Decision made (migrate or skip)
- [ ] If migrating, all files created
- [ ] CORE skill updated
- [ ] Context loading updated

---

## Testing

### Unit Tests

| Test | Input | Expected Output |
|------|-------|-----------------|
| get_learning_signal() empty | No ratings file | Empty string |
| get_learning_signal() | 10 ratings avg 7.5 | "Learning: 7.5→" |
| trend detection improving | [5,5,5,8,8,8] | "↑" |
| trend detection declining | [8,8,8,5,5,5] | "↓" |
| trend detection stable | [7,7,7,7,7,7] | "→" |

### Integration Tests

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Named agent launch | "Use Engineer agent" | Agent with correct persona |
| Agent voice | Complete task as Engineer | Correct voice ID used |
| Status line | Have 10+ ratings | Learning signal displayed |

### Manual Tests

| Test | Steps | Pass Criteria |
|------|-------|---------------|
| Engineer agent | Launch, do TDD task | TDD behavior observed |
| Architect agent | Launch, design task | Opus model, strategic thinking |
| Status line visual | Open new terminal | Learning signal visible |
| Voice correct | Engineer completes task | Engineer voice speaks |

---

## Regression Tests

| Test | Steps | Pass Criteria |
|------|-------|---------------|
| Existing agents | Use Intern | Still works |
| Dynamic agents | AgentFactory | Still works |
| Voice system | Any completion | Voice still works |
| TELOS loading | Session start | Context still loads |

---

## Exit Criteria

Phase 4 is complete when:

- [ ] 7 named agent definitions created
- [ ] Agents skill updated
- [ ] Voice mapping updated
- [ ] Status line learning display working
- [ ] TELOS decision made and implemented (if migrating)
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All regression tests pass
- [ ] PR created and reviewed

---

## Migration Notes

### Backward Compatibility

- Existing agent codenames (Rookie, Tesla, etc.) can coexist with named agents
- AgentFactory still works for dynamic agents
- Voice system extended, not replaced

### Breaking Changes

- None expected if careful

---

## Merge Process

1. Create PR from `sync/phase-4-agents` to `master`
2. Run all tests in worktree
3. Request review
4. Squash merge with descriptive message
5. Update Atlas version to v0.2.0
6. Create release notes
7. Remove all sync worktrees

---

## Post-Sync Actions

After all phases merged:

1. **Update README.md** with new features
2. **Update CLAUDE.md** with any changes
3. **Create v0.2.0 release** with full changelog
4. **Archive old sync analysis** document
5. **Remove sync worktrees** after 7 days stable
6. **Update skill count** if changed
