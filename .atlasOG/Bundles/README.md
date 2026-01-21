# Atlas Bundles

Bundles are portable configurations of Atlas capabilities that can be exported and imported across machines.

## What is a Bundle?

A **bundle** is a manifest file that defines:
- Which skills are included
- Which hooks are active
- Configuration settings
- Voice personalities

Bundles enable you to:
- Export your Atlas setup to a new machine
- Share configurations with others
- Create minimal or full configurations

## Available Bundles

| Bundle | Description | Skills | Status |
|--------|-------------|--------|--------|
| [Atlas-Standard](Atlas-Standard/) | Complete Atlas installation | 11 skills | Active |

## Bundle Structure

```
Bundles/
└── BundleName/
    ├── manifest.json     # Bundle definition
    └── README.md         # Bundle documentation
```

## Using Bundles

### Export Current Config

```bash
bun run ~/.claude/Bundles/tools/export-bundle.ts --name "MyConfig"
```

### Import a Bundle

```bash
bun run ~/.claude/Bundles/tools/import-bundle.ts --bundle Atlas-Standard
```

### Via Command

```
/atlas:bundle list           # List available bundles
/atlas:bundle export MyName  # Export current config
/atlas:bundle info Standard  # Show bundle details
```

## Creating Custom Bundles

1. Create a directory in `Bundles/`
2. Add a `manifest.json` with bundle definition
3. Add a `README.md` describing the bundle

See [Atlas-Standard](Atlas-Standard/) as a reference.
