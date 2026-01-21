/**
 * Atlas Configuration Types and Schema
 *
 * Defines the structure for atlas.yaml configuration file.
 * Uses Zod for runtime validation with helpful error messages.
 */

import { z } from 'zod';

// =============================================================================
// Zod Schemas
// =============================================================================

export const IdentitySchema = z.object({
  name: z.string().default('Atlas'),
  timezone: z.string().default('America/Los_Angeles'),
});

export const GoogleTTSSchema = z.object({
  voice: z.string().default('en-US-Neural2-J'),
  speaking_rate: z.number().min(0.25).max(4.0).default(1.0),
  pitch: z.number().min(-20).max(20).default(0),
});

export const VoiceSchema = z.object({
  provider: z.enum(['elevenlabs', 'google']).default('elevenlabs'),
  default_personality: z.string().default('default'),
  port: z.number().int().min(1).max(65535).default(8888),
  default_volume: z.number().min(0).max(1).default(0.8),
  voices: z.record(z.string(), z.string()).default({}),
  google: GoogleTTSSchema.optional(),
});

export const ObservabilitySchema = z.object({
  enabled: z.boolean().default(true),
  port: z.number().int().min(1).max(65535).default(3000),
});

export const FeaturesSchema = z.object({
  voice_enabled: z.boolean().default(true),
  observability_enabled: z.boolean().default(true),
});

export const AtlasConfigSchema = z.object({
  identity: IdentitySchema.default({}),
  voice: VoiceSchema.default({}),
  observability: ObservabilitySchema.default({}),
  features: FeaturesSchema.default({}),
});

// =============================================================================
// TypeScript Types (inferred from Zod schemas)
// =============================================================================

export type Identity = z.infer<typeof IdentitySchema>;
export type GoogleTTS = z.infer<typeof GoogleTTSSchema>;
export type VoiceConfig = z.infer<typeof VoiceSchema>;
export type ObservabilityConfig = z.infer<typeof ObservabilitySchema>;
export type FeaturesConfig = z.infer<typeof FeaturesSchema>;
export type AtlasConfig = z.infer<typeof AtlasConfigSchema>;

// =============================================================================
// Secrets Schema (for .env validation)
// =============================================================================

export const SecretsSchema = z.object({
  ELEVENLABS_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
});

export type AtlasSecrets = z.infer<typeof SecretsSchema>;

// =============================================================================
// Combined Runtime Config
// =============================================================================

export interface AtlasRuntimeConfig {
  config: AtlasConfig;
  secrets: AtlasSecrets;
}

// =============================================================================
// Voice Personality Settings (from voice-personalities.json)
// These define prosody settings (stability, similarity_boost) per personality.
// Voice IDs are configured separately in atlas.yaml.
// =============================================================================

export const VoicePersonalitySchema = z.object({
  voice_name: z.string(),
  stability: z.number().min(0).max(1),
  similarity_boost: z.number().min(0).max(1),
  description: z.string(),
});

export const VoicePersonalitiesSchema = z.object({
  default_volume: z.number().min(0).max(1).default(0.8),
  voices: z.record(z.string(), VoicePersonalitySchema),
  _instructions: z.any().optional(), // Allow metadata field
});

export type VoicePersonality = z.infer<typeof VoicePersonalitySchema>;
export type VoicePersonalities = z.infer<typeof VoicePersonalitiesSchema>;
