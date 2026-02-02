/**
 * VoiceNotification.ts - Voice Notification Handler
 *
 * PURPOSE:
 * Sends completion messages to the voice server for TTS playback.
 * Extracts the 🗣️ voice line from responses and sends to ElevenLabs via voice server.
 *
 * Pure handler: receives pre-parsed transcript data, sends to voice server.
 * No I/O for transcript reading - that's done by orchestrator.
 */

import { existsSync, readFileSync, appendFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { paiPath } from '../lib/paths';
import { getISOTimestamp } from '../lib/time';
import { isValidVoiceCompletion, getVoiceFallback } from '../lib/response-format';
import type { ParsedTranscript } from '../../skills/CORE/Tools/TranscriptParser';

// Read AI name from settings for display only (voice selection handled by VoiceServer)
function getAiName(): string {
  try {
    const settingsPath = join(homedir(), '.claude', 'settings.json');
    const settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));
    return settings.daidentity?.name || 'Atlas';
  } catch {
    return 'Atlas';
  }
}

// Voice notification payload (voice selection handled by VoiceServer via voices.json)
interface VoiceNotificationPayload {
  message: string;
  title?: string;
  voice_enabled?: boolean;
  // NO voice_id - VoiceServer uses identity from voices.json
  // NO voice_settings - VoiceServer uses identity from voices.json
}

interface VoiceEvent {
  timestamp: string;
  session_id: string;
  event_type: 'sent' | 'failed' | 'skipped';
  message: string;
  character_count: number;
  voice_engine: 'voiceserver';
  status_code?: number;
  error?: string;
}

const VOICE_LOG_PATH = paiPath('MEMORY', 'VOICE', 'voice-events.jsonl');
const CURRENT_WORK_PATH = paiPath('MEMORY', 'STATE', 'current-work.json');

function getActiveWorkDir(): string | null {
  try {
    if (!existsSync(CURRENT_WORK_PATH)) return null;
    const content = readFileSync(CURRENT_WORK_PATH, 'utf-8');
    const state = JSON.parse(content);
    if (state.work_dir) {
      const workPath = paiPath('MEMORY', 'WORK', state.work_dir);
      if (existsSync(workPath)) return workPath;
    }
  } catch {
    // Silent fail
  }
  return null;
}

function logVoiceEvent(event: VoiceEvent): void {
  const line = JSON.stringify(event) + '\n';

  try {
    const dir = paiPath('MEMORY', 'VOICE');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    appendFileSync(VOICE_LOG_PATH, line);
  } catch {
    // Silent fail
  }

  try {
    const workDir = getActiveWorkDir();
    if (workDir) {
      appendFileSync(join(workDir, 'voice.jsonl'), line);
    }
  } catch {
    // Silent fail
  }
}

async function sendNotification(payload: VoiceNotificationPayload, sessionId: string): Promise<void> {
  const baseEvent: Omit<VoiceEvent, 'event_type' | 'status_code' | 'error'> = {
    timestamp: getISOTimestamp(),
    session_id: sessionId,
    message: payload.message,
    character_count: payload.message.length,
    voice_engine: 'voiceserver',
  };

  try {
    // Send to VoiceServer - it handles voice selection via voices.json
    const response = await fetch('http://localhost:8888/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('[Voice] Server error:', response.statusText);
      logVoiceEvent({
        ...baseEvent,
        event_type: 'failed',
        status_code: response.status,
        error: response.statusText,
      });
    } else {
      logVoiceEvent({
        ...baseEvent,
        event_type: 'sent',
        status_code: response.status,
      });
    }
  } catch (error) {
    console.error('[Voice] Failed to send:', error);
    logVoiceEvent({
      ...baseEvent,
      event_type: 'failed',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Handle voice notification with pre-parsed transcript data.
 * Uses ElevenLabs TTS via the voice server.
 */
export async function handleVoice(parsed: ParsedTranscript, sessionId: string): Promise<void> {
  let voiceCompletion = parsed.voiceCompletion;

  // Validate voice completion
  if (!isValidVoiceCompletion(voiceCompletion)) {
    console.error(`[Voice] Invalid completion: "${voiceCompletion.slice(0, 50)}..."`);
    voiceCompletion = getVoiceFallback();
  }

  // Skip empty or too-short messages
  if (!voiceCompletion || voiceCompletion.length < 5) {
    console.error('[Voice] Skipping - message too short or empty');
    return;
  }

  // Send to VoiceServer without voice_id - it uses voices.json for identity voice
  const aiName = getAiName();
  const payload: VoiceNotificationPayload = {
    message: voiceCompletion,
    title: `${aiName} says`,
    voice_enabled: true,
    // NO voice_id - VoiceServer uses identity from voices.json
    // NO voice_settings - VoiceServer uses identity from voices.json
  };

  await sendNotification(payload, sessionId);
}
