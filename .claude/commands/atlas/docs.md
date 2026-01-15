---
description: "Quick access to Atlas documentation. Usage: /atlas:docs [readme|packs|platform|security]"
---

# Atlas Documentation

Access Atlas system documentation and resources.

## Available Documentation

**Core Documentation:**
- 📖 README: `~/Developer/AI/PAI/README.md`
- 📦 Packs System: `~/Developer/AI/PAI/PACKS.md`
- 🏗️ Platform: `~/Developer/AI/PAI/PLATFORM.md`
- 🔒 Security: `~/Developer/AI/PAI/SECURITY.md`

**Tools & Templates:**
- 🛠️ Check Atlas State: `~/Developer/AI/PAI/Tools/CheckPAIState.md`
- 📋 Pack Template: `~/Developer/AI/PAI/Tools/PAIPackTemplate.md`
- 🎁 Bundle Template: `~/Developer/AI/PAI/Tools/PAIBundleTemplate.md`

**Quick Actions:**
- View all packs: `/atlas:packs`
- System status: `/atlas:status`
- Health check: `/atlas:check`

## Read Documentation

To read a specific doc, use: `$ARGUMENTS`

!if [ -n "$1" ]; then \
  case "$1" in \
    readme|README) cat ~/Developer/AI/PAI/README.md ;; \
    packs|PACKS) cat ~/Developer/AI/PAI/PACKS.md ;; \
    platform|PLATFORM) cat ~/Developer/AI/PAI/PLATFORM.md ;; \
    security|SECURITY) cat ~/Developer/AI/PAI/SECURITY.md ;; \
    *) echo "Unknown doc: $1. Use readme, packs, platform, or security" ;; \
  esac; \
else \
  echo "Specify a doc to read: readme, packs, platform, or security"; \
fi
