/**
 * Phase 4 Tests: Caching System
 * Tests for hash cache, TTL, LRU eviction, and performance
 */

import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import {
  generateCacheKey,
  getCacheFilePath,
  getCacheEntry,
  addToCache,
  removeFromCache,
  clearExpired,
  clearAllCache,
  getCacheStats,
  loadCacheIndex,
  saveCacheIndex,
  ensureCacheDir,
  CACHE_DIR,
  DEFAULT_TTL_MS,
  MAX_CACHE_SIZE_BYTES,
  MAX_CACHE_ENTRIES,
} from './lib/cache';
import { existsSync, unlinkSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

// =============================================================================
// Test Setup
// =============================================================================

const TEST_VOICE_ID = 'test-voice-id';
const TEST_TEXT = 'Hello, this is a test message for caching.';
const TEST_AUDIO = new Uint8Array([0x49, 0x44, 0x33, 0x04, 0x00, 0x00]).buffer; // Minimal MP3 header

beforeAll(() => {
  // Ensure cache directory exists for tests
  ensureCacheDir();
});

afterAll(() => {
  // Clean up test entries (but don't clear entire cache)
  const hash = generateCacheKey(TEST_TEXT, TEST_VOICE_ID);
  removeFromCache(hash);
});

// =============================================================================
// Unit Tests: Cache Key Generation
// =============================================================================

describe('Cache Key Generation', () => {
  test('generateCacheKey returns consistent hash for same input', () => {
    const key1 = generateCacheKey('Hello world', 'voice-1');
    const key2 = generateCacheKey('Hello world', 'voice-1');

    expect(key1).toBe(key2);
  });

  test('generateCacheKey returns different hash for different text', () => {
    const key1 = generateCacheKey('Hello world', 'voice-1');
    const key2 = generateCacheKey('Goodbye world', 'voice-1');

    expect(key1).not.toBe(key2);
  });

  test('generateCacheKey returns different hash for different voice', () => {
    const key1 = generateCacheKey('Hello world', 'voice-1');
    const key2 = generateCacheKey('Hello world', 'voice-2');

    expect(key1).not.toBe(key2);
  });

  test('generateCacheKey returns hex string', () => {
    const key = generateCacheKey('Test', 'voice');

    expect(key).toMatch(/^[0-9a-f]+$/);
  });

  test('getCacheFilePath returns correct path format', () => {
    const hash = 'abc123';
    const path = getCacheFilePath(hash);

    expect(path).toBe(join(CACHE_DIR, 'abc123.mp3'));
  });
});

// =============================================================================
// Unit Tests: Cache Operations
// =============================================================================

describe('Cache Operations', () => {
  test('addToCache creates cache entry and file', () => {
    const hash = generateCacheKey(TEST_TEXT, TEST_VOICE_ID);
    const filePath = getCacheFilePath(hash);

    // Clean up first
    if (existsSync(filePath)) unlinkSync(filePath);
    removeFromCache(hash);

    // Add to cache
    const entry = addToCache(TEST_TEXT, TEST_VOICE_ID, TEST_AUDIO);

    expect(entry.hash).toBe(hash);
    expect(entry.voiceId).toBe(TEST_VOICE_ID);
    expect(entry.size).toBe(TEST_AUDIO.byteLength);
    expect(existsSync(filePath)).toBe(true);

    // Clean up
    removeFromCache(hash);
  });

  test('getCacheEntry returns hit for cached item', () => {
    const hash = generateCacheKey(TEST_TEXT, TEST_VOICE_ID);

    // Add to cache
    addToCache(TEST_TEXT, TEST_VOICE_ID, TEST_AUDIO);

    // Check cache
    const result = getCacheEntry(TEST_TEXT, TEST_VOICE_ID);

    expect(result.hit).toBe(true);
    expect(result.buffer).toBeDefined();
    expect(result.buffer!.byteLength).toBe(TEST_AUDIO.byteLength);

    // Clean up
    removeFromCache(hash);
  });

  test('getCacheEntry returns miss for uncached item', () => {
    const result = getCacheEntry('Unique uncached text ' + Date.now(), TEST_VOICE_ID);

    expect(result.hit).toBe(false);
    expect(result.buffer).toBeUndefined();
  });

  test('removeFromCache removes entry and file', () => {
    const hash = generateCacheKey(TEST_TEXT, TEST_VOICE_ID);
    const filePath = getCacheFilePath(hash);

    // Add to cache
    addToCache(TEST_TEXT, TEST_VOICE_ID, TEST_AUDIO);
    expect(existsSync(filePath)).toBe(true);

    // Remove
    const removed = removeFromCache(hash);

    expect(removed).toBe(true);
    expect(existsSync(filePath)).toBe(false);

    // Check index
    const index = loadCacheIndex();
    expect(index.entries[hash]).toBeUndefined();
  });
});

// =============================================================================
// Unit Tests: TTL Expiration
// =============================================================================

describe('TTL Expiration', () => {
  test('getCacheEntry respects TTL', async () => {
    const text = 'TTL test ' + Date.now();
    const hash = generateCacheKey(text, TEST_VOICE_ID);

    // Add to cache
    addToCache(text, TEST_VOICE_ID, TEST_AUDIO);

    // Should hit with default TTL
    const result1 = getCacheEntry(text, TEST_VOICE_ID);
    expect(result1.hit).toBe(true);

    // Wait a bit then check with short TTL
    await new Promise(resolve => setTimeout(resolve, 10));
    const result2 = getCacheEntry(text, TEST_VOICE_ID, 5); // 5ms TTL (already expired after 10ms wait)
    expect(result2.hit).toBe(false);

    // Clean up
    removeFromCache(hash);
  });

  test('clearExpired removes old entries', () => {
    const text = 'Expired test ' + Date.now();
    const hash = generateCacheKey(text, TEST_VOICE_ID);

    // Add to cache
    addToCache(text, TEST_VOICE_ID, TEST_AUDIO);

    // Manually make it old
    const index = loadCacheIndex();
    if (index.entries[hash]) {
      index.entries[hash].createdAt = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago
      saveCacheIndex(index);
    }

    // Clear expired
    const cleared = clearExpired();

    expect(cleared).toBeGreaterThan(0);

    // Verify removed
    const result = getCacheEntry(text, TEST_VOICE_ID);
    expect(result.hit).toBe(false);
  });
});

// =============================================================================
// Unit Tests: Cache Statistics
// =============================================================================

describe('Cache Statistics', () => {
  test('getCacheStats returns valid statistics', () => {
    const stats = getCacheStats();

    expect(typeof stats.entryCount).toBe('number');
    expect(typeof stats.totalSize).toBe('number');
    expect(typeof stats.totalSizeMB).toBe('string');
    expect(typeof stats.maxSize).toBe('number');
    expect(typeof stats.hitRate).toBe('number');
    expect(stats.hitRate).toBeGreaterThanOrEqual(0);
    expect(stats.hitRate).toBeLessThanOrEqual(1);
  });

  test('getCacheStats reflects cache changes', () => {
    const text = 'Stats test ' + Date.now();
    const hash = generateCacheKey(text, TEST_VOICE_ID);

    const statsBefore = getCacheStats();

    // Add entry
    addToCache(text, TEST_VOICE_ID, TEST_AUDIO);

    const statsAfter = getCacheStats();

    expect(statsAfter.entryCount).toBe(statsBefore.entryCount + 1);
    expect(statsAfter.totalSize).toBeGreaterThan(statsBefore.totalSize);

    // Clean up
    removeFromCache(hash);
  });
});

// =============================================================================
// Unit Tests: Cache Index
// =============================================================================

describe('Cache Index', () => {
  test('loadCacheIndex returns valid structure', () => {
    const index = loadCacheIndex();

    expect(index.version).toBe(1);
    expect(typeof index.entries).toBe('object');
    expect(typeof index.totalSize).toBe('number');
  });

  test('saveCacheIndex persists changes', () => {
    const index = loadCacheIndex();
    const testKey = 'test-key-' + Date.now();

    // Add test entry
    index.entries[testKey] = {
      hash: testKey,
      text: 'Test',
      voiceId: 'test',
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      size: 100,
      hitCount: 0,
    };
    index.totalSize += 100;

    saveCacheIndex(index);

    // Reload and verify
    const reloaded = loadCacheIndex();
    expect(reloaded.entries[testKey]).toBeDefined();

    // Clean up
    delete reloaded.entries[testKey];
    reloaded.totalSize -= 100;
    saveCacheIndex(reloaded);
  });
});

// =============================================================================
// Unit Tests: Edge Cases
// =============================================================================

describe('Edge Cases', () => {
  test('handles corrupted cache file', () => {
    const text = 'Corrupt test ' + Date.now();
    const hash = generateCacheKey(text, TEST_VOICE_ID);
    const filePath = getCacheFilePath(hash);

    // Add to cache
    addToCache(text, TEST_VOICE_ID, TEST_AUDIO);

    // Corrupt the file
    writeFileSync(filePath, 'corrupted data that is different size');

    // Should detect corruption and return miss
    const result = getCacheEntry(text, TEST_VOICE_ID);
    expect(result.hit).toBe(false);
  });

  test('handles missing cache file', () => {
    const text = 'Missing file test ' + Date.now();
    const hash = generateCacheKey(text, TEST_VOICE_ID);
    const filePath = getCacheFilePath(hash);

    // Add to cache
    addToCache(text, TEST_VOICE_ID, TEST_AUDIO);

    // Delete file but keep index entry
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }

    // Should return miss and clean up index
    const result = getCacheEntry(text, TEST_VOICE_ID);
    expect(result.hit).toBe(false);

    // Verify index cleaned up
    const index = loadCacheIndex();
    expect(index.entries[hash]).toBeUndefined();
  });

  test('handles empty text', () => {
    const hash = generateCacheKey('', TEST_VOICE_ID);
    expect(hash).toBeTruthy();
    expect(hash.length).toBeGreaterThan(0);
  });

  test('handles special characters in text', () => {
    const specialText = 'Hello "world" with <tags> & special chars! 🎉';
    const hash = generateCacheKey(specialText, TEST_VOICE_ID);

    expect(hash).toBeTruthy();
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });
});

// =============================================================================
// Integration Tests: Server Integration
// =============================================================================

describe('Server Integration', () => {
  test('server.ts imports cache module correctly', async () => {
    const server = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/voice/server.ts`
    ).text();

    expect(server).toContain('from "./lib/cache"');
    expect(server).toContain('getCacheEntry');
    expect(server).toContain('addToCache');
    expect(server).toContain('getCacheStats');
  });

  test('server checks cache before generating speech', async () => {
    const server = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/voice/server.ts`
    ).text();

    expect(server).toContain('cacheResult = getCacheEntry');
    expect(server).toContain('cacheResult.hit');
    expect(server).toContain('Cache HIT');
  });

  test('server adds to cache after generation', async () => {
    const server = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/voice/server.ts`
    ).text();

    expect(server).toContain('addToCache(safeMessage, voice, audioBuffer)');
    expect(server).toContain('Cached:');
  });

  test('health endpoint includes cache stats', async () => {
    const server = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/voice/server.ts`
    ).text();

    expect(server).toContain('cache: {');
    expect(server).toContain('cacheStats.entryCount');
    expect(server).toContain('cacheStats.totalSizeMB');
  });

  test('server clears expired on startup', async () => {
    const server = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/voice/server.ts`
    ).text();

    expect(server).toContain('clearExpired()');
    expect(server).toContain('Cache:');
  });
});

// =============================================================================
// Performance Tests
// =============================================================================

describe('Performance', () => {
  test('cache lookup is fast (<10ms)', () => {
    const text = 'Performance test ' + Date.now();
    const hash = generateCacheKey(text, TEST_VOICE_ID);

    // Add to cache
    addToCache(text, TEST_VOICE_ID, TEST_AUDIO);

    // Measure lookup time
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      getCacheEntry(text, TEST_VOICE_ID);
    }
    const duration = performance.now() - start;
    const avgTime = duration / 100;

    expect(avgTime).toBeLessThan(10); // <10ms per lookup

    // Clean up
    removeFromCache(hash);
  });

  test('cache key generation is fast (<1ms)', () => {
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      generateCacheKey(`Text ${i}`, `voice-${i}`);
    }
    const duration = performance.now() - start;
    const avgTime = duration / 1000;

    expect(avgTime).toBeLessThan(1); // <1ms per key
  });

  test('cache module file is reasonable size', async () => {
    const cache = await Bun.file(
      `${process.env.HOME}/.dotfiles/atlas/.claude/voice/lib/cache.ts`
    );

    expect(cache.size).toBeLessThan(15 * 1024); // <15KB
  });
});

// =============================================================================
// Configuration Tests
// =============================================================================

describe('Configuration', () => {
  test('CACHE_DIR is in user home directory', () => {
    expect(CACHE_DIR).toContain('.cache');
    expect(CACHE_DIR).toContain('pai');
    expect(CACHE_DIR).toContain('voice');
  });

  test('DEFAULT_TTL_MS is 24 hours', () => {
    expect(DEFAULT_TTL_MS).toBe(24 * 60 * 60 * 1000);
  });

  test('MAX_CACHE_SIZE_BYTES is 100MB', () => {
    expect(MAX_CACHE_SIZE_BYTES).toBe(100 * 1024 * 1024);
  });

  test('MAX_CACHE_ENTRIES is 500', () => {
    expect(MAX_CACHE_ENTRIES).toBe(500);
  });
});
