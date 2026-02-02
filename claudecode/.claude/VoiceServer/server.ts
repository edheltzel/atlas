#!/usr/bin/env bun
/**
 * Voice Server - Multi-Provider TTS Notification Server
 *
 * Supports three TTS providers (configurable in voices.json):
 * 1. Kokoro (local) - Free, offline, no API key needed
 * 2. ElevenLabs (cloud) - Premium quality, requires API key
 * 3. macOS say (system) - Basic quality, always available fallback
 *
 * Features:
 * - Provider abstraction layer for extensibility
 * - Per-provider circuit breakers (fast fallback after failures)
 * - Configurable fallback chain
 * - Environment variable support for API keys
 * - Consolidated config in voices.json
 */

import { serve } from "bun";
import { spawn } from "child_process";
import { homedir } from "os";
import { join } from "path";
import { existsSync, readFileSync } from "fs";
import { ElevenLabsClient } from "elevenlabs";

// =============================================================================
// Types and Interfaces
// =============================================================================

interface TTSProvider {
  name: string;
  isEnabled(): boolean;
  isHealthy(): Promise<boolean>;
  speak(text: string, voice?: string, settings?: VoiceSettings): Promise<boolean>;
}

interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

interface VoiceSettings {
  stability?: number;
  similarity_boost?: number;
  style?: number;
  speed?: number;
  use_speaker_boost?: boolean;
}

interface ProviderConfig {
  enabled: boolean;
  apiKey?: string;
  endpoint?: string;
  defaultVoice?: string;
  defaultVoiceId?: string;
  voice?: string;
  description?: string;
}

interface VoiceMapping {
  description?: string;
  elevenlabs?: {
    voice_id: string;
    voice_name?: string;
    stability?: number;
    similarity_boost?: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
  kokoro?: {
    voice: string;
    speed?: number;
  };
}

interface VoicesConfig {
  providers: {
    kokoro: ProviderConfig;
    elevenlabs: ProviderConfig;
    say: ProviderConfig;
  };
  defaultProvider: string;
  fallbackOrder: string[];
  default_rate?: number;
  default_volume?: number;
  identity: VoiceMapping;
  agents: Record<string, VoiceMapping>;
}

// =============================================================================
// Configuration Loading
// =============================================================================

// Load .env from multiple locations (first found wins for each key)
const envPaths = [
  join(homedir(), '.claude', '.env'),
  join(homedir(), '.env'),
];

for (const envPath of envPaths) {
  if (existsSync(envPath)) {
    const envContent = await Bun.file(envPath).text();
    envContent.split('\n').forEach(line => {
      const eqIndex = line.indexOf('=');
      if (eqIndex === -1) return;
      const key = line.slice(0, eqIndex).trim();
      let value = line.slice(eqIndex + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (key && value && !key.startsWith('#') && !process.env[key]) {
        process.env[key] = value;
      }
    });
  }
}

const PORT = parseInt(process.env.PORT || "8888");
const VOICES_PATH = join(import.meta.dir, 'voices.json');
const DEFAULT_MACOS_VOICE = 'Daniel (Enhanced)';
const ELEVENLABS_TIMEOUT_MS = 10_000;
const KOKORO_TIMEOUT_MS = 10_000;

// Resolve environment variables in config values
function resolveEnvVar(value: string | undefined): string | undefined {
  if (!value) return value;
  const match = value.match(/^\$\{([^}]+)\}$/);
  if (match) {
    return process.env[match[1]];
  }
  return value;
}

// Load voices.json (single source of truth for all voice config)
function loadVoicesConfig(): VoicesConfig {
  const defaultConfig: VoicesConfig = {
    providers: {
      kokoro: {
        enabled: true,
        endpoint: 'http://127.0.0.1:8880/v1',
        defaultVoice: 'af_sky',
        description: 'Local TTS - free, offline, no API key needed'
      },
      elevenlabs: {
        enabled: false,
        apiKey: '${ELEVENLABS_API_KEY}',
        defaultVoiceId: 's3TPKV1kjDlVtZbl4Ksh',
        description: 'Premium cloud TTS - requires API key from elevenlabs.io'
      },
      say: {
        enabled: true,
        voice: DEFAULT_MACOS_VOICE,
        description: 'macOS built-in - always available fallback'
      }
    },
    defaultProvider: 'kokoro',
    fallbackOrder: ['kokoro', 'elevenlabs', 'say'],
    default_volume: 0.8,
    identity: {
      description: 'Main AI assistant voice',
      kokoro: { voice: 'am_adam', speed: 1.1 }
    },
    agents: {}
  };

  try {
    if (existsSync(VOICES_PATH)) {
      const content = readFileSync(VOICES_PATH, 'utf-8');
      const config = JSON.parse(content);
      console.log('✅ Loaded voice config from voices.json');
      return {
        ...defaultConfig,
        ...config,
        providers: {
          ...defaultConfig.providers,
          ...config.providers
        }
      };
    }
  } catch (error) {
    console.warn('⚠️  Failed to load voices.json, using defaults');
  }

  return defaultConfig;
}

// Global config (loaded once at startup)
const voicesConfig = loadVoicesConfig();

function getMacOSFallbackVoice(): string {
  return voicesConfig.providers.say.voice || DEFAULT_MACOS_VOICE;
}

// =============================================================================
// Circuit Breakers - Per-Provider Fast Fallback
// =============================================================================

const circuitBreakers: Record<string, CircuitBreakerState> = {
  elevenlabs: { failures: 0, lastFailure: 0, isOpen: false },
  kokoro: { failures: 0, lastFailure: 0, isOpen: false },
};

const CIRCUIT_BREAKER_THRESHOLD = 1;
const CIRCUIT_BREAKER_RESET_MS = 60_000;

function recordProviderSuccess(provider: string): void {
  const breaker = circuitBreakers[provider];
  if (!breaker) return;

  breaker.failures = 0;
  if (breaker.isOpen) {
    console.log(`🟢 Circuit CLOSED - ${provider} recovered`);
    breaker.isOpen = false;
  }
}

function recordProviderFailure(provider: string): void {
  const breaker = circuitBreakers[provider];
  if (!breaker) return;

  breaker.failures++;
  breaker.lastFailure = Date.now();

  if (breaker.failures >= CIRCUIT_BREAKER_THRESHOLD && !breaker.isOpen) {
    breaker.isOpen = true;
    console.warn(`🔴 Circuit OPEN - ${provider} disabled, using fallback`);
  }
}

function shouldSkipProvider(provider: string): boolean {
  const breaker = circuitBreakers[provider];
  if (!breaker || !breaker.isOpen) return false;

  if (Date.now() - breaker.lastFailure > CIRCUIT_BREAKER_RESET_MS) {
    console.log(`🟡 Circuit HALF-OPEN - testing ${provider}`);
    return false;
  }

  return true;
}

// =============================================================================
// Voice Configuration Lookup
// =============================================================================

function getVoiceMapping(identifier: string | null): VoiceMapping | null {
  if (!identifier) {
    // Return identity voice for main AI
    return voicesConfig.identity;
  }

  // Check agents
  if (voicesConfig.agents[identifier]) {
    return voicesConfig.agents[identifier];
  }

  // Check if it's an ElevenLabs voice ID
  for (const [name, mapping] of Object.entries(voicesConfig.agents)) {
    if (mapping.elevenlabs?.voice_id === identifier) {
      return mapping;
    }
  }

  // Check identity
  if (voicesConfig.identity.elevenlabs?.voice_id === identifier) {
    return voicesConfig.identity;
  }

  return null;
}

// =============================================================================
// Utility Functions
// =============================================================================

function escapeForAppleScript(input: string): string {
  return input.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function stripMarkers(message: string): string {
  return message.replace(/\[[^\]]*\]/g, '').trim();
}

function sanitizeForSpeech(input: string): string {
  const cleaned = input
    .replace(/<script/gi, '')
    .replace(/\.\.\//g, '')
    .replace(/[;&|><`$\\]/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .trim()
    .substring(0, 500);

  return cleaned;
}

function validateInput(input: any): { valid: boolean; error?: string; sanitized?: string } {
  if (!input || typeof input !== 'string') {
    return { valid: false, error: 'Invalid input type' };
  }

  if (input.length > 500) {
    return { valid: false, error: 'Message too long (max 500 characters)' };
  }

  const sanitized = sanitizeForSpeech(input);

  if (!sanitized || sanitized.length === 0) {
    return { valid: false, error: 'Message contains no valid content after sanitization' };
  }

  return { valid: true, sanitized };
}

function getVolumeSetting(): number {
  const vol = voicesConfig.default_volume;
  if (typeof vol === 'number' && vol >= 0 && vol <= 1) {
    return vol;
  }
  return 1.0;
}

async function playAudio(audioBuffer: ArrayBuffer, format: 'mp3' | 'wav' | 'aiff' = 'mp3'): Promise<void> {
  const tempFile = `/tmp/voice-${Date.now()}.${format}`;
  await Bun.write(tempFile, audioBuffer);

  const volume = getVolumeSetting();

  return new Promise((resolve, reject) => {
    const proc = spawn('/usr/bin/afplay', ['-v', volume.toString(), tempFile]);

    proc.on('error', (error) => {
      console.error('Error playing audio:', error);
      spawn('/bin/rm', ['-f', tempFile]);
      reject(error);
    });

    proc.on('exit', (code) => {
      spawn('/bin/rm', ['-f', tempFile]);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`afplay exited with code ${code}`));
      }
    });
  });
}

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

// =============================================================================
// TTS Provider Implementations
// =============================================================================

// --- macOS Say Provider ---
class MacOSSayProvider implements TTSProvider {
  name = 'say';

  isEnabled(): boolean {
    return voicesConfig.providers.say.enabled !== false;
  }

  async isHealthy(): Promise<boolean> {
    return true; // Always available on macOS
  }

  async speak(text: string): Promise<boolean> {
    try {
      const fallbackVoice = getMacOSFallbackVoice();
      console.log(`🍎 Using macOS say (voice: ${fallbackVoice})...`);

      const proc = spawn('/usr/bin/say', [
        '-v', fallbackVoice,
        '-r', '175',
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
      console.error('🍎 macOS say failed:', error);
      return false;
    }
  }
}

// --- ElevenLabs Provider ---
class ElevenLabsProvider implements TTSProvider {
  name = 'elevenlabs';
  private client: ElevenLabsClient | null = null;

  constructor() {
    const apiKey = resolveEnvVar(voicesConfig.providers.elevenlabs.apiKey) || process.env.ELEVENLABS_API_KEY;
    if (apiKey) {
      this.client = new ElevenLabsClient({ apiKey });
    }
  }

  isEnabled(): boolean {
    return voicesConfig.providers.elevenlabs.enabled === true && this.client !== null;
  }

  async isHealthy(): Promise<boolean> {
    if (!this.client) return false;
    if (shouldSkipProvider('elevenlabs')) return false;
    return true;
  }

  async speak(text: string, voiceId?: string, voiceSettings?: VoiceSettings): Promise<boolean> {
    if (!this.client) return false;

    const voice = voiceId || voicesConfig.providers.elevenlabs.defaultVoiceId || 's3TPKV1kjDlVtZbl4Ksh';

    const settings = {
      stability: voiceSettings?.stability ?? 0.5,
      similarity_boost: voiceSettings?.similarity_boost ?? 0.5,
      style: voiceSettings?.style ?? 0.0,
      use_speaker_boost: voiceSettings?.use_speaker_boost ?? true,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ELEVENLABS_TIMEOUT_MS);

    try {
      console.log(`🎙️  ElevenLabs speaking (voice: ${voice})...`);

      const audioStream = await this.client.textToSpeech.convert(
        voice,
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

      await playAudio(result.buffer, 'mp3');
      recordProviderSuccess('elevenlabs');
      console.log('✅ ElevenLabs speech completed');
      return true;
    } catch (error: any) {
      clearTimeout(timeoutId);
      recordProviderFailure('elevenlabs');

      const isTimeout = error.name === 'AbortError' ||
                        error.message?.includes('timeout') ||
                        error.message?.includes('Timeout');

      if (isTimeout) {
        console.warn(`⏱️  ElevenLabs timeout after ${ELEVENLABS_TIMEOUT_MS}ms`);
      } else {
        console.error('❌ ElevenLabs error:', error.message || error);
      }
      return false;
    }
  }
}

// --- Kokoro Provider ---
class KokoroProvider implements TTSProvider {
  name = 'kokoro';

  isEnabled(): boolean {
    return voicesConfig.providers.kokoro.enabled === true;
  }

  async isHealthy(): Promise<boolean> {
    if (!this.isEnabled()) return false;
    if (shouldSkipProvider('kokoro')) return false;

    const endpoint = voicesConfig.providers.kokoro.endpoint || 'http://127.0.0.1:8880/v1';

    try {
      const response = await fetch(`${endpoint}/models`, {
        signal: AbortSignal.timeout(2000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async speak(text: string, voice?: string, voiceSettings?: VoiceSettings): Promise<boolean> {
    const endpoint = voicesConfig.providers.kokoro.endpoint || 'http://127.0.0.1:8880/v1';
    const kokoroVoice = voice || voicesConfig.providers.kokoro.defaultVoice || 'af_sky';
    const speed = voiceSettings?.speed ?? 1.0;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), KOKORO_TIMEOUT_MS);

    try {
      console.log(`🎵 Kokoro speaking (voice: ${kokoroVoice}, speed: ${speed})...`);

      const response = await fetch(`${endpoint}/audio/speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'kokoro',
          input: text,
          voice: kokoroVoice,
          speed: speed,
          response_format: 'mp3'
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Kokoro API returned ${response.status}: ${response.statusText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      await playAudio(audioBuffer, 'mp3');
      recordProviderSuccess('kokoro');
      console.log('✅ Kokoro speech completed');
      return true;
    } catch (error: any) {
      clearTimeout(timeoutId);
      recordProviderFailure('kokoro');

      const isTimeout = error.name === 'AbortError' ||
                        error.message?.includes('timeout') ||
                        error.message?.includes('Timeout');

      if (isTimeout) {
        console.warn(`⏱️  Kokoro timeout after ${KOKORO_TIMEOUT_MS}ms`);
      } else {
        console.error('❌ Kokoro error:', error.message || error);
      }
      return false;
    }
  }
}

// =============================================================================
// Provider Management
// =============================================================================

const providers: Record<string, TTSProvider> = {
  elevenlabs: new ElevenLabsProvider(),
  kokoro: new KokoroProvider(),
  say: new MacOSSayProvider(),
};

async function getProviderStatus(): Promise<Record<string, { enabled: boolean; healthy: boolean; endpoint?: string }>> {
  const status: Record<string, { enabled: boolean; healthy: boolean; endpoint?: string }> = {};

  for (const [name, provider] of Object.entries(providers)) {
    const enabled = provider.isEnabled();
    const healthy = enabled ? await provider.isHealthy() : false;

    status[name] = {
      enabled,
      healthy,
      ...(name === 'kokoro' && { endpoint: voicesConfig.providers.kokoro.endpoint }),
      ...(name === 'elevenlabs' && { apiKeyConfigured: !!resolveEnvVar(voicesConfig.providers.elevenlabs.apiKey) })
    };
  }

  return status;
}

async function speakWithFallback(
  text: string,
  voiceId?: string,
  voiceSettings?: VoiceSettings
): Promise<{ success: boolean; provider: string }> {
  // Build provider order: primary first, then fallback order
  const providerOrder = [voicesConfig.defaultProvider, ...voicesConfig.fallbackOrder.filter(p => p !== voicesConfig.defaultProvider)];

  // Get voice mapping for personality
  const voiceMapping = getVoiceMapping(voiceId || null);

  for (const providerName of providerOrder) {
    const provider = providers[providerName];
    if (!provider) continue;

    if (!provider.isEnabled()) {
      console.log(`⏭️  Skipping ${providerName} (disabled)`);
      continue;
    }

    const healthy = await provider.isHealthy();
    if (!healthy) {
      console.log(`⏭️  Skipping ${providerName} (unhealthy)`);
      continue;
    }

    // Determine voice/settings for this provider
    let providerVoice: string | undefined;
    let providerSettings = voiceSettings;

    if (voiceMapping) {
      if (providerName === 'kokoro' && voiceMapping.kokoro) {
        providerVoice = voiceMapping.kokoro.voice;
        providerSettings = { ...voiceSettings, speed: voiceMapping.kokoro.speed };
      } else if (providerName === 'elevenlabs' && voiceMapping.elevenlabs) {
        providerVoice = voiceMapping.elevenlabs.voice_id;
        providerSettings = {
          stability: voiceMapping.elevenlabs.stability,
          similarity_boost: voiceMapping.elevenlabs.similarity_boost,
          style: voiceMapping.elevenlabs.style,
          use_speaker_boost: voiceMapping.elevenlabs.use_speaker_boost,
          ...voiceSettings
        };
      }
    }

    const success = await provider.speak(text, providerVoice, providerSettings);
    if (success) {
      return { success: true, provider: providerName };
    }
  }

  return { success: false, provider: 'none' };
}

// =============================================================================
// Notification Handler
// =============================================================================

const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0.0,
  speed: 1.0,
  use_speaker_boost: true,
};

async function sendNotification(
  title: string,
  message: string,
  voiceEnabled = true,
  voiceId: string | null = null
) {
  const titleValidation = validateInput(title);
  const messageValidation = validateInput(message);

  if (!titleValidation.valid) {
    throw new Error(`Invalid title: ${titleValidation.error}`);
  }

  if (!messageValidation.valid) {
    throw new Error(`Invalid message: ${messageValidation.error}`);
  }

  const safeTitle = titleValidation.sanitized!;
  let safeMessage = stripMarkers(messageValidation.sanitized!);

  if (voiceEnabled) {
    try {
      const voiceMapping = getVoiceMapping(voiceId);

      // Build voice settings from mapping
      let voiceSettings = DEFAULT_VOICE_SETTINGS;
      if (voiceMapping?.elevenlabs) {
        voiceSettings = {
          stability: voiceMapping.elevenlabs.stability ?? DEFAULT_VOICE_SETTINGS.stability,
          similarity_boost: voiceMapping.elevenlabs.similarity_boost ?? DEFAULT_VOICE_SETTINGS.similarity_boost,
          style: voiceMapping.elevenlabs.style ?? DEFAULT_VOICE_SETTINGS.style,
          speed: voiceMapping.kokoro?.speed ?? DEFAULT_VOICE_SETTINGS.speed,
          use_speaker_boost: voiceMapping.elevenlabs.use_speaker_boost ?? DEFAULT_VOICE_SETTINGS.use_speaker_boost,
        };
      } else if (voiceMapping?.kokoro) {
        voiceSettings = {
          ...DEFAULT_VOICE_SETTINGS,
          speed: voiceMapping.kokoro.speed ?? 1.0,
        };
      }

      if (voiceMapping?.description) {
        console.log(`👤 Voice: ${voiceMapping.description}`);
      }

      console.log(`🎙️  Speaking...`);

      const result = await speakWithFallback(safeMessage, voiceId || undefined, voiceSettings);

      if (result.success) {
        console.log(`✅ Speech via ${result.provider}`);
      } else {
        console.warn('⚠️  All speech providers failed');
      }
    } catch (error) {
      console.error("Failed to speak:", error);
    }
  }

  // Display macOS notification
  try {
    const escapedTitle = escapeForAppleScript(safeTitle);
    const escapedMessage = escapeForAppleScript(safeMessage);
    const script = `display notification "${escapedMessage}" with title "${escapedTitle}" sound name ""`;
    await spawnSafe('/usr/bin/osascript', ['-e', script]);
  } catch (error) {
    console.error("Notification display error:", error);
  }
}

// =============================================================================
// Rate Limiting
// =============================================================================

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

// =============================================================================
// HTTP Server
// =============================================================================

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
        const voiceId = data.voice_id || data.voice_name || null;

        if (voiceId && typeof voiceId !== 'string') {
          throw new Error('Invalid voice_id');
        }

        console.log(`📨 Notification: "${title}" - "${message}" (voice: ${voiceEnabled}, provider: ${voicesConfig.defaultProvider})`);

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
      const providerStatus = await getProviderStatus();

      return new Response(
        JSON.stringify({
          status: "healthy",
          port: PORT,
          voice_system: "Multi-provider TTS (Kokoro, ElevenLabs, macOS say)",
          config_source: "voices.json",
          activeProvider: voicesConfig.defaultProvider,
          providers: providerStatus,
          fallbackOrder: voicesConfig.fallbackOrder,
          macos_fallback_voice: getMacOSFallbackVoice(),
          circuit_breakers: {
            elevenlabs: {
              open: circuitBreakers.elevenlabs.isOpen,
              failures: circuitBreakers.elevenlabs.failures,
            },
            kokoro: {
              open: circuitBreakers.kokoro.isOpen,
              failures: circuitBreakers.kokoro.failures,
            },
            threshold: CIRCUIT_BREAKER_THRESHOLD,
            reset_after_ms: CIRCUIT_BREAKER_RESET_MS,
          },
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200
        }
      );
    }

    return new Response("Voice Server - POST to /notify or /pai, GET /health for status", {
      headers: corsHeaders,
      status: 200
    });
  },
});

// =============================================================================
// Startup Banner
// =============================================================================

const providerStatus = await getProviderStatus();

console.log(`🚀 Voice Server running on port ${PORT}`);
console.log(`📄 Config source: voices.json`);
console.log(`🎙️  Primary provider: ${voicesConfig.defaultProvider}`);
console.log(`📋 Fallback order: ${voicesConfig.fallbackOrder.join(' → ')}`);
console.log(`🔧 Provider status:`);
for (const [name, status] of Object.entries(providerStatus)) {
  const icon = status.healthy ? '✅' : (status.enabled ? '⚠️' : '⬚');
  console.log(`   ${icon} ${name}: ${status.enabled ? 'enabled' : 'disabled'}${status.healthy ? ', healthy' : ''}`);
}
console.log(`🍎 macOS fallback voice: ${getMacOSFallbackVoice()}`);
console.log(`⚡ Circuit breaker: ${CIRCUIT_BREAKER_THRESHOLD} failures → ${CIRCUIT_BREAKER_RESET_MS / 1000}s cooldown`);
console.log(`📡 Endpoints: POST /notify, POST /pai, GET /health`);
console.log(`🔒 Security: CORS restricted to localhost, rate limiting enabled`);
