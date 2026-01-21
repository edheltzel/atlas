#!/usr/bin/env bun
// $PAI_DIR/hooks/stop-hook-voice.ts
// Main agent voice notification with prosody enhancement
// Phase 3: Refactored to use shared-voice module

import { enhanceProsody, cleanForSpeech, getVoiceId } from './lib/prosody-enhancer';
import {
  NotificationPayload,
  HookInput,
  readStdinWithTimeout,
  parseHookInput,
  sendNotification,
  getLastAssistantMessage,
  stripSystemReminders,
} from './lib/shared-voice';

/**
 * Extract completion message with prosody enhancement
 */
function extractCompletion(text: string, agentType: string = 'pai'): string | null {
  // Remove system-reminder tags using shared utility
  text = stripSystemReminders(text);

  // Look for COMPLETED section
  const patterns = [
    /🎯\s*\*{0,2}COMPLETED:?\*{0,2}\s*(.+?)(?:\n|$)/i,
    /\*{0,2}COMPLETED:?\*{0,2}\s*(.+?)(?:\n|$)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      let completed = match[1].trim();

      // Clean agent tags
      completed = completed.replace(/^\[AGENT:\w+\]\s*/i, '');

      // Clean for speech
      completed = cleanForSpeech(completed);

      // Enhance with prosody
      completed = enhanceProsody(completed, agentType);

      return completed;
    }
  }

  return null; // No COMPLETED pattern found - stay silent
}

/**
 * Extract awaiting message for when direction is needed
 */
function extractAwaiting(text: string): string | null {
  // Remove system-reminder tags using shared utility
  text = stripSystemReminders(text);

  const patterns = [
    /🔔\s*\*{0,2}AWAITING:?\*{0,2}\s*(.+?)(?:\n|$)/i,
    /\*{0,2}AWAITING:?\*{0,2}\s*(.+?)(?:\n|$)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      let awaiting = match[1].trim();
      awaiting = cleanForSpeech(awaiting);
      return awaiting;
    }
  }

  return null; // No AWAITING pattern found - stay silent
}

async function main() {
  // Read and parse hook input using shared utilities
  const input = await readStdinWithTimeout(100);
  const hookInput = parseHookInput(input);

  // Extract completion or awaiting from transcript
  const agentType = 'pai'; // Main agent is your PAI
  let completion: string | null = null;
  let awaiting: string | null = null;

  if (hookInput?.transcript_path) {
    const lastMessage = getLastAssistantMessage(hookInput.transcript_path);
    if (lastMessage) {
      // Check for COMPLETED first, then AWAITING
      completion = extractCompletion(lastMessage, agentType);
      if (!completion) {
        awaiting = extractAwaiting(lastMessage);
      }
    }
  }

  // Only speak when there's an explicit pattern
  // Silent otherwise to avoid overlap with subagent announcements
  if (!completion && !awaiting) {
    process.exit(0);
  }

  // Build spoken message based on pattern type
  let spokenMessage: string;
  if (completion) {
    spokenMessage = `The task is completed, Ed. ${completion}`;
  } else {
    spokenMessage = `${awaiting}, need your direction, Ed`;
  }

  // Get voice ID for this agent
  const voiceId = getVoiceId(agentType);

  // Send voice notification using shared utility
  const payload: NotificationPayload = {
    title: 'PAI',
    message: spokenMessage,
    voice_enabled: true,
    priority: 'normal',
    voice_id: voiceId
  };

  await sendNotification(payload);

  process.exit(0);
}

main().catch((error) => {
  console.error('Stop hook error:', error);
  process.exit(0);
});
