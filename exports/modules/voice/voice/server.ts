#!/usr/bin/env bun
// $PAI_DIR/voice-server/server.ts
// Voice notification server with multi-provider TTS support
// Supports: Google Cloud TTS, ElevenLabs
// Platforms: macOS, Linux

import { serve } from "bun";
import { spawn } from "child_process";
import { homedir } from "os";
import { join } from "path";
import { existsSync, readFileSync } from "fs";
import {
  getCacheEntry,
  addToCache,
  getCacheStats,
  clearExpired,
  prewarmCache,
  generateCacheKey,
  CACHE_DIR,
} from "./lib/cache";
import {
  loadRuntimeConfig,
  loadVoicePersonalities,
  getPaiDir,
  getConfigPath,
  type AtlasRuntimeConfig,
} from "../lib/config-loader";

// =============================================================================
// Configuration Loading
// =============================================================================

// Load configuration from atlas.yaml and secrets from .env
let runtimeConfig: AtlasRuntimeConfig;
try {
  runtimeConfig = await loadRuntimeConfig();
  console.log(`✅ Config loaded from ${getConfigPath()}`);
} catch (error) {
  console.error('❌ Failed to load config, using defaults');
  runtimeConfig = {
    config: {
      identity: { name: 'Atlas', timezone: 'America/Los_Angeles' },
      voice: {
        provider: 'elevenlabs',
        default_personality: 'pai',
        port: 8888,
        default_volume: 0.8,
        voices: { default: 's3TPKV1kjDlVtZbl4Ksh' },
      },
      observability: { enabled: true, port: 3000 },
      features: { voice_enabled: true, observability_enabled: true },
    },
    secrets: {},
  };
}

const { config, secrets } = runtimeConfig;

// Extract configuration values
const PORT = config.voice.port;
const TTS_PROVIDER = config.voice.provider;
const DEFAULT_VOLUME = config.voice.default_volume;

// API Keys from secrets (.env)
const ELEVENLABS_API_KEY = secrets.ELEVENLABS_API_KEY;
const GOOGLE_API_KEY = secrets.GOOGLE_API_KEY;

// Voice IDs from config (atlas.yaml)
const DEFAULT_ELEVENLABS_VOICE = config.voice.voices.default || "s3TPKV1kjDlVtZbl4Ksh";
const GOOGLE_TTS_VOICE = config.voice.google?.voice || "en-US-Neural2-J";

// Validate provider configuration
const paiDir = getPaiDir();
if (TTS_PROVIDER === 'elevenlabs' && !ELEVENLABS_API_KEY) {
  console.error(`⚠️  ELEVENLABS_API_KEY not found in ${paiDir}/.env`);
  console.error('Add: ELEVENLABS_API_KEY=your_key_here to $PAI_DIR/.env');
  console.error('Or switch to Google TTS: voice.provider: google in atlas.yaml');
}

if (TTS_PROVIDER === 'google' && !GOOGLE_API_KEY) {
  console.error(`⚠️  GOOGLE_API_KEY not found in ${paiDir}/.env`);
  console.error('Add: GOOGLE_API_KEY=your_key_here to $PAI_DIR/.env');
  console.error('Note: Enable Cloud Text-to-Speech API in Google Cloud Console');
}

// Default voice based on provider
const DEFAULT_VOICE_ID = TTS_PROVIDER === 'google' ? GOOGLE_TTS_VOICE : DEFAULT_ELEVENLABS_VOICE;

// Voice configuration types
interface VoiceConfig {
  voice_id: string;
  voice_name: string;
  stability: number;
  similarity_boost: number;
  description: string;
}

interface VoicesConfig {
  default_volume?: number;
  voices: Record<string, VoiceConfig>;
}

// 13 Emotional Presets - Prosody System
const EMOTIONAL_PRESETS: Record<string, { stability: number; similarity_boost: number }> = {
  'excited': { stability: 0.7, similarity_boost: 0.9 },
  'celebration': { stability: 0.65, similarity_boost: 0.85 },
  'insight': { stability: 0.55, similarity_boost: 0.8 },
  'creative': { stability: 0.5, similarity_boost: 0.75 },
  'success': { stability: 0.6, similarity_boost: 0.8 },
  'progress': { stability: 0.55, similarity_boost: 0.75 },
  'investigating': { stability: 0.6, similarity_boost: 0.85 },
  'debugging': { stability: 0.55, similarity_boost: 0.8 },
  'learning': { stability: 0.5, similarity_boost: 0.75 },
  'pondering': { stability: 0.65, similarity_boost: 0.8 },
  'focused': { stability: 0.7, similarity_boost: 0.85 },
  'caution': { stability: 0.4, similarity_boost: 0.6 },
  'urgent': { stability: 0.3, similarity_boost: 0.9 },
};

// Load voice personalities (settings like stability, similarity_boost)
let voicesConfig: VoicesConfig | null = null;
try {
  const personalities = await loadVoicePersonalities();
  voicesConfig = {
    default_volume: personalities.default_volume,
    voices: Object.fromEntries(
      Object.entries(personalities.voices).map(([key, p]) => [
        key,
        {
          // Get voice_id from config.voice.voices, not from personalities file
          voice_id: config.voice.voices[key] || config.voice.voices.default || DEFAULT_VOICE_ID,
          voice_name: p.voice_name,
          stability: p.stability,
          similarity_boost: p.similarity_boost,
          description: p.description,
        },
      ])
    ),
  };
  console.log(`✅ Loaded ${Object.keys(voicesConfig.voices).length} voice personalities`);
} catch (error) {
  console.warn('⚠️  Failed to load voice personalities, using defaults');
}

// Extract emotional marker from message
function extractEmotionalMarker(message: string): { cleaned: string; emotion?: string } {
  const emojiToEmotion: Record<string, string> = {
    '💥': 'excited', '🎉': 'celebration', '💡': 'insight', '🎨': 'creative',
    '✨': 'success', '📈': 'progress', '🔍': 'investigating', '🐛': 'debugging',
    '📚': 'learning', '🤔': 'pondering', '🎯': 'focused', '⚠️': 'caution', '🚨': 'urgent'
  };

  const emotionMatch = message.match(/\[(💥|🎉|💡|🎨|✨|📈|🔍|🐛|📚|🤔|🎯|⚠️|🚨)\s+(\w+)\]/);
  if (emotionMatch) {
    const emoji = emotionMatch[1];
    const emotionName = emotionMatch[2].toLowerCase();
    if (emojiToEmotion[emoji] === emotionName) {
      return {
        cleaned: message.replace(emotionMatch[0], '').trim(),
        emotion: emotionName
      };
    }
  }
  return { cleaned: message };
}

// Get voice configuration by voice ID or agent name
function getVoiceConfig(identifier: string): VoiceConfig | null {
  if (!voicesConfig) return null;
  if (voicesConfig.voices[identifier]) return voicesConfig.voices[identifier];
  for (const config of Object.values(voicesConfig.voices)) {
    if (config.voice_id === identifier) return config;
  }
  return null;
}

// Sanitize input for TTS - allow natural speech, block dangerous characters
function sanitizeForSpeech(input: string): string {
  return input
    .replace(/<script/gi, '')
    .replace(/\.\.\//g, '')
    .replace(/[;&|><`$\\]/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .trim()
    .substring(0, 500);
}

// Validate input
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

// =============================================================================
// TTS Providers
// =============================================================================

// ElevenLabs TTS Generation (Streaming)
// Uses /stream endpoint for lower time-to-first-byte
async function generateSpeechElevenLabs(
  text: string,
  voiceId: string,
  voiceSettings?: { stability: number; similarity_boost: number }
): Promise<ArrayBuffer> {
  if (!ELEVENLABS_API_KEY) {
    throw new Error('ElevenLabs API key not configured');
  }

  // Use streaming endpoint with latency optimization and smaller format
  // mp3_22050_32 = 22.05kHz, 32kbps - good quality, faster transfer
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?optimize_streaming_latency=3&output_format=mp3_22050_32`;
  const settings = voiceSettings || { stability: 0.5, similarity_boost: 0.5 };

  const startTime = performance.now();

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': ELEVENLABS_API_KEY,
    },
    body: JSON.stringify({
      text: text,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: settings,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
  }

  const ttfb = performance.now() - startTime;
  console.log(`⚡ TTFB: ${ttfb.toFixed(0)}ms`);

  // Collect streaming response
  const chunks: Uint8Array[] = [];
  const reader = response.body?.getReader();

  if (!reader) {
    throw new Error('No response body');
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  // Combine chunks into single buffer
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const audioBuffer = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    audioBuffer.set(chunk, offset);
    offset += chunk.length;
  }

  const totalTime = performance.now() - startTime;
  console.log(`📦 Total: ${totalTime.toFixed(0)}ms (${(totalLength / 1024).toFixed(1)}KB)`);

  return audioBuffer.buffer;
}

// Google Cloud TTS Generation
// Free tier: 4M chars/month (Standard), 1M chars/month (WaveNet/Neural2)
async function generateSpeechGoogle(
  text: string,
  voice?: string
): Promise<ArrayBuffer> {
  if (!GOOGLE_API_KEY) {
    throw new Error('Google API key not configured. Add GOOGLE_API_KEY to your .env file.');
  }

  const voiceName = voice || GOOGLE_TTS_VOICE;
  // Extract language code from voice name (e.g., "en-US" from "en-US-Neural2-J")
  const languageCode = voiceName.split('-').slice(0, 2).join('-');

  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: { text },
      voice: {
        languageCode,
        name: voiceName,
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 1.0,
        pitch: 0,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google TTS API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  // Google returns base64-encoded audio in the 'audioContent' field
  if (!data.audioContent) {
    throw new Error('Google TTS: No audio content in response');
  }

  // Decode base64 to ArrayBuffer
  const binaryString = atob(data.audioContent);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Unified speech generation - routes to the configured provider
async function generateSpeech(
  text: string,
  voiceId: string,
  voiceSettings?: { stability: number; similarity_boost: number }
): Promise<ArrayBuffer> {
  if (TTS_PROVIDER === 'google') {
    return generateSpeechGoogle(text, voiceId);
  } else {
    return generateSpeechElevenLabs(text, voiceId, voiceSettings);
  }
}

// Get volume setting from config (defaults to 0.8 = 80%)
function getVolumeSetting(): number {
  // Use config.voice.default_volume (from atlas.yaml)
  return DEFAULT_VOLUME;
}

// =============================================================================
// Cross-Platform Audio Playback
// =============================================================================

// Generate unique temp file name to prevent collisions
function getTempFileName(): string {
  const uuid = crypto.randomUUID();
  return `/tmp/voice-${uuid}.mp3`;
}

// Play audio - supports macOS (afplay) and Linux (mpg123, mpv)
async function playAudio(audioBuffer: ArrayBuffer): Promise<void> {
  const tempFile = getTempFileName();
  const playbackStart = performance.now();
  await Bun.write(tempFile, audioBuffer);
  const volume = getVolumeSetting();

  return new Promise((resolve, reject) => {
    let player: string;
    let args: string[];

    if (process.platform === 'darwin') {
      // macOS: use afplay
      player = '/usr/bin/afplay';
      args = ['-v', volume.toString(), tempFile];
    } else {
      // Linux: try mpg123 first, then mpv
      if (existsSync('/usr/bin/mpg123')) {
        player = '/usr/bin/mpg123';
        args = ['-q', tempFile];
      } else if (existsSync('/usr/bin/mpv')) {
        player = '/usr/bin/mpv';
        args = ['--no-terminal', '--volume=' + (volume * 100), tempFile];
      } else if (existsSync('/snap/bin/mpv')) {
        player = '/snap/bin/mpv';
        args = ['--no-terminal', '--volume=' + (volume * 100), tempFile];
      } else {
        console.warn('⚠️  No audio player found. Install mpg123 or mpv for audio playback.');
        spawn('/bin/rm', [tempFile]);
        resolve();
        return;
      }
    }

    const proc = spawn(player, args);

    // Cleanup function using Bun's native unlink
    const cleanup = () => {
      try {
        Bun.file(tempFile).exists().then(exists => {
          if (exists) {
            require('fs').unlinkSync(tempFile);
          }
        });
      } catch {
        // Ignore cleanup errors
      }
    };

    proc.on('error', (error) => {
      console.error('Error playing audio:', error);
      cleanup();
      reject(error);
    });

    proc.on('exit', (code) => {
      const playbackTime = performance.now() - playbackStart;
      console.log(`🔊 Playback: ${playbackTime.toFixed(0)}ms`);
      cleanup();
      if (code === 0 || code === null) {
        resolve();
      } else {
        reject(new Error(`${player} exited with code ${code}`));
      }
    });
  });
}

// =============================================================================
// Cross-Platform Notifications
// =============================================================================

// Send notification with voice
async function sendNotification(
  title: string,
  message: string,
  voiceEnabled = true,
  voiceId: string | null = null
) {
  const titleValidation = validateInput(title);
  const messageValidation = validateInput(message);

  if (!titleValidation.valid) throw new Error(`Invalid title: ${titleValidation.error}`);
  if (!messageValidation.valid) throw new Error(`Invalid message: ${messageValidation.error}`);

  const safeTitle = titleValidation.sanitized!;
  let safeMessage = messageValidation.sanitized!;

  // Extract emotional marker if present
  const { cleaned, emotion } = extractEmotionalMarker(safeMessage);
  safeMessage = cleaned;

  // Generate and play voice
  const apiKeyConfigured = TTS_PROVIDER === 'google' ? GOOGLE_API_KEY : ELEVENLABS_API_KEY;
  if (voiceEnabled && apiKeyConfigured) {
    try {
      const voice = voiceId || DEFAULT_VOICE_ID;
      const voiceConfig = getVoiceConfig(voice);

      // Determine voice settings (priority: emotional > personality > defaults)
      let voiceSettings = { stability: 0.5, similarity_boost: 0.5 };

      if (emotion && EMOTIONAL_PRESETS[emotion]) {
        voiceSettings = EMOTIONAL_PRESETS[emotion];
        console.log(`🎭 Emotion: ${emotion}`);
      } else if (voiceConfig) {
        voiceSettings = {
          stability: voiceConfig.stability,
          similarity_boost: voiceConfig.similarity_boost
        };
        console.log(`👤 Personality: ${voiceConfig.description}`);
      }

      // Check cache first (Phase 4 optimization)
      const cacheStart = performance.now();
      const cacheResult = getCacheEntry(safeMessage, voice);

      if (cacheResult.hit && cacheResult.buffer) {
        const cacheTime = performance.now() - cacheStart;
        console.log(`⚡ Cache HIT: ${cacheTime.toFixed(0)}ms (${(cacheResult.buffer.byteLength / 1024).toFixed(1)}KB)`);
        await playAudio(cacheResult.buffer);
      } else {
        // Cache miss - generate speech
        console.log(`🎙️  Generating speech (voice: ${voice}, stability: ${voiceSettings.stability})`);

        const audioBuffer = await generateSpeech(safeMessage, voice, voiceSettings);

        // Add to cache for future use
        addToCache(safeMessage, voice, audioBuffer);
        console.log(`💾 Cached: ${generateCacheKey(safeMessage, voice).substring(0, 8)}...`);

        await playAudio(audioBuffer);
      }
    } catch (error) {
      console.error("Failed to generate/play speech:", error);
    }
  }

  // Display desktop notification (platform-aware)
  try {
    if (process.platform === 'linux') {
      // Linux: use notify-send
      spawn('/usr/bin/notify-send', [safeTitle, safeMessage]);
    } else if (process.platform === 'darwin') {
      // macOS: use osascript
      const escapedTitle = safeTitle.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      const escapedMessage = safeMessage.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      const script = `display notification "${escapedMessage}" with title "${escapedTitle}" sound name ""`;
      spawn('/usr/bin/osascript', ['-e', script]);
    }
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

  if (record.count >= RATE_LIMIT) return false;
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
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 }
      );
    }

    // Main notification endpoint
    if (url.pathname === "/notify" && req.method === "POST") {
      try {
        const data = await req.json();
        const title = data.title || "PAI Notification";
        const message = data.message || "Task completed, Ed";
        const voiceEnabled = data.voice_enabled !== false;
        // Resolve voice: direct voice_id > voice_name > personality lookup > null
        let voiceId = data.voice_id || data.voice_name || null;

        // If personality is provided, look up the voice_id from config
        if (!voiceId && data.personality) {
          const personality = data.personality.toLowerCase();
          voiceId = config.voice.voices[personality] || null;
          if (voiceId) {
            console.log(`🎭 Resolved personality "${personality}" → ${voiceId}`);
          } else {
            console.warn(`⚠️  Unknown personality "${personality}", using default`);
          }
        }

        if (voiceId && typeof voiceId !== 'string') {
          throw new Error('Invalid voice_id');
        }

        console.log(`📨 Notification: "${title}" - "${message.substring(0, 50)}..."`);

        await sendNotification(title, message, voiceEnabled, voiceId);

        return new Response(
          JSON.stringify({ status: "success", message: "Notification sent" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      } catch (error: any) {
        console.error("Notification error:", error);
        return new Response(
          JSON.stringify({ status: "error", message: error.message || "Internal server error" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: error.message?.includes('Invalid') ? 400 : 500 }
        );
      }
    }

    // Health check endpoint
    if (url.pathname === "/health") {
      const providerInfo = TTS_PROVIDER === 'google'
        ? { name: 'Google Cloud TTS', configured: !!GOOGLE_API_KEY, voice: GOOGLE_TTS_VOICE }
        : { name: 'ElevenLabs', configured: !!ELEVENLABS_API_KEY, voice: DEFAULT_ELEVENLABS_VOICE };

      const cacheStats = getCacheStats();

      return new Response(
        JSON.stringify({
          status: "healthy",
          port: PORT,
          platform: process.platform,
          config_source: getConfigPath(),
          tts_provider: providerInfo.name,
          default_voice: providerInfo.voice,
          default_volume: DEFAULT_VOLUME,
          api_key_configured: providerInfo.configured,
          providers: {
            active: TTS_PROVIDER,
            google: { configured: !!GOOGLE_API_KEY, voice: GOOGLE_TTS_VOICE },
            elevenlabs: { configured: !!ELEVENLABS_API_KEY, voice: DEFAULT_ELEVENLABS_VOICE }
          },
          voices_configured: Object.keys(config.voice.voices).length,
          cache: {
            entries: cacheStats.entryCount,
            size_mb: cacheStats.totalSizeMB,
            max_size_mb: cacheStats.maxSizeMB,
            hit_rate: (cacheStats.hitRate * 100).toFixed(1) + '%',
            directory: CACHE_DIR,
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    return new Response("PAI Voice Server - POST to /notify", {
      headers: corsHeaders,
      status: 200
    });
  },
});

// Connection warmup - pre-establish connection to reduce first-request latency
async function warmupConnection(): Promise<void> {
  if (TTS_PROVIDER === 'elevenlabs' && ELEVENLABS_API_KEY) {
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        method: 'GET',
        headers: { 'xi-api-key': ELEVENLABS_API_KEY },
      });
      if (response.ok) {
        console.log('🔥 ElevenLabs connection warmed up');
      }
    } catch (error) {
      console.warn('⚠️  Connection warmup failed (will retry on first request)');
    }
  } else if (TTS_PROVIDER === 'google' && GOOGLE_API_KEY) {
    try {
      // Simple request to warm up Google TTS connection
      const response = await fetch(`https://texttospeech.googleapis.com/v1/voices?key=${GOOGLE_API_KEY}`);
      if (response.ok) {
        console.log('🔥 Google TTS connection warmed up');
      }
    } catch (error) {
      console.warn('⚠️  Connection warmup failed (will retry on first request)');
    }
  }
}

// Startup logs
console.log(`🚀 Voice Server running on port ${PORT}`);
console.log(`🖥️  Platform: ${process.platform}`);
console.log(`📁 Config: ${getConfigPath()}`);
console.log(`🎙️  TTS Provider: ${TTS_PROVIDER === 'google' ? 'Google Cloud TTS' : 'ElevenLabs'}`);
console.log(`🗣️  Default voice: ${DEFAULT_VOICE_ID}`);
console.log(`🔊 Volume: ${(DEFAULT_VOLUME * 100).toFixed(0)}%`);
console.log(`📡 POST to http://localhost:${PORT}/notify`);
console.log(`🔒 Security: CORS restricted to localhost, rate limiting enabled`);
if (TTS_PROVIDER === 'google') {
  console.log(`🔑 Google API Key: ${GOOGLE_API_KEY ? '✅ Configured' : '❌ Missing (add to .env)'}`);
  console.log(`💰 Free tier: 4M chars/month (Standard), 1M chars/month (Neural2)`);
} else {
  console.log(`🔑 ElevenLabs API Key: ${ELEVENLABS_API_KEY ? '✅ Configured' : '❌ Missing (add to .env)'}`);
  console.log(`⚡ Latency optimization: optimize_streaming_latency=3 enabled`);
}
console.log(`💡 Config: voice.provider in atlas.yaml | Secrets: .env`);

// Cache maintenance on startup
const cacheStats = getCacheStats();
console.log(`💾 Cache: ${cacheStats.entryCount} entries (${cacheStats.totalSizeMB}MB) in ${CACHE_DIR}`);
const expiredCleared = clearExpired();
if (expiredCleared > 0) {
  console.log(`🧹 Cleared ${expiredCleared} expired cache entries`);
}

// Warm up connection on startup (non-blocking)
warmupConnection();
