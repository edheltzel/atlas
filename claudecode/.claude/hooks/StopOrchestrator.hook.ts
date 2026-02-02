#!/usr/bin/env bun
/**
 * StopOrchestrator.hook.ts - Single Entry Point for Stop Hooks
 *
 * PURPOSE:
 * Orchestrates all Stop event handlers by reading and parsing the transcript
 * ONCE, then distributing the parsed data to isolated handlers. This prevents
 * multiple redundant transcript reads and ensures data consistency.
 *
 * TRIGGER: Stop (fires after Claude generates a response)
 *
 * INPUT:
 * - session_id: Current session identifier
 * - transcript_path: Path to the JSONL transcript file
 * - hook_event_name: "Stop"
 *
 * OUTPUT:
 * - stdout: None (no context injection)
 * - exit(0): Normal completion
 *
 * SIDE EFFECTS:
 * - Voice handler: Announces completion via voice server
 * - Capture handler: Updates WORK/ directory with response
 * - TabState handler: Resets tab title/color to default
 * - SystemIntegrity handler: Detects PAI changes and spawns background maintenance
 * - RebuildSkill handler: Rebuilds SKILL.md if Components/ modified
 *
 * INTER-HOOK RELATIONSHIPS:
 * - DEPENDS ON: UpdateTabTitle (expects tab to be in working state)
 * - COORDINATES WITH: AutoWorkCreation (updates work created by it)
 * - MUST RUN BEFORE: None
 * - MUST RUN AFTER: Claude's response generation
 *
 * HANDLERS (in hooks/handlers/):
 * - VoiceNotification.ts: Extracts 🗣️ line, sends to voice server
 * - ResponseCapture.ts: Updates current-work.json and WORK/ items
 * - TabState.ts: Resets Kitty tab to default UL blue
 * - SystemIntegrity.ts: Detects PAI changes, spawns IntegrityMaintenance.ts
 * - RebuildSkill.ts: Auto-rebuilds SKILL.md from Components/ if modified
 *
 * ERROR HANDLING:
 * - Missing transcript: Exits gracefully
 * - Parse failures: Logged, exits gracefully
 * - Handler failures: Isolated via Promise.allSettled (one failure doesn't affect others)
 *
 * PERFORMANCE:
 * - Non-blocking: Yes
 * - Typical execution: <200ms
 * - Optimization: Single transcript read vs. 3+ separate reads
 *
 * ARCHITECTURE NOTES:
 * Before this orchestrator, each Stop handler read the transcript independently:
 * - 4 transcript reads → 1 (3x I/O reduction)
 * - Guaranteed consistency (all handlers see same data)
 * - Isolated failures (Promise.allSettled)
 */

import { parseTranscript } from '../skills/CORE/Tools/TranscriptParser';
import { handleVoice } from './handlers/VoiceNotification';
import { handleCapture } from './handlers/ResponseCapture';
import { handleTabState } from './handlers/TabState';
import { handleSystemIntegrity } from './handlers/SystemIntegrity';
import { handleISCValidation } from './handlers/ISCValidator';
import { handleRebuildSkill } from './handlers/RebuildSkill';
import { handleUpdateCounts } from './handlers/UpdateCounts';

interface HookInput {
  session_id: string;
  transcript_path: string;
  hook_event_name: string;
}

async function readStdin(): Promise<HookInput | null> {
  try {
    const decoder = new TextDecoder();
    const reader = Bun.stdin.stream().getReader();
    let input = '';

    const timeoutPromise = new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 500);
    });

    const readPromise = (async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        input += decoder.decode(value, { stream: true });
      }
    })();

    await Promise.race([readPromise, timeoutPromise]);

    if (input.trim()) {
      return JSON.parse(input) as HookInput;
    }
  } catch (error) {
    console.error('[StopOrchestrator] Error reading stdin:', error);
  }
  return null;
}

// Timing helper for debug mode
const DEBUG = process.env.PAI_DEBUG === '1' || process.env.PAI_DEBUG === 'true';
async function timed<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    if (DEBUG) {
      console.error(`[StopOrchestrator] ⏱️  ${name}: ${(performance.now() - start).toFixed(0)}ms`);
    }
    return result;
  } catch (err) {
    if (DEBUG) {
      console.error(`[StopOrchestrator] ⏱️  ${name}: ${(performance.now() - start).toFixed(0)}ms (FAILED)`);
    }
    throw err;
  }
}

async function main() {
  const mainStart = performance.now();
  const hookInput = await readStdin();

  if (!hookInput || !hookInput.transcript_path) {
    console.error('[StopOrchestrator] No transcript path provided');
    process.exit(0);
  }

  // SINGLE READ, SINGLE PARSE
  const parseStart = performance.now();
  const parsed = parseTranscript(hookInput.transcript_path);
  if (DEBUG) {
    console.error(`[StopOrchestrator] ⏱️  TranscriptParse: ${(performance.now() - parseStart).toFixed(0)}ms`);
  }

  console.error(`[StopOrchestrator] Parsed transcript: ${parsed.plainCompletion.slice(0, 50)}...`);

  // Run non-blocking handlers first (with timing in debug mode)
  const handlersStart = performance.now();
  const [voiceResult, captureResult, tabResult, integrityResult, rebuildResult, countsResult] = await Promise.allSettled([
    timed('Voice', () => handleVoice(parsed, hookInput.session_id)),
    timed('Capture', () => handleCapture(parsed, hookInput)),
    timed('TabState', () => handleTabState(parsed)),
    timed('SystemIntegrity', () => handleSystemIntegrity(parsed, hookInput)),
    timed('RebuildSkill', () => handleRebuildSkill()),
    timed('UpdateCounts', () => handleUpdateCounts()),
  ]);
  if (DEBUG) {
    console.error(`[StopOrchestrator] ⏱️  AllHandlers (parallel): ${(performance.now() - handlersStart).toFixed(0)}ms`);
  }

  // Log any handler failures
  const handlerNames = ['Voice', 'Capture', 'TabState', 'SystemIntegrity', 'RebuildSkill', 'UpdateCounts'];
  [voiceResult, captureResult, tabResult, integrityResult, rebuildResult, countsResult].forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`[StopOrchestrator] ${handlerNames[index]} handler failed:`, result.reason);
    }
  });

  // Run ISC validation (potentially blocking)
  try {
    const iscStart = performance.now();
    const iscResult = await handleISCValidation(parsed, hookInput);
    if (DEBUG) {
      console.error(`[StopOrchestrator] ⏱️  ISCValidation: ${(performance.now() - iscStart).toFixed(0)}ms`);
    }

    if (iscResult.shouldBlock && iscResult.blockReason) {
      // Output blocking decision to stdout (Claude Code reads this)
      console.log(JSON.stringify({
        decision: 'block',
        reason: iscResult.blockReason,
      }));
      console.error('[StopOrchestrator] ISC validation BLOCKED response');
      process.exit(0);
    }
  } catch (err) {
    console.error('[StopOrchestrator] ISCValidator handler failed:', err);
  }

  if (DEBUG) {
    console.error(`[StopOrchestrator] ⏱️  TOTAL: ${(performance.now() - mainStart).toFixed(0)}ms`);
  }
  process.exit(0);
}

main().catch((error) => {
  console.error('[StopOrchestrator] Fatal error:', error);
  process.exit(0);
});
