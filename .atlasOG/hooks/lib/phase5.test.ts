/**
 * Phase 5 Tests: Build Optimization
 * Tests for hook compilation and startup performance
 *
 * Key finding: Bun's interpreted execution is already ~28ms,
 * well under the 50ms target. Compilation to binaries doesn't
 * provide significant improvement due to Bun's fast startup.
 */

import { describe, test, expect, beforeAll } from 'bun:test';
import { existsSync } from 'fs';
import { join } from 'path';
import { $ } from 'bun';

const HOOKS_DIR = join(process.env.HOME!, '.dotfiles/atlas/.claude/hooks');
const BIN_DIR = join(HOOKS_DIR, 'bin');

// =============================================================================
// Unit Tests: Build Script
// =============================================================================

describe('Build Script', () => {
  test('build.sh exists and is executable', async () => {
    const buildScript = join(HOOKS_DIR, 'build.sh');
    expect(existsSync(buildScript)).toBe(true);

    const stat = await Bun.file(buildScript).stat();
    // Check executable bit (mode & 0o111)
    expect((stat?.mode ?? 0) & 0o111).toBeGreaterThan(0);
  });

  test('build.sh has all required commands', async () => {
    const buildScript = await Bun.file(join(HOOKS_DIR, 'build.sh')).text();

    expect(buildScript).toContain('build_all');
    expect(buildScript).toContain('clean');
    expect(buildScript).toContain('test_binaries');
    expect(buildScript).toContain('benchmark');
  });

  test('build.sh targets correct hooks', async () => {
    const buildScript = await Bun.file(join(HOOKS_DIR, 'build.sh')).text();

    expect(buildScript).toContain('stop-hook-voice');
    expect(buildScript).toContain('subagent-stop-hook-voice');
  });
});

// =============================================================================
// Unit Tests: Hook Files
// =============================================================================

describe('Hook Source Files', () => {
  test('stop-hook-voice.ts exists', () => {
    const hookPath = join(HOOKS_DIR, 'stop-hook-voice.ts');
    expect(existsSync(hookPath)).toBe(true);
  });

  test('subagent-stop-hook-voice.ts exists', () => {
    const hookPath = join(HOOKS_DIR, 'subagent-stop-hook-voice.ts');
    expect(existsSync(hookPath)).toBe(true);
  });

  test('hooks have shebang for bun', async () => {
    const stopHook = await Bun.file(join(HOOKS_DIR, 'stop-hook-voice.ts')).text();
    const subagentHook = await Bun.file(join(HOOKS_DIR, 'subagent-stop-hook-voice.ts')).text();

    expect(stopHook.startsWith('#!/usr/bin/env bun')).toBe(true);
    expect(subagentHook.startsWith('#!/usr/bin/env bun')).toBe(true);
  });

  test('hooks import from shared module', async () => {
    const stopHook = await Bun.file(join(HOOKS_DIR, 'stop-hook-voice.ts')).text();
    const subagentHook = await Bun.file(join(HOOKS_DIR, 'subagent-stop-hook-voice.ts')).text();

    expect(stopHook).toContain("from './lib/shared-voice'");
    expect(subagentHook).toContain("from './lib/shared-voice'");
  });
});

// =============================================================================
// Performance Tests: Startup Time
// =============================================================================

describe('Startup Performance', () => {
  const TARGET_MS = 50;

  test('stop-hook-voice starts in <50ms (interpreted)', async () => {
    const hookPath = join(HOOKS_DIR, 'stop-hook-voice.ts');

    const times: number[] = [];
    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      const proc = Bun.spawn(['bun', 'run', hookPath], {
        stdin: new TextEncoder().encode('{}'),
        stdout: 'ignore',
        stderr: 'ignore',
      });
      await proc.exited;
      times.push(performance.now() - start);
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    console.log(`stop-hook-voice avg: ${avgTime.toFixed(1)}ms`);

    expect(avgTime).toBeLessThan(TARGET_MS);
  });

  test('subagent-stop-hook-voice starts in <50ms (interpreted)', async () => {
    const hookPath = join(HOOKS_DIR, 'subagent-stop-hook-voice.ts');

    const times: number[] = [];
    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      const proc = Bun.spawn(['bun', 'run', hookPath], {
        stdin: new TextEncoder().encode('{}'),
        stdout: 'ignore',
        stderr: 'ignore',
      });
      await proc.exited;
      times.push(performance.now() - start);
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    console.log(`subagent-stop-hook-voice avg: ${avgTime.toFixed(1)}ms`);

    expect(avgTime).toBeLessThan(TARGET_MS);
  });
});

// =============================================================================
// Integration Tests: Hook Execution
// =============================================================================

describe('Hook Execution', () => {
  test('stop-hook-voice exits cleanly with empty input', async () => {
    const hookPath = join(HOOKS_DIR, 'stop-hook-voice.ts');

    const proc = Bun.spawn(['bun', 'run', hookPath], {
      stdin: new TextEncoder().encode('{}'),
      stdout: 'pipe',
      stderr: 'pipe',
    });

    const exitCode = await proc.exited;
    expect(exitCode).toBe(0);
  });

  test('subagent-stop-hook-voice exits cleanly with empty input', async () => {
    const hookPath = join(HOOKS_DIR, 'subagent-stop-hook-voice.ts');

    const proc = Bun.spawn(['bun', 'run', hookPath], {
      stdin: new TextEncoder().encode('{}'),
      stdout: 'pipe',
      stderr: 'pipe',
    });

    const exitCode = await proc.exited;
    expect(exitCode).toBe(0);
  });

  test('stop-hook-voice handles valid hook input', async () => {
    const hookPath = join(HOOKS_DIR, 'stop-hook-voice.ts');

    const input = JSON.stringify({
      session_id: 'test-session',
      transcript_path: '/tmp/nonexistent.jsonl',
      hook_event_name: 'Stop',
    });

    const proc = Bun.spawn(['bun', 'run', hookPath], {
      stdin: new TextEncoder().encode(input),
      stdout: 'pipe',
      stderr: 'pipe',
    });

    const exitCode = await proc.exited;
    // Should exit 0 even with nonexistent transcript (graceful handling)
    expect(exitCode).toBe(0);
  });
});

// =============================================================================
// Settings Tests
// =============================================================================

describe('Hook Settings', () => {
  test('settings-hooks.json exists', () => {
    const settingsPath = join(HOOKS_DIR, '..', 'settings-hooks.json');
    expect(existsSync(settingsPath)).toBe(true);
  });

  test('settings-hooks.json has Stop hook', async () => {
    const settingsPath = join(HOOKS_DIR, '..', 'settings-hooks.json');
    const settings = await Bun.file(settingsPath).json();

    const stopHook = settings.hooks?.find((h: any) => h.event === 'Stop');
    expect(stopHook).toBeDefined();
    expect(stopHook.command).toContain('stop-hook-voice');
  });

  test('settings-hooks.json has SubagentStop hook', async () => {
    const settingsPath = join(HOOKS_DIR, '..', 'settings-hooks.json');
    const settings = await Bun.file(settingsPath).json();

    const subagentHook = settings.hooks?.find((h: any) => h.event === 'SubagentStop');
    expect(subagentHook).toBeDefined();
    expect(subagentHook.command).toContain('subagent-stop-hook-voice');
  });
});

// =============================================================================
// Compilation Tests (Optional - for reference)
// =============================================================================

describe('Compilation (Optional)', () => {
  test('bun build --compile works for hooks', async () => {
    const hookPath = join(HOOKS_DIR, 'stop-hook-voice.ts');
    const outPath = '/tmp/test-stop-hook-voice';

    // Clean up first
    try {
      await Bun.$`rm -f ${outPath}`;
    } catch {}

    // Try to compile
    const proc = Bun.spawn(['bun', 'build', '--compile', hookPath, '--outfile', outPath], {
      stdout: 'pipe',
      stderr: 'pipe',
    });

    const exitCode = await proc.exited;
    expect(exitCode).toBe(0);

    // Verify binary was created
    expect(existsSync(outPath)).toBe(true);

    // Clean up
    try {
      await Bun.$`rm -f ${outPath}`;
    } catch {}
  });
});

// =============================================================================
// Documentation
// =============================================================================

describe('Phase 5 Documentation', () => {
  test('build.sh documents the approach', async () => {
    const buildScript = await Bun.file(join(HOOKS_DIR, 'build.sh')).text();

    expect(buildScript).toContain('Phase 5');
    expect(buildScript).toContain('native binaries');
  });
});
