#!/usr/bin/env bun
// merge-hooks.ts
// Merges hooks from a module.json into settings.json

import { readFileSync, writeFileSync, existsSync } from 'fs';

interface ModuleJson {
  name: string;
  hooks?: Record<string, Array<{ command: string; matcher?: string }>>;
  settings?: Record<string, any>;
}

interface SettingsJson {
  env?: Record<string, string>;
  hooks?: Record<string, Array<{ hooks: Array<{ type: string; command: string }>; matcher?: string }>>;
  statusLine?: { type: string; command: string };
  [key: string]: any;
}

function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: merge-hooks.ts <module.json> <settings.json>');
    process.exit(1);
  }

  const [moduleJsonPath, settingsJsonPath] = args;

  // Read module.json
  const moduleJson: ModuleJson = JSON.parse(readFileSync(moduleJsonPath, 'utf-8'));

  // Read or initialize settings.json
  let settings: SettingsJson;
  if (existsSync(settingsJsonPath)) {
    settings = JSON.parse(readFileSync(settingsJsonPath, 'utf-8'));
  } else {
    settings = { env: {}, hooks: {} };
  }

  // Ensure hooks object exists
  if (!settings.hooks) {
    settings.hooks = {};
  }

  // Ensure env has PAI_DIR
  if (!settings.env) {
    settings.env = {};
  }
  if (!settings.env.PAI_DIR) {
    settings.env.PAI_DIR = process.env.CLAUDE_DIR || `${process.env.HOME}/.claude`;
  }

  // Merge hooks from module
  if (moduleJson.hooks) {
    for (const [eventType, hookConfigs] of Object.entries(moduleJson.hooks)) {
      // Initialize event type array if it doesn't exist
      if (!settings.hooks[eventType]) {
        settings.hooks[eventType] = [];
      }

      // Convert module hook format to settings format
      for (const hookConfig of hookConfigs) {
        const newHook = {
          hooks: [
            {
              type: 'command' as const,
              command: hookConfig.command.replace('$CLAUDE_DIR', '$PAI_DIR')
            }
          ],
          ...(hookConfig.matcher && { matcher: hookConfig.matcher })
        };

        // Check if this hook already exists
        const exists = settings.hooks[eventType].some(existing =>
          existing.hooks?.some(h => h.command === newHook.hooks[0].command)
        );

        if (!exists) {
          settings.hooks[eventType].push(newHook);
        }
      }
    }
  }

  // Merge settings (like statusLine)
  if (moduleJson.settings) {
    for (const [key, value] of Object.entries(moduleJson.settings)) {
      if (key === 'statusLine' && !settings.statusLine) {
        settings.statusLine = {
          type: value.type,
          command: value.command.replace('$CLAUDE_DIR', settings.env.PAI_DIR || '$PAI_DIR')
        };
      }
    }
  }

  // Write updated settings
  writeFileSync(settingsJsonPath, JSON.stringify(settings, null, 2));

  console.log(`Merged hooks from ${moduleJson.name} into settings.json`);
}

main();
