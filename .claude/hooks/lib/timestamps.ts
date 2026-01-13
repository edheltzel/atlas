// Shared timestamp utilities for hooks

/**
 * Get a formatted local timestamp string.
 * Uses sv-SE locale which outputs ISO-like format: YYYY-MM-DD HH:MM:SS
 */
export function getLocalTimestamp(): string {
  const tz = process.env.TIME_ZONE || Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Date()
    .toLocaleString('sv-SE', { timeZone: tz })
    .replace('T', ' ');
}

/**
 * Get year-month string for directory organization (e.g., "2024-01")
 */
export function getYearMonth(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Generate a filename with timestamp and description.
 * @param type - Category label (e.g., "SESSION", "LEARNING", "AGENT-explorer")
 * @param description - Human-readable description to kebab-case
 * @param maxDescLength - Maximum length for description portion (default 60)
 */
export function generateFilename(
  type: string,
  description: string,
  maxDescLength: number = 60
): string {
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
  const kebab = description
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, maxDescLength);
  return `${timestamp}_${type}_${kebab}.md`;
}
