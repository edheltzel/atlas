---
name: Documents
description: USE WHEN document, process file.
---

# Documents

Documentation creation and management skill. Handles both agent-context documentation (CLAUDE.md) and human-readable documentation (README.md), plus document file processing.

## Customization

**Before executing, check for user customizations at:**
`~/.claude/skills/CORE/USER/SKILLCUSTOMIZATIONS/Documents/`

If this directory exists, load and apply any PREFERENCES.md, configurations, or resources found there. These override default behavior.

## Workflow Routing

| Trigger | Workflow |
|---------|----------|
| "update docs", "document changes" | Auto-detect and update |
| "update README", "readme" | README.md workflow |
| "update CLAUDE.md", "claude docs" | CLAUDE.md workflow |
| "document this skill" | Skill documentation workflow |
| "docx", "Word document" | `Docx/SKILL.md` |
| "pdf", "PDF file" | `Pdf/SKILL.md` |
| "pptx", "PowerPoint" | `Pptx/SKILL.md` |
| "xlsx", "Excel", "spreadsheet" | `Xlsx/SKILL.md` |

## Auto-Detection Workflow

When triggered without specific target:

1. **Analyze recent changes:**
   ```bash
   git diff --name-only HEAD~5 2>/dev/null || git diff --name-only
   ```

2. **Categorize changes:**
   - Skills modified → Update CLAUDE.md + skill SKILL.md
   - Commands added → Update CLAUDE.md
   - Configuration changed → Update both
   - Architecture changes → Update both
   - New integrations → Update both

3. **Update in order:**
   - CLAUDE.md first (agent context)
   - README.md second (human docs)
   - Specific SKILL.md files as needed

## CLAUDE.md Workflow

**Purpose:** Agent context — what AI needs to work with this codebase.

**Structure:**
```markdown
# CLAUDE.md

## Overview
[Brief description of the project]

## Architecture
[Directory structure, key patterns]

## Key Files
[Important files and their purposes]

## Commands
[Available commands and how to use them]

## Conventions
[Coding patterns, naming conventions, gotchas]

## Integrations
[External systems, APIs, dependencies]
```

**Content guidelines:**
- Focus on what AI needs to know to work effectively
- Include file paths, patterns, and relationships
- Document gotchas and non-obvious behaviors
- Keep concise but comprehensive

## README.md Workflow

**Purpose:** Human documentation — setup, usage, getting started.

**Structure:**
```markdown
# Project Name

## Overview
[What this project does]

## Quick Start
[Fastest path to running/using]

## Installation
[Detailed setup instructions]

## Usage
[How to use the project]

## Architecture
[High-level system design]

## Contributing
[How to contribute]
```

**Content guidelines:**
- Prioritize getting started quickly
- Include code examples
- Explain the "why" not just the "what"
- Use tables for quick reference

## Skill Documentation Workflow

For documenting a specific skill:

1. **Read existing SKILL.md** if present
2. **Analyze skill structure:**
   - Workflows/ directory
   - Tools/ directory
   - Context files
3. **Update SKILL.md with:**
   - Accurate workflow routing table
   - USE WHEN triggers (no workflow summaries!)
   - Examples section
   - Quick reference

## Document Format Reference

For processing document files (not code documentation):
- **DOCX:** See `Docx/SKILL.md`
- **PDF:** See `Pdf/SKILL.md`
- **PPTX:** See `Pptx/SKILL.md`
- **XLSX:** See `Xlsx/SKILL.md`

## Documentation Principles

1. **Agent vs Human:** CLAUDE.md for AI context, README.md for humans
2. **Level of detail:** Comprehensive but not overwhelming
3. **Don't duplicate:** Reference other docs, don't copy
4. **Keep current:** Documentation should reflect actual state
5. **Examples:** Show don't just tell

## Examples

**Example 1: Auto-update after feature work**
```
User: "/docs"
→ Analyzes git diff
→ Sees new skill added, commands modified
→ Updates CLAUDE.md with skill location and patterns
→ Updates README.md with new command usage
```

**Example 2: Focus on README only**
```
User: "/docs readme"
→ Reads current README.md
→ Checks for outdated sections
→ Updates with current state
→ Adds any missing sections
```

**Example 3: Document a skill**
```
User: "/docs ~/.claude/skills/Research"
→ Reads skill directory structure
→ Analyzes workflows and tools
→ Updates SKILL.md with accurate routing
→ Ensures USE WHEN triggers are correct
```
