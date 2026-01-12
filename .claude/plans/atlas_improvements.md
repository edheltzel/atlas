---
project: atlas-improvements
directory: /Users/ed/.dotfiles/atlas
created: 2026-01-12
status: in_progress
github_sync:
  repo: edheltzel/atlas
  mappings:
    - step: "Analyze architecture - modular rules for context optimization"
      issue: 1
      url: https://github.com/edheltzel/atlas/issues/1
      synced_at: 2026-01-12T00:00:00.000Z
    - step: "Add ui-skills from ibelick/ui-skills"
      issue: 2
      url: https://github.com/edheltzel/atlas/issues/2
      synced_at: 2026-01-12T00:00:00.000Z
  last_sync: 2026-01-12T00:00:00.000Z
---

# Task: Atlas Improvements

Improvements to Atlas architecture and skills.

## Phases

### Phase 1: Architecture Optimization
- [ ] Analyze architecture - modular rules for context optimization

**Details (Issue #1):**
> Right now, a lot of the skill and rules are actually stored inside of the core skill. We need to investigate more of a modular rules architecture. This way, we can optimize our context window.
>
> We need to reduce the level of context inside of the agents.md file and have it reference specific files when a particular job duty is needed. This is more than just a skill, but how to perform a job instead of being an expert at a job.

### Phase 2: New Skills
- [x] Add ui-skills from ibelick/ui-skills

**Details (Issue #2):**
> Add https://github.com/ibelick/ui-skills

## Status Updates

- 2026-01-12: Created plan from existing GitHub issues #1 and #2
- 2026-01-12: Added UISkills from ibelick/ui-skills (Issue #2 closed)
