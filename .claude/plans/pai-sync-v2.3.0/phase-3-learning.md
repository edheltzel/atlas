# Phase 3: Learning Extraction Plan

**Branch:** `sync/phase-3-learning`
**Estimated Effort:** 4-6 hours
**Dependencies:** Phase 2 sentiment capture complete
**Deliverable:** WorkCompletionLearning hook extracting insights at session end

---

## Objective

Implement the learning extraction system:
1. WorkCompletionLearning hook - extracts insights at SessionEnd
2. Categorized learning files created in MEMORY/Learning/
3. Low ratings automatically trigger learning capture
4. Integration with existing stop hooks

---

## Worktree Setup

```bash
# Create worktree
cd /Users/ed/.dotfiles/atlas
git worktree add ../atlas-sync-phase-3 -b sync/phase-3-learning

# Work in the worktree
cd ../atlas-sync-phase-3
```

---

## Pre-Phase Checklist

Before starting, verify:
- [ ] Phase 2 merged to master
- [ ] Sentiment hooks writing to ratings.jsonl
- [ ] lib/ratings.ts utilities working
- [ ] lib/learning-utils.ts available
- [ ] Phase 0 audit for this hook reviewed

---

## Tasks

### Task 3.1: Analyze PAI WorkCompletionLearning Hook

**Goal:** Fully understand the PAI implementation before porting.

**PAI File:** `~/Developer/AI/PAI/Releases/v2.3/.claude/hooks/WorkCompletionLearning.hook.ts`

**Key Analysis Points:**

| Aspect | PAI Implementation | Atlas Adaptation |
|--------|-------------------|------------------|
| Trigger Event | SessionEnd | Same |
| Input | current-work.json, Work directory META.yaml | Check Atlas equivalents |
| Significant Work Check | Files changed > 0 OR item_count > 1 OR manual | Adapt criteria |
| Output Directory | `MEMORY/LEARNING/{category}/{YYYY-MM}/` | `MEMORY/Learning/{category}/{YYYY-MM}/` |
| Filename | `{date}_{time}_work_{slug}.md` | Same |
| Dependencies | lib/time, lib/learning-utils | Use Atlas equivalents |

**Critical Questions:**
- Does Atlas have `current-work.json`?
- Does Atlas have Work directory with META.yaml?
- What constitutes "significant work" in Atlas?

**Checklist:**
- [ ] All inputs documented
- [ ] All outputs documented
- [ ] Atlas state file equivalents identified
- [ ] Adaptation plan for Atlas work tracking

---

### Task 3.2: Audit Atlas Work Tracking System

**Goal:** Understand what Atlas currently tracks.

**Files to Check:**

| File | Expected Content | Status |
|------|------------------|--------|
| `MEMORY/State/active-work.json` | Current task metadata | Check format |
| `MEMORY/Work/` | Per-session work directories | Check structure |
| Stop hooks | What they capture | Review |

**Document:**
- Current Atlas work tracking format
- What metadata is available at SessionEnd
- Gap analysis vs PAI expectations

**Checklist:**
- [ ] Atlas work tracking documented
- [ ] Format differences from PAI noted
- [ ] Adaptation plan created

---

### Task 3.3: Create Learning File Generator

**Goal:** Utility to create properly formatted learning files.

**File:** `.claude/lib/learning-writer.ts`

```typescript
/**
 * Learning File Writer
 *
 * Creates markdown learning files in the correct directory structure.
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { getLearningCategory, getLearningDir } from './learning-utils';

interface LearningContent {
  title: string;
  category?: 'ALGORITHM' | 'SYSTEM';
  rating?: number;
  source: 'work-completion' | 'low-rating' | 'sentiment-detected';
  context: string;
  insights?: string;
  filesChanged?: string[];
  toolsUsed?: string[];
  duration?: string;
  sessionId?: string;
}

/**
 * Get PST timestamp components
 */
function getPSTComponents(): {
  year: string;
  month: string;
  day: string;
  hours: string;
  minutes: string;
  seconds: string;
} {
  const now = new Date();
  // Adjust for PST (UTC-8)
  const pst = new Date(now.getTime() - (8 * 60 * 60 * 1000));

  return {
    year: String(pst.getUTCFullYear()),
    month: String(pst.getUTCMonth() + 1).padStart(2, '0'),
    day: String(pst.getUTCDate()).padStart(2, '0'),
    hours: String(pst.getUTCHours()).padStart(2, '0'),
    minutes: String(pst.getUTCMinutes()).padStart(2, '0'),
    seconds: String(pst.getUTCSeconds()).padStart(2, '0'),
  };
}

/**
 * Create a learning file
 */
export function writeLearning(content: LearningContent): string {
  const category = content.category || getLearningCategory(content.title, content.context);
  const dir = getLearningDir(category);

  // Ensure directory exists
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const { year, month, day, hours, minutes, seconds } = getPSTComponents();

  // Create filename
  const titleSlug = content.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 30);

  const filename = `${year}-${month}-${day}-${hours}${minutes}${seconds}_${content.source}_${titleSlug}.md`;
  const filepath = join(dir, filename);

  // Skip if already exists
  if (existsSync(filepath)) {
    console.error(`[LearningWriter] Learning already exists: ${filename}`);
    return filepath;
  }

  // Build content
  const md = `---
capture_type: LEARNING
timestamp: ${year}-${month}-${day} ${hours}:${minutes}:${seconds} PST
source: ${content.source}
category: ${category}
${content.rating ? `rating: ${content.rating}` : ''}
auto_captured: true
tags: [${content.source}, ${category.toLowerCase()}]
---

# ${content.title}

**Date:** ${year}-${month}-${day}
**Category:** ${category}
${content.rating ? `**Rating:** ${content.rating}/10` : ''}
${content.sessionId ? `**Session:** ${content.sessionId}` : ''}
${content.duration ? `**Duration:** ${content.duration}` : ''}

---

## Context

${content.context || 'No context provided'}

---

## What Was Done

${content.filesChanged?.length ? `- **Files Changed:** ${content.filesChanged.length}` : ''}
${content.toolsUsed?.length ? `- **Tools Used:** ${content.toolsUsed.join(', ')}` : ''}

---

## Insights

${content.insights || '*To be analyzed for patterns and improvements.*'}

---

*Auto-captured by Atlas learning system*
`;

  writeFileSync(filepath, md, 'utf-8');
  console.error(`[LearningWriter] Created learning: ${filename}`);

  return filepath;
}
```

**Checklist:**
- [ ] Directory creation handled
- [ ] PST timestamps (or configurable timezone)
- [ ] Filename format matches PAI
- [ ] Frontmatter complete
- [ ] No overwrites of existing files

---

### Task 3.4: Implement WorkCompletionLearning Hook

**Goal:** Create Atlas version of the hook.

**File:** `.claude/hooks/work-completion-learning.ts`

```typescript
#!/usr/bin/env bun
/**
 * work-completion-learning.ts - Extract Learnings from Completed Work
 *
 * TRIGGER: SessionEnd
 *
 * PURPOSE:
 * When a session ends with significant work completed, this hook
 * captures work metadata and creates a learning file for future reference.
 *
 * SIGNIFICANT WORK CRITERIA:
 * - Files were changed, OR
 * - Multiple tools used, OR
 * - Session duration > 5 minutes
 *
 * INTER-HOOK RELATIONSHIPS:
 * - DEPENDS ON: State/active-work.json (if exists)
 * - COORDINATES WITH: capture-session-summary.ts
 * - MUST RUN BEFORE: Session cleanup
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { writeLearning } from '../lib/learning-writer';

const MEMORY_DIR = join(process.env.PAI_DIR || process.env.HOME + '/.claude', 'MEMORY');
const STATE_DIR = join(MEMORY_DIR, 'State');
const ACTIVE_WORK_FILE = join(STATE_DIR, 'active-work.json');

interface HookInput {
  session_id: string;
  transcript_path?: string;
}

interface ActiveWork {
  session_id: string;
  title?: string;
  started_at?: string;
  tools_used?: string[];
  files_changed?: string[];
}

async function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    const timer = setTimeout(() => reject(new Error('Timeout')), 5000);
    process.stdin.on('data', (chunk) => { data += chunk.toString(); });
    process.stdin.on('end', () => { clearTimeout(timer); resolve(data); });
    process.stdin.on('error', (err) => { clearTimeout(timer); reject(err); });
  });
}

function isSignificantWork(work: ActiveWork): boolean {
  // Has files changed
  if (work.files_changed && work.files_changed.length > 0) return true;

  // Has multiple tools used
  if (work.tools_used && work.tools_used.length > 3) return true;

  // Session duration > 5 minutes (if we have start time)
  if (work.started_at) {
    const start = new Date(work.started_at);
    const now = new Date();
    const minutes = (now.getTime() - start.getTime()) / 60000;
    if (minutes > 5) return true;
  }

  return false;
}

async function main() {
  try {
    console.error('[WorkCompletionLearning] Hook started');

    const input = await readStdin();
    if (!input.trim()) {
      console.error('[WorkCompletionLearning] No input received');
      process.exit(0);
    }

    const data: HookInput = JSON.parse(input);

    // Check for active work
    if (!existsSync(ACTIVE_WORK_FILE)) {
      console.error('[WorkCompletionLearning] No active work file');
      process.exit(0);
    }

    const activeWork: ActiveWork = JSON.parse(readFileSync(ACTIVE_WORK_FILE, 'utf-8'));

    // Check if significant
    if (!isSignificantWork(activeWork)) {
      console.error('[WorkCompletionLearning] Trivial session, skipping');
      process.exit(0);
    }

    // Calculate duration
    let duration = 'Unknown';
    if (activeWork.started_at) {
      const start = new Date(activeWork.started_at);
      const now = new Date();
      const minutes = Math.round((now.getTime() - start.getTime()) / 60000);
      duration = minutes < 60 ? `${minutes} minutes` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    }

    // Create learning
    writeLearning({
      title: activeWork.title || 'Work Session',
      source: 'work-completion',
      context: `Session ${data.session_id} completed successfully.`,
      filesChanged: activeWork.files_changed,
      toolsUsed: activeWork.tools_used,
      duration,
      sessionId: data.session_id,
      insights: `*Review this session for patterns and improvements.*

**What worked well:**
- [To be analyzed]

**What could be improved:**
- [To be analyzed]
`,
    });

    console.error('[WorkCompletionLearning] Done');
    process.exit(0);
  } catch (err) {
    console.error(`[WorkCompletionLearning] Error: ${err}`);
    process.exit(0);
  }
}

main();
```

**Checklist:**
- [ ] Hook file created with proper shebang
- [ ] Reads active-work.json correctly
- [ ] Significant work detection implemented
- [ ] Learning file created with proper structure
- [ ] Proper error handling (always exit 0)
- [ ] Coordinates with existing stop hooks

---

### Task 3.5: Ensure Active Work Tracking Exists

**Goal:** Verify or create active-work.json population.

**Check Existing Hooks:**
- Does `stop-hook.ts` write to active-work.json?
- Does `capture-all-events.ts` track tools/files?
- What data is currently available?

**If Needed, Update:**
- `capture-all-events.ts` to track tools_used
- Relevant hooks to track files_changed
- Initialize active-work.json at session start

**Checklist:**
- [ ] active-work.json populated correctly
- [ ] tools_used tracked
- [ ] files_changed tracked (if possible)
- [ ] started_at timestamp set

---

### Task 3.6: Integrate Low Rating → Learning

**Goal:** Ensure low ratings from sentiment hooks trigger learning.

**Verify in Phase 2 Hooks:**
- ExplicitRatingCapture calls `captureLowRatingLearning()` for ratings < 6
- ImplicitSentimentCapture calls `captureLowRatingLearning()` for ratings < 6

**If Not Already Done:**
```typescript
// In sentiment hooks, after writing rating:
if (rating < 6) {
  writeLearning({
    title: `Low Rating: ${rating}/10`,
    source: 'low-rating',
    rating,
    context: responseContext || 'No context available',
    insights: comment || sentimentSummary || 'Review for improvement opportunities',
  });
}
```

**Checklist:**
- [ ] Low explicit ratings trigger learning
- [ ] Low implicit ratings trigger learning
- [ ] Learning files created in correct category

---

### Task 3.7: Register Hook in settings.json

**Goal:** Add hook to SessionEnd event.

**Update:** `.claude/settings.json`

```json
{
  "hooks": {
    "SessionEnd": [
      // Existing hooks...
      {
        "command": "bun run $PAI_DIR/hooks/work-completion-learning.ts"
      }
      // capture-session-summary.ts should come AFTER
    ]
  }
}
```

**Checklist:**
- [ ] Hook added to SessionEnd
- [ ] Order correct (before session cleanup)
- [ ] Command syntax correct

---

## Testing

### Unit Tests

| Test | Input | Expected Output |
|------|-------|-----------------|
| isSignificantWork() empty | {} | false |
| isSignificantWork() files | { files_changed: ['a.ts'] } | true |
| isSignificantWork() tools | { tools_used: ['Read', 'Write', 'Bash', 'Edit'] } | true |
| isSignificantWork() duration | { started_at: 10 mins ago } | true |
| writeLearning() | Valid content | File created |
| writeLearning() duplicate | Same content twice | Skip second |

### Integration Tests

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Session end learning | Complete work session, end | Learning file created |
| Trivial session | Quick question/answer | No learning file |
| Low rating learning | Rate "3 - bad" | Learning file created |
| Directory creation | First learning in new month | Directory auto-created |

### Manual Tests

| Test | Steps | Pass Criteria |
|------|-------|---------------|
| Real session | Do real work, end session | Learning file in MEMORY/Learning/ |
| Category routing | Work on algorithm task | File in ALGORITHM/ |
| Category routing | Work on code task | File in SYSTEM/ |

---

## Regression Tests

| Test | Steps | Pass Criteria |
|------|-------|---------------|
| Session summary | End session | Summary still generated |
| Stop hooks | End session | All stop hooks fire |
| Voice feedback | End session | Voice still works |

---

## Exit Criteria

Phase 3 is complete when:

- [ ] WorkCompletionLearning hook implemented
- [ ] Learning file generator utility complete
- [ ] Active work tracking verified/implemented
- [ ] Low rating learning integration verified
- [ ] Hook registered in settings.json
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All regression tests pass
- [ ] PR created and reviewed

---

## Merge Process

1. Create PR from `sync/phase-3-learning` to `master`
2. Run all tests in worktree
3. Request review
4. Squash merge with descriptive message
5. Keep worktree for 7 days, then remove
