# Diverged Files from Upstream PAI

**Last Updated:** 2026-01-31
**Atlas Version:** PAI 2.4 based
**Upstream Version:** PAI v2.5.0
**Algorithm:** Atlas 7-phase ISC (diverged from PAI 8-point STORY)

Files in this list have been intentionally modified from the upstream PAI repository and should NOT be blindly overwritten during sync.

## Quick Reference: Sync Checklist

```
After PAI upstream sync, re-apply these:

□ VoiceServer/ - KEEP ATLAS (never overwrite)
□ CORE/SKILL.md - KEEP ATLAS (7-phase ISC format)
□ StartupGreeting.hook.ts - Re-apply async IIFE wrapper
□ UpdateTabTitle.hook.ts - Re-apply sentence format with periods
□ FormatReminder.hook.ts - Keep (Atlas-only, not in upstream)
□ Skill descriptions - Re-apply concise "USE WHEN..." format
□ 13 other hooks - Safe to overwrite (identical to upstream)
```

## PAI v2.5 Note

PAI v2.5 renamed `skills/CORE` to `skills/PAI`. Atlas still uses `CORE`. See `PAI_UPGRADE_PLAN.md` for migration strategy.

## How to Sync Safely

When syncing with upstream PAI (`~/Developer/AI/PAI` or v2.5 release):

1. **Review this file first** - Check what's diverged and why
2. **Use selective sync** - Don't copy diverged files, or merge manually
3. **Check upstream changes** - See if upstream has improvements we want to merge
4. **See full plan** - `cat ~/Developer/AI/atlasProject/atlas/PAI_UPGRADE_PLAN.md`

```bash
# Compare diverged files with upstream
diff ~/.claude/VoiceServer/server.ts ~/Developer/AI/PAI/.claude/VoiceServer/server.ts

# If upstream has changes we want, merge manually
```

---

## Critical Divergences (DO NOT OVERWRITE)

### 1. CORE/SKILL.md (Algorithm Format) — MAJOR DIVERGENCE

**Reason:** Atlas uses 7-phase ISC format; upstream PAI uses 8-point STORY format.

| Aspect | Atlas | Upstream PAI |
|--------|-------|--------------|
| **Format** | 7-phase: OBSERVE → THINK → PLAN → BUILD → EXECUTE → VERIFY → LEARN | 8-point: SUMMARY, ANALYSIS, ACTIONS, RESULTS, STATUS, CAPTURE, NEXT, STORY |
| **ISC Tracking** | Visual ASCII tables with symbols (⬜🔄✅❌🔀🗑️👀) | TaskCreate/TaskList tools |
| **Progress Bar** | Visual `░░░░░░░░░░` indicator | None |
| **OUTPUT Phase** | 6.5/7 for large result sets | Not present |
| **Capability Selection** | MCS with Phase Start Prompts | Two-Pass Selection |
| **Anti-Criteria** | Explicit tracking with 👀 WATCHING | Not explicit |

**Action:** KEEP ATLAS VERSION. Manual merge for algorithm version updates only.

**What to merge from upstream:**
- Algorithm version changes (v0.2.25 → v0.3.x) - core concepts only
- New capabilities or composition patterns
- Bug fixes to non-format sections

**What to NEVER overwrite:**
- 7-phase format structure
- ISC table definitions
- Phase headers with spaced letters
- MCS (Mandatory Capability Selection) rules
- Anti-criteria tracking

---

### 2. VoiceServer (ENTIRE DIRECTORY)

**Reason:** Complete TypeScript rewrite with reliability improvements

**Atlas Implementation (TypeScript/Bun):**
- ElevenLabs SDK integration (replaces raw fetch)
- 10-second timeout to prevent multi-minute hangs
- Circuit breaker pattern (opens after 1 failure, 60s reset)
- macOS `say` command fallback for instant local TTS
- Full voice settings support (style, speed, use_speaker_boost)

**PAI v2.5 Implementation (Python):**
- Python-based with different architecture
- No timeout protection
- No circuit breaker

**Files to protect:**
```
VoiceServer/server.ts          # Main server (TypeScript)
VoiceServer/package.json       # ElevenLabs SDK dependency
VoiceServer/bun.lock          # Lockfile
VoiceServer/Tools/            # Atlas-specific tools
VoiceServer/CHANGELOG.md      # Local changelog
VoiceServer/USAGE.md          # Local docs
VoiceServer/config/           # Config directory
VoiceServer/voices.json       # Voice configuration
```

**Date:** 2026-01-27
**Commit:** 314fde5

---

### 3. USER Directory Extensions

**Location:** `skills/CORE/USER/` (will become `skills/PAI/USER/`)

Atlas has significantly extended USER beyond upstream:

| Atlas Addition | Purpose |
|----------------|---------|
| `ALGOPREFS.md` | Algorithm preferences |
| `BUSINESS/` | Business context |
| `HEALTH/` | Health tracking |
| `WORK/` | Work context |
| `STATUSLINE/` | Custom statusline themes (rosepine, eldritch) |
| `PAISECURITYSYSTEM/` | User security rules |
| `SKILLCUSTOMIZATIONS/Art/` | Art skill preferences |
| `README.md` | USER documentation |

**Action:** PRESERVE all. Compare `AISTEERINGRULES.md` with upstream.

---

### 4. SYSTEM Directory Extensions

**Location:** `skills/CORE/SYSTEM/`

| Atlas Addition | Purpose |
|----------------|---------|
| `BACKUPS.md` | Backup documentation |
| `RESPONSEFORMAT.md` | Response format rules |
| `SCRAPINGREFERENCE.md` | Scraping reference |
| `UPDATES/` | Update tracking directory |

**Action:** PRESERVE. Not in upstream PAI v2.5.

---

### 5. Atlas-Only Skills

Skills in Atlas not present in upstream PAI:

| Skill | Purpose |
|-------|---------|
| `System` | Integrity audits, documentation tracking |
| `THEALGORITHM` | Algorithm reference (merge with PAI updates) |
| `FindSkill` | Skill search utility |
| `InstallBackend` | Backend skill installer (skills.sh) |
| `InstallDevops` | DevOps skill installer (skills.sh) |
| `InstallFrontend` | Frontend skill installer (skills.sh) |
| `find-skills` | Symlink to `~/.agents/skills/find-skills` |

**Action:** PRESERVE all.

---

### 6. Hook Differences

**Verified Status (2026-01-31):**

| Hook | Status | Atlas Change |
|------|--------|--------------|
| `StartupGreeting.hook.ts` | ⚠️ MODIFIED | Wrapped in async IIFE for better async handling |
| `UpdateTabTitle.hook.ts` | ⚠️ MODIFIED | Changed format to complete sentences with periods |
| `FormatReminder.hook.ts` | ➕ ATLAS-ONLY | Not in upstream |
| All 13 other hooks | ✅ IDENTICAL | Safe to overwrite |

**Re-application after sync:**

For `StartupGreeting.hook.ts`:
- Wrap main logic in `(async () => { ... })()`
- Restructure try/catch for async operations

For `UpdateTabTitle.hook.ts`:
- Change tab/voice format to complete sentences with periods
- Example: "Checking the config." instead of "Checking config"

**Action:** After sync, re-apply the 2 modified hooks. Keep FormatReminder.hook.ts.

---

### 7. Skill Description Format

**Reason:** Atlas shortened verbose skill descriptions to concise "USE WHEN..." triggers.

**Before (upstream):**
```markdown
description: Dynamic agent composition and management system. USE WHEN user says create custom agents, spin up custom agents, specialized agents, OR asks for agent personalities, available traits, agent voices.
```

**After (Atlas):**
```markdown
description: USE WHEN create custom agents, spin up custom agents, specialized agents, agent personalities, available traits, agent voices.
```

**Affected:** ~35 skill SKILL.md files

**Re-application script:**
```bash
# After sync, re-apply concise descriptions
# Pattern: Remove verbose prefix before "USE WHEN"
fd SKILL.md ~/.claude/skills -x sed -i '' 's/description: .* USE WHEN/description: USE WHEN/g' {}
```

**Action:** Re-apply after each sync. This is cosmetic but improves skill-index parsing.

---

## Files Safe to Sync

After the CORE -> PAI rename migration:

- `skills/PAI/SKILL.md` - WITH MERGE for algorithm updates
- `skills/PAI/SYSTEM/` files that exist in both - WITH COMPARISON
- `hooks/` - WITH COMPARISON (keep Atlas additions)
- `agents/` - Generally safe
- `MEMORY/` structure - Compare and migrate data
- `Observability/` - WITH MERGE
- `INSTALL.ts` - Safe (just renamed)
- `INSTALL.md` - Safe (new)
- `statusline-*.sh` - Compare first

---

## Merge Strategy

### For VoiceServer:

**NEVER copy from upstream.** Atlas TypeScript version is strictly superior.

If upstream PAI eventually ports to TypeScript or adds similar features:
1. Check if they added SDK support - compare implementations
2. Check if they added timeout/fallback - merge their approach with ours
3. If no overlap - keep Atlas version

### For SKILL.md (Algorithm):

1. Copy algorithm updates (v0.2.23 -> v0.2.25)
2. Preserve Atlas format customizations
3. Maintain ISC Tracker format

### For Hooks:

1. Compare each hook file
2. Keep Atlas-specific hooks
3. Merge improvements from upstream

### For USER/SYSTEM:

1. NEVER overwrite Atlas additions
2. Compare shared files for updates
3. Merge improvements selectively

---

## Key Features to ALWAYS Preserve

1. **VoiceServer TypeScript implementation**
   - 10s timeout (prevents hanging)
   - Circuit breaker (fast fallback)
   - macOS say fallback (works without API credits)

2. **USER directory extensions**
   - Personal context files
   - STATUSLINE themes
   - SKILLCUSTOMIZATIONS

3. **Atlas-only skills**
   - System, FindSkill, Install* skills

4. **SYSTEM extensions**
   - BACKUPS.md, RESPONSEFORMAT.md, SCRAPINGREFERENCE.md

---

## Related Documentation

- `~/Developer/AI/atlasProject/atlas/PAI_UPGRADE_PLAN.md` - Full upgrade plan
- `~/Developer/AI/atlasProject/atlas/CLAUDE.md` - Atlas architecture
- `~/.claude/skills/CORE/SKILL.md` - Current algorithm implementation
