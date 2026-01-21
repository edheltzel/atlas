#!/usr/bin/env bun
/**
 * StartupGreeting.hook.ts - Display PAI Banner at Session Start (SessionStart)
 *
 * PURPOSE:
 * Displays the responsive neofetch-style PAI banner with system statistics.
 * Creates a visual confirmation that PAI is initialized and shows key metrics
 * like skill count, session count, and learning items.
 *
 * TRIGGER: SessionStart
 *
 * INPUT:
 * - Environment: COLUMNS, KITTY_WINDOW_ID for terminal detection
 * - Settings: settings.json for identity configuration
 *
 * OUTPUT:
 * - stdout: Banner display (captured by Claude Code)
 * - stderr: Error messages on failure
 * - exit(0): Normal completion
 * - exit(1): Banner display failed
 *
 * SIDE EFFECTS:
 * - Spawns Banner.ts tool as child process
 * - Reads settings.json for configuration
 *
 * INTER-HOOK RELATIONSHIPS:
 * - DEPENDS ON: None (runs independently at session start)
 * - COORDINATES WITH: LoadContext (both run at SessionStart)
 * - MUST RUN BEFORE: None (visual feedback only)
 * - MUST RUN AFTER: None
 *
 * ERROR HANDLING:
 * - Missing settings: Error logged, exits with error code
 * - Banner tool failure: Error logged, exits with error code
 *
 * PERFORMANCE:
 * - Non-blocking: Yes (banner is informational)
 * - Typical execution: <100ms
 * - Skipped for subagents: Yes
 *
 * BANNER MODES:
 * - nano (<40 cols): Minimal single-line
 * - micro (40-59 cols): Compact with stats
 * - mini (60-84 cols): Medium layout
 * - normal (85+ cols): Full neofetch-style
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { spawnSync } from 'child_process';

import { getPaiDir, getSettingsPath } from './lib/paths';

const paiDir = getPaiDir();
const settingsPath = getSettingsPath();

(async () => {
  try {
    const settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));

    // Check if this is a subagent session - if so, exit silently
    const claudeProjectDir = process.env.CLAUDE_PROJECT_DIR || '';
    const isSubagent = claudeProjectDir.includes('/.claude/Agents/') ||
                      process.env.CLAUDE_AGENT_TYPE !== undefined;

    if (isSubagent) {
      process.exit(0);
    }

    // Run the banner tool
    const bannerPath = join(paiDir, 'skills/CORE/Tools/Banner.ts');
    const result = spawnSync('bun', ['run', bannerPath], {
      encoding: 'utf-8',
      stdio: ['inherit', 'pipe', 'pipe'],
      env: {
        ...process.env,
        // Pass through terminal detection env vars
        COLUMNS: process.env.COLUMNS,
        KITTY_WINDOW_ID: process.env.KITTY_WINDOW_ID,
      }
    });

    if (result.stdout) {
      console.log(result.stdout);
    }

    // Speak the startup catchphrase - must await before exit
    const catchphrase = settings.daidentity?.startupCatchphrase || `${settings.daidentity?.name || 'PAI'} here, ready to go.`;
    try {
      await fetch('http://localhost:8888/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: catchphrase, voice_enabled: true }),
      });
    } catch {
      // Voice server not running - continue silently
    }

    process.exit(0);
  } catch (error) {
    console.error('StartupGreeting: Failed to display banner', error);
    process.exit(1);
  }
})();
