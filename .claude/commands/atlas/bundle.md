---
description: "Manage Atlas bundles for portable configurations. Usage: /atlas:bundle [list|export|info] [args]"
---

# Atlas Bundle Management

Bundles are portable configurations of Atlas capabilities.

## Commands

### List Bundles
```bash
ls ~/.claude/Bundles/
```

### Export Current Config
```bash
bun run ~/.claude/Bundles/tools/export-bundle.ts --name "MyConfig"
```

### Show Bundle Info
```bash
cat ~/.claude/Bundles/<bundle-name>/manifest.json
```

## Available Bundles

| Bundle | Description |
|--------|-------------|
| Atlas-Standard | Complete Atlas installation (11 skills, 20+ commands) |

## Actions

- `list` - Show available bundles
- `export <name>` - Export current config as a new bundle
- `info <bundle>` - Show bundle manifest details

When invoked, parse $ARGUMENTS to determine the action:

- If "list" or empty: List available bundles in ~/.claude/Bundles/
- If "export <name>": Run export-bundle.ts with the provided name
- If "info <bundle>": Display the bundle's manifest.json
