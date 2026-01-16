/**
 * Central Identity Loader
 * Single source of truth for DA (Digital Assistant) and Principal identity
 *
 * Reads from settings.json - supports both:
 * - PAI standard: daidentity/principal sections
 * - Atlas compat: env.DA/env.TIME_ZONE/env.PRINCIPAL
 *
 * All hooks and tools should import from here.
 *
 * Adapted from PAI v2.3.0 for Atlas compatibility
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const HOME = process.env.HOME!;
const SETTINGS_PATH = join(HOME, '.claude/settings.json');

// Default identity (fallback if settings.json doesn't have identity section)
const DEFAULT_IDENTITY = {
  name: 'Atlas',
  fullName: 'Atlas AI',
  displayName: 'Atlas',
  voiceId: '',
  color: '#3B82F6',
};

const DEFAULT_PRINCIPAL = {
  name: 'Ed',
  pronunciation: '',
  timezone: 'America/New_York',
};

export interface VoiceProsody {
  stability: number;
  similarity_boost: number;
  style: number;
  speed: number;
  use_speaker_boost: boolean;
}

export interface Identity {
  name: string;
  fullName: string;
  displayName: string;
  voiceId: string;
  color: string;
  voice?: VoiceProsody;
}

export interface Principal {
  name: string;
  pronunciation: string;
  timezone: string;
}

export interface Settings {
  daidentity?: Partial<Identity>;
  principal?: Partial<Principal>;
  env?: Record<string, string>;
  [key: string]: unknown;
}

let cachedSettings: Settings | null = null;

/**
 * Load settings.json (cached)
 */
function loadSettings(): Settings {
  if (cachedSettings) return cachedSettings;

  try {
    if (!existsSync(SETTINGS_PATH)) {
      cachedSettings = {};
      return cachedSettings;
    }

    const content = readFileSync(SETTINGS_PATH, 'utf-8');
    cachedSettings = JSON.parse(content);
    return cachedSettings!;
  } catch {
    cachedSettings = {};
    return cachedSettings;
  }
}

/**
 * Get DA (Digital Assistant) identity from settings.json
 * Supports both PAI standard (daidentity) and Atlas compat (env.DA)
 */
export function getIdentity(): Identity {
  const settings = loadSettings();

  // Prefer settings.daidentity, fall back to env.DA for Atlas compat
  const daidentity = settings.daidentity || {};
  const envDA = settings.env?.DA;

  return {
    name: daidentity.name || envDA || DEFAULT_IDENTITY.name,
    fullName: daidentity.fullName || daidentity.name || envDA || DEFAULT_IDENTITY.fullName,
    displayName: daidentity.displayName || daidentity.name || envDA || DEFAULT_IDENTITY.displayName,
    voiceId: daidentity.voiceId || DEFAULT_IDENTITY.voiceId,
    color: daidentity.color || DEFAULT_IDENTITY.color,
    voice: (daidentity as any).voice as VoiceProsody | undefined,
  };
}

/**
 * Get Principal (human owner) identity from settings.json
 * Supports both PAI standard (principal) and Atlas compat (env.PRINCIPAL, env.TIME_ZONE)
 */
export function getPrincipal(): Principal {
  const settings = loadSettings();

  // Prefer settings.principal, fall back to env for Atlas compat
  const principal = settings.principal || {};
  const envPrincipal = settings.env?.PRINCIPAL;
  const envTimezone = settings.env?.TIME_ZONE;

  return {
    name: principal.name || envPrincipal || DEFAULT_PRINCIPAL.name,
    pronunciation: principal.pronunciation || DEFAULT_PRINCIPAL.pronunciation,
    timezone: principal.timezone || envTimezone || DEFAULT_PRINCIPAL.timezone,
  };
}

/**
 * Clear cache (useful for testing or when settings.json changes)
 */
export function clearCache(): void {
  cachedSettings = null;
}

/**
 * Get just the DA name (convenience function)
 */
export function getDAName(): string {
  return getIdentity().name;
}

/**
 * Get just the Principal name (convenience function)
 */
export function getPrincipalName(): string {
  return getPrincipal().name;
}

/**
 * Get just the voice ID (convenience function)
 */
export function getVoiceId(): string {
  return getIdentity().voiceId;
}

/**
 * Get the full settings object (for advanced use)
 */
export function getSettings(): Settings {
  return loadSettings();
}

/**
 * Get the default identity (for documentation/testing)
 */
export function getDefaultIdentity(): Identity {
  return { ...DEFAULT_IDENTITY };
}

/**
 * Get the default principal (for documentation/testing)
 */
export function getDefaultPrincipal(): Principal {
  return { ...DEFAULT_PRINCIPAL };
}

/**
 * Get voice prosody settings (convenience function)
 */
export function getVoiceProsody(): VoiceProsody | undefined {
  return getIdentity().voice;
}
