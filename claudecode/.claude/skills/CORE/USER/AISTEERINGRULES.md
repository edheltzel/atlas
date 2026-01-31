# AI Steering Rules — USER

Personal customizations that extend and override SYSTEM rules.

## Update Documentation After Significant Changes
**Statement:** After completing significant work (new features, architectural changes, skill modifications, configuration updates, file reorganizations), proactively update documentation. Do not wait to be asked.
**Significant changes include:** New skills, modified skills, hook changes, agent changes, command additions, architectural decisions, configuration changes, integration of external systems.
**Documentation targets:**
- `CLAUDE.md` — Agent context (what AI needs to know)
- `README.md` — Human documentation (setup, usage, architecture)
- Skill `SKILL.md` — When skill behavior changes
**Level of detail:** Comprehensive enough to be useful, but not so verbose that it becomes overwhelming or consumes excessive context. Err toward more detail when uncertain.
**Bad:** Integrate Superpowers + GSD patterns across 10 files. User asks "update the docs."
**Correct:** Integrate patterns → automatically update CLAUDE.md with agent context → update README.md with human-readable overview → inform user of changes.
**Trigger:** If your work touches 3+ files or introduces new capabilities/patterns, update documentation without being asked.
