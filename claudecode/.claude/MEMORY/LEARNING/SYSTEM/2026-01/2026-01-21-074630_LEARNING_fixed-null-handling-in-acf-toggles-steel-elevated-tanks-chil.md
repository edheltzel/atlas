---
capture_type: LEARNING
timestamp: 2026-01-21 07:46:30 PST
auto_captured: true
tags: [auto-capture]
---

# Quick Learning: Fixed NULL handling in ACF toggles, Steel Elevated Tanks children grid now displays correctly.

**Date:** 2026-01-21
**Auto-captured:** Yes (use /capture-learning for detailed narrative)

---

## Summary

N/A

## Analysis

N/A

## Actions Taken

N/A

## Results

N/A

## Current Status

N/A

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

The children grid is now displaying correctly with all three child products:
- **Fluted Column Tanks**
- **Multi-Column Tanks**  
- **Single Pedestal Tanks**

Each card shows the icon, description, and "Read More" link as expected.

---

📋 **SUMMARY**: Fixed ACF toggle NULL handling causing children grid to not display

🔍 **ANALYSIS**: 
- ACF returns `NULL` (not empty string) when a field hasn't been saved for a post
- The code checked `'' === $show_children_grid` which doesn't match `NULL`
- Since `NULL` is falsy, the grid component was skipped entirely

⚡ **ACTIONS**:
- Added debug code to identify the issue
- Found `show_children_grid=NULL` on Steel Elevated Tanks page
- Updated all section toggle checks to handle both `NULL` and empty string
- Removed debug code after fix

✅ **RESULTS**:
- Steel Elevated Tanks now shows 3 service items in the children grid
- All three children displayed: Fluted Column Tanks, Multi-Column Tanks, Single Pedestal Tanks

📊 **STATUS**: Fix deployed and verified working

📁 **CAPTURE**: ACF true/false fields return NULL when never saved, not empty string

➡️ **NEXT**: Any other product pages to verify, or this debugging session is complete

📖 **STORY EXPLANATION**:
1. Steel Elevated Tanks page wasn't showing children grid despite toggle being YES in admin
2. Added debug to content-product.php to see the actual toggle value
3. Discovered `show_children_grid=NULL` instead of expected true/boolean
4. ACF returns NULL when a field has never been explicitly saved for a post
5. The code only checked for empty string `''`, not NULL
6. Updated all four toggle checks to handle both NULL and empty string
7. Deployed fix via rsync.sh
8. Verified grid now renders with all 3 children products

⭐ **RATE (1-10)**: 

🗣️ Atlas: Fixed NULL handling in ACF toggles, Steel Elevated Tanks children grid now displays correctly.

</details>
