#!/usr/bin/env bun
/**
 * Sync Issues on Session End
 *
 * Automatically pushes plan updates to GitHub Issues when a session ends.
 * Runs silently - failures don't block session termination.
 */

import { existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { homedir } from 'os';
import { parse as parseYaml } from 'yaml';

// Read stdin with timeout to prevent hanging on exit
async function readStdinWithTimeout(timeoutMs: number = 500): Promise<string> {
  const decoder = new TextDecoder();
  const reader = Bun.stdin.stream().getReader();
  let input = '';

  const timeoutPromise = new Promise<void>((resolve) => {
    setTimeout(() => resolve(), timeoutMs);
  });

  const readPromise = (async () => {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      input += decoder.decode(value, { stream: true });
    }
  })();

  await Promise.race([readPromise, timeoutPromise]);
  return input;
}

interface SessionEndPayload {
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
 * Check if a plan file exists in the directory.
 */
function hasPlanFile(cwd: string): boolean {
  // Check current directory
  if (existsSync(join(cwd, 'task_plan.md'))) return true;

  // Check .claude/plans/
  const plansDir = join(cwd, '.claude', 'plans');
  if (existsSync(plansDir)) {
    try {
      const proc = Bun.spawnSync(['ls', '-1', plansDir]);
      const files = proc.stdout.toString().trim().split('\n');
      return files.some(
        (f) => f.endsWith('task_plan.md') || f.endsWith('_plan.md')
      );
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
  try {
    // Read stdin payload with timeout to prevent hanging
    const stdinData = await readStdinWithTimeout(500);
    if (!stdinData.trim()) {
      process.exit(0);
    }

    const payload: SessionEndPayload = JSON.parse(stdinData);
    const paiDir = process.env.PAI_DIR || join(homedir(), '.claude');

    // Load config
    const syncConfig = loadSyncConfig(paiDir);

    // Check if auto-sync is enabled
    if (!syncConfig?.enabled || !syncConfig?.auto_sync_on_session_end) {
      process.exit(0);
    }

    // Get working directory
    const cwd = payload.cwd || process.cwd();

    // Check if this is a GitHub repo with a plan file
    if (!(await isGitHubRepo(cwd)) || !hasPlanFile(cwd)) {
      process.exit(0);
    }

    // Run sync in background (don't block session end)
    console.error('[Atlas] Syncing plan to GitHub Issues...');

    const syncTool = join(paiDir, 'lib', 'github-sync', 'index.ts');

    const proc = Bun.spawn(['bun', 'run', syncTool, 'push'], {
      cwd,
      stdout: 'pipe',
      stderr: 'pipe',
    });

    // Wait for completion but don't block too long
    const timeout = setTimeout(() => {
      proc.kill();
      console.error('[Atlas] GitHub sync timed out');
    }, 30000); // 30 second timeout

    const exitCode = await proc.exited;
    clearTimeout(timeout);

    if (exitCode === 0) {
      const output = await new Response(proc.stdout).text();
      if (output.includes('Created:') || output.includes('Closed:')) {
        console.error('[Atlas] GitHub sync complete');
      }
    } else {
      const stderr = await new Response(proc.stderr).text();
      if (stderr.trim()) {
        console.error('[Atlas] GitHub sync warning:', stderr.trim());
      }
    }
  } catch (error) {
    // Never crash - session end must complete
    console.error(
      '[Atlas] GitHub sync error:',
      error instanceof Error ? error.message : error
    );
  }

  process.exit(0);
}

main();
