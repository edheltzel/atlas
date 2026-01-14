/**
 * Voice Cache Module
 * Phase 4: Hash-based caching with TTL and LRU eviction
 *
 * Cache location: ~/.cache/pai/voice/{hash}.mp3
 * Target: <100ms for cached phrase playback
 */

import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

// =============================================================================
// Configuration
// =============================================================================

const CACHE_DIR = join(homedir(), '.cache', 'pai', 'voice');
const CACHE_INDEX_FILE = join(CACHE_DIR, 'index.json');
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE_BYTES = 100 * 1024 * 1024; // 100MB
const MAX_CACHE_ENTRIES = 500;

// =============================================================================
// Types
// =============================================================================

interface CacheEntry {
  hash: string;
  text: string;
  voiceId: string;
  createdAt: number;
  lastAccessedAt: number;
  size: number;
  hitCount: number;
}

interface CacheIndex {
  version: number;
  entries: Record<string, CacheEntry>;
  totalSize: number;
}

// =============================================================================
// Cache Key Generation
// =============================================================================

/**
 * Generate deterministic cache key from text and voice ID
 * Uses Bun.hash for fast, consistent hashing
 */
export function generateCacheKey(text: string, voiceId: string): string {
  const input = `${voiceId}:${text}`;
  // Use Bun.hash for fast hashing, convert to hex string
  const hash = Bun.hash(input);
  return hash.toString(16);
}

/**
 * Get the file path for a cached audio file
 */
export function getCacheFilePath(hash: string): string {
  return join(CACHE_DIR, `${hash}.mp3`);
}

// =============================================================================
// Cache Index Management
// =============================================================================

/**
 * Ensure cache directory exists
 */
export function ensureCacheDir(): void {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/**
 * Load cache index from disk
 */
export function loadCacheIndex(): CacheIndex {
  ensureCacheDir();

  if (!existsSync(CACHE_INDEX_FILE)) {
    return { version: 1, entries: {}, totalSize: 0 };
  }

  try {
    const content = readFileSync(CACHE_INDEX_FILE, 'utf-8');
    const index = JSON.parse(content) as CacheIndex;
    return index;
  } catch {
    // Corrupted index - start fresh
    console.warn('⚠️  Cache index corrupted, starting fresh');
    return { version: 1, entries: {}, totalSize: 0 };
  }
}

/**
 * Save cache index to disk
 */
export function saveCacheIndex(index: CacheIndex): void {
  ensureCacheDir();
  writeFileSync(CACHE_INDEX_FILE, JSON.stringify(index, null, 2));
}

// =============================================================================
// Cache Operations
// =============================================================================

/**
 * Check if a cached entry exists and is valid
 */
export function getCacheEntry(
  text: string,
  voiceId: string,
  ttlMs: number = DEFAULT_TTL_MS
): { hit: boolean; buffer?: ArrayBuffer; entry?: CacheEntry } {
  const hash = generateCacheKey(text, voiceId);
  const filePath = getCacheFilePath(hash);
  const index = loadCacheIndex();
  const entry = index.entries[hash];

  // Check if entry exists in index
  if (!entry) {
    return { hit: false };
  }

  // Check TTL expiration
  const now = Date.now();
  if (now - entry.createdAt > ttlMs) {
    // Expired - remove entry
    removeFromCache(hash);
    return { hit: false };
  }

  // Check if file exists on disk
  if (!existsSync(filePath)) {
    // File missing - remove from index
    delete index.entries[hash];
    saveCacheIndex(index);
    return { hit: false };
  }

  // Read and validate file
  try {
    const buffer = readFileSync(filePath);

    // Validate file size matches index
    if (buffer.length !== entry.size) {
      console.warn('⚠️  Cache file size mismatch, regenerating');
      removeFromCache(hash);
      return { hit: false };
    }

    // Update last accessed time and hit count
    entry.lastAccessedAt = now;
    entry.hitCount++;
    saveCacheIndex(index);

    return {
      hit: true,
      buffer: buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
      entry
    };
  } catch (error) {
    console.warn('⚠️  Failed to read cache file:', error);
    removeFromCache(hash);
    return { hit: false };
  }
}

/**
 * Add audio to cache
 */
export function addToCache(
  text: string,
  voiceId: string,
  audioBuffer: ArrayBuffer
): CacheEntry {
  const hash = generateCacheKey(text, voiceId);
  const filePath = getCacheFilePath(hash);
  const index = loadCacheIndex();
  const now = Date.now();
  const size = audioBuffer.byteLength;

  // Ensure we have space (LRU eviction if needed)
  evictIfNeeded(index, size);

  // Write audio file
  ensureCacheDir();
  writeFileSync(filePath, Buffer.from(audioBuffer));

  // Create entry
  const entry: CacheEntry = {
    hash,
    text: text.substring(0, 100), // Store truncated text for debugging
    voiceId,
    createdAt: now,
    lastAccessedAt: now,
    size,
    hitCount: 0,
  };

  // Update index
  index.entries[hash] = entry;
  index.totalSize += size;
  saveCacheIndex(index);

  return entry;
}

/**
 * Remove entry from cache
 */
export function removeFromCache(hash: string): boolean {
  const filePath = getCacheFilePath(hash);
  const index = loadCacheIndex();
  const entry = index.entries[hash];

  // Remove file if exists
  if (existsSync(filePath)) {
    try {
      unlinkSync(filePath);
    } catch {
      // Ignore file removal errors
    }
  }

  // Remove from index
  if (entry) {
    index.totalSize -= entry.size;
    delete index.entries[hash];
    saveCacheIndex(index);
    return true;
  }

  return false;
}

/**
 * LRU eviction - remove least recently used entries to make space
 */
function evictIfNeeded(index: CacheIndex, newEntrySize: number): void {
  const entries = Object.values(index.entries);

  // Check entry count limit
  while (entries.length >= MAX_CACHE_ENTRIES) {
    const lru = findLRU(index);
    if (lru) {
      console.log(`🗑️  Evicting (max entries): ${lru.hash.substring(0, 8)}...`);
      removeFromCacheInternal(index, lru.hash);
    } else {
      break;
    }
  }

  // Check size limit
  while (index.totalSize + newEntrySize > MAX_CACHE_SIZE_BYTES) {
    const lru = findLRU(index);
    if (lru) {
      console.log(`🗑️  Evicting (size limit): ${lru.hash.substring(0, 8)}...`);
      removeFromCacheInternal(index, lru.hash);
    } else {
      break;
    }
  }
}

/**
 * Find least recently used entry
 */
function findLRU(index: CacheIndex): CacheEntry | null {
  const entries = Object.values(index.entries);
  if (entries.length === 0) return null;

  return entries.reduce((lru, entry) =>
    entry.lastAccessedAt < lru.lastAccessedAt ? entry : lru
  );
}

/**
 * Internal remove (updates index in place, doesn't save)
 */
function removeFromCacheInternal(index: CacheIndex, hash: string): void {
  const filePath = getCacheFilePath(hash);
  const entry = index.entries[hash];

  if (existsSync(filePath)) {
    try {
      unlinkSync(filePath);
    } catch {
      // Ignore
    }
  }

  if (entry) {
    index.totalSize -= entry.size;
    delete index.entries[hash];
  }
}

// =============================================================================
// Cache Maintenance
// =============================================================================

/**
 * Clear expired entries from cache
 */
export function clearExpired(ttlMs: number = DEFAULT_TTL_MS): number {
  const index = loadCacheIndex();
  const now = Date.now();
  let cleared = 0;

  for (const [hash, entry] of Object.entries(index.entries)) {
    if (now - entry.createdAt > ttlMs) {
      removeFromCacheInternal(index, hash);
      cleared++;
    }
  }

  if (cleared > 0) {
    saveCacheIndex(index);
    console.log(`🧹 Cleared ${cleared} expired cache entries`);
  }

  return cleared;
}

/**
 * Clear entire cache
 */
export function clearAllCache(): void {
  const index = loadCacheIndex();

  for (const hash of Object.keys(index.entries)) {
    const filePath = getCacheFilePath(hash);
    if (existsSync(filePath)) {
      try {
        unlinkSync(filePath);
      } catch {
        // Ignore
      }
    }
  }

  saveCacheIndex({ version: 1, entries: {}, totalSize: 0 });
  console.log('🗑️  Cache cleared');
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  entryCount: number;
  totalSize: number;
  totalSizeMB: string;
  maxSize: number;
  maxSizeMB: string;
  hitRate: number;
  oldestEntry: number | null;
} {
  const index = loadCacheIndex();
  const entries = Object.values(index.entries);

  const totalHits = entries.reduce((sum, e) => sum + e.hitCount, 0);
  const totalAccesses = totalHits + entries.length; // hits + initial caches

  const oldest = entries.length > 0
    ? Math.min(...entries.map(e => e.createdAt))
    : null;

  return {
    entryCount: entries.length,
    totalSize: index.totalSize,
    totalSizeMB: (index.totalSize / 1024 / 1024).toFixed(2),
    maxSize: MAX_CACHE_SIZE_BYTES,
    maxSizeMB: (MAX_CACHE_SIZE_BYTES / 1024 / 1024).toFixed(0),
    hitRate: totalAccesses > 0 ? totalHits / totalAccesses : 0,
    oldestEntry: oldest,
  };
}

// =============================================================================
// Pre-warming
// =============================================================================

/**
 * Common phrases to pre-cache on server startup
 */
export const COMMON_PHRASES: { text: string; voiceId: string }[] = [
  // Main agent completions - these would use actual voice IDs in production
  // Placeholder - actual pre-warming happens in server.ts with real voice IDs
];

/**
 * Pre-warm cache with common phrases
 * Called by server.ts with actual generateSpeech function
 */
export async function prewarmCache(
  phrases: { text: string; voiceId: string }[],
  generateSpeech: (text: string, voiceId: string) => Promise<ArrayBuffer>
): Promise<number> {
  let cached = 0;

  for (const { text, voiceId } of phrases) {
    const { hit } = getCacheEntry(text, voiceId);

    if (!hit) {
      try {
        const audio = await generateSpeech(text, voiceId);
        addToCache(text, voiceId, audio);
        cached++;
        console.log(`🔥 Pre-cached: "${text.substring(0, 30)}..."`);
      } catch (error) {
        console.warn(`⚠️  Failed to pre-cache: "${text.substring(0, 30)}..."`, error);
      }
    }
  }

  return cached;
}

// =============================================================================
// Exports
// =============================================================================

export {
  CACHE_DIR,
  DEFAULT_TTL_MS,
  MAX_CACHE_SIZE_BYTES,
  MAX_CACHE_ENTRIES,
};
