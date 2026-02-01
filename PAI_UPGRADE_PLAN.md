# PAI 2.5 to 3.0 Upgrade Preparation Plan

**Generated:** 2026-01-31
**Current Atlas Version:** PAI 2.4 (based on settings.json paiVersion)
**Target Versions:** PAI 2.5 (immediate) -> 3.0 (future)

---

## Executive Summary

Atlas has diverged from upstream PAI in several intentional ways. This plan ensures:
1. **Protection** of Atlas customizations during sync
2. **Adoption** of PAI v2.5 improvements without losing enhancements
3. **Preparation** for PAI 3.0 compatibility

---

## PAI v2.5 Major Features

| Feature | Description | Atlas Impact |
|---------|-------------|--------------|
| **Two-Pass Capability Selection** | Hook hints + THINK validation | Need FormatReminder hook update |
| **Thinking Tools with Justify-Exclusion** | 6 tools opt-OUT default | New behavior to adopt |
| **Parallel-by-Default Execution** | Concurrent agents | Already supported |
| **CORE -> PAI Rename** | Core skill directory renamed | Major migration required |
| **Algorithm v0.2.25** | New version with metacognition | Update SKILL.md and THEALGORITHM |
| **17 Hooks** | 2 new hooks added | Compare and merge |
| **INSTALL.ts** | Wizard renamed from PAIInstallWizard.ts | Minor path update |
| **MEMORY Structure** | Updated directory organization | Review and migrate |

---

## 1. Atlas Divergences to PROTECT

### 1.1 VoiceServer (CRITICAL - DO NOT OVERWRITE)

**Location:** `claudecode/.claude/VoiceServer/`

**Atlas Implementation (TypeScript/Bun):**
- ElevenLabs SDK with 10s timeout
- Circuit breaker pattern (opens after 1 failure, 60s reset)
- macOS `say` command fallback
- Full voice settings support

**PAI v2.5 Implementation (Python):**
- Python-based server
- Different architecture

**Action:** KEEP Atlas implementation. It is strictly superior with:
- Timeout protection (prevents hangs)
- Circuit breaker (fast fallback)
- Local TTS fallback (works offline)

**Files to protect:**
```
VoiceServer/server.ts          # Main server
VoiceServer/package.json       # ElevenLabs SDK dependency
VoiceServer/bun.lock          # Lockfile
VoiceServer/Tools/            # Atlas-specific tools
VoiceServer/CHANGELOG.md      # Local changelog
VoiceServer/USAGE.md          # Local docs
```

### 1.2 USER Directory Extensions

**Location:** `claudecode/.claude/skills/CORE/USER/`

Atlas has significantly extended USER with personal files not in upstream:

| Atlas Addition | Purpose | Action |
|----------------|---------|--------|
| `ALGOPREFS.md` | Algorithm preferences | KEEP |
| `BUSINESS/` | Business context | KEEP |
| `HEALTH/` | Health tracking | KEEP |
| `WORK/` | Work context | KEEP |
| `STATUSLINE/` | Custom statusline themes | KEEP |
| `PAISECURITYSYSTEM/` | User security rules | KEEP |
| `SKILLCUSTOMIZATIONS/Art/` | Art skill preferences | KEEP |
| `AISTEERINGRULES.md` | User steering rules | KEEP (compare with upstream) |

### 1.3 Atlas-Only Skills

Skills in Atlas not present in PAI v2.5:

| Skill | Purpose | Action |
|-------|---------|--------|
| `System` | Integrity audits, documentation | KEEP - unique functionality |
| `THEALGORITHM` | Algorithm reference | MERGE with PAI updates |
| `FindSkill` | Skill search utility | KEEP |
| `InstallBackend` | Backend skill installer | KEEP |
| `InstallDevops` | DevOps skill installer | KEEP |
| `InstallFrontend` | Frontend skill installer | KEEP |
| `find-skills` | skills.sh symlink | KEEP (symlink to ~/.agents) |

### 1.4 SYSTEM Directory Extensions

Atlas has additional SYSTEM files:

| Atlas Addition | Purpose | Action |
|----------------|---------|--------|
| `BACKUPS.md` | Backup documentation | KEEP |
| `RESPONSEFORMAT.md` | Response format rules | KEEP (may merge) |
| `SCRAPINGREFERENCE.md` | Scraping reference | KEEP |
| `UPDATES/` | Update tracking | KEEP |

---

## 2. PAI v2.5 Features to ADOPT

### 2.1 CORE -> PAI Skill Rename

**Required Migration:**

```bash
# Step 1: Rename directory
mv skills/CORE skills/PAI

# Step 2: Update settings.json contextFiles
# FROM:
"contextFiles": [
    "skills/CORE/SKILL.md",
    "skills/CORE/SYSTEM/AISTEERINGRULES.md",
    "skills/CORE/USER/AISTEERINGRULES.md",
    "skills/CORE/USER/DAIDENTITY.md"
]
# TO:
"contextFiles": [
    "skills/PAI/SKILL.md",
    "skills/PAI/SYSTEM/AISTEERINGRULES.md",
    "skills/PAI/USER/AISTEERINGRULES.md",
    "skills/PAI/USER/DAIDENTITY.md"
]

# Step 3: Update skill references in all SKILL.md files
rg -l "skills/CORE" ~/.claude/skills/ | xargs sed -i '' 's|skills/CORE|skills/PAI|g'

# Step 4: Update SKILLCUSTOMIZATIONS path references
rg -l "CORE/USER/SKILLCUSTOMIZATIONS" ~/.claude/skills/ | xargs sed -i '' 's|CORE/USER/SKILLCUSTOMIZATIONS|PAI/USER/SKILLCUSTOMIZATIONS|g'
```

### 2.2 Algorithm Updates (v0.2.23 -> v0.2.25)

**Changes to merge:**

| Version | Feature | File |
|---------|---------|------|
| v0.2.23 | Two-Pass Capability Selection | SKILL.md |
| v0.2.24 | Thinking Tools Assessment | SKILL.md |
| v0.2.25 | Parallel-by-default execution | SKILL.md |

**Action:** Update `skills/PAI/SKILL.md` with new algorithm sections while preserving Atlas format customizations.

### 2.3 New/Updated Hooks

**PAI v2.5 has 17 hooks vs Atlas has ~16:**

| Hook | Status | Action |
|------|--------|--------|
| `RelationshipMemory.hook.ts` | In PAI v2.5, in Atlas | COMPARE - check for updates |
| `SoulEvolution.hook.ts` | In PAI v2.5, in Atlas | COMPARE - check for updates |
| `FormatReminder.hook.ts` | In PAI v2.5, in Atlas | UPDATE - critical for two-pass capability |
| `FormatEnforcer.hook.ts` | Atlas only | KEEP - may be Atlas-specific |

### 2.4 MEMORY Structure

PAI v2.5 reorganized MEMORY:
```
MEMORY/
├── LEARNING/
│   └── README.md
├── RESEARCH/
│   └── README.md
├── STATE/
│   └── README.md
├── WORK/
│   └── README.md
└── README.md
```

**Action:** Compare with Atlas MEMORY structure and migrate if beneficial.

### 2.5 Observability Updates

PAI v2.5 includes updated Observability dashboard components.

**Action:** Compare and merge improvements without losing Atlas customizations.

---

## 3. Hooks Comparison

### Atlas Hooks (16)
```
AgentOutputCapture.hook.ts
AutoWorkCreation.hook.ts
CheckVersion.hook.ts
ExplicitRatingCapture.hook.ts
FormatEnforcer.hook.ts        <- Atlas only?
FormatReminder.hook.ts
ImplicitSentimentCapture.hook.ts
LoadContext.hook.ts
QuestionAnswered.hook.ts
SecurityValidator.hook.ts
SessionSummary.hook.ts
SetQuestionTab.hook.ts
SoulEvolution.hook.ts         <- May need checking
StartupGreeting.hook.ts
StopOrchestrator.hook.ts
UpdateTabTitle.hook.ts
WorkCompletionLearning.hook.ts
```

### PAI v2.5 Hooks (17)
```
AgentOutputCapture.hook.ts
AutoWorkCreation.hook.ts
CheckVersion.hook.ts
ExplicitRatingCapture.hook.ts
FormatReminder.hook.ts
ImplicitSentimentCapture.hook.ts
LoadContext.hook.ts
QuestionAnswered.hook.ts
README.md
RelationshipMemory.hook.ts    <- Verify in Atlas
SecurityValidator.hook.ts
SessionSummary.hook.ts
SetQuestionTab.hook.ts
SoulEvolution.hook.ts
StartupGreeting.hook.ts
StopOrchestrator.hook.ts
UpdateTabTitle.hook.ts
WorkCompletionLearning.hook.ts
```

---

## 4. Settings.json Migration

### Current Atlas settings.json

```json
{
  "paiVersion": "2.4",
  "contextFiles": [
    "skills/CORE/SKILL.md",
    "skills/CORE/SYSTEM/AISTEERINGRULES.md",
    "skills/CORE/USER/AISTEERINGRULES.md",
    "skills/CORE/USER/DAIDENTITY.md"
  ]
}
```

### Required Updates for v2.5

```json
{
  "paiVersion": "2.5",
  "contextFiles": [
    "skills/PAI/SKILL.md",
    "skills/PAI/SYSTEM/AISTEERINGRULES.md",
    "skills/PAI/USER/AISTEERINGRULES.md",
    "skills/PAI/USER/DAIDENTITY.md"
  ]
}
```

---

## 5. Upgrade Execution Plan

### Phase 1: Pre-Upgrade Backup (CRITICAL)

```bash
# Create timestamped backup
cp -r ~/.claude ~/.claude-backup-$(date +%Y%m%d-%H%M%S)

# Or use Atlas Stow (if symlinked)
cd ~/Developer/AI/atlasProject/atlas
git stash  # Stash any uncommitted changes
git checkout -b pre-2.5-backup
git add -A && git commit -m "Backup before PAI 2.5 upgrade"
```

### Phase 2: Download and Compare v2.5

```bash
# Clone PAI v2.5 to temp location
mkdir -p ~/tmp/pai-2.5
cd ~/tmp/pai-2.5
gh release download v2.5.0 --repo danielmiessler/Personal_AI_Infrastructure --archive=tar.gz
tar -xzf *.tar.gz
```

### Phase 3: Selective Merge

**DO NOT copy:**
- `VoiceServer/` (keep Atlas)
- `skills/PAI/USER/` contents that Atlas extends

**COPY with merge:**
- `skills/PAI/SKILL.md` (merge algorithm updates)
- `skills/PAI/SYSTEM/` (compare each file)
- `hooks/` (compare each hook)
- `MEMORY/` structure updates
- `Observability/` updates

**COPY directly:**
- `INSTALL.ts` (renamed from PAIInstallWizard.ts)
- `INSTALL.md` (new documentation)
- `statusline-command.sh` updates
- `statusline-debug.sh` (new)

### Phase 4: CORE -> PAI Migration

```bash
# Execute rename
cd ~/.claude/skills
mv CORE PAI

# Update all references
rg -l "skills/CORE" ~/.claude | xargs sed -i '' 's|skills/CORE|skills/PAI|g'
rg -l "CORE/USER" ~/.claude | xargs sed -i '' 's|CORE/USER|PAI/USER|g'

# Update settings.json contextFiles
# (Manual edit or scripted)
```

### Phase 5: Verification

```bash
# Test voice server
curl -s -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "PAI 2.5 upgrade test"}'

# Test startup
claude --new "test PAI 2.5"

# Verify hooks
ls -la ~/.claude/hooks/

# Verify skills
ls -la ~/.claude/skills/PAI/
```

### Phase 6: Update DIVERGED.md

Add new divergences:
- TypeScript VoiceServer (vs Python upstream)
- Atlas-only skills
- USER directory extensions

---

## 6. PAI 3.0 Preparation

### Expected 3.0 Changes (Speculation)

Based on v2.5 trajectory:
- Deeper metacognition
- Enhanced parallel execution
- Possible new thinking tools
- Potential structural changes

### Preparation Actions

1. **Document all Atlas divergences** in `DIVERGED.md`
2. **Tag current Atlas state** in git before any upgrade
3. **Maintain clean separation** of Atlas additions vs PAI base
4. **Follow PAI releases** for 3.0 announcements

---

## 7. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| VoiceServer regression | High if copied | High | DO NOT copy, keep Atlas |
| Lost USER customizations | Medium | High | Backup, selective merge |
| Broken skill references | High | Medium | Systematic sed replacement |
| Hook incompatibility | Low | Medium | Compare before replacing |
| MEMORY structure conflict | Medium | Low | Migrate data, keep structure |

---

## 8. Rollback Plan

If upgrade fails:

```bash
# Restore from backup
rm -rf ~/.claude
cp -r ~/.claude-backup-TIMESTAMP ~/.claude

# Or using git (if Atlas Stow)
cd ~/Developer/AI/atlasProject/atlas
git checkout pre-2.5-backup
make run  # Restow
```

---

## 9. Files Summary

### MUST PROTECT (Atlas Improvements)
- `VoiceServer/server.ts` + dependencies
- `skills/CORE/USER/` extensions
- Atlas-only skills
- `DIVERGED.md`

### SAFE TO UPDATE
- `skills/PAI/SKILL.md` (with merge)
- Hooks (with comparison)
- `settings.json` (paths + version)
- Observability (with merge)

### NEW FILES TO ADD
- `INSTALL.ts` (renamed)
- `INSTALL.md`
- `statusline-debug.sh`
- Updated MEMORY structure

---

## 10. Next Steps

1. **Review this plan** with user
2. **Create pre-upgrade backup**
3. **Execute Phase 2** - download v2.5
4. **Execute selective merge** with careful comparison
5. **Test thoroughly** before committing
6. **Update DIVERGED.md** with new divergences
7. **Monitor PAI repo** for v3.0 announcements

---

*This plan was generated by the PAIUpgrade skill to ensure safe upgrade while preserving Atlas customizations.*
