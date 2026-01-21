---
description: "Sync project documentation files (CLAUDE.md, AGENTS.md, README.md, memory). Usage: /atlas:sync-docs [scope]"
---

# Sync Project Documentation

Update and synchronize project documentation files to reflect current codebase state.

## Scope

Argument: `$ARGUMENTS`

- `all` (default) - Update all documentation files
- `claude` - Update CLAUDE.md only
- `agents` - Update AGENTS.md only
- `readme` - Update README.md only
- `memory` - Update memory/context files only

## Documentation Files to Sync

### 1. CLAUDE.md
Project-specific instructions for Claude Code. Should contain:
- Build and test commands
- Code style and conventions
- Project-specific patterns
- Quick reference for common tasks

### 2. AGENTS.md
Comprehensive project documentation. Should contain:
- Project overview and architecture
- Development workflow and git strategy
- Build commands and testing
- Code conventions and standards
- Directory structure

### 3. README.md
User-facing project documentation. Should contain:
- Project description and purpose
- Installation instructions
- Usage examples
- Contributing guidelines

### 4. Memory/Context Files
Files that preserve context across sessions:
- `.claude/plans/` - Active and completed plans
- `.claude/memory/` - Session memories (if used)
- Project-specific context files

## Workflow

1. **Analyze Current State**
   - Read existing documentation files
   - Scan codebase for changes (new files, patterns, commands)
   - Check for outdated references

2. **Identify Updates Needed**
   - New build commands or scripts
   - Changed file structure
   - New patterns or conventions
   - Outdated instructions

3. **Apply Updates**
   - Preserve existing structure and tone
   - Add new sections as needed
   - Remove outdated information
   - Maintain consistency between files

4. **Verify Changes**
   - Ensure no broken references
   - Check formatting consistency
   - Validate command examples still work

## Instructions

Based on the scope provided (`$1` or `all` if not specified):

1. First, read the existing documentation files in the project root and `.claude/` directory
2. Analyze the current codebase state - check for new patterns, commands, or conventions
3. Compare documentation against actual codebase
4. Update files to reflect current state while preserving the existing structure
5. Report what was updated and why

**Important:**
- Do NOT overwrite user customizations
- Preserve existing structure and formatting
- Only update factual information that has changed
- Ask before making major structural changes
