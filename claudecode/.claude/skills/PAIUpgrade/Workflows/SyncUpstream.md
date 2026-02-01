# SyncUpstream Workflow

## Voice Notification

```bash
curl -s -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Running the SyncUpstream workflow to sync with upstream PAI"}' \
  > /dev/null 2>&1 &
```

Running the **SyncUpstream** workflow in the **PAIUpgrade** skill to sync with upstream PAI...

**Trigger:** "sync PAI", "sync upstream", "pull PAI updates", "update from upstream", "sync with PAI repo"

---

## Overview

This workflow syncs the local PAI installation with the upstream PAI repository and automatically updates version numbers in settings.json to prevent status line confusion.

**Key Steps:**
1. Check upstream PAI repo for latest version
2. Perform selective sync (respecting DIVERGED.md)
3. Update version numbers in settings.json
4. Commit with appropriate message

---

## Configuration

| Setting | Value |
|---------|-------|
| Upstream repo | `~/Developer/AI/PAI` (local clone) or `github.com/danielmiessler/PAI` |
| Settings file | `~/.claude/settings.json` |
| Diverged manifest | `~/.claude/DIVERGED.md` |

---

## Execution

### Step 1: Detect Upstream Version

Check the upstream PAI repo for its version:

```bash
# If local clone exists
if [ -d ~/Developer/AI/PAI ]; then
  # Pull latest
  cd ~/Developer/AI/PAI && git pull origin main
  # Extract version from SKILL.md or settings
  grep -o 'v[0-9]\+\.[0-9]\+' ~/Developer/AI/PAI/skills/CORE/SKILL.md | head -1
fi
```

Alternative: Check the upstream settings.json or SKILL.md for version references.

### Step 2: Review DIVERGED.md

Before syncing, check which files have intentional local modifications:

```bash
cat ~/.claude/DIVERGED.md
```

**CRITICAL:** Files listed in DIVERGED.md should NOT be overwritten blindly. These have local improvements.

### Step 3: Selective Sync

Perform the sync while respecting diverged files:

1. **Safe to sync:** Files NOT in DIVERGED.md
2. **Manual merge:** Files IN DIVERGED.md (compare and merge selectively)
3. **New files:** Always copy new files from upstream

### Step 4: Update Version Numbers

After sync completes, update BOTH version fields in settings.json:

```bash
# Get the new version (extract from upstream or use provided version)
NEW_VERSION="X.Y"

# Update settings.json - two locations
# Line ~215: "paiVersion": "X.Y"
# Line ~245: "pai": { ... "version": "X.Y" }
```

**Using jq (if available):**
```bash
jq --arg v "$NEW_VERSION" '.paiVersion = $v | .pai.version = $v' ~/.claude/settings.json > /tmp/settings.json && mv /tmp/settings.json ~/.claude/settings.json
```

**Using sed (fallback):**
```bash
sed -i '' 's/"paiVersion": "[^"]*"/"paiVersion": "'$NEW_VERSION'"/' ~/.claude/settings.json
sed -i '' 's/\("pai":.*"version": "\)[^"]*"/\1'$NEW_VERSION'"/' ~/.claude/settings.json
```

### Step 5: Verify Updates

Confirm both version fields are updated:

```bash
grep -E '"paiVersion"|"version"' ~/.claude/settings.json
```

Expected output should show both fields with the new version.

### Step 6: Commit Changes

Create a commit documenting the sync:

```bash
git add -A
git commit -m "feat: sync with PAI v$NEW_VERSION

- Synced from upstream PAI repository
- Updated paiVersion and pai.version to $NEW_VERSION
- Respected DIVERGED.md for local modifications"
```

---

## ISC Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| 1 | Upstream version detected from PAI repo source | Version string extracted |
| 2 | DIVERGED.md consulted before any file overwrites | File read and respected |
| 3 | settings.json paiVersion field updated to new version | grep confirms value |
| 4 | settings.json pai.version field updated to new version | grep confirms value |
| 5 | Both version fields match the upstream version | Values are identical |
| 6 | Changes committed with descriptive sync message | git log shows commit |

---

## Error Handling

| Error | Resolution |
|-------|------------|
| No upstream repo found | Prompt user for PAI repo location |
| Version detection fails | Ask user to provide version manually |
| DIVERGED.md missing | Warn and proceed with full sync |
| settings.json parse error | Use sed fallback instead of jq |

---

## Example Execution

```
User: "sync with upstream PAI"

→ Checking ~/Developer/AI/PAI for updates...
→ Upstream version: 2.5
→ Reading DIVERGED.md (3 files marked as diverged)
→ Syncing safe files...
→ Skipping diverged: VoiceServer/index.ts (local improvements)
→ Updating settings.json:
  - paiVersion: "2.4" → "2.5"
  - pai.version: "2.4" → "2.5"
→ Committing: "feat: sync with PAI v2.5"

✅ Sync complete. PAI updated to v2.5.
```

---

**This workflow ensures version numbers stay synchronized with upstream, preventing status line confusion after PAI syncs.**
