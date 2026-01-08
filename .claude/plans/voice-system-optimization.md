# Voice System Optimization Plan

## Status: IN PROGRESS (Phase 3 Complete)

## Executive Summary

Analysis from 3 specialized agents identified **14 performance issues** and designed a **5-phase optimization roadmap** targeting 70%+ latency reduction.

---

## Current Performance Profile

| Stage | Current Latency | Target |
|-------|-----------------|--------|
| Hook startup | ~200ms | ~50ms |
| Stdin timeout | 500ms (fixed) | 100ms |
| Transcript parsing | Variable (O(n²)) | O(n) |
| TTS API call | 500-1500ms | ~400ms |
| Audio playback | Sequential | Streaming |
| **Total time-to-audio** | **~2000ms** | **~400-600ms** |

---

## Critical Issues Found

### High Severity (Address First)

| Issue | File | Lines | Impact |
|-------|------|-------|--------|
| O(n²) transcript search | subagent-stop-hook-voice.ts | 86-128 | Quadratic complexity |
| ~~No fetch timeout~~ | stop-hook-voice.ts | 115-120 | ✅ FIXED - 5s timeout |
| Fixed 200ms retry delay | subagent-stop-hook-voice.ts | 59-62 | Unnecessary latency |
| ~~Temp file collisions~~ | server.ts | 288 | ✅ FIXED - UUID naming |
| Duplicate code (stdin, notification) | both hooks | Multiple | Maintainability |
| Blocking env load | server.ts | 16-24 | Startup delay |

### Medium Severity

| Issue | File | Lines | Impact |
|-------|------|-------|--------|
| Expensive regex (9 patterns) | prosody-enhancer.ts | 173-196 | CPU per message |
| Unbounded rate limit map | server.ts | 410-426 | Memory leak |
| Untracked child processes | server.ts | 313, 328 | Resource leak |
| ~~Fixed 500ms stdin timeout~~ | both hooks | 138-139 | ✅ FIXED - 100ms |

---

## Optimization Strategy

### Phase 1: Quick Wins (1-2 hours)

**Expected Impact: 500ms+ reduction**

1. **Reduce stdin timeout** from 500ms to 100ms
   - Files: `stop-hook-voice.ts:138`, `subagent-stop-hook-voice.ts:214`

2. **Pre-warm ElevenLabs connection** on server startup
   - File: `server.ts` - add warmup call in server init

3. **Add `optimize_streaming_latency: 3`** to TTS requests
   - File: `server.ts` - ElevenLabs API calls

4. **Add fetch timeout** (5000ms) to prevent hangs
   - Files: both hook files

### Phase 2: Streaming TTS (4-6 hours)

**Expected Impact: 60-75% TTS latency reduction**

1. Switch to ElevenLabs streaming endpoint
   ```
   POST /v1/text-to-speech/{voice_id}/stream
   ```

2. Use **Eleven Flash v2.5** model for ultra-low latency (~75ms TTFB)

3. Stream audio directly to player stdin (no temp file)
   ```typescript
   const player = Bun.spawn(['afplay', '-'], { stdin: 'pipe' });
   for await (const chunk of audioStream) {
     player.stdin.write(chunk);
   }
   ```

4. Use **PCM format** (pcm_s16le_16) for zero encoding overhead

### Phase 3: Code Consolidation (2-3 hours)

**Expected Impact: Better maintainability + 20-30ms**

1. Extract shared module: `lib/shared-voice.ts`
   - `readStdinWithTimeout()`
   - `sendVoiceNotification()`
   - `parseTranscript()` (optimized)

2. Fix O(n²) transcript search - forward iteration only

3. Consolidate .env loading to single location

### Phase 4: Caching System (2-3 hours)

**Expected Impact: <100ms for cached phrases**

1. Implement phrase cache with hash keys
   ```
   ~/.cache/pai/voice/{hash}.mp3
   ```

2. Pre-cache common phrases on server startup:
   - "The task is completed, Ed."
   - "{Codename} completed" for each agent

3. TTL-based invalidation (24 hours)

### Phase 5: Build Optimization (1 hour)

**Expected Impact: 50-100ms startup reduction**

1. Pre-compile hooks to native binaries
   ```bash
   bun build ./hooks/stop-hook-voice.ts --compile --outfile ./hooks/stop-hook-voice
   ```

2. Update `settings-hooks.json` with binary paths

---

## Implementation Checklist

**CRITICAL: No task is complete until tests pass. Each phase requires:**
1. Implementation
2. Unit tests written and passing
3. Integration tests written and passing
4. Manual verification
5. Performance benchmark (before/after)

---

### Phase 1 Tasks ✅ COMPLETED (2026-01-05)

#### Implementation
- [x] Reduce stdin timeout to 100ms in both hooks
- [x] Add fetch timeout (5000ms) with AbortController
- [x] Add connection warmup in server.ts
- [x] Add optimize_streaming_latency parameter

#### Required Tests (Phase 1)
- [x] Unit test: `readStdinWithTimeout()` with 100ms timeout
- [x] Unit test: fetch timeout triggers AbortError after 5000ms
- [x] Integration test: server warmup reduces first-request latency
- [x] Integration test: optimize_streaming_latency parameter sent to API
- [x] Manual test: hook completes faster (measure before/after)
- [x] Manual test: server startup shows warmup success message

#### Phase 1 Acceptance Criteria
- [x] All unit tests pass (`bun test hooks/lib/phase1.test.ts` - 16 tests)
- [x] Integration tests pass
- [x] Latency improvement: stdin 500ms→100ms, TTS +75% optimization
- [x] No regressions in existing functionality

---

### Phase 2 Tasks ✅ COMPLETED (2026-01-05)

#### Implementation
- [x] Research ElevenLabs streaming endpoint auth
- [x] Implement streaming response handler (response.body.getReader())
- [x] Use /stream endpoint with mp3_22050_32 format (smaller, faster)
- [x] Add UUID-based temp file naming (collision prevention)
- [x] Add error handling for stream interruptions
- [x] Add TTFB, total time, and playback timing logs

#### Required Tests (Phase 2)
- [x] Unit test: streaming response chunking works correctly
- [x] Unit test: UUID temp file naming
- [x] Integration test: full streaming flow end-to-end
- [x] Integration test: health endpoint accessible
- [x] Manual test: audio quality verified
- [x] Performance: TTFB measured at 241ms (target <600ms ✓)

#### Phase 2 Acceptance Criteria
- [x] All streaming tests pass (`bun test phase2.test.ts` - 18 tests)
- [x] TTFB: 241ms, Total: 283ms (target <600ms ✓)
- [x] UUID temp files prevent collisions
- [x] Audio quality verified by manual listening

---

### Phase 3 Tasks ✅ COMPLETED (2026-01-08)

#### Implementation
- [x] Create lib/shared-voice.ts with common functions
- [x] Refactor stop-hook-voice.ts to use shared module
- [x] Refactor subagent-stop-hook-voice.ts to use shared module
- [x] Fix transcript parsing to O(n) complexity
- [x] Remove duplicate .env loading

#### Required Tests (Phase 3)
- [x] Unit test: shared module functions work identically to originals
- [x] Unit test: transcript parsing O(n) verified with benchmark
- [x] Unit test: 10K line transcript parses in <500ms
- [x] Integration test: both hooks work after refactor
- [x] Integration test: all 12 agent types still speak correctly
- [x] Regression test: no double-voice bug
- [x] Regression test: no duplicate agent name in speech

#### Phase 3 Acceptance Criteria
- [x] Code coverage > 80% for shared module
- [x] No duplicate code between hooks (verified by diff)
- [x] Transcript parsing benchmark shows linear scaling
- [x] All existing tests still pass (33/33 tests pass)

---

### Phase 4 Tasks

#### Implementation
- [ ] Create cache directory structure (~/.cache/pai/voice/)
- [ ] Implement hash-based caching with Bun.hash
- [ ] Add cache warmup on server start
- [ ] Implement TTL-based cache invalidation
- [ ] Add cache size limits and LRU eviction

#### Required Tests (Phase 4)
- [ ] Unit test: cache key generation is deterministic
- [ ] Unit test: cache hit returns identical audio
- [ ] Unit test: cache miss triggers generation
- [ ] Unit test: TTL expiry removes entries
- [ ] Unit test: LRU eviction works at size limit
- [ ] Integration test: cached phrase plays in <100ms
- [ ] Integration test: cache survives server restart
- [ ] Edge case test: corrupted cache file handled
- [ ] Edge case test: cache directory permission denied
- [ ] Manual test: verify cache files created in correct location

#### Phase 4 Acceptance Criteria
- [ ] Cached phrase playback < 100ms (measured)
- [ ] Cache correctly invalidates after TTL
- [ ] No cache corruption after 100 requests
- [ ] Disk usage stays within limits

---

### Phase 5 Tasks

#### Implementation
- [ ] Compile stop-hook-voice.ts to native binary
- [ ] Compile subagent-stop-hook-voice.ts to native binary
- [ ] Update settings-hooks.json with binary paths
- [ ] Add build script for recompilation

#### Required Tests (Phase 5)
- [ ] Unit test: compiled binary produces same output as source
- [ ] Integration test: hook triggers work with compiled binaries
- [ ] Integration test: all 12 agents speak correctly
- [ ] Performance test: startup time < 50ms (measured)
- [ ] Regression test: all previous functionality works
- [ ] Edge case test: binary handles missing dependencies gracefully
- [ ] Manual test: fresh machine install works with binaries

#### Phase 5 Acceptance Criteria
- [ ] Compiled binaries work on macOS (arm64 and x64)
- [ ] Startup time improvement documented (before/after)
- [ ] No functionality regressions
- [ ] Build script documented in README

---

## Alternative: Daemon Architecture (Future)

If Phases 1-5 insufficient, consider long-running daemon:

```
┌─────────────────┐     Unix Socket    ┌─────────────────────────┐
│  Claude Code    │ ─────────────────► │  Voice Daemon           │
│  Stop Hook      │   Quick IPC        │  - Pre-warmed Bun       │
└─────────────────┘                    │  - Persistent EL conn   │
                                       │  - In-memory cache      │
                                       └─────────────────────────┘
```

Estimated: 8+ hours, saves 100-200ms (eliminates Bun startup per hook)

---

## Success Metrics

| Metric | Before | Target | Stretch |
|--------|--------|--------|---------|
| Time-to-first-audio | ~2000ms | ~600ms | ~400ms |
| Hook startup | ~200ms | ~100ms | ~50ms |
| Cached phrase playback | N/A | <100ms | <50ms |
| Memory usage | Growing | Stable | Stable |

---

## Key Research Findings

### ElevenLabs Best Practices
- Use **Flash v2.5** model for lowest latency (~75ms)
- **optimize_streaming_latency: 3** for 75% improvement
- **PCM format** eliminates encoding overhead
- Global endpoint for geographic optimization

### Bun Optimizations
- `Bun.spawn` is significantly faster than Node child_process
- Native WebSocket pub/sub for real-time updates
- 250KB shared buffer for streaming file reads
- `sendfile` syscall for direct file-to-socket transfer

### macOS Audio
- `afplay` has high startup latency (~200-500ms)
- Pipe to stdin eliminates temp file overhead
- Consider native addon for sub-100ms playback

---

## Testing Strategy

### Test Categories

#### 1. Unit Tests (`hooks/lib/*.test.ts`)

| Test | Description | Edge Cases |
|------|-------------|------------|
| `readStdinWithTimeout()` | Stdin reading with timeout | Empty input, partial input, timeout exceeded, malformed JSON, large payload (>1MB) |
| `parseTranscript()` | JSONL transcript parsing | Empty file, single line, 10K+ lines, corrupted JSON, missing fields, nested content arrays |
| `extractCompletion()` | COMPLETED pattern extraction | No pattern, multiple patterns, pattern in middle of text, unicode/emoji in message |
| `getVoiceId()` | Voice ID mapping | Unknown agent type, null input, case sensitivity, special characters |
| `enhanceProsody()` | Prosody enhancement | Empty string, very long text (>10K chars), all emotional markers, no markers |
| `cleanForSpeech()` | Text cleaning | Markdown, code blocks, URLs, file paths, special characters, HTML entities |
| `getAgentDisplayName()` | Codename mapping | All known types, unknown types, empty string, mixed case |

#### 2. Integration Tests (`voice/*.test.ts`)

| Test | Description | Edge Cases |
|------|-------------|------------|
| Server startup | Warmup, env loading | Missing .env, invalid API key, port in use, permission denied |
| `/notify` endpoint | Full notification flow | Valid payload, missing fields, oversized message, rate limit hit |
| TTS generation | ElevenLabs API | Network timeout, 429 rate limit, invalid voice ID, API key expired |
| Audio playback | afplay subprocess | Missing afplay, audio corruption, concurrent playback, process crash |
| Caching | Phrase cache operations | Cache miss, cache hit, cache full, corrupted cache file, TTL expiry |

#### 3. Hook Tests (`hooks/*.test.ts`)

| Test | Description | Edge Cases |
|------|-------------|------------|
| Stop hook | Main agent completion | With COMPLETED, without COMPLETED, malformed transcript path |
| SubagentStop hook | Subagent completion | All agent types, unknown agent, missing Task tool result |
| Transcript lookup | File discovery | File exists, file missing, directory empty, stale files, permission denied |
| Voice server connection | HTTP to server | Server running, server down, wrong port, network error |

### Edge Case Test Matrix

#### Input Validation

```typescript
// Test: Empty/null inputs
test('handles empty stdin gracefully', async () => {
  const result = await readStdinWithTimeout('');
  expect(result).toBeNull();
});

test('handles null transcript path', async () => {
  const result = await findTaskResult(null);
  expect(result).toEqual({ result: null, agentType: null, description: null });
});

// Test: Malformed inputs
test('handles corrupted JSON in transcript', async () => {
  const transcript = '{"valid": true}\n{invalid json\n{"also": "valid"}';
  const result = parseTranscript(transcript);
  expect(result.errors).toHaveLength(1);
  expect(result.validEntries).toHaveLength(2);
});

// Test: Boundary conditions
test('handles transcript with 10000+ lines', async () => {
  const largePath = createLargeTranscript(10000);
  const start = performance.now();
  const result = await findTaskResult(largePath);
  const duration = performance.now() - start;
  expect(duration).toBeLessThan(500); // O(n) should complete in <500ms
});
```

#### Network Resilience

```typescript
// Test: Server unavailable
test('fails gracefully when voice server is down', async () => {
  const result = await sendNotification({ message: 'test' });
  expect(result.success).toBe(false);
  expect(result.error).toMatch(/ECONNREFUSED|timeout/);
});

// Test: Timeout handling
test('respects fetch timeout', async () => {
  mockSlowServer(10000); // 10s response delay
  const start = performance.now();
  await sendNotification({ message: 'test' }, { timeout: 1000 });
  const duration = performance.now() - start;
  expect(duration).toBeLessThan(1500); // Should timeout around 1000ms
});

// Test: Rate limiting
test('handles 429 rate limit response', async () => {
  mockRateLimitResponse();
  const result = await generateSpeech('test message');
  expect(result.retryAfter).toBeDefined();
  expect(result.cached).toBe(false);
});
```

#### Concurrent Operations

```typescript
// Test: Multiple simultaneous notifications
test('handles concurrent notifications without collision', async () => {
  const notifications = Array(10).fill(null).map((_, i) =>
    sendNotification({ message: `Message ${i}`, voice_id: 'test' })
  );
  const results = await Promise.all(notifications);
  const tempFiles = results.map(r => r.tempFile);
  const uniqueFiles = new Set(tempFiles);
  expect(uniqueFiles.size).toBe(10); // No collisions
});

// Test: Rapid hook invocations
test('handles rapid sequential hook calls', async () => {
  for (let i = 0; i < 5; i++) {
    await simulateHookCall({ sessionId: `session-${i}` });
  }
  // All should complete without resource exhaustion
  const openProcesses = await countChildProcesses();
  expect(openProcesses).toBeLessThan(3); // Cleanup working
});
```

#### Audio Playback

```typescript
// Test: Various audio formats
test('plays MP3 audio correctly', async () => {
  const audio = await generateSpeech('test', { format: 'mp3_44100_128' });
  const result = await playAudio(audio);
  expect(result.exitCode).toBe(0);
});

test('plays PCM audio correctly', async () => {
  const audio = await generateSpeech('test', { format: 'pcm_s16le_16' });
  const result = await playAudio(audio);
  expect(result.exitCode).toBe(0);
});

// Test: Interrupted playback
test('handles interrupted audio playback', async () => {
  const playPromise = playAudio(longAudioBuffer);
  setTimeout(() => killAudioProcess(), 100);
  const result = await playPromise;
  expect(result.interrupted).toBe(true);
  expect(tempFilesCleaned()).toBe(true);
});

// Test: Audio queue management
test('queues overlapping audio correctly', async () => {
  const audio1 = playAudio(buffer1);
  const audio2 = playAudio(buffer2); // Should queue, not overlap
  await Promise.all([audio1, audio2]);
  expect(audioOverlapDetected()).toBe(false);
});
```

#### Caching

```typescript
// Test: Cache operations
test('caches and retrieves phrases correctly', async () => {
  const phrase = 'The task is completed, Ed.';
  const voiceId = 'test-voice';

  // First call - cache miss
  const result1 = await getCachedAudio(phrase, voiceId);
  expect(result1.cached).toBe(false);

  // Second call - cache hit
  const result2 = await getCachedAudio(phrase, voiceId);
  expect(result2.cached).toBe(true);
  expect(result2.audio).toEqual(result1.audio);
});

test('invalidates cache after TTL', async () => {
  await setCacheEntry('key', audioBuffer, { ttl: 100 }); // 100ms TTL
  await sleep(150);
  const result = await getCacheEntry('key');
  expect(result).toBeNull();
});

test('handles corrupted cache files', async () => {
  await writeCorruptedCacheFile('key');
  const result = await getCachedAudio('phrase', 'voice');
  expect(result.cached).toBe(false); // Falls back to generation
  expect(cacheFileRemoved('key')).toBe(true); // Cleanup
});

test('respects cache size limits', async () => {
  await fillCacheToLimit();
  await setCacheEntry('new-key', largeAudioBuffer);
  const cacheSize = await getCacheSize();
  expect(cacheSize).toBeLessThanOrEqual(MAX_CACHE_SIZE);
});
```

#### Agent-Specific

```typescript
// Test: All agent codenames
const AGENT_TYPES = [
  'explore', 'plan', 'general-purpose', 'claude-code-guide', 'default',
  'intern', 'engineer', 'architect', 'researcher', 'designer',
  'artist', 'pentester', 'writer'
];

test.each(AGENT_TYPES)('agent %s has valid codename and voice', async (agentType) => {
  const codename = getAgentDisplayName(agentType);
  const voiceId = getVoiceId(agentType);

  expect(codename).toBeTruthy();
  expect(codename).not.toBe(agentType); // Should be mapped
  expect(voiceId).toMatch(/^[a-zA-Z0-9]+$/); // Valid ElevenLabs ID format
});

// Test: Unknown agent fallback
test('unknown agent type uses default voice', async () => {
  const voiceId = getVoiceId('unknown-agent-type');
  const defaultVoiceId = getVoiceId('default');
  expect(voiceId).toBe(defaultVoiceId);
});
```

#### Transcript Parsing Edge Cases

```typescript
// Test: Various transcript formats
test('extracts COMPLETED with emoji prefix', async () => {
  const text = '🎯 COMPLETED: Task finished successfully';
  const result = extractCompletion(text);
  expect(result).toBe('Task finished successfully');
});

test('extracts COMPLETED with agent tag', async () => {
  const text = '🎯 COMPLETED: [AGENT:writer] Documentation updated';
  const { message, agentType } = extractCompletionMessage(text);
  expect(message).toContain('Documentation updated');
  expect(agentType).toBe('writer');
});

test('ignores COMPLETED in code blocks', async () => {
  const text = '```\n🎯 COMPLETED: This is in a code block\n```\nRegular text';
  const result = extractCompletion(text);
  expect(result).toBeNull();
});

test('handles multiple COMPLETED patterns (uses first)', async () => {
  const text = '🎯 COMPLETED: First task\n🎯 COMPLETED: Second task';
  const result = extractCompletion(text);
  expect(result).toBe('First task');
});

test('strips system-reminder tags before extraction', async () => {
  const text = '<system-reminder>ignore</system-reminder>🎯 COMPLETED: Real message';
  const result = extractCompletion(text);
  expect(result).toBe('Real message');
});
```

### Performance Benchmarks

```typescript
// Benchmark suite
describe('Performance Benchmarks', () => {
  test('stdin read completes within timeout', async () => {
    const times = [];
    for (let i = 0; i < 10; i++) {
      const start = performance.now();
      await readStdinWithTimeout(sampleInput);
      times.push(performance.now() - start);
    }
    const avg = times.reduce((a, b) => a + b) / times.length;
    expect(avg).toBeLessThan(150); // Target: <150ms average
  });

  test('transcript parsing scales linearly', async () => {
    const sizes = [100, 1000, 5000, 10000];
    const times = [];

    for (const size of sizes) {
      const transcript = generateTranscript(size);
      const start = performance.now();
      await parseTranscript(transcript);
      times.push({ size, duration: performance.now() - start });
    }

    // Check linear scaling (10x size should be ~10x time, not 100x)
    const ratio = times[3].duration / times[0].duration;
    expect(ratio).toBeLessThan(150); // Allow some overhead, but not O(n²)
  });

  test('TTS latency meets target', async () => {
    const start = performance.now();
    await generateSpeech('Short test message', { streaming: true });
    const ttfb = performance.now() - start;
    expect(ttfb).toBeLessThan(600); // Target: <600ms time-to-first-audio
  });

  test('cached playback is fast', async () => {
    // Prime cache
    await generateSpeech('Cached phrase', { cache: true });

    // Measure cached retrieval
    const start = performance.now();
    await generateSpeech('Cached phrase', { cache: true });
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(100); // Target: <100ms for cached
  });
});
```

### Stress Tests

```typescript
describe('Stress Tests', () => {
  test('survives 100 rapid notifications', async () => {
    const results = [];
    for (let i = 0; i < 100; i++) {
      results.push(await sendNotification({ message: `Stress test ${i}` }));
      await sleep(50); // Small delay to simulate real usage
    }
    const failures = results.filter(r => !r.success);
    expect(failures.length).toBeLessThan(5); // <5% failure rate
  });

  test('memory stays stable over time', async () => {
    const initialMemory = process.memoryUsage().heapUsed;

    for (let i = 0; i < 50; i++) {
      await sendNotification({ message: `Memory test ${i}` });
    }

    // Force GC if available
    if (global.gc) global.gc();

    const finalMemory = process.memoryUsage().heapUsed;
    const growth = finalMemory - initialMemory;
    expect(growth).toBeLessThan(50 * 1024 * 1024); // <50MB growth
  });

  test('handles server restart gracefully', async () => {
    await sendNotification({ message: 'Before restart' });
    await restartVoiceServer();
    const result = await sendNotification({ message: 'After restart' });
    expect(result.success).toBe(true);
  });
});
```

### Manual Test Checklist

#### Pre-Release Testing

- [ ] **Fresh install**: Clone repo, run setup, verify voice works
- [ ] **Voice server startup**: Start server, check console output
- [ ] **Main agent completion**: Say "🎯 COMPLETED: Test" and verify voice
- [ ] **Subagent completion**: Run Task tool, verify agent voice speaks
- [ ] **All 12 agent voices**: Demo each codename, verify correct voice
- [ ] **No COMPLETED pattern**: Verify silence (no double-trigger)
- [ ] **Long message**: Test 500+ character completion message
- [ ] **Special characters**: Test quotes, apostrophes, numbers in message
- [ ] **Network offline**: Disconnect network, verify graceful failure
- [ ] **Server crash recovery**: Kill server mid-notification, verify cleanup

#### Regression Testing

- [ ] **Double-voice bug**: Confirm only one voice speaks per event
- [ ] **Agent name duplication**: Confirm no "Graphite completed Graphite completed"
- [ ] **Temp file cleanup**: Check /tmp for orphaned voice-*.mp3 files
- [ ] **Memory leak**: Run for 1 hour, check memory usage stable
- [ ] **Rate limit map**: Verify old entries are cleaned up

---

## Files to Modify

| File | Changes |
|------|---------|
| `hooks/stop-hook-voice.ts` | Timeout, shared module, compile |
| `hooks/subagent-stop-hook-voice.ts` | Timeout, O(n) parsing, shared module, compile |
| `hooks/lib/shared-voice.ts` | NEW - extracted common code |
| `voice/server.ts` | Streaming, caching, warmup |
| `voice/lib/cache.ts` | NEW - phrase caching |
| `settings-hooks.json` | Binary paths |
