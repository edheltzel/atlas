#!/usr/bin/env bun
/**
 * SubagentStartGreeting.hook.ts - Speak agent catchphrase when subagent spawns (PreToolUse:Task)
 *
 * PURPOSE:
 * When the Task tool is invoked with a subagent_type, this hook speaks the agent's
 * unique catchphrase so the user knows which agent is being activated.
 *
 * TRIGGER: PreToolUse (matcher: Task)
 *
 * INPUT:
 * - stdin: JSON with tool_input containing subagent_type
 * - voices.json: Agent definitions with catchphrases
 *
 * OUTPUT:
 * - stdout: Empty (no system reminder needed)
 * - stderr: Error messages on failure
 * - exit(0): Normal completion (allows tool to proceed)
 *
 * SIDE EFFECTS:
 * - POSTs to VoiceServer /notify endpoint with agent's catchphrase
 *
 * INTER-HOOK RELATIONSHIPS:
 * - DEPENDS ON: VoiceServer running (fails silently if not)
 * - COORDINATES WITH: None
 * - MUST RUN BEFORE: Task tool execution
 * - MUST RUN AFTER: None
 *
 * ERROR HANDLING:
 * - VoiceServer not running: Silent continue
 * - Agent not found in voices.json: Silent continue
 * - No catchphrase defined: Silent continue
 *
 * PERFORMANCE:
 * - Non-blocking: Yes (fire-and-forget POST)
 * - Typical execution: <50ms
 */

import { readFileSync } from 'fs';
import { join } from 'path';

interface HookInput {
  tool_name: string;
  tool_input: {
    subagent_type?: string;
    prompt?: string;
    description?: string;
  };
}

interface AgentConfig {
  description: string;
  catchphrase?: string;
  elevenlabs?: Record<string, unknown>;
  kokoro?: Record<string, unknown>;
}

interface VoicesConfig {
  agents: Record<string, AgentConfig>;
}

const VOICE_SERVER_URL = 'http://localhost:8888/notify';

async function main() {
  try {
    // Read hook input from stdin
    const inputData = readFileSync(0, 'utf-8');
    const hookInput: HookInput = JSON.parse(inputData);

    // Only process Task tool invocations
    if (hookInput.tool_name !== 'Task') {
      process.exit(0);
    }

    // Extract subagent_type from tool input
    const subagentType = hookInput.tool_input?.subagent_type?.toLowerCase();
    if (!subagentType) {
      process.exit(0);
    }

    // Load voices.json to get agent catchphrases
    const paiDir = process.env.PAI_DIR || join(process.env.HOME || '', '.claude');
    const voicesPath = join(paiDir, 'VoiceServer', 'voices.json');

    let voicesConfig: VoicesConfig;
    try {
      voicesConfig = JSON.parse(readFileSync(voicesPath, 'utf-8'));
    } catch {
      // voices.json not found or invalid - continue silently
      process.exit(0);
    }

    // Look up agent configuration
    const agent = voicesConfig.agents[subagentType];
    if (!agent?.catchphrase) {
      // No catchphrase defined for this agent - continue silently
      process.exit(0);
    }

    // POST catchphrase to VoiceServer with agent's voice
    try {
      await fetch(VOICE_SERVER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: agent.catchphrase,
          voice_id: subagentType,  // VoiceServer maps this to correct voice config
          voice_enabled: true
        }),
      });
    } catch {
      // VoiceServer not running - continue silently
    }

    process.exit(0);
  } catch (error) {
    // On any error, exit cleanly to not block the Task tool
    console.error('SubagentStartGreeting: Error processing hook', error);
    process.exit(0);
  }
}

main();
