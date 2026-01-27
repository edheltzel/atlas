#!/usr/bin/env bun
/**
 * Voice Server - Personal AI Voice notification server using ElevenLabs TTS
 *
 * Features:
 * - ElevenLabs SDK with 10s timeout (prevents indefinite hangs)
 * - Circuit breaker pattern (fast fallback after consecutive failures)
 * - macOS `say` command fallback (local, instant, always available)
 */

import { serve } from "bun";
import { spawn } from "child_process";
import { homedir } from "os";
import { join } from "path";
import { existsSync, readFileSync } from "fs";
import { ElevenLabsClient } from "elevenlabs";

// =============================================================================
// Circuit Breaker - Fast fallback after consecutive failures
// =============================================================================
interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

const circuitBreaker: CircuitBreakerState = {
  failures: 0,
  lastFailure: 0,
  isOpen: false,
};

const CIRCUIT_BREAKER_THRESHOLD = 1;      // Open after 1 failure - fast fallback
const CIRCUIT_BREAKER_RESET_MS = 60_000;  // Try again after 1 minute

function recordSuccess(): void {
  circuitBreaker.failures = 0;
  if (circuitBreaker.isOpen) {
    console.log('🟢 Circuit CLOSED - ElevenLabs recovered');
    circuitBreaker.isOpen = false;
  }
}

function recordFailure(): void {
  circuitBreaker.failures++;
  circuitBreaker.lastFailure = Date.now();

  if (circuitBreaker.failures >= CIRCUIT_BREAKER_THRESHOLD && !circuitBreaker.isOpen) {
    circuitBreaker.isOpen = true;
    console.warn('🔴 Circuit OPEN - ElevenLabs disabled, using fallback');
  }
}

function shouldSkipElevenLabs(): boolean {
  if (!circuitBreaker.isOpen) return false;

  // Check if we should try again (half-open state)
  if (Date.now() - circuitBreaker.lastFailure > CIRCUIT_BREAKER_RESET_MS) {
    console.log('🟡 Circuit HALF-OPEN - testing ElevenLabs');
    return false;
  }

  return true;
}

// Load .env from multiple locations (first found wins for each key)
const envPaths = [
  join(homedir(), '.claude', '.env'),  // PAI directory
  join(homedir(), '.env'),              // Home directory fallback
];

for (const envPath of envPaths) {
  if (existsSync(envPath)) {
    const envContent = await Bun.file(envPath).text();
    envContent.split('\n').forEach(line => {
      const eqIndex = line.indexOf('=');
      if (eqIndex === -1) return;
      const key = line.slice(0, eqIndex).trim();
      let value = line.slice(eqIndex + 1).trim();
      // Strip surrounding quotes (single or double)
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      // Only set if not already set (first found wins)
      if (key && value && !key.startsWith('#') && !process.env[key]) {
        process.env[key] = value;
      }
    });
  }
}

const PORT = parseInt(process.env.PORT || "8888");
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_TIMEOUT_MS = 10_000; // 10 second timeout

// =============================================================================
// Load settings.json for fallback voice configuration
// =============================================================================
const SETTINGS_PATH = join(homedir(), '.claude', 'settings.json');
const DEFAULT_MACOS_VOICE = 'Daniel (Enhanced)';

function getMacOSFallbackVoice(): string {
  try {
    if (existsSync(SETTINGS_PATH)) {
      const settings = JSON.parse(readFileSync(SETTINGS_PATH, 'utf-8'));
      const fallbackVoice = settings?.daidentity?.voice?.fallbackVoice;
      if (fallbackVoice && typeof fallbackVoice === 'string') {
        return fallbackVoice;
      }
    }
  } catch (error) {
    console.warn('⚠️  Failed to read fallback voice from settings.json');
  }
  return DEFAULT_MACOS_VOICE;
}

if (!ELEVENLABS_API_KEY) {
  console.error('⚠️  ELEVENLABS_API_KEY not found in ~/.claude/.env or ~/.env');
  console.error('Add: ELEVENLABS_API_KEY=your_key_here');
}

// Initialize ElevenLabs SDK client
const elevenLabsClient = ELEVENLABS_API_KEY
  ? new ElevenLabsClient({ apiKey: ELEVENLABS_API_KEY })
  : null;

// Default voice ID (Kai's voice)
const DEFAULT_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "s3TPKV1kjDlVtZbl4Ksh";

// Voice configuration types
interface VoiceConfig {
  voice_id: string;
  voice_name: string;
  stability: number;
  similarity_boost: number;
  description: string;
  type: string;
}

interface VoicesConfig {
  voices: Record<string, VoiceConfig>;
}

// Full voice settings interface matching settings.json
interface VoiceSettings {
  stability?: number;
  similarity_boost?: number;
  style?: number;
  speed?: number;
  use_speaker_boost?: boolean;
}

// Default voice settings (full ElevenLabs options)
const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0.0,
  speed: 1.0,
  use_speaker_boost: true,
};

// Load voices configuration from CORE skill (canonical source)
let voicesConfig: VoicesConfig | null = null;
try {
  // Try CORE skill markdown first (canonical source of truth)
  const corePersonalitiesPath = join(homedir(), '.claude', 'skills', 'CORE', 'SYSTEM', 'AGENTPERSONALITIES.md');
  if (existsSync(corePersonalitiesPath)) {
    const markdownContent = readFileSync(corePersonalitiesPath, 'utf-8');
    // Extract JSON block from markdown
    const jsonMatch = markdownContent.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
      voicesConfig = JSON.parse(jsonMatch[1]);
      console.log('✅ Loaded voice personalities from CORE/SYSTEM/AGENTPERSONALITIES.md');
    }
  } else {
    // Fallback to local voices.json (deprecated)
    const voicesPath = join(import.meta.dir, 'voices.json');
    if (existsSync(voicesPath)) {
      const voicesContent = readFileSync(voicesPath, 'utf-8');
      voicesConfig = JSON.parse(voicesContent);
      console.log('⚠️  Loaded from voices.json (deprecated - use CORE/agent-personalities.md)');
    }
  }
} catch (error) {
  console.warn('⚠️  Failed to load voice personalities, using defaults');
}

// Escape special characters for AppleScript
function escapeForAppleScript(input: string): string {
  // Escape backslashes first, then double quotes
  return input.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

// Strip any bracket markers from message (legacy cleanup)
function stripMarkers(message: string): string {
  return message.replace(/\[[^\]]*\]/g, '').trim();
}

// Get voice configuration by voice ID or agent name
function getVoiceConfig(identifier: string): VoiceConfig | null {
  if (!voicesConfig) return null;

  // Try direct agent name lookup
  if (voicesConfig.voices[identifier]) {
    return voicesConfig.voices[identifier];
  }

  // Try voice_id lookup
  for (const config of Object.values(voicesConfig.voices)) {
    if (config.voice_id === identifier) {
      return config;
    }
  }

  return null;
}

// Sanitize input for TTS and notifications - allow natural speech punctuation
function sanitizeForSpeech(input: string): string {
  // Allow: letters, numbers, spaces, common punctuation for natural speech
  // Explicitly block: shell metacharacters, path traversal, script tags, markdown
  const cleaned = input
    .replace(/<script/gi, '')  // Remove script tags
    .replace(/\.\.\//g, '')     // Remove path traversal
    .replace(/[;&|><`$\\]/g, '') // Remove shell metacharacters
    .replace(/\*\*([^*]+)\*\*/g, '$1')  // Strip bold markdown: **text** → text
    .replace(/\*([^*]+)\*/g, '$1')       // Strip italic markdown: *text* → text
    .replace(/`([^`]+)`/g, '$1')         // Strip inline code: `text` → text
    .replace(/#{1,6}\s+/g, '')           // Strip markdown headers: ### → (empty)
    .trim()
    .substring(0, 500);

  return cleaned;
}

// Validate user input - check for obviously malicious content
function validateInput(input: any): { valid: boolean; error?: string; sanitized?: string } {
  if (!input || typeof input !== 'string') {
    return { valid: false, error: 'Invalid input type' };
  }

  if (input.length > 500) {
    return { valid: false, error: 'Message too long (max 500 characters)' };
  }

  // Sanitize and check if anything remains
  const sanitized = sanitizeForSpeech(input);

  if (!sanitized || sanitized.length === 0) {
    return { valid: false, error: 'Message contains no valid content after sanitization' };
  }

  return { valid: true, sanitized };
}

// =============================================================================
// macOS `say` Fallback - Local TTS when ElevenLabs is unavailable
// =============================================================================
async function speakWithMacOS(text: string): Promise<boolean> {
  try {
    const fallbackVoice = getMacOSFallbackVoice();
    console.log(`🍎 Using macOS say fallback (voice: ${fallbackVoice})...`);

    // Speak directly - no file intermediary, simpler and more reliable
    const proc = spawn('/usr/bin/say', [
      '-v', fallbackVoice,  // Configurable fallback voice from settings.json
      '-r', '175',          // Slightly faster rate
      text
    ]);

    await new Promise<void>((resolve, reject) => {
      proc.on('exit', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`say exited with code ${code}`));
      });
      proc.on('error', reject);
    });

    console.log('🍎 macOS say completed');
    return true;
  } catch (error) {
    console.error('🍎 macOS say fallback failed:', error);
    return false;
  }
}

// =============================================================================
// ElevenLabs SDK Speech Generation with Timeout
// =============================================================================

async function generateSpeechWithElevenLabs(
  text: string,
  voiceId: string,
  voiceSettings?: VoiceSettings
): Promise<ArrayBuffer> {
  if (!elevenLabsClient) {
    throw new Error('ElevenLabs API key not configured');
  }

  // Apply all voice settings from config
  const settings = {
    stability: voiceSettings?.stability ?? 0.5,
    similarity_boost: voiceSettings?.similarity_boost ?? 0.5,
    style: voiceSettings?.style ?? 0.0,
    use_speaker_boost: voiceSettings?.use_speaker_boost ?? true,
  };

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ELEVENLABS_TIMEOUT_MS);

  try {
    const audioStream = await elevenLabsClient.textToSpeech.convert(
      voiceId,
      {
        text: text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: settings,
      },
      {
        timeoutInSeconds: ELEVENLABS_TIMEOUT_MS / 1000,
        abortSignal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    // Convert stream to ArrayBuffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }

    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return result.buffer;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// =============================================================================
// Main Speech Function - ElevenLabs with Direct macOS Fallback
// =============================================================================

async function speak(
  text: string,
  voiceId: string,
  voiceSettings?: VoiceSettings
): Promise<{ success: boolean; source: 'elevenlabs' | 'macos' }> {
  // Check circuit breaker - skip ElevenLabs if it's been failing
  if (shouldSkipElevenLabs() || !elevenLabsClient) {
    console.log('⚡ Skipping ElevenLabs, using macOS fallback');
    const success = await speakWithMacOS(text);
    return { success, source: 'macos' };
  }

  // Try ElevenLabs first
  try {
    const audio = await generateSpeechWithElevenLabs(text, voiceId, voiceSettings);
    recordSuccess();

    // Play the ElevenLabs audio
    await playAudio(audio, 'mp3');
    return { success: true, source: 'elevenlabs' };
  } catch (error: any) {
    recordFailure();

    const isTimeout = error.name === 'AbortError' ||
                      error.message?.includes('timeout') ||
                      error.message?.includes('Timeout');

    if (isTimeout) {
      console.warn(`⏱️  ElevenLabs timeout after ${ELEVENLABS_TIMEOUT_MS}ms - using fallback`);
    } else {
      console.error('❌ ElevenLabs error:', error.message || error);
    }

    // Fallback to macOS say (speaks directly)
    const success = await speakWithMacOS(text);
    return { success, source: 'macos' };
  }
}

// Get volume setting from config (defaults to 1.0 = 100%)
function getVolumeSetting(): number {
  if (voicesConfig && 'default_volume' in voicesConfig) {
    const vol = (voicesConfig as any).default_volume;
    if (typeof vol === 'number' && vol >= 0 && vol <= 1) {
      return vol;
    }
  }
  return 1.0; // Default to full volume
}

// Play audio using afplay (macOS)
// Supports both MP3 (ElevenLabs) and AIFF (macOS say fallback)
async function playAudio(audioBuffer: ArrayBuffer, format: 'mp3' | 'aiff' = 'mp3'): Promise<void> {
  const tempFile = `/tmp/voice-${Date.now()}.${format}`;

  // Write audio to temp file
  await Bun.write(tempFile, audioBuffer);

  const volume = getVolumeSetting();

  return new Promise((resolve, reject) => {
    // afplay -v takes a value from 0.0 to 1.0
    const proc = spawn('/usr/bin/afplay', ['-v', volume.toString(), tempFile]);

    proc.on('error', (error) => {
      console.error('Error playing audio:', error);
      spawn('/bin/rm', ['-f', tempFile]);
      reject(error);
    });

    proc.on('exit', (code) => {
      // Clean up temp file
      spawn('/bin/rm', ['-f', tempFile]);

      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`afplay exited with code ${code}`));
      }
    });
  });
}

// Spawn a process safely
function spawnSafe(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args);

    proc.on('error', (error) => {
      console.error(`Error spawning ${command}:`, error);
      reject(error);
    });

    proc.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with code ${code}`));
      }
    });
  });
}

// Send macOS notification with voice
async function sendNotification(
  title: string,
  message: string,
  voiceEnabled = true,
  voiceId: string | null = null
) {
  // Validate and sanitize inputs
  const titleValidation = validateInput(title);
  const messageValidation = validateInput(message);

  if (!titleValidation.valid) {
    throw new Error(`Invalid title: ${titleValidation.error}`);
  }

  if (!messageValidation.valid) {
    throw new Error(`Invalid message: ${messageValidation.error}`);
  }

  // Use pre-sanitized values from validation
  const safeTitle = titleValidation.sanitized!;
  let safeMessage = stripMarkers(messageValidation.sanitized!);

  // Generate and play voice using ElevenLabs (with fallback to macOS say)
  if (voiceEnabled) {
    try {
      const voice = voiceId || DEFAULT_VOICE_ID;

      // Get voice configuration (personality settings)
      const voiceConfig = getVoiceConfig(voice);

      // Build full voice settings from config or defaults
      const voiceSettings: VoiceSettings = voiceConfig
        ? {
            stability: voiceConfig.stability,
            similarity_boost: voiceConfig.similarity_boost,
            style: (voiceConfig as any).style ?? DEFAULT_VOICE_SETTINGS.style,
            speed: (voiceConfig as any).speed ?? DEFAULT_VOICE_SETTINGS.speed,
            use_speaker_boost: (voiceConfig as any).use_speaker_boost ?? DEFAULT_VOICE_SETTINGS.use_speaker_boost,
          }
        : DEFAULT_VOICE_SETTINGS;

      if (voiceConfig) {
        console.log(`👤 Voice: ${voiceConfig.description}`);
      }

      console.log(`🎙️  Speaking...`);

      const result = await speak(safeMessage, voice, voiceSettings);

      if (result.success) {
        console.log(`✅ Speech via ${result.source}`);
      } else {
        console.warn('⚠️  Speech failed');
      }
    } catch (error) {
      console.error("Failed to speak:", error);
    }
  }

  // Display macOS notification - escape for AppleScript
  try {
    const escapedTitle = escapeForAppleScript(safeTitle);
    const escapedMessage = escapeForAppleScript(safeMessage);
    const script = `display notification "${escapedMessage}" with title "${escapedTitle}" sound name ""`;
    await spawnSafe('/usr/bin/osascript', ['-e', script]);
  } catch (error) {
    console.error("Notification display error:", error);
  }
}

// Rate limiting
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now > record.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

// Start HTTP server
const server = serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    const clientIp = req.headers.get('x-forwarded-for') || 'localhost';

    const corsHeaders = {
      "Access-Control-Allow-Origin": "http://localhost",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders, status: 204 });
    }

    if (!checkRateLimit(clientIp)) {
      return new Response(
        JSON.stringify({ status: "error", message: "Rate limit exceeded" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 429
        }
      );
    }

    if (url.pathname === "/notify" && req.method === "POST") {
      try {
        const data = await req.json();
        const title = data.title || "PAI Notification";
        const message = data.message || "Task completed";
        const voiceEnabled = data.voice_enabled !== false;
        const voiceId = data.voice_id || data.voice_name || null; // Support both voice_id and voice_name

        if (voiceId && typeof voiceId !== 'string') {
          throw new Error('Invalid voice_id');
        }

        console.log(`📨 Notification: "${title}" - "${message}" (voice: ${voiceEnabled}, voiceId: ${voiceId || DEFAULT_VOICE_ID})`);

        await sendNotification(title, message, voiceEnabled, voiceId);

        return new Response(
          JSON.stringify({ status: "success", message: "Notification sent" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200
          }
        );
      } catch (error: any) {
        console.error("Notification error:", error);
        return new Response(
          JSON.stringify({ status: "error", message: error.message || "Internal server error" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: error.message?.includes('Invalid') ? 400 : 500
          }
        );
      }
    }

    if (url.pathname === "/pai" && req.method === "POST") {
      try {
        const data = await req.json();
        const title = data.title || "PAI Assistant";
        const message = data.message || "Task completed";

        console.log(`🤖 PAI notification: "${title}" - "${message}"`);

        await sendNotification(title, message, true, null);

        return new Response(
          JSON.stringify({ status: "success", message: "PAI notification sent" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200
          }
        );
      } catch (error: any) {
        console.error("PAI notification error:", error);
        return new Response(
          JSON.stringify({ status: "error", message: error.message || "Internal server error" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: error.message?.includes('Invalid') ? 400 : 500
          }
        );
      }
    }

    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          status: "healthy",
          port: PORT,
          voice_system: "ElevenLabs + macOS fallback",
          default_voice_id: DEFAULT_VOICE_ID,
          macos_fallback_voice: getMacOSFallbackVoice(),
          api_key_configured: !!ELEVENLABS_API_KEY,
          circuit_breaker: {
            open: circuitBreaker.isOpen,
            failures: circuitBreaker.failures,
            threshold: CIRCUIT_BREAKER_THRESHOLD,
            reset_after_ms: CIRCUIT_BREAKER_RESET_MS,
          },
          timeout_ms: ELEVENLABS_TIMEOUT_MS,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200
        }
      );
    }

    return new Response("Voice Server - POST to /notify or /pai", {
      headers: corsHeaders,
      status: 200
    });
  },
});

console.log(`🚀 Voice Server running on port ${PORT}`);
console.log(`🎙️  Primary: ElevenLabs TTS (${ELEVENLABS_TIMEOUT_MS / 1000}s timeout)`);
console.log(`🍎 Fallback: macOS say command (voice: ${getMacOSFallbackVoice()})`);
console.log(`⚡ Circuit breaker: ${CIRCUIT_BREAKER_THRESHOLD} failures → ${CIRCUIT_BREAKER_RESET_MS / 1000}s cooldown`);
console.log(`📡 POST to http://localhost:${PORT}/notify`);
console.log(`🔒 Security: CORS restricted to localhost, rate limiting enabled`);
console.log(`🔑 API Key: ${ELEVENLABS_API_KEY ? '✅ Configured' : '❌ Missing (fallback only)'}`);
