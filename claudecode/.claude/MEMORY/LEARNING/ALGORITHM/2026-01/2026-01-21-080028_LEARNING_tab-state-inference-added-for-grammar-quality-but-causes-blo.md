---
capture_type: LEARNING
timestamp: 2026-01-21 08:00:28 PST
auto_captured: true
tags: [auto-capture]
---

# Quick Learning: Tab-state inference added for grammar quality but causes blocking. VoiceProsody is the valuable divergence to keep.

**Date:** 2026-01-21
**Auto-captured:** Yes (use /capture-learning for detailed narrative)

---

## Summary

Complete analysis of divergences, reasoning behind changes, and sync impact.

## Analysis

N/A

## Actions Taken

N/A

## Results

N/A

## Current Status

Full divergence analysis complete

## Next Steps

N/A

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

📋 SUMMARY: Complete analysis of divergences, reasoning behind changes, and sync impact.

---

## WHY Tab-State Inference Was Added

Looking at the code differences, I can infer the **intent** behind adding inference to `tab-state.ts`:

| Aspect | Public Repo (Simple) | Private Instance (Inference) |
|--------|---------------------|------------------------------|
| **Title generation** | First 4 words of voice line | AI-generated "proper" summary |
| **Format** | `"Fixed auth bug by..."` → `"Fixed auth bug"` | `"Fixed auth bug by..."` → `"Fixed the auth bug."` |
| **Grammar** | Raw truncation | Past-tense with "the" article |
| **Quality** | Sometimes awkward cuts | Grammatically correct sentences |

**The reasoning:** Simple truncation sometimes produces awkward titles like `"Updated the hook logic"` → `"Updated the hook"` (fine) but also `"Removed assistant messages from"` → `"Removed assistant messages"` (missing object). The inference was added to **semantically understand** and **reformat** the completion into a proper 3-4 word sentence.

**The tradeoff:** 2-5 seconds of blocking latency for marginally better grammar.

---

## Detailed Divergence List

### 1. **tab-state.ts** - FUNCTIONAL (Blocking)
| Change | Impact |
|--------|--------|
| Added `inference()` call with 10s timeout | **2-5 second blocking delay** |
| Removed `TAB_SUFFIXES` (?, !, "") | No suffix indicators |
| Changed title format from truncation to AI-generated | Slightly better grammar |
| Only uses `✓` prefix (removed `⚠` for errors) | Simplified visual feedback |

### 2. **voice.ts** - FUNCTIONAL (Non-blocking)
| Change | Impact |
|--------|--------|
| Added `VoiceProsody` import | Supports voice tuning |
| Added `voice_settings` to notification payload | Enables ElevenLabs prosody control |

### 3. **identity.ts** - STRUCTURAL
| Change | Impact |
|--------|--------|
| Added `VoiceProsody` interface | Type definition for voice settings |
| Added `voice?: VoiceProsody` to Identity | Allows voice config in settings.json |
| Added `getVoiceProsody()` function | Convenience accessor |

### 4. **response-format.ts** - COSMETIC
| Change | Impact |
|--------|--------|
| `"Fixing bug"` → `"Fixing the bug."` | Added "the" article + period |
| Same for fallbacks | Slightly more formal phrasing |

### 5. **recovery-types.ts** - COSMETIC
| Change | Impact |
|--------|--------|
| `PAI_HOME` → `PAI_DIR` | Environment variable naming |

### 6. **UpdateTabTitle.hook.ts** - FUNCTIONAL
| Change | Impact |
|--------|--------|
| Added voice announcement docs in header | Documentation |
| Added `voice_settings` to fetch payload | Prosody support |
| Changed to async `announceVoice()` with proper fetch | Better error handling |
| Skips assistant messages in context | Different summarization behavior |
| Uses `fromInference` flag to skip voice on fallback | Only speaks AI-generated summaries |

### 7. **StartupGreeting.hook.ts** - STRUCTURAL
| Change | Impact |
|--------|--------|
| Wrapped in async IIFE | Async error handling pattern |
| Minor formatting differences | Cosmetic |

---

## What Will Break/Be Lost on Upstream Sync

### ❌ WILL LOSE (Valuable)
| Feature | Description |
|---------|-------------|
| **VoiceProsody support** | Custom ElevenLabs voice settings (stability, similarity, speed, style) |
| **voice_settings in payloads** | Voice tuning sent to voice server |
| **getVoiceProsody() function** | Convenience accessor |
| **"the" article in titles** | Slightly more formal phrasing |

### ✅ WILL GAIN (Good)
| Feature | Description |
|---------|-------------|
| **No blocking delay** | Tab-state uses simple truncation (instant) |
| **TAB_SUFFIXES restored** | Visual `?` and `!` indicators |
| **Simpler code** | No inference dependency in tab-state |

### ⚠️ NEUTRAL
| Feature | Description |
|---------|-------------|
| PAI_HOME vs PAI_DIR | Just env var naming, both work |
| Async wrapper in StartupGreeting | Different pattern, same behavior |

---

## Recommendation

**Before syncing upstream:**
1. **Port VoiceProsody** to public PAI if valuable for community
2. **Keep tab-state simple** (public version is better - no blocking)
3. **Add voice_settings** to public voice.ts if prosody is useful

**Or:** Accept public version entirely - the tab-state hang fix is worth losing the "the" article.

📊 STATUS: Full divergence analysis complete

🗣️ Atlas: Tab-state inference added for grammar quality but causes blocking. VoiceProsody is the valuable divergence to keep.

</details>
