---
description: "Switch Atlas voice personality. Usage: /atlas:voice <personality>"
---

# Voice Personality Switcher

Switch to a different voice personality based on the task at hand.

**Available voices (with codenames):**
- **default** (Atlas) - Professional, expressive (default PAI)
- **intern** (Rookie) - Enthusiastic, chaotic energy (176 IQ genius)
- **engineer** (Tesla) - Wise leader, stable (Fortune 10 principal)
- **architect** (Keystone) - Wise leader, deliberate (PhD-level system designer)
- **researcher** (Einstein) - Analyst, measured (comprehensive research)
- **designer** (Apollo) - Critic, measured (exacting UX/UI)
- **artist** (Picasso) - Enthusiast, chaotic (visual content creator)
- **pentester** (Sphinx) - Enthusiast, chaotic (offensive security)
- **writer** (Graphite) - Professional, expressive (content creation)

**Built-in agent codenames:**
- **explore** → Scout
- **plan** → Strategist
- **general-purpose** → Atlas
- **claude-code-guide** → Mentor

## Usage

Switch to personality: `$ARGUMENTS`

!bun run ~/.claude/hooks/lib/voice-controller.ts --personality $1

---

**Note:** Voice will remain active for this session. Use `/atlas:voice pai` to return to default.
