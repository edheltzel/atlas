---
name: modules
description: Manage installed Atlas modules - list, add, remove
allowed-tools: [Bash, Read, Write, Edit, Glob]
---

# Module Management

You are managing Atlas modules for Claude Code.

## Available Actions

1. **List modules** - Show installed and available modules
2. **Add module** - Install a new module
3. **Remove module** - Uninstall a module
4. **Status** - Check module health

## Module Locations

- **Installed modules**: Check `~/.claude/` for installed components
- **Available modules**: `~/.dotfiles/atlas/exports/modules/`

## How to List Modules

```bash
ls -1 ~/.dotfiles/atlas/exports/modules/
```

For each module, read its `module.json` to get description.

## How to Add a Module

1. Copy module files to `~/.claude/`:
   ```bash
   cp -r ~/.dotfiles/atlas/exports/modules/{name}/* ~/.claude/
   ```

2. Merge hooks using:
   ```bash
   bun run ~/.dotfiles/atlas/exports/merge-hooks.ts \
     ~/.dotfiles/atlas/exports/modules/{name}/module.json \
     ~/.claude/settings.json
   ```

3. Run postInstall if defined in module.json

## How to Remove a Module

1. Read the module's `module.json` to see what files it installed
2. Remove those files from `~/.claude/`
3. Remove the module's hooks from `~/.claude/settings.json`

## Module Format

Each module has a `module.json` with:
- `name`: Module identifier
- `description`: What it does
- `hooks`: Hooks to add to settings.json
- `files`: Files to copy
- `dependencies`: Other required modules
- `postInstall`: Command to run after install

## Respond to User

Based on what the user asked, perform the appropriate action and report the results.
