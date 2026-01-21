#!/usr/bin/env bun

/**
 * export-bundle.ts - Export current Atlas configuration as a bundle
 *
 * Creates a portable bundle manifest from the current Atlas installation.
 *
 * Usage:
 *   bun run export-bundle.ts --name "MyConfig"
 *   bun run export-bundle.ts --name "MyConfig" --output ~/Desktop
 */

import { parseArgs } from "util";
import { readdirSync, existsSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const CLAUDE_DIR = join(homedir(), ".claude");

interface BundleManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  created: string;
  exportedFrom: string;
  tier: string;
  platform: string;
  skills: {
    included: string[];
  };
  hooks: {
    included: string[];
  };
  commands: {
    namespace: string;
    included: string[];
  };
  directories: {
    included: string[];
  };
}

function getSkills(): string[] {
  const skillsDir = join(CLAUDE_DIR, "skills");
  if (!existsSync(skillsDir)) return [];

  return readdirSync(skillsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

function getHooks(): string[] {
  const hooksDir = join(CLAUDE_DIR, "hooks");
  if (!existsSync(hooksDir)) return [];

  return readdirSync(hooksDir)
    .filter((f) => f.endsWith(".ts"))
    .map((f) => f);
}

function getCommands(): string[] {
  const commandsDir = join(CLAUDE_DIR, "commands", "atlas");
  if (!existsSync(commandsDir)) return [];

  return readdirSync(commandsDir)
    .filter((f) => f.endsWith(".md") && f !== "README.md")
    .map((f) => f.replace(".md", ""));
}

function getDirectories(): string[] {
  const dirs: string[] = [];
  const checkDirs = ["skills", "hooks", "commands", "voice", "observability", "MEMORY", "Bundles"];

  for (const dir of checkDirs) {
    const fullPath = join(CLAUDE_DIR, dir);
    if (existsSync(fullPath)) {
      dirs.push(dir);
    }
  }

  return dirs;
}

async function main() {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      name: { type: "string", short: "n" },
      output: { type: "string", short: "o" },
      help: { type: "boolean", short: "h" },
    },
  });

  if (values.help) {
    console.log(`
export-bundle.ts - Export Atlas configuration as a bundle

USAGE:
  bun run export-bundle.ts --name "MyConfig"
  bun run export-bundle.ts --name "MyConfig" --output ~/Desktop

OPTIONS:
  -n, --name <name>     Bundle name (required)
  -o, --output <dir>    Output directory (default: ~/.claude/Bundles)
  -h, --help            Show this help
`);
    return;
  }

  if (!values.name) {
    console.error("Error: --name is required");
    process.exit(1);
  }

  const bundleName = values.name.replace(/\s+/g, "-");
  const outputDir = values.output || join(CLAUDE_DIR, "Bundles");
  const bundleDir = join(outputDir, bundleName);

  // Create bundle directory
  if (!existsSync(bundleDir)) {
    mkdirSync(bundleDir, { recursive: true });
  }

  // Gather current configuration
  const skills = getSkills();
  const hooks = getHooks();
  const commands = getCommands();
  const directories = getDirectories();

  // Create manifest
  const manifest: BundleManifest = {
    name: bundleName,
    version: "1.0.0",
    description: `Exported Atlas configuration: ${bundleName}`,
    author: process.env.USER || "unknown",
    created: new Date().toISOString().split("T")[0],
    exportedFrom: CLAUDE_DIR,
    tier: skills.length >= 8 ? "complete" : skills.length >= 4 ? "intermediate" : "starter",
    platform: "claude-code",
    skills: {
      included: skills,
    },
    hooks: {
      included: hooks,
    },
    commands: {
      namespace: "atlas",
      included: commands,
    },
    directories: {
      included: directories,
    },
  };

  // Write manifest
  const manifestPath = join(bundleDir, "manifest.json");
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  // Write README
  const readmePath = join(bundleDir, "README.md");
  const readme = `# ${bundleName} Bundle

Exported from Atlas on ${manifest.created}.

## Contents

### Skills (${skills.length})
${skills.map((s) => `- ${s}`).join("\n")}

### Hooks (${hooks.length})
${hooks.map((h) => `- ${h}`).join("\n")}

### Commands (${commands.length})
${commands.map((c) => `- /atlas:${c}`).join("\n")}

## Import

To import this bundle on another machine:

1. Copy this directory to \`~/.claude/Bundles/${bundleName}/\`
2. Run: \`bun run ~/.claude/Bundles/tools/import-bundle.ts --bundle ${bundleName}\`

Or manually copy the corresponding directories from the source machine.
`;
  writeFileSync(readmePath, readme);

  console.log(`Bundle exported successfully!`);
  console.log(`  Location: ${bundleDir}`);
  console.log(`  Skills: ${skills.length}`);
  console.log(`  Hooks: ${hooks.length}`);
  console.log(`  Commands: ${commands.length}`);
  console.log(`\nManifest: ${manifestPath}`);
}

main().catch(console.error);
