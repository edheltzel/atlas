#!/usr/bin/env bun
// $PAI_DIR/hooks/subagent-stop-hook-voice.ts
// Subagent voice notification with personality-specific delivery
// Phase 3: Refactored to use shared-voice module

import { enhanceProsody, cleanForSpeech, getVoiceId } from './lib/prosody-enhancer';
import {
  NotificationPayload,
  readStdinWithTimeout,
  parseHookInput,
  sendNotification,
  findTaskResult,
  getAgentDisplayName,
} from './lib/shared-voice';

/**
 * Extract completion message from task output
 */
function extractCompletionMessage(taskOutput: string): { message: string | null; agentType: string | null } {
  // Look for COMPLETED section with agent tag
  const agentPatterns = [
    /🎯\s*COMPLETED:\s*\[AGENT:(\w+[-\w]*)\]\s*(.+?)(?:\n|$)/is,
    /COMPLETED:\s*\[AGENT:(\w+[-\w]*)\]\s*(.+?)(?:\n|$)/is,
    /🎯.*COMPLETED.*\[AGENT:(\w+[-\w]*)\]\s*(.+?)(?:\n|$)/is,
  ];

  for (const pattern of agentPatterns) {
    const match = taskOutput.match(pattern);
    if (match && match[1] && match[2]) {
      const agentType = match[1].toLowerCase();
      let message = match[2].trim();

      // Clean for speech
      message = cleanForSpeech(message);

      // Enhance with prosody
      message = enhanceProsody(message, agentType);

      // Format: "FriendlyName completed [message]"
      const friendlyName = getAgentDisplayName(agentType);

      // Don't prepend "completed" for greetings or questions
      const isGreeting = /^(hey|hello|hi|greetings)/i.test(message);
      const isQuestion = message.includes('?');

      const fullMessage = (isGreeting || isQuestion)
        ? message
        : `${friendlyName} completed ${message}`;

      return { message: fullMessage, agentType };
    }
  }

  // Fallback patterns
  const genericPatterns = [
    /🎯\s*COMPLETED:\s*(.+?)(?:\n|$)/i,
    /COMPLETED:\s*(.+?)(?:\n|$)/i,
  ];

  for (const pattern of genericPatterns) {
    const match = taskOutput.match(pattern);
    if (match && match[1]) {
      let message = match[1].trim();
      message = cleanForSpeech(message);

      if (message.length > 5) {
        return { message, agentType: null };
      }
    }
  }

  return { message: null, agentType: null };
}

async function main() {
  // Read and parse hook input using shared utilities
  const input = await readStdinWithTimeout(100);
  const hookInput = parseHookInput(input);

  if (!hookInput?.transcript_path) {
    process.exit(0);
  }

  // Find task result using shared utility
  const { result: taskOutput, agentType, description } = await findTaskResult(hookInput.transcript_path);

  if (!taskOutput) {
    process.exit(0);
  }

  // Extract completion message
  const { message: completionMessage, agentType: extractedAgentType } = extractCompletionMessage(taskOutput);

  // Determine agent type
  const finalAgentType = extractedAgentType || agentType || 'default';

  // Only speak when there's an explicit COMPLETED pattern
  // Silent otherwise to avoid noisy announcements on every agent completion
  if (!completionMessage) {
    process.exit(0);
  }

  // Build the final message
  const agentDisplayName = getAgentDisplayName(finalAgentType);
  let finalMessage: string;
  // Check if message already starts with agent display name (from [AGENT:x] pattern)
  const startsWithDisplayName = completionMessage.toLowerCase().startsWith(agentDisplayName.toLowerCase());
  if (startsWithDisplayName) {
    finalMessage = completionMessage;
  } else {
    // Prepend agent name for messages from generic COMPLETED: pattern
    finalMessage = `${agentDisplayName} completed ${completionMessage}`;
  }

  // Get voice ID for this agent type
  const voiceId = getVoiceId(finalAgentType);

  // Send voice notification using shared utility
  await sendNotification({
    title: agentDisplayName,
    message: finalMessage,
    voice_enabled: true,
    voice_id: voiceId
  });

  process.exit(0);
}

main().catch(console.error);
