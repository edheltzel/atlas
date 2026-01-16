# Phase 1: Memory Infrastructure Plan

**Branch:** `sync/phase-1-memory`
**Estimated Effort:** 4-6 hours
**Dependencies:** Phase 0 audit complete
**Deliverable:** Memory directory structure and ratings.jsonl schema ready for sentiment hooks

---

## Objective

Prepare Atlas's memory infrastructure to support the continuous learning system:
1. Create `MEMORY/Learning/Signals/` directory structure
2. Define and document `ratings.jsonl` schema
3. Create utility functions for reading/writing ratings
4. Ensure backward compatibility with existing memory system

---

## Worktree Setup

```bash
# Create worktree
cd /Users/ed/.dotfiles/atlas
git worktree add ../atlas-sync-phase-1 -b sync/phase-1-memory

# Work in the worktree
cd ../atlas-sync-phase-1
```

---

## Pre-Phase Checklist

Before starting, verify from Phase 0 audit:
- [ ] PAI memory structure documented completely
- [ ] Atlas current memory structure documented
- [ ] Case sensitivity confirmed (Learning vs LEARNING)
- [ ] No orphan files will result from changes

---

## Tasks

### Task 1.1: Backup Current Memory System

**Goal:** Ensure we can rollback if needed.

```bash
# Create backup
cp -r ~/.claude/MEMORY ~/.claude/MEMORY.backup.$(date +%Y%m%d)
```

**Checklist:**
- [ ] Backup created with timestamp
- [ ] Backup verified (can restore)
- [ ] Backup location documented

---

### Task 1.2: Create Signals Directory Structure

**Goal:** Create the directory for ratings.jsonl and future signals.

**Target Structure:**
```
.claude/MEMORY/
├── State/              # (existing)
├── Work/               # (existing)
├── Learning/           # (existing, may need adjustments)
│   ├── Signals/        # NEW - for ratings and patterns
│   │   └── .gitkeep    # Placeholder until ratings exist
│   ├── Algorithm/      # (existing or create)
│   └── System/         # (existing or create)
├── sessions/           # (existing)
├── decisions/          # (existing)
└── research/           # (existing)
```

**Implementation:**
```bash
mkdir -p ~/.claude/MEMORY/Learning/Signals
touch ~/.claude/MEMORY/Learning/Signals/.gitkeep
```

**Checklist:**
- [ ] Signals/ directory created
- [ ] .gitkeep added (for git tracking)
- [ ] Permissions correct (user read/write)
- [ ] Path case matches Atlas conventions (Learning not LEARNING)

---

### Task 1.3: Define ratings.jsonl Schema

**Goal:** Document the exact schema for rating entries.

**Schema Definition:**

```typescript
// File: .claude/lib/types/ratings.ts

/**
 * A single rating entry in ratings.jsonl
 * Both explicit and implicit ratings use this schema
 */
interface RatingEntry {
  /** ISO 8601 timestamp */
  timestamp: string;

  /** Rating value 1-10 */
  rating: number;

  /** Session identifier */
  session_id: string;

  /** Source of the rating */
  type: 'explicit' | 'implicit';

  /** User comment (explicit only) */
  comment?: string;

  /** Sentiment summary (implicit only) */
  sentiment_summary?: string;

  /** Confidence score 0-1 (implicit only) */
  confidence?: number;

  /** Context about what was being done */
  context?: string;
}
```

**Example Entries:**

```jsonl
{"timestamp":"2026-01-16T10:30:00Z","rating":8,"session_id":"abc123","type":"explicit","comment":"great work on the refactor"}
{"timestamp":"2026-01-16T10:35:00Z","rating":9,"session_id":"abc123","type":"implicit","sentiment_summary":"User expressed strong satisfaction","confidence":0.9,"context":"bug fix completed"}
{"timestamp":"2026-01-16T10:40:00Z","rating":3,"session_id":"abc123","type":"implicit","sentiment_summary":"User frustrated with incorrect output","confidence":0.85,"context":"code generation task"}
```

**Checklist:**
- [ ] Schema TypeScript interface created
- [ ] Schema documented in MEMORY system docs
- [ ] Example entries documented
- [ ] Validation rules defined (rating 1-10, required fields)

---

### Task 1.4: Create Rating Utility Functions

**Goal:** Provide reusable functions for reading/writing ratings.

**File:** `.claude/lib/ratings.ts`

```typescript
/**
 * Ratings Utility Functions
 *
 * Used by sentiment capture hooks to read/write ratings.jsonl
 */

import { appendFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

const RATINGS_FILE = join(
  process.env.PAI_DIR || join(process.env.HOME!, '.claude'),
  'MEMORY', 'Learning', 'Signals', 'ratings.jsonl'
);

interface RatingEntry {
  timestamp: string;
  rating: number;
  session_id: string;
  type: 'explicit' | 'implicit';
  comment?: string;
  sentiment_summary?: string;
  confidence?: number;
  context?: string;
}

/**
 * Append a rating to ratings.jsonl
 */
export function writeRating(entry: RatingEntry): void {
  const dir = join(RATINGS_FILE, '..');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const jsonLine = JSON.stringify(entry) + '\n';
  appendFileSync(RATINGS_FILE, jsonLine, 'utf-8');
}

/**
 * Read all ratings from ratings.jsonl
 */
export function readAllRatings(): RatingEntry[] {
  if (!existsSync(RATINGS_FILE)) {
    return [];
  }

  const content = readFileSync(RATINGS_FILE, 'utf-8');
  return content
    .trim()
    .split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line));
}

/**
 * Read recent ratings (last N entries)
 */
export function readRecentRatings(count: number = 10): RatingEntry[] {
  const all = readAllRatings();
  return all.slice(-count);
}

/**
 * Calculate rolling average of recent ratings
 */
export function calculateRollingAverage(count: number = 10): number | null {
  const recent = readRecentRatings(count);
  if (recent.length === 0) return null;

  const sum = recent.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / recent.length) * 10) / 10;
}

/**
 * Get trend direction based on recent ratings
 */
export function getTrend(count: number = 10): '↑' | '↓' | '→' {
  const recent = readRecentRatings(count);
  if (recent.length < 3) return '→';

  const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
  const secondHalf = recent.slice(Math.floor(recent.length / 2));

  const firstAvg = firstHalf.reduce((a, r) => a + r.rating, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, r) => a + r.rating, 0) / secondHalf.length;

  const diff = secondAvg - firstAvg;
  if (diff > 0.5) return '↑';
  if (diff < -0.5) return '↓';
  return '→';
}
```

**Checklist:**
- [ ] All functions implemented
- [ ] All functions have JSDoc comments
- [ ] Error handling for file operations
- [ ] Exported from lib/index.ts (if exists)

---

### Task 1.5: Create Learning Category Utility

**Goal:** Port PAI's learning categorization logic.

**File:** `.claude/lib/learning-utils.ts`

```typescript
/**
 * Learning Utility Functions
 *
 * Ported from PAI v2.3.0 hooks/lib/learning-utils.ts
 */

/**
 * Categorize a learning entry based on content
 * Returns 'ALGORITHM' or 'SYSTEM'
 */
export function getLearningCategory(
  content: string,
  context?: string
): 'ALGORITHM' | 'SYSTEM' {
  const combined = `${content} ${context || ''}`.toLowerCase();

  // Algorithm-related keywords
  const algorithmKeywords = [
    'process', 'approach', 'method', 'workflow', 'phase',
    'observe', 'think', 'plan', 'build', 'execute', 'verify', 'learn',
    'isc', 'ideal state', 'criteria', 'iteration'
  ];

  // System-related keywords
  const systemKeywords = [
    'code', 'implementation', 'bug', 'error', 'fix', 'feature',
    'api', 'database', 'performance', 'security', 'test'
  ];

  const algorithmScore = algorithmKeywords.filter(k => combined.includes(k)).length;
  const systemScore = systemKeywords.filter(k => combined.includes(k)).length;

  return algorithmScore > systemScore ? 'ALGORITHM' : 'SYSTEM';
}

/**
 * Get the learning directory path for a category
 */
export function getLearningDir(category: 'ALGORITHM' | 'SYSTEM'): string {
  const baseDir = process.env.PAI_DIR || join(process.env.HOME!, '.claude');
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  return join(baseDir, 'MEMORY', 'Learning', category, yearMonth);
}
```

**Checklist:**
- [ ] Function matches PAI logic
- [ ] Category directories created on demand
- [ ] Monthly directory naming correct

---

### Task 1.6: Update MEMORY Documentation

**Goal:** Document the updated memory structure.

**Update:** `.claude/skills/CORE/SYSTEM/MEMORYSYSTEM.md`

Add section:

```markdown
## Learning Signals

The `MEMORY/Learning/Signals/` directory contains signal data that feeds the continuous learning system.

### ratings.jsonl

Stores user satisfaction signals from two sources:

1. **Explicit Ratings** - User types "8" or "8 - great work"
2. **Implicit Ratings** - AI-detected sentiment from natural language

**Schema:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| timestamp | string | Yes | ISO 8601 timestamp |
| rating | number | Yes | Rating 1-10 |
| session_id | string | Yes | Session identifier |
| type | string | Yes | "explicit" or "implicit" |
| comment | string | No | User comment (explicit only) |
| sentiment_summary | string | No | AI summary (implicit only) |
| confidence | number | No | 0-1 confidence (implicit only) |
| context | string | No | What was being done |

**Usage:**
- Status line displays rolling average with trend
- Low ratings (< 6) trigger learning capture
- Patterns analyzed to improve system
```

**Checklist:**
- [ ] MEMORYSYSTEM.md updated
- [ ] ratings.jsonl schema documented
- [ ] Directory structure diagram updated

---

## Testing

### Unit Tests

| Test | Input | Expected Output |
|------|-------|-----------------|
| writeRating() | Valid entry | File appended |
| writeRating() | Missing required field | Error thrown |
| readAllRatings() | Empty file | Empty array |
| readAllRatings() | 5 entries | 5-element array |
| calculateRollingAverage() | 10 ratings avg 7.5 | 7.5 |
| getTrend() | Improving ratings | '↑' |
| getTrend() | Declining ratings | '↓' |
| getTrend() | Stable ratings | '→' |

### Integration Tests

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Ratings persist | Write 3 ratings, read back | All 3 present |
| Concurrent writes | Write from 2 processes | Both entries saved |
| Large file | Write 10000 ratings | No performance degradation |

### Manual Tests

| Test | Steps | Pass Criteria |
|------|-------|---------------|
| Directory creation | Delete Signals/, run writeRating | Directory auto-created |
| File permissions | Check ratings.jsonl perms | User read/write |
| Path correctness | Verify path uses PAI_DIR | Correct path used |

---

## Regression Tests

Ensure existing memory system still works:

| Test | Steps | Pass Criteria |
|------|-------|---------------|
| State files | Check active-work.json works | No errors |
| Work directories | Create new work session | Directory created correctly |
| Session summaries | End session | Summary generated |
| Existing hooks | Run stop-hook.ts | No errors |

---

## Exit Criteria

Phase 1 is complete when:

- [ ] `MEMORY/Learning/Signals/` directory exists
- [ ] `ratings.jsonl` schema documented and implemented
- [ ] Utility functions created and tested
- [ ] Documentation updated
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All regression tests pass
- [ ] PR created and reviewed

---

## Merge Process

1. Create PR from `sync/phase-1-memory` to `master`
2. Run all tests in worktree
3. Request review
4. Squash merge with descriptive message
5. Tag as `v0.2.0-phase1` (optional)
6. Keep worktree for 7 days, then remove

---

## Rollback Plan

If issues discovered post-merge:

```bash
# Revert the merge commit
git revert <merge-commit-sha>

# Restore backup if needed
cp -r ~/.claude/MEMORY.backup.YYYYMMDD ~/.claude/MEMORY
```
