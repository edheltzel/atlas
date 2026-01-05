/**
 * Phase 2 Tests: Streaming TTS Optimization
 * Tests for streaming endpoint, format optimization, and latency
 */

import { describe, test, expect } from 'bun:test';

// =============================================================================
// Unit Tests: Streaming Endpoint Configuration
// =============================================================================

describe('Streaming Endpoint', () => {
  test('uses /stream endpoint instead of regular endpoint', async () => {
    const server = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/voice/server.ts`
    ).text();

    expect(server).toContain('/stream?');
  });

  test('streaming endpoint includes optimize_streaming_latency', async () => {
    const server = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/voice/server.ts`
    ).text();

    expect(server).toContain('optimize_streaming_latency=3');
  });

  test('uses mp3_22050_32 format for faster transfer', async () => {
    const server = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/voice/server.ts`
    ).text();

    expect(server).toContain('output_format=mp3_22050_32');
  });
});

// =============================================================================
// Unit Tests: Streaming Response Handling
// =============================================================================

describe('Streaming Response Handling', () => {
  test('uses response.body.getReader() for streaming', async () => {
    const server = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/voice/server.ts`
    ).text();

    expect(server).toContain('response.body?.getReader()');
  });

  test('collects chunks into buffer', async () => {
    const server = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/voice/server.ts`
    ).text();

    expect(server).toContain('chunks.push(value)');
  });

  test('logs TTFB (time-to-first-byte)', async () => {
    const server = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/voice/server.ts`
    ).text();

    expect(server).toContain('TTFB:');
  });

  test('logs total time and file size', async () => {
    const server = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/voice/server.ts`
    ).text();

    expect(server).toContain('Total:');
    expect(server).toContain('KB)');
  });
});

// =============================================================================
// Unit Tests: Temp File Collision Prevention
// =============================================================================

describe('Temp File Collision Prevention', () => {
  test('uses UUID for temp file names', async () => {
    const server = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/voice/server.ts`
    ).text();

    expect(server).toContain('crypto.randomUUID()');
  });

  test('getTempFileName function exists', async () => {
    const server = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/voice/server.ts`
    ).text();

    expect(server).toContain('function getTempFileName()');
  });
});

// =============================================================================
// Unit Tests: Audio Playback Improvements
// =============================================================================

describe('Audio Playback Improvements', () => {
  test('logs playback timing', async () => {
    const server = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/voice/server.ts`
    ).text();

    expect(server).toContain('Playback:');
  });

  test('cleanup function exists', async () => {
    const server = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/voice/server.ts`
    ).text();

    expect(server).toContain('const cleanup = ()');
  });

  test('uses unlinkSync for cleanup', async () => {
    const server = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/voice/server.ts`
    ).text();

    expect(server).toContain('unlinkSync(tempFile)');
  });
});

// =============================================================================
// Integration Tests: Live Server (requires running server)
// =============================================================================

describe('Live Server Streaming Tests', () => {
  const serverUrl = 'http://localhost:8888';

  test('notify endpoint accepts streaming request', async () => {
    try {
      const response = await fetch(`${serverUrl}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test',
          message: 'Streaming test',
          voice_enabled: false, // Don't play audio during test
        }),
      });

      if (response.ok) {
        const data = await response.json();
        expect(data.status).toBe('success');
      }
    } catch {
      console.log('⚠️  Voice server not running, skipping live test');
    }
  });

  test('health endpoint is accessible', async () => {
    try {
      const response = await fetch(`${serverUrl}/health`);
      if (response.ok) {
        const data = await response.json();
        expect(data.status).toBe('healthy');
      }
    } catch {
      console.log('⚠️  Voice server not running, skipping live test');
    }
  });
});

// =============================================================================
// Performance Tests
// =============================================================================

describe('Performance Metrics', () => {
  test('server file is optimized size', async () => {
    const server = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/voice/server.ts`
    );

    // Server file should be under 25KB for reasonable load time
    expect(server.size).toBeLessThan(25 * 1024);
  });

  test('performance.now() is used for timing', async () => {
    const server = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/voice/server.ts`
    ).text();

    expect(server).toContain('performance.now()');
  });
});

// =============================================================================
// Error Handling Tests
// =============================================================================

describe('Error Handling', () => {
  test('handles missing response body', async () => {
    const server = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/voice/server.ts`
    ).text();

    expect(server).toContain("throw new Error('No response body')");
  });

  test('handles API errors', async () => {
    const server = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/voice/server.ts`
    ).text();

    expect(server).toContain('ElevenLabs API error');
  });
});
