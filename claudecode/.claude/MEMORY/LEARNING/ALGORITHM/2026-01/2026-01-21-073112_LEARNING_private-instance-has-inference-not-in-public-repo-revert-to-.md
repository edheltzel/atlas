---
capture_type: LEARNING
timestamp: 2026-01-21 07:31:12 PST
auto_captured: true
tags: [auto-capture]
---

# Quick Learning: Private instance has inference not in public repo. Revert to public version or make non-blocking.

**Date:** 2026-01-21
**Auto-captured:** Yes (use /capture-learning for detailed narrative)

---

## Summary

Found the source - your private `~/.claude` instance has a modified `tab-state.ts` with inference that doesn't exist in the public PAI repo.

## Analysis

| Location | Version | Has Inference? |

## Actions Taken

Identified divergence between public/private versions

## Results

The "fix" already exists in the public PAI repo - your private instance diverged

## Current Status

Root cause confirmed - local modification added inference

## Next Steps

- **Option 1:** Revert `~/.claude/hooks/handlers/tab-state.ts` to match public PAI version

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

📋 SUMMARY: Found the source - your private `~/.claude` instance has a modified `tab-state.ts` with inference that doesn't exist in the public PAI repo.

🔍 ANALYSIS:
| Location | Version | Has Inference? |
|----------|---------|----------------|
| **Public PAI repo** | Simple 4-word truncation | **No** ✓ |
| **Private ~/.claude** | AI inference for tab title | **Yes** (2-5s delay) |

The public PAI repo at `Packs/pai-hook-system/src/hooks/handlers/tab-state.ts` uses simple string truncation:
```typescript
// Clean version (public repo)
const words = cleanTitle.split(/\s+/).slice(0, 4);
let shortTitle = words.join(' ');
```

Your private instance added inference:
```typescript
// Modified version (private ~/.claude)
const shortTitle = await generateCompletionSummary(plainCompletion);
// ↑ spawns claude subprocess with 10s timeout
```

⚡ ACTIONS: Identified divergence between public/private versions

✅ RESULTS: The "fix" already exists in the public PAI repo - your private instance diverged

📊 STATUS: Root cause confirmed - local modification added inference

➡️ NEXT: 
- **Option 1:** Revert `~/.claude/hooks/handlers/tab-state.ts` to match public PAI version
- **Option 2:** Apply fire-and-forget fix from plan to keep inference but non-blocking

📖 STORY EXPLANATION:
1. Public PAI repo has simple string truncation for tab titles
2. Private ~/.claude instance was modified to use AI inference
3. Inference spawns claude subprocess with 10-second timeout
4. This causes 2-5 second delays after every response
5. The modification was made locally, not in the public repo
6. Reverting to public version eliminates the delay entirely
7. Alternatively, make inference non-blocking to keep AI quality
8. Either approach fixes the hanging issue

⭐ RATE (1-10): 

🗣️ Atlas: Private instance has inference not in public repo. Revert to public version or make non-blocking.

</details>
