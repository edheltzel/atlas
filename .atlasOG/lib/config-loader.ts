/**
 * Atlas Configuration Loader
 *
 * Loads configuration from atlas.yaml and secrets from .env
 * Provides a unified interface for accessing Atlas configuration.
 */

import { parse as parseYaml } from 'yaml';
import { join } from 'path';
import { homedir } from 'os';
import { existsSync } from 'fs';
import {
  AtlasConfigSchema,
  SecretsSchema,
  VoicePersonalitiesSchema,
  type AtlasConfig,
  type AtlasSecrets,
  type AtlasRuntimeConfig,
  type VoicePersonalities,
} from './config';

// =============================================================================
// Configuration Paths
// =============================================================================

function getPaiDir(): string {
  return process.env.PAI_DIR || join(homedir(), '.claude');
}

function getConfigPath(): string {
  return join(getPaiDir(), 'atlas.yaml');
}

function getEnvPath(): string {
  return join(getPaiDir(), '.env');
}

function getVoicePersonalitiesPath(): string {
  return join(getPaiDir(), 'voice-personalities.json');
}

// =============================================================================
// Environment Parsing
// =============================================================================

function parseEnvFile(content: string): Record<string, string> {
  const env: Record<string, string> = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

// =============================================================================
// Legacy .env Voice ID Detection
// =============================================================================

const LEGACY_VOICE_ENV_KEYS = [
  'ELEVENLABS_VOICE_DEFAULT',
  'ELEVENLABS_VOICE_PAI',
  'ELEVENLABS_VOICE_ENGINEER',
  'ELEVENLABS_VOICE_ARCHITECT',
  'ELEVENLABS_VOICE_RESEARCHER',
  'ELEVENLABS_VOICE_DESIGNER',
  'ELEVENLABS_VOICE_ARTIST',
  'ELEVENLABS_VOICE_PENTESTER',
  'ELEVENLABS_VOICE_WRITER',
  'ELEVENLABS_VOICE_INTERN',
];

function detectLegacyVoiceIds(env: Record<string, string>): Record<string, string> {
  const voices: Record<string, string> = {};

  for (const key of LEGACY_VOICE_ENV_KEYS) {
    if (env[key]) {
      // Convert ELEVENLABS_VOICE_PAI -> pai
      const personality = key.replace('ELEVENLABS_VOICE_', '').toLowerCase();
      voices[personality] = env[key];
    }
  }

  return voices;
}

// =============================================================================
// Config Loading
// =============================================================================

let cachedConfig: AtlasRuntimeConfig | null = null;
let configMtime: number = 0;

/**
 * Load Atlas configuration from atlas.yaml
 * Falls back to defaults if file doesn't exist
 */
export async function loadConfig(): Promise<AtlasConfig> {
  const configPath = getConfigPath();

  if (!existsSync(configPath)) {
    console.warn(`⚠️  Config file not found: ${configPath}`);
    console.warn('   Using defaults. Run /atlas:migrate-config to create config file.');
    return AtlasConfigSchema.parse({});
  }

  try {
    const content = await Bun.file(configPath).text();
    const parsed = parseYaml(content);
    return AtlasConfigSchema.parse(parsed);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Config error in ${configPath}:`);
      console.error(`   ${error.message}`);
    }
    throw error;
  }
}

/**
 * Load secrets from .env file
 * Only loads API keys, not voice IDs
 */
export async function loadSecrets(): Promise<AtlasSecrets> {
  const envPath = getEnvPath();

  if (!existsSync(envPath)) {
    console.warn(`⚠️  Secrets file not found: ${envPath}`);
    return SecretsSchema.parse({});
  }

  try {
    const content = await Bun.file(envPath).text();
    const env = parseEnvFile(content);

    // Check for legacy voice IDs and warn
    const legacyVoices = detectLegacyVoiceIds(env);
    if (Object.keys(legacyVoices).length > 0) {
      console.warn('⚠️  DEPRECATION: Voice IDs found in .env file');
      console.warn('   Voice IDs should be in atlas.yaml, not .env');
      console.warn('   Run /atlas:migrate-config to migrate your config');
      console.warn(`   Found: ${Object.keys(legacyVoices).join(', ')}`);
    }

    return SecretsSchema.parse({
      ELEVENLABS_API_KEY: env.ELEVENLABS_API_KEY,
      GOOGLE_API_KEY: env.GOOGLE_API_KEY,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Secrets error in ${envPath}:`);
      console.error(`   ${error.message}`);
    }
    throw error;
  }
}

/**
 * Load voice personalities from voice-personalities.json
 */
export async function loadVoicePersonalities(): Promise<VoicePersonalities> {
  const path = getVoicePersonalitiesPath();

  if (!existsSync(path)) {
    return VoicePersonalitiesSchema.parse({ voices: {} });
  }

  try {
    const content = await Bun.file(path).text();
    const parsed = JSON.parse(content);
    return VoicePersonalitiesSchema.parse(parsed);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Voice personalities error in ${path}:`);
      console.error(`   ${error.message}`);
    }
    throw error;
  }
}

/**
 * Load complete runtime configuration (config + secrets)
 * With caching for performance
 */
export async function loadRuntimeConfig(forceReload = false): Promise<AtlasRuntimeConfig> {
  const configPath = getConfigPath();

  // Check if config file has been modified
  if (!forceReload && cachedConfig) {
    try {
      const stat = await Bun.file(configPath).stat();
      if (stat && stat.mtime.getTime() === configMtime) {
        return cachedConfig;
      }
    } catch {
      // File doesn't exist or can't be read, reload
    }
  }

  const [config, secrets] = await Promise.all([
    loadConfig(),
    loadSecrets(),
  ]);

  // Merge legacy voice IDs from .env if not in config
  const envPath = getEnvPath();
  if (existsSync(envPath)) {
    const envContent = await Bun.file(envPath).text();
    const env = parseEnvFile(envContent);
    const legacyVoices = detectLegacyVoiceIds(env);

    // Only use legacy voices if not defined in config
    for (const [personality, voiceId] of Object.entries(legacyVoices)) {
      if (!config.voice.voices[personality]) {
        config.voice.voices[personality] = voiceId;
      }
    }
  }

  cachedConfig = { config, secrets };

  try {
    const stat = await Bun.file(configPath).stat();
    if (stat) {
      configMtime = stat.mtime.getTime();
    }
  } catch {
    // Ignore stat errors
  }

  return cachedConfig;
}

/**
 * Get a specific voice ID by personality name
 * Checks config first, then falls back to legacy .env
 */
export async function getVoiceId(personality: string): Promise<string | undefined> {
  const { config } = await loadRuntimeConfig();
  return config.voice.voices[personality.toLowerCase()];
}

/**
 * Invalidate config cache (for hot reload)
 */
export function invalidateConfigCache(): void {
  cachedConfig = null;
  configMtime = 0;
}

// =============================================================================
// Exports
// =============================================================================

export {
  getPaiDir,
  getConfigPath,
  getEnvPath,
  getVoicePersonalitiesPath,
  parseEnvFile,
  detectLegacyVoiceIds,
};
