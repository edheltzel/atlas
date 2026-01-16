# Phase 2: Sentiment Capture Hooks Plan

**Branch:** `sync/phase-2-sentiment`
**Estimated Effort:** 6-8 hours
**Dependencies:** Phase 1 memory infrastructure complete
**Deliverable:** ExplicitRatingCapture and ImplicitSentimentCapture hooks working

---

## Objective

Implement the core sentiment capture system:
1. ExplicitRatingCapture hook - detects "8" or "8 - great work" patterns
2. ImplicitSentimentCapture hook - AI inference for sentiment detection
3. Both hooks write to ratings.jsonl
4. Hooks coordinate correctly (explicit takes priority)

---

## Worktree Setup

```bash
# Create worktree
cd /Users/ed/.dotfiles/atlas
git worktree add ../atlas-sync-phase-2 -b sync/phase-2-sentiment

# Work in the worktree
cd ../atlas-sync-phase-2
```

---

## Pre-Phase Checklist

Before starting, verify:
- [ ] Phase 1 merged to master
- [ ] `MEMORY/Learning/Signals/` exists
- [ ] `lib/ratings.ts` utility functions working
- [ ] Phase 0 audit for these hooks reviewed

---

## Tasks

### Task 2.1: Analyze PAI ExplicitRatingCapture Hook

**Goal:** Fully understand the PAI implementation before porting.

**PAI File:** `~/Developer/AI/PAI/Releases/v2.3/.claude/hooks/ExplicitRatingCapture.hook.ts`

**Key Analysis Points:**

| Aspect | PAI Implementation | Atlas Adaptation |
|--------|-------------------|------------------|
| Trigger Event | UserPromptSubmit | Same |
| Rating Pattern | `/^(10\|[1-9])(?:\s*[-:]\s*\|\s+)?(.*)$/` | Same |
| Non-rating filter | Rejects "3 items", "5 things" | Same |
| Output | `MEMORY/LEARNING/SIGNALS/ratings.jsonl` | `MEMORY/Learning/Signals/ratings.jsonl` |
| Low rating action | Captures to LEARNING directory | Same |
| Dependencies | `lib/learning-utils`, `lib/identity`, `lib/time` | Use Atlas equivalents |

**Checklist:**
- [ ] Pattern regex understood completely
- [ ] All imports identified
- [ ] All side effects documented
- [ ] Atlas path adaptations planned

---

### Task 2.2: Implement ExplicitRatingCapture Hook

**Goal:** Create Atlas version of the hook.

**File:** `.claude/hooks/explicit-rating-capture.ts`

**Implementation Outline:**

```typescript
#!/usr/bin/env bun
/**
 * explicit-rating-capture.ts - Capture Explicit User Ratings
 *
 * TRIGGER: UserPromptSubmit
 *
 * PURPOSE:
 * Detects when the user explicitly rates a response with a number 1-10.
 * Examples: "8", "8 - great work", "9: excellent"
 *
 * OUTPUT:
 * - Writes to: MEMORY/Learning/Signals/ratings.jsonl
 * - Low ratings (< 6) trigger learning capture
 *
 * COORDINATION:
 * - Runs BEFORE ImplicitSentimentCapture
 * - ImplicitSentimentCapture checks isExplicitRating() and defers
 */

import { writeRating } from '../lib/ratings';
import { getLearningCategory, getLearningDir } from '../lib/learning-utils';
// ... implementation
```

**Key Functions to Implement:**

1. `parseRating(prompt: string)` - Detect and parse rating from prompt
2. `isExplicitRating(prompt: string)` - Boolean check (exported for ImplicitSentiment)
3. `writeRating(entry)` - Use lib/ratings.ts
4. `captureLowRatingLearning(rating, comment, context)` - For ratings < 6

**Checklist:**
- [ ] Hook file created with proper shebang
- [ ] parseRating() matches PAI regex exactly
- [ ] Non-rating patterns rejected (items, things, steps, etc.)
- [ ] Writes to correct ratings.jsonl path
- [ ] Low ratings trigger learning capture
- [ ] Uses Atlas lib functions where possible
- [ ] Proper error handling (always exit 0)

---

### Task 2.3: Create isExplicitRating Export

**Goal:** Allow ImplicitSentimentCapture to check if explicit rating detected.

**File:** `.claude/hooks/lib/rating-detection.ts`

```typescript
/**
 * Shared rating detection for hook coordination
 */

/**
 * Check if a prompt is an explicit rating
 * Used by ImplicitSentimentCapture to defer to ExplicitRatingCapture
 */
export function isExplicitRating(prompt: string): boolean {
  const trimmed = prompt.trim();
  const ratingPattern = /^(10|[1-9])(?:\s*[-:]\s*|\s+)?(.*)$/;
  const match = trimmed.match(ratingPattern);

  if (!match) return false;

  const comment = match[2]?.trim();
  if (comment) {
    // Reject common words that indicate a sentence, not a rating
    const sentenceStarters = /^(items?|things?|steps?|files?|lines?|bugs?|issues?|errors?|times?|minutes?|hours?|days?|seconds?|percent|%|th\b|st\b|nd\b|rd\b|of\b|in\b|at\b|to\b|the\b|a\b|an\b)/i;
    if (sentenceStarters.test(comment)) {
      return false;
    }
  }

  return true;
}
```

**Checklist:**
- [ ] Function exported correctly
- [ ] Regex matches PAI exactly
- [ ] All sentence starters included

---

### Task 2.4: Analyze PAI ImplicitSentimentCapture Hook

**Goal:** Fully understand the PAI implementation before porting.

**PAI File:** `~/Developer/AI/PAI/Releases/v2.3/.claude/hooks/ImplicitSentimentCapture.hook.ts`

**Key Analysis Points:**

| Aspect | PAI Implementation | Atlas Adaptation |
|--------|-------------------|------------------|
| Trigger Event | UserPromptSubmit | Same |
| Coordination | Checks isExplicitRating() first | Same |
| AI Model | Sonnet via inference() | Need to implement/adapt |
| System Prompt | Detailed sentiment analysis | Adapt names (PAI → Atlas, Daniel → Ed) |
| Timeout | 25 seconds | Same |
| Min Confidence | 0.5 | Same |
| Neutral handling | Assigns rating 5 as baseline | Same |

**Critical Dependency:** `skills/CORE/Tools/Inference.ts`

**Checklist:**
- [ ] System prompt documented completely
- [ ] Inference function requirements understood
- [ ] All configuration values documented
- [ ] Atlas naming adaptations planned

---

### Task 2.5: Implement/Adapt Inference Utility

**Goal:** Create inference helper for sentiment analysis.

**File:** `.claude/lib/inference.ts`

**Implementation:**

```typescript
/**
 * AI Inference Utility
 *
 * Provides AI model inference for hooks.
 * Uses Anthropic API with configurable model selection.
 */

import Anthropic from '@anthropic-ai/sdk';

interface InferenceOptions {
  systemPrompt: string;
  userPrompt: string;
  expectJson?: boolean;
  timeout?: number;
  level?: 'fast' | 'standard' | 'deep';  // haiku, sonnet, opus
}

interface InferenceResult {
  success: boolean;
  parsed?: any;
  raw?: string;
  error?: string;
}

const MODEL_MAP = {
  fast: 'claude-3-5-haiku-20241022',
  standard: 'claude-sonnet-4-20250514',
  deep: 'claude-opus-4-20250514'
};

export async function inference(options: InferenceOptions): Promise<InferenceResult> {
  const {
    systemPrompt,
    userPrompt,
    expectJson = false,
    timeout = 20000,
    level = 'standard'
  } = options;

  try {
    const client = new Anthropic();

    const response = await Promise.race([
      client.messages.create({
        model: MODEL_MAP[level],
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeout)
      )
    ]);

    const content = response.content[0];
    if (content.type !== 'text') {
      return { success: false, error: 'Non-text response' };
    }

    if (expectJson) {
      try {
        const parsed = JSON.parse(content.text);
        return { success: true, parsed, raw: content.text };
      } catch {
        return { success: false, error: 'Invalid JSON', raw: content.text };
      }
    }

    return { success: true, raw: content.text };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
```

**Checklist:**
- [ ] Inference function implemented
- [ ] Model selection configurable
- [ ] Timeout handling works
- [ ] JSON parsing optional
- [ ] Error handling robust
- [ ] API key from environment

---

### Task 2.6: Implement ImplicitSentimentCapture Hook

**Goal:** Create Atlas version of the hook.

**File:** `.claude/hooks/implicit-sentiment-capture.ts`

**System Prompt Adaptation:**

```typescript
const SENTIMENT_SYSTEM_PROMPT = `Analyze Ed's message for emotional sentiment toward Atlas (the AI assistant).

CONTEXT: This is a personal AI system. Ed is the ONLY user.

OUTPUT FORMAT (JSON only):
{
  "rating": <1-10 or null>,
  "sentiment": "positive" | "negative" | "neutral",
  "confidence": <0.0-1.0>,
  "summary": "<brief explanation, 10 words max>",
  "detailed_context": "<comprehensive analysis for learning, 100-256 words>"
}

RATING SCALE:
- 1-2: Strong frustration, anger, disappointment
- 3-4: Mild frustration, dissatisfaction
- 5: Neutral (no strong sentiment)
- 6-7: Satisfaction, approval
- 8-9: Strong approval, impressed
- 10: Extraordinary enthusiasm

CRITICAL DISTINCTIONS:
- Profanity can indicate EITHER frustration OR excitement
- Context is KEY: Is the emotion directed AT Atlas's work?
- Sarcasm: "Oh great, another error" = negative despite "great"

WHEN TO RETURN null FOR RATING:
- Neutral technical questions
- Simple commands ("Do it", "Yes", "Continue")
- No emotional indicators present
`;
```

**Checklist:**
- [ ] Hook file created with proper shebang
- [ ] Checks isExplicitRating() first (defers if true)
- [ ] System prompt adapted for Atlas/Ed
- [ ] Uses inference utility
- [ ] Timeout handling (25s)
- [ ] Minimum confidence threshold (0.5)
- [ ] Neutral ratings assigned 5
- [ ] Writes to ratings.jsonl
- [ ] Low ratings trigger learning capture
- [ ] Proper error handling (always exit 0)

---

### Task 2.7: Register Hooks in settings.json

**Goal:** Add hooks to settings.json with correct ordering.

**Update:** `.claude/settings.json`

```json
{
  "hooks": {
    "UserPromptSubmit": [
      // Existing hooks first...

      // Sentiment capture (explicit MUST run before implicit)
      {
        "command": "bun run $PAI_DIR/hooks/explicit-rating-capture.ts"
      },
      {
        "command": "bun run $PAI_DIR/hooks/implicit-sentiment-capture.ts"
      }
    ]
  }
}
```

**Checklist:**
- [ ] Both hooks added to UserPromptSubmit
- [ ] Explicit hook listed BEFORE implicit
- [ ] Command syntax correct ($PAI_DIR)
- [ ] No duplicate hook entries
- [ ] Existing hooks not disrupted

---

### Task 2.8: Add Required Dependencies

**Goal:** Ensure all npm/bun packages are available.

**Check/Add:**
```bash
cd ~/.claude
bun add @anthropic-ai/sdk  # If not already present
```

**Checklist:**
- [ ] @anthropic-ai/sdk installed
- [ ] package.json updated if needed
- [ ] bun.lockb committed

---

## Testing

### Unit Tests

| Test | Input | Expected Output |
|------|-------|-----------------|
| isExplicitRating("8") | "8" | true |
| isExplicitRating("8 - great") | "8 - great" | true |
| isExplicitRating("8 items") | "8 items" | false |
| isExplicitRating("hello") | "hello" | false |
| parseRating("9: excellent") | "9: excellent" | { rating: 9, comment: "excellent" } |
| inference() timeout | 30s prompt | Error after 25s |
| inference() JSON | JSON request | Parsed object |

### Integration Tests

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Explicit rating flow | Send "8 - great work" | Rating in ratings.jsonl |
| Implicit positive | Send "This is amazing!" | High rating (8-10) in file |
| Implicit negative | Send "What the fuck, wrong again" | Low rating (1-3) in file |
| Explicit priority | Send "8" | Only 1 entry (not 2) |
| Low rating learning | Send "2 - terrible" | Learning file created |

### Manual Tests

| Test | Steps | Pass Criteria |
|------|-------|---------------|
| Real session explicit | Type "8" after response | Rating captured, voice feedback |
| Real session implicit | Express satisfaction naturally | Rating detected |
| No false positives | Type "check 3 files" | No rating captured |
| Hook coordination | Type explicit rating | Implicit hook defers |

---

## Regression Tests

Ensure existing functionality not broken:

| Test | Steps | Pass Criteria |
|------|-------|---------------|
| Voice feedback | Complete task | 🎯 COMPLETED still works |
| Stop hooks | End session | All stop hooks fire |
| Tab titles | Work on task | Tab updates correctly |
| Security | Run blocked command | Still blocked |

---

## Exit Criteria

Phase 2 is complete when:

- [ ] ExplicitRatingCapture hook implemented and tested
- [ ] ImplicitSentimentCapture hook implemented and tested
- [ ] Inference utility created and working
- [ ] Hooks registered in settings.json
- [ ] Hook coordination verified (explicit takes priority)
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All regression tests pass
- [ ] Manual testing complete
- [ ] PR created and reviewed

---

## Performance Considerations

- ImplicitSentimentCapture uses AI inference (2-5 second latency)
- Hook runs async - should not block user interaction
- Timeout set to 25s to prevent hanging
- Consider caching for repeated similar prompts (future optimization)

---

## Merge Process

1. Create PR from `sync/phase-2-sentiment` to `master`
2. Run all tests in worktree
3. Request review
4. Squash merge with descriptive message
5. Tag as `v0.2.0-phase2` (optional)
6. Keep worktree for 7 days, then remove

---

## Rollback Plan

If issues discovered post-merge:

```bash
# Remove hooks from settings.json
# Revert the merge commit
git revert <merge-commit-sha>

# Hooks will stop running immediately after settings.json change
```
