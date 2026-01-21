---
capture_type: LEARNING
timestamp: 2026-01-21 08:31:20 PST
auto_captured: true
tags: [auto-capture]
---

# Quick Learning: Private repo allows MEMORY and USER. Only exclude dot-env and tokens. Encrypt API keys separately.

**Date:** 2026-01-21
**Auto-captured:** Yes (use /capture-learning for detailed narrative)

---

## Summary

For a private repo, MEMORY and USER can be included - only truly sensitive items need exclusion.

## Analysis

**Reclassifying for Private Repo:**

## Actions Taken

Here's the revised .gitignore for private repo:

## Results

N/A

## Current Status

Plan updated for private repo

## Next Steps

1. Update the migration plan to include MEMORY/ and USER/

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

📋 SUMMARY: For a private repo, MEMORY and USER can be included - only truly sensitive items need exclusion.

🔍 ANALYSIS:

**Reclassifying for Private Repo:**

| Category | Contains | Private Repo? |
|----------|----------|---------------|
| **MEMORY/** | Learning, sessions, work items | ✅ Include |
| **USER/** | Personal configs, preferences | ✅ Include |
| `.env` | API keys (ElevenLabs, etc.) | ❌ Never |
| `history.jsonl` | May contain typed secrets | ⚠️ Your call |
| `settings.local.json` | OAuth tokens | ❌ Never |
| Cache/ephemeral | No value | ❌ Exclude |

**Revised Strategy:**

```
✅ INCLUDE (Private Repo)
├── skills/, hooks/, lib/       # PAI code
├── MEMORY/                     # Your learning, sessions, work
├── USER/                       # Your personal configs
├── settings.json               # Config (sanitize voiceId if sharing)
├── VoiceServer/, Observability/
└── agents/, plugins/, chrome/

❌ STILL EXCLUDE
├── .env                        # Real API keys
├── settings.local.json         # OAuth tokens
├── history.jsonl               # Optional - may contain secrets
└── cache/, session-env/, etc.  # Ephemeral/no value
```

**For .env Backup:**

```bash
# Option 1: Encrypted in repo
gpg --symmetric --cipher-algo AES256 .env
# Creates .env.gpg - safe to commit

# Option 2: Separate secure location
cp .env ~/.config/pai-secrets/.env
# Or use 1Password/Bitwarden CLI

# Option 3: Environment-based
# Store in ~/.zshrc or use direnv with encrypted .envrc
```

⚡ ACTIONS: Here's the revised .gitignore for private repo:

```gitignore
# ============================================
# TRULY SENSITIVE - NEVER COMMIT
# ============================================
.env
*.env
settings.local.json

# Optional - exclude if you type secrets in prompts
# history.jsonl

# ============================================
# EPHEMERAL - NO VALUE IN VERSIONING
# ============================================
cache/
file-history/
session-env/
shell-snapshots/
statsig/
stats-cache.json
telemetry/
todos/
projects/
debug/
ide/

# Logs (but not the directories themselves)
*.log
VoiceServer/logs/*.log

# ============================================
# OS/EDITOR
# ============================================
.DS_Store
*.swp
*.swo
```

**Backup Strategy for .env:**

```bash
# Create encrypted backup
gpg -c ~/.claude/.env
mv ~/.claude/.env.gpg ~/Developer/AI/atlasProject/atlas/claudecode/.claude/.env.gpg.backup

# To restore:
gpg -d .env.gpg.backup > .env
```

📊 STATUS: Plan updated for private repo

➡️ NEXT: 
1. Update the migration plan to include MEMORY/ and USER/
2. Decide on history.jsonl (include or exclude?)
3. Set up encrypted backup for .env

🗣️ Atlas: Private repo allows MEMORY and USER. Only exclude dot-env and tokens. Encrypt API keys separately.

</details>
