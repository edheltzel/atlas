#!/usr/bin/env bun
/**
 * Voice Server - Multi-Provider TTS Notification Server
 *
 * Supports three TTS providers (configurable in settings.json):
 * 1. Kokoro (local) - Free, offline, no API key needed
 * 2. ElevenLabs (cloud) - Premium quality, requires API key
 * 3. macOS say (system) - Basic quality, always available fallback
 *
 * Features:
 * - Provider abstraction layer for extensibility
 * - Per-provider circuit breakers (fast fallback after failures)
 * - Configurable fallback chain
 * - Environment variable support for API keys
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

interface VoiceConfig {
  voice_id: string;
  voice_name: string;
  stability: number;
  similarity_boost: number;
  description: string;
  type: string;
  kokoro?: {
    voice: string;
    speed?: number;
  };
}

interface VoicesConfig {
  default_rate?: number;
  default_volume?: number;
  voices: Record<string, VoiceConfig>;
}

interface TTSProviderConfig {
  enabled: boolean;
  apiKey?: string;
  endpoint?: string;
  defaultVoice?: string;
  defaultVoiceId?: string;
  voice?: string;
  description?: string;
}

interface TTSConfig {
  provider: string;
  providers: {
    elevenlabs: TTSProviderConfig;
    kokoro: TTSProviderConfig;
    say: TTSProviderConfig;
  };
  fallbackOrder: string[];
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
const SETTINGS_PATH = join(homedir(), '.claude', 'settings.json');
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

// Load settings.json
function loadSettings(): any {
  try {
    if (existsSync(SETTINGS_PATH)) {
      return JSON.parse(readFileSync(SETTINGS_PATH, 'utf-8'));
    }
  } catch (error) {
    console.warn('⚠️  Failed to read settings.json');
  }
  return {};
}

// Get TTS configuration with defaults
function getTTSConfig(): TTSConfig {
  const settings = loadSettings();
  const ttsConfig = settings?.voiceServer?.tts;

  // Default configuration (open source friendly)
  const defaultConfig: TTSConfig = {
    provider: 'kokoro',
    providers: {
      elevenlabs: {
        enabled: false,
        apiKey: '${ELEVENLABS_API_KEY}',
        defaultVoiceId: 's3TPKV1kjDlVtZbl4Ksh',
        description: 'Premium cloud TTS - requires API key from elevenlabs.io'
      },
      kokoro: {
        enabled: true,
        endpoint: 'http://127.0.0.1:8880/v1',
        defaultVoice: 'af_sky',
        description: 'Local TTS - free, offline, no API key needed'
      },
      say: {
        enabled: true,
        voice: DEFAULT_MACOS_VOICE,
        description: 'macOS built-in - always available fallback'
      }
    },
    fallbackOrder: ['kokoro', 'elevenlabs', 'say']
  };

  if (!ttsConfig) {
    return defaultConfig;
  }

  // Merge with defaults
  return {
    provider: ttsConfig.provider || defaultConfig.provider,
    providers: {
      elevenlabs: { ...defaultConfig.providers.elevenlabs, ...ttsConfig.providers?.elevenlabs },
      kokoro: { ...defaultConfig.providers.kokoro, ...ttsConfig.providers?.kokoro },
      say: { ...defaultConfig.providers.say, ...ttsConfig.providers?.say }
    },
    fallbackOrder: ttsConfig.fallbackOrder || defaultConfig.fallbackOrder
  };
}

function getMacOSFallbackVoice(): string {
  const settings = loadSettings();
  const fallbackVoice = settings?.daidentity?.voice?.fallbackVoice;
  if (fallbackVoice && typeof fallbackVoice === 'string') {
    return fallbackVoice;
  }
  const ttsConfig = getTTSConfig();
  return ttsConfig.providers.say.voice || DEFAULT_MACOS_VOICE;
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
// Voice Configuration Loading
// =============================================================================

let voicesConfig: VoicesConfig | null = null;
try {
  const corePersonalitiesPath = join(homedir(), '.claude', 'skills', 'CORE', 'SYSTEM', 'AGENTPERSONALITIES.md');
  if (existsSync(corePersonalitiesPath)) {
    const markdownContent = readFileSync(corePersonalitiesPath, 'utf-8');
    const jsonMatch = markdownContent.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
      voicesConfig = JSON.parse(jsonMatch[1]);
      console.log('✅ Loaded voice personalities from CORE/SYSTEM/AGENTPERSONALITIES.md');
    }
  } else {
    const voicesPath = join(import.meta.dir, 'voices.json');
    if (existsSync(voicesPath)) {
      const voicesContent = readFileSync(voicesPath, 'utf-8');
      voicesConfig = JSON.parse(voicesContent);
      console.log('✅ Loaded voice personalities from voices.json');
    }
  }
} catch (error) {
  console.warn('⚠️  Failed to load voice personalities, using defaults');
}

function getVoiceConfig(identifier: string): VoiceConfig | null {
  if (!voicesConfig) return null;

  if (voicesConfig.voices[identifier]) {
    return voicesConfig.voices[identifier];
  }

  for (const config of Object.values(voicesConfig.voices)) {
    if (config.voice_id === identifier) {
      return config;
    }
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
  if (voicesConfig && 'default_volume' in voicesConfig) {
    const vol = (voicesConfig as any).default_volume;
    if (typeof vol === 'number' && vol >= 0 && vol <= 1) {
      return vol;
    }
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
    const config = getTTSConfig();
    return config.providers.say.enabled !== false;
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
    const config = getTTSConfig();
    const apiKey = resolveEnvVar(config.providers.elevenlabs.apiKey) || process.env.ELEVENLABS_API_KEY;
    if (apiKey) {
      this.client = new ElevenLabsClient({ apiKey });
    }
  }

  isEnabled(): boolean {
    const config = getTTSConfig();
    return config.providers.elevenlabs.enabled === true && this.client !== null;
  }

  async isHealthy(): Promise<boolean> {
    if (!this.client) return false;
    if (shouldSkipProvider('elevenlabs')) return false;

    // Simple health check - we could add a real API ping here
    return true;
  }

  async speak(text: string, voiceId?: string, voiceSettings?: VoiceSettings): Promise<boolean> {
    if (!this.client) return false;

    const config = getTTSConfig();
    const voice = voiceId || config.providers.elevenlabs.defaultVoiceId || 's3TPKV1kjDlVtZbl4Ksh';

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
    const config = getTTSConfig();
    return config.providers.kokoro.enabled === true;
  }

  async isHealthy(): Promise<boolean> {
    if (!this.isEnabled()) return false;
    if (shouldSkipProvider('kokoro')) return false;

    const config = getTTSConfig();
    const endpoint = config.providers.kokoro.endpoint || 'http://127.0.0.1:8880/v1';

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
    const config = getTTSConfig();
    const endpoint = config.providers.kokoro.endpoint || 'http://127.0.0.1:8880/v1';
    const kokoroVoice = voice || config.providers.kokoro.defaultVoice || 'af_sky';
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
  const config = getTTSConfig();
  const status: Record<string, { enabled: boolean; healthy: boolean; endpoint?: string }> = {};

  for (const [name, provider] of Object.entries(providers)) {
    const enabled = provider.isEnabled();
    const healthy = enabled ? await provider.isHealthy() : false;

    status[name] = {
      enabled,
      healthy,
      ...(name === 'kokoro' && { endpoint: config.providers.kokoro.endpoint }),
      ...(name === 'elevenlabs' && { apiKeyConfigured: !!resolveEnvVar(config.providers.elevenlabs.apiKey) })
    };
  }

  return status;
}

async function speakWithFallback(
  text: string,
  voiceId?: string,
  voiceSettings?: VoiceSettings
): Promise<{ success: boolean; provider: string }> {
  const config = getTTSConfig();

  // Build provider order: primary first, then fallback order
  const providerOrder = [config.provider, ...config.fallbackOrder.filter(p => p !== config.provider)];

  // Get voice config for personality mapping
  const voiceConfig = voiceId ? getVoiceConfig(voiceId) : null;

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
    let providerVoice = voiceId;
    let providerSettings = voiceSettings;

    if (voiceConfig) {
      if (providerName === 'kokoro' && voiceConfig.kokoro) {
        providerVoice = voiceConfig.kokoro.voice;
        providerSettings = { ...voiceSettings, speed: voiceConfig.kokoro.speed };
      } else if (providerName === 'elevenlabs') {
        providerVoice = voiceConfig.voice_id;
        providerSettings = {
          stability: voiceConfig.stability,
          similarity_boost: voiceConfig.similarity_boost,
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
      const voiceConfig = voiceId ? getVoiceConfig(voiceId) : null;

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

        const config = getTTSConfig();
        console.log(`📨 Notification: "${title}" - "${message}" (voice: ${voiceEnabled}, provider: ${config.provider})`);

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
      const config = getTTSConfig();
      const providerStatus = await getProviderStatus();

      return new Response(
        JSON.stringify({
          status: "healthy",
          port: PORT,
          voice_system: "Multi-provider TTS (Kokoro, ElevenLabs, macOS say)",
          activeProvider: config.provider,
          providers: providerStatus,
          fallbackOrder: config.fallbackOrder,
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

const config = getTTSConfig();
const providerStatus = await getProviderStatus();

console.log(`🚀 Voice Server running on port ${PORT}`);
console.log(`🎙️  Primary provider: ${config.provider}`);
console.log(`📋 Fallback order: ${config.fallbackOrder.join(' → ')}`);
console.log(`🔧 Provider status:`);
for (const [name, status] of Object.entries(providerStatus)) {
  const icon = status.healthy ? '✅' : (status.enabled ? '⚠️' : '⬚');
  console.log(`   ${icon} ${name}: ${status.enabled ? 'enabled' : 'disabled'}${status.healthy ? ', healthy' : ''}`);
}
console.log(`🍎 macOS fallback voice: ${getMacOSFallbackVoice()}`);
console.log(`⚡ Circuit breaker: ${CIRCUIT_BREAKER_THRESHOLD} failures → ${CIRCUIT_BREAKER_RESET_MS / 1000}s cooldown`);
console.log(`📡 Endpoints: POST /notify, POST /pai, GET /health`);
console.log(`🔒 Security: CORS restricted to localhost, rate limiting enabled`);
