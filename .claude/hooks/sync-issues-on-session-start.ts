#!/usr/bin/env bun
/**
 * Sync Issues on Session Start (Background)
 *
 * Pulls GitHub issue updates to local plan at session start.
 * Runs in background - never blocks session initialization.
 */

import { existsSync, readFileSync } from 'fs';
import { spawn } from 'child_process';
import { join } from 'path';
import { homedir } from 'os';
import { parse as parseYaml } from 'yaml';

interface SessionStartPayload {
  session_id: string;
  cwd?: string;
}

interface GitHubSyncConfig {
  enabled: boolean;
  auto_sync_on_session_end: boolean;
}

/**
 * Check if directory is a GitHub repository.
 */
async function isGitHubRepo(cwd: string): Promise<boolean> {
  try {
    const proc = Bun.spawn(['git', 'remote', 'get-url', 'origin'], {
      cwd,
      stdout: 'pipe',
      stderr: 'pipe',
    });
    const output = await new Response(proc.stdout).text();
    await proc.exited;
    return output.includes('github.com');
  } catch {
    return false;
  }
}

/**
 * Check if a plan file with github_sync exists.
 */
function hasSyncedPlanFile(cwd: string): boolean {
  const planPaths = [
    join(cwd, 'task_plan.md'),
    join(cwd, '.claude', 'plans'),
  ];

  // Check direct task_plan.md
  if (existsSync(planPaths[0])) {
    try {
      const content = readFileSync(planPaths[0]!, 'utf-8');
      if (content.includes('github_sync:')) return true;
    } catch {
      // Continue checking
    }
  }

  // Check .claude/plans/
  const plansDir = planPaths[1]!;
  if (existsSync(plansDir)) {
    try {
      const proc = Bun.spawnSync(['ls', '-1', plansDir]);
      const files = proc.stdout.toString().trim().split('\n');
      for (const file of files) {
        if (file.endsWith('.md')) {
          const filePath = join(plansDir, file);
          const content = readFileSync(filePath, 'utf-8');
          if (content.includes('github_sync:')) return true;
        }
      }
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Load GitHub sync config from atlas.yaml.
 */
function loadSyncConfig(paiDir: string): GitHubSyncConfig | null {
  const configPath = join(paiDir, 'atlas.yaml');
  if (!existsSync(configPath)) return null;

  try {
    const content = readFileSync(configPath, 'utf-8');
    const config = parseYaml(content);
    return config?.github_sync || null;
  } catch {
    return null;
  }
}

async function main(): Promise<void> {
  // Hard timeout - NEVER block session start for more than 2 seconds
  const timeout = setTimeout(() => {
    console.error('[Atlas] GitHub sync check timed out, skipping');
    process.exit(0);
  }, 2000);

  try {
    const stdinData = await Bun.stdin.text();
    if (!stdinData.trim()) {
      process.exit(0);
    }

    const payload: SessionStartPayload = JSON.parse(stdinData);
    const paiDir = process.env.PAI_DIR || join(homedir(), '.claude');

    // Load config
    const syncConfig = loadSyncConfig(paiDir);

    // Check if sync is enabled
    if (!syncConfig?.enabled) {
      process.exit(0);
    }

    // Get working directory
    const cwd = payload.cwd || process.cwd();

    // Quick checks - exit fast if no sync needed
    if (!(await isGitHubRepo(cwd)) || !hasSyncedPlanFile(cwd)) {
      process.exit(0);
    }

    // Spawn detached background process for pull
    const syncTool = join(paiDir, 'lib', 'github-sync', 'index.ts');

    // Use Node's spawn with detached: true for true background execution
    const child = spawn('bun', ['run', syncTool, 'pull'], {
      cwd,
      detached: true,
      stdio: 'ignore',
    });

    // Unref allows parent to exit independently
    child.unref();

    // Don't wait - exit immediately so session starts fast
    console.error('[Atlas] GitHub pull started in background');

  } catch (error) {
    // Never crash - session start must complete
    console.error(
      '[Atlas] GitHub sync check error:',
      error instanceof Error ? error.message : error
    );
  }

  clearTimeout(timeout);
  process.exit(0);
}

main();
