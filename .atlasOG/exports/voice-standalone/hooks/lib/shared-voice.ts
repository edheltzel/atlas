/**
 * Shared Voice Utilities
 * Common functions used by both stop-hook-voice.ts and subagent-stop-hook-voice.ts
 * Phase 3 optimization: consolidate duplicate code
 */

// =============================================================================
// Types
// =============================================================================

export interface NotificationPayload {
  title: string;
  message: string;
  voice_enabled: boolean;
  priority?: 'low' | 'normal' | 'high';
  voice_id?: string;
}

export interface HookInput {
  session_id: string;
  transcript_path: string;
  hook_event_name: string;
}

// =============================================================================
// Agent Display Names
// =============================================================================

const AGENT_DISPLAY_NAMES: Record<string, string> = {
  // Claude Code built-in agents
  'explore': 'Scout',
  'plan': 'Strategist',
  'general-purpose': 'Atlas',
  'claude-code-guide': 'Mentor',
  'default': 'Agent Zero',
  // Custom agents with codenames
  'intern': 'Rookie',
  'engineer': 'Tesla',
  'architect': 'Keystone',
  'researcher': 'Einstein',
  'designer': 'Apollo',
  'artist': 'Picasso',
  'pentester': 'Sphinx',
  'writer': 'Graphite',
};

/**
 * Get friendly display name for an agent type
 */
export function getAgentDisplayName(agentType: string): string {
  const normalized = agentType.toLowerCase();
  if (AGENT_DISPLAY_NAMES[normalized]) {
    return AGENT_DISPLAY_NAMES[normalized];
  }
  // Fallback: capitalize first letter
  return agentType.charAt(0).toUpperCase() + agentType.slice(1);
}

// =============================================================================
// Stdin Reading
// =============================================================================

/**
 * Read stdin with timeout
 * Optimized: 100ms timeout (reduced from 500ms in Phase 1)
 */
export async function readStdinWithTimeout(timeoutMs: number = 100): Promise<string> {
  const decoder = new TextDecoder();
  const reader = Bun.stdin.stream().getReader();
  let input = '';

  const timeoutPromise = new Promise<void>((resolve) => {
    setTimeout(() => resolve(), timeoutMs);
  });

  const readPromise = (async () => {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      input += decoder.decode(value, { stream: true });
    }
  })();

  await Promise.race([readPromise, timeoutPromise]);

  return input;
}

/**
 * Parse hook input from stdin
 */
export function parseHookInput(input: string): HookInput | null {
  if (!input.trim()) return null;

  try {
    return JSON.parse(input) as HookInput;
  } catch {
    return null;
  }
}

// =============================================================================
// Notification Sending
// =============================================================================

/**
 * Send notification to voice server
 * Optimized: 5000ms timeout with AbortController (Phase 1)
 */
export async function sendNotification(payload: NotificationPayload): Promise<boolean> {
  const serverUrl = process.env.PAI_VOICE_SERVER || 'http://localhost:8888/notify';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(serverUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('Voice server error:', response.statusText);
      return false;
    }

    return true;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.error('Voice notification timed out after 5000ms');
    }
    // Fail silently - voice server may not be running
    return false;
  }
}

// =============================================================================
// Text Processing
// =============================================================================

/**
 * Convert Claude content to plain text
 */
export function contentToText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map(c => {
        if (typeof c === 'string') return c;
        if (c?.text) return c.text;
        if (c?.content) return contentToText(c.content);
        return '';
      })
      .join(' ')
      .trim();
  }
  return '';
}

/**
 * Remove system-reminder tags from text
 */
export function stripSystemReminders(text: string): string {
  return text.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '');
}

// =============================================================================
// Transcript Parsing (O(n) optimized)
// =============================================================================

interface TranscriptEntry {
  type: string;
  message?: {
    content: unknown;
  };
}

/**
 * Get last assistant message from transcript
 * Optimized: O(n) single pass, reads backward from end
 */
export function getLastAssistantMessage(transcriptPath: string): string {
  try {
    const { readFileSync } = require('fs');
    const content = readFileSync(transcriptPath, 'utf-8');
    const lines = content.trim().split('\n');

    // Read backward to find last assistant message (O(n) worst case, usually O(1))
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const entry: TranscriptEntry = JSON.parse(line);
        if (entry.type === 'assistant' && entry.message?.content) {
          const text = contentToText(entry.message.content);
          if (text) return text;
        }
      } catch {
        // Skip invalid JSON lines
      }
    }

    return '';
  } catch (error) {
    console.error('Error reading transcript:', error);
    return '';
  }
}

/**
 * Find task result from transcript (for subagent hook)
 * Optimized: O(n) single pass with early exit
 */
export async function findTaskResult(
  transcriptPath: string,
  maxAttempts: number = 2
): Promise<{
  result: string | null;
  agentType: string | null;
  description: string | null;
}> {
  const { readFileSync, existsSync, readdirSync, statSync } = require('fs');
  const { dirname, join } = require('path');

  let actualTranscriptPath = transcriptPath;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      await new Promise(resolve => setTimeout(resolve, 100)); // Reduced from 200ms
    }

    // Find transcript file
    if (!existsSync(actualTranscriptPath)) {
      const dir = dirname(transcriptPath);
      if (existsSync(dir)) {
        const files = readdirSync(dir)
          .filter((f: string) => f.startsWith('agent-') && f.endsWith('.jsonl'))
          .map((f: string) => ({ name: f, mtime: statSync(join(dir, f)).mtime }))
          .sort((a: any, b: any) => b.mtime.getTime() - a.mtime.getTime());

        if (files.length > 0) {
          actualTranscriptPath = join(dir, files[0].name);
        }
      }

      if (!existsSync(actualTranscriptPath)) {
        continue;
      }
    }

    try {
      const transcript = readFileSync(actualTranscriptPath, 'utf-8');
      const lines = transcript.trim().split('\n');

      // O(n) single pass: find last Task tool use and its result
      let lastTaskIndex = -1;
      let lastTaskToolUseId = '';
      let lastTaskInput: any = null;

      // First pass: find the last Task tool_use
      for (let i = lines.length - 1; i >= 0; i--) {
        try {
          const entry = JSON.parse(lines[i]);
          if (entry.type === 'assistant' && entry.message?.content) {
            for (const content of entry.message.content) {
              if (content.type === 'tool_use' && content.name === 'Task') {
                lastTaskIndex = i;
                lastTaskToolUseId = content.id;
                lastTaskInput = content.input;
                break;
              }
            }
            if (lastTaskIndex !== -1) break;
          }
        } catch {
          // Skip invalid lines
        }
      }

      if (lastTaskIndex === -1) continue;

      // Second pass: find the tool_result for that Task (only search after the tool_use)
      for (let j = lastTaskIndex + 1; j < lines.length; j++) {
        try {
          const resultEntry = JSON.parse(lines[j]);
          if (resultEntry.type === 'user' && resultEntry.message?.content) {
            for (const resultContent of resultEntry.message.content) {
              if (resultContent.type === 'tool_result' && resultContent.tool_use_id === lastTaskToolUseId) {
                let taskOutput: string;
                if (typeof resultContent.content === 'string') {
                  taskOutput = resultContent.content;
                } else if (Array.isArray(resultContent.content)) {
                  taskOutput = resultContent.content
                    .filter((item: any) => item.type === 'text')
                    .map((item: any) => item.text)
                    .join('\n');
                } else {
                  continue;
                }

                const agentType = lastTaskInput?.subagent_type || 'default';
                const description = lastTaskInput?.description || null;
                return { result: taskOutput, agentType, description };
              }
            }
          }
        } catch {
          // Skip invalid lines
        }
      }
    } catch {
      // Will retry
    }
  }

  return { result: null, agentType: null, description: null };
}
