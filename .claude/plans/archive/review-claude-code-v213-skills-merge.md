# Review: Claude Code v2.1.3 Skills/Commands Merge

**Status:** Completed
**Created:** 2026-01-10
**Completed:** 2026-01-12

## Summary

Claude Code v2.1.3 **merged slash commands and skills** into a unified concept. This is explicitly stated as having **no change in behavior** - it's a conceptual simplification, not a functional change.

---

## What Changed

### The Merge (v2.1.3)
> "Merged slash commands and skills, simplifying the mental model with no change in behavior"

**Translation:** Commands and skills are now treated as the same thing internally. Both:
- Live in their respective directories (`.claude/commands/` and `.claude/skills/`)
- Are invoked via the same Skill tool
- Appear in the slash command menu (skills now visible by default)

### Building Up to the Merge (v2.1.0-2.1.2)

| Version | Change | Impact |
|---------|--------|--------|
| v2.1.0 | Skills visible in slash menu by default | Skills auto-appear as `/skillname` |
| v2.1.0 | Fixed redundant Skill tool invocation | Commands that delegate to skills are more efficient |
| v2.1.0 | Automatic skill hot-reload | Skills work immediately after creation |
| v2.1.0 | `context: fork` for sub-agent skills | Skills can run in isolated context |
| v2.1.2 | Skills can be shared/installed as plugins | Portability improved |

---

## How It Affects Atlas

### Current Atlas Architecture

```
.claude/
├── skills/           # 11 skills (SKILL.md files)
│   ├── CORE/         # Auto-loads at session start
│   ├── Algorithm/
│   ├── Agents/
│   ├── Art/
│   └── ...
└── commands/atlas/   # 22 commands (*.md files)
    ├── art.md        # Delegates to Art skill
    ├── agents.md     # Delegates to Agents skill
    └── ...
```

### Atlas's Command→Skill Delegation Pattern

Many `/atlas:*` commands simply delegate to skills:

```
/atlas:art <task>
    ↓ [command reads art.md]
    ↓ [invokes Skill tool with skill: "Art"]
    ↓ [Art SKILL.md routes to workflow]
→ Workflows/TechnicalDiagrams.md
```

**This pattern continues to work unchanged.**

---

## Impact Assessment

### ✅ No Breaking Changes

| Component | Status | Notes |
|-----------|--------|-------|
| Skill definitions | ✅ Works | SKILL.md frontmatter unchanged |
| Command definitions | ✅ Works | Markdown + frontmatter unchanged |
| Skill tool invocation | ✅ Works | `skill: "SkillName"` unchanged |
| Command→Skill delegation | ✅ Works | Pattern preserved |
| Hooks system | ✅ Works | Not affected by merge |
| Auto-loading (CORE) | ✅ Works | SessionStart hooks unchanged |

### 📋 Considerations

1. **Skills Now Visible in Menu by Default**
   - All 11 Atlas skills may appear in slash command autocomplete
   - Can hide with `user-invocable: false` in frontmatter if desired
   - May want to review which skills should be user-invocable vs model-only

2. **Potential Redundancy**
   - `/atlas:art` command AND `Art` skill both appear in menu
   - Not a problem, just potentially confusing UI
   - Could consolidate by removing command wrappers if skills are sufficient

3. **Model Invocation Control**
   - `disable-model-invocation: true` prevents Skill tool from auto-invoking
   - Useful for skills that should only be user-triggered

---

## Recommended Actions

### Phase 1: Audit (No Code Changes) - ✅ COMPLETED

- [x] List all skills currently visible in slash menu
- [x] Identify any skills that should be hidden (`user-invocable: false`)
- [x] Check for redundancy between commands and skills

**Result:** Reviewed all 11 skills. Added `user-invocable: false` to CORE skill (commit 815bb4e). Other skills left visible per user decision.

### Phase 2: Optimize (Optional) - DEFERRED

- [ ] Consider removing command wrappers that only delegate to skills
- [x] Add `user-invocable: false` to internal-only skills *(Done for CORE only)*
- [ ] Add `disable-model-invocation: true` to user-only skills if needed

### Phase 3: Documentation - DEFERRED

- [ ] Update Atlas docs to reflect unified concept
- [ ] Remove any references to "commands vs skills" distinction

---

## Technical Details

### Skill Frontmatter Options (Relevant to Merge)

```yaml
---
name: SkillName
description: What this skill does. USE WHEN...
user-invocable: false    # Hide from slash menu (still model-invocable)
disable-model-invocation: true  # Prevent Skill tool auto-invocation
context: fork            # Run in sub-agent context
agent: general-purpose   # Specify agent type for execution
---
```

### The Unified Mental Model

**Before v2.1.3:**
- Commands = user-invoked via `/command`
- Skills = model-invoked via Skill tool
- Conceptually separate

**After v2.1.3:**
- Both are "Skills" conceptually
- Both can be user-invoked via `/name`
- Both can be model-invoked via Skill tool
- Same underlying mechanism

---

## Sources

- [Claude Code v2.1.3 Release Notes](https://github.com/anthropics/claude-code/releases/tag/v2.1.3)
- [Claude Code Skills Documentation](https://code.claude.com/docs/en/skills)
- [Claude Code Slash Commands Documentation](https://code.claude.com/docs/en/slash-commands)

---

## Conclusion

**No action required for compatibility.** Atlas works fine with v2.1.3. The merge is purely conceptual - it simplifies how users and developers think about commands vs skills by treating them as one thing.

Optional optimizations can reduce redundancy if desired, but aren't necessary for continued operation.
