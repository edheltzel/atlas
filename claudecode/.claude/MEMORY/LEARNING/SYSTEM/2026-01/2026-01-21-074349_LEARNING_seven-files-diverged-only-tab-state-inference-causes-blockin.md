---
capture_type: LEARNING
timestamp: 2026-01-21 07:43:49 PST
auto_captured: true
tags: [auto-capture]
---

# Quick Learning: Seven files diverged. Only tab-state inference causes blocking. Others are enhancements or cosmetic.

**Date:** 2026-01-21
**Auto-captured:** Yes (use /capture-learning for detailed narrative)

---

## Summary

Found 7 files that diverged between private `~/.claude` and public PAI repo.

## Analysis

| File | Divergence Type | Impact |

## Actions Taken

N/A

## Results

- **1 blocking change:** tab-state.ts inference

## Current Status

Full divergence audit complete

## Next Steps

- Fix tab-state.ts (revert to simple truncation OR make inference non-blocking)

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

📋 SUMMARY: Found 7 files that diverged between private `~/.claude` and public PAI repo.

🔍 ANALYSIS:

| File | Divergence Type | Impact |
|------|-----------------|--------|
| **handlers/tab-state.ts** | Added AI inference | **2-5s delay** (root cause) |
| handlers/voice.ts | Added VoiceProsody settings | Minor enhancement |
| lib/identity.ts | Added VoiceProsody interface | Supporting voice.ts |
| lib/response-format.ts | Minor wording ("the" added) | Cosmetic |
| lib/recovery-types.ts | PAI_DIR vs PAI_HOME | Env var naming |
| StartupGreeting.hook.ts | Async wrapper + formatting | Structural |
| UpdateTabTitle.hook.ts | Added voice announcement + "the" | Minor changes |

**Root cause confirmed:** Only `tab-state.ts` adds blocking inference. Other changes are:
- Voice prosody settings (non-blocking enhancement)
- Minor wording changes ("Fixing bug" → "Fixing the bug.")
- Env var naming (PAI_HOME → PAI_DIR)

✅ RESULTS: 
- **1 blocking change:** tab-state.ts inference
- **6 non-blocking changes:** enhancements and cosmetic tweaks

📊 STATUS: Full divergence audit complete

➡️ NEXT:
- Fix tab-state.ts (revert to simple truncation OR make inference non-blocking)
- Optionally sync other changes back to public repo if valuable

📖 STORY EXPLANATION:
1. Seven files differ between private and public PAI
2. Only tab-state.ts adds blocking behavior (inference)
3. Voice.ts and identity.ts add prosody settings (non-blocking)
4. Response-format.ts has minor wording tweaks
5. Recovery-types.ts uses different env var name
6. StartupGreeting.hook.ts has async wrapper changes
7. UpdateTabTitle.hook.ts has voice announcement added
8. Only the tab-state.ts inference needs fixing for the hang

⭐ RATE (1-10): 

🗣️ Atlas: Seven files diverged. Only tab-state inference causes blocking. Others are enhancements or cosmetic.

</details>
