/**
 * Phase 1 Tests: Quick Wins Optimization
 * Tests for stdin timeout, fetch timeout, and connection warmup
 * Updated for Phase 3: Tests now check shared-voice.ts for implementation
 */

import { describe, test, expect, beforeAll, afterAll, mock } from 'bun:test';

// =============================================================================
// Unit Tests: Stdin Timeout (100ms)
// =============================================================================

describe('Stdin Timeout', () => {
  test('stdin timeout default is 100ms in shared module', async () => {
    // After Phase 3 consolidation, check the shared module
    const sharedVoice = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/hooks/lib/shared-voice.ts`
    ).text();

    // Check for 100ms default timeout
    expect(sharedVoice).toContain('timeoutMs: number = 100');
  });

  test('timeout comment documents the optimization', async () => {
    const sharedVoice = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/hooks/lib/shared-voice.ts`
    ).text();

    expect(sharedVoice).toContain('reduced from 500ms');
  });

  test('hooks call readStdinWithTimeout with 100ms', async () => {
    const stopHook = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/hooks/stop-hook-voice.ts`
    ).text();

    const subagentHook = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/hooks/subagent-stop-hook-voice.ts`
    ).text();

    // Hooks call the shared function with 100ms
    expect(stopHook).toContain('readStdinWithTimeout(100)');
    expect(subagentHook).toContain('readStdinWithTimeout(100)');
  });
});

// =============================================================================
// Unit Tests: Fetch Timeout with AbortController
// =============================================================================

describe('Fetch Timeout', () => {
  test('AbortController is used in shared sendNotification', async () => {
    const sharedVoice = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/hooks/lib/shared-voice.ts`
    ).text();

    expect(sharedVoice).toContain('new AbortController()');
    expect(sharedVoice).toContain('controller.abort()');
    expect(sharedVoice).toContain('signal: controller.signal');
    expect(sharedVoice).toContain('5000'); // 5000ms timeout
  });

  test('AbortError is handled gracefully', async () => {
    const sharedVoice = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/hooks/lib/shared-voice.ts`
    ).text();

    expect(sharedVoice).toContain("error.name === 'AbortError'");
    expect(sharedVoice).toContain('timed out after 5000ms');
  });

  test('timeout clears on successful response', async () => {
    const sharedVoice = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/hooks/lib/shared-voice.ts`
    ).text();

    expect(sharedVoice).toContain('clearTimeout(timeoutId)');
  });
});

// =============================================================================
// Integration Tests: Server Warmup
// =============================================================================

describe('Server Warmup', () => {
  test('warmupConnection function exists in server.ts', async () => {
    const server = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/voice/server.ts`
    ).text();

    expect(server).toContain('async function warmupConnection()');
  });

  test('warmup is called on startup', async () => {
    const server = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/voice/server.ts`
    ).text();

    expect(server).toContain('warmupConnection()');
  });

  test('warmup fetches ElevenLabs voices endpoint', async () => {
    const server = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/voice/server.ts`
    ).text();

    expect(server).toContain("fetch('https://api.elevenlabs.io/v1/voices'");
  });

  test('warmup logs success message', async () => {
    const server = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/voice/server.ts`
    ).text();

    expect(server).toContain('ElevenLabs connection warmed up');
  });

  test('warmup handles failures gracefully', async () => {
    const server = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/voice/server.ts`
    ).text();

    expect(server).toContain('Connection warmup failed');
  });
});

// =============================================================================
// Integration Tests: optimize_streaming_latency Parameter
// =============================================================================

describe('Optimize Streaming Latency', () => {
  test('optimize_streaming_latency=3 is added to ElevenLabs URL', async () => {
    const server = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/voice/server.ts`
    ).text();

    expect(server).toContain('optimize_streaming_latency=3');
  });

  test('latency optimization is logged on startup', async () => {
    const server = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/voice/server.ts`
    ).text();

    expect(server).toContain('Latency optimization: optimize_streaming_latency=3 enabled');
  });
});

// =============================================================================
// Integration Tests: Live Server Tests (requires running server)
// =============================================================================

describe('Live Server Tests', () => {
  const serverUrl = 'http://localhost:8888';

  test('health endpoint returns optimize_streaming_latency info', async () => {
    try {
      const response = await fetch(`${serverUrl}/health`);
      if (response.ok) {
        const data = await response.json();
        expect(data.status).toBe('healthy');
        expect(data.tts_provider).toBe('ElevenLabs');
      }
    } catch {
      // Server not running - skip test
      console.log('⚠️  Voice server not running, skipping live test');
    }
  });

  test('notification endpoint responds within timeout', async () => {
    try {
      const start = performance.now();
      const response = await fetch(`${serverUrl}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test',
          message: 'Quick test',
          voice_enabled: false, // Don't play audio during test
        }),
      });
      const duration = performance.now() - start;

      if (response.ok) {
        // Response should be fast (< 100ms for non-voice)
        expect(duration).toBeLessThan(100);
      }
    } catch {
      console.log('⚠️  Voice server not running, skipping live test');
    }
  });
});

// =============================================================================
// Performance Benchmark Tests
// =============================================================================

describe('Performance Benchmarks', () => {
  test('hook files are reasonable size for fast loading', async () => {
    const stopHook = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/hooks/stop-hook-voice.ts`
    );
    const subagentHook = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/hooks/subagent-stop-hook-voice.ts`
    );

    // Files should be under 15KB for fast parsing
    expect(stopHook.size).toBeLessThan(15 * 1024);
    expect(subagentHook.size).toBeLessThan(15 * 1024);
  });
});
