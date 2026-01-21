---
capture_type: LEARNING
timestamp: 2026-01-21 03:50:29 PST
auto_captured: true
tags: [auto-capture]
---

# Quick Learning: Tab state handler uses AI inference causing two to five second delays after every response.

**Date:** 2026-01-21
**Auto-captured:** Yes (use /capture-learning for detailed narrative)

---

## Summary

Found the Stop hook hanging issue - `tab-state.ts` calls AI inference during every Stop event.

## Analysis

- `handleTabState()` calls `generateCompletionSummary()` which spawns a `claude` subprocess

## Actions Taken

Created plan at `Plans/fix-stop-hook-hang.md`

## Results

Root cause identified in `hooks/handlers/tab-state.ts:47-67`

## Current Status

Plan written and ready for implementation

## Next Steps

- Implement Option A (replace inference with simple string extraction)

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

📋 SUMMARY: Found the Stop hook hanging issue - `tab-state.ts` calls AI inference during every Stop event.

🔍 ANALYSIS: 
- `handleTabState()` calls `generateCompletionSummary()` which spawns a `claude` subprocess
- The inference call has a 10-second timeout, typically taking 2-5 seconds
- Even though handlers run via `Promise.allSettled`, the orchestrator waits for ALL to finish
- This blocks CC from being responsive until inference completes

⚡ ACTIONS: Created plan at `Plans/fix-stop-hook-hang.md`

✅ RESULTS: Root cause identified in `hooks/handlers/tab-state.ts:47-67`

📊 STATUS: Plan written and ready for implementation

➡️ NEXT: 
- Implement Option A (replace inference with simple string extraction)
- Test that tab titles still look reasonable
- Verify Stop hook completes in <200ms

📖 STORY EXPLANATION:
1. Stop hook runs `StopOrchestrator.hook.ts` after each Claude response
2. Orchestrator runs 4 handlers in parallel: voice, capture, tab-state, system-integrity
3. The `tab-state` handler generates a 3-4 word tab title using AI inference
4. Inference spawns a `claude` subprocess with 10-second timeout
5. Even "fast" Haiku takes 2-5 seconds to respond
6. `Promise.allSettled` waits for ALL handlers before exiting
7. This blocks CC's responsiveness for the duration of the inference call
8. Fix: Replace inference with simple string extraction from the voice line

⭐ RATE (1-10): 

🗣️ Atlas: Tab state handler uses AI inference causing two to five second delays after every response.

</details>
