#!/usr/bin/env bun
/**
 * Claude Max Plan Usage Tracker
 * Counts prompts in the current 5-hour cycle
 *
 * Usage: bun run usage-tracker.ts [--json]
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

interface UsageStats {
  cyclePrompts: number;
  cycleLimit: number;
  cyclePercent: number;
  cycleResetMinutes: number;
  tier: string;
}

// Max plan limits (5-hour cycle)
const LIMITS: Record<string, number> = {
  'max_5x': 100,
  'max_20x': 400,
  'pro': 30,
  'free': 10,
};

const TIER = process.env.CLAUDE_TIER || 'max_5x';
const PROJECTS_DIR = join(homedir(), '.claude', 'projects');

function get5HourCycleStart(): Date {
  const now = new Date();
  // 5-hour cycles start at midnight UTC and repeat every 5 hours
  const hoursSinceMidnight = now.getUTCHours();
  const cycleHour = Math.floor(hoursSinceMidnight / 5) * 5;

  const cycleStart = new Date(now);
  cycleStart.setUTCHours(cycleHour, 0, 0, 0);

  return cycleStart;
}

function countPromptsInCycle(): number {
  const cycleStart = get5HourCycleStart();
  const cycleStartTime = cycleStart.getTime();
  let count = 0;

  if (!existsSync(PROJECTS_DIR)) {
    return 0;
  }

  const projects = readdirSync(PROJECTS_DIR);

  for (const project of projects) {
    const projectDir = join(PROJECTS_DIR, project);

    try {
      const stat = statSync(projectDir);
      if (!stat.isDirectory()) continue;

      // Skip if directory hasn't been modified in the cycle
      if (stat.mtimeMs < cycleStartTime) continue;

      const files = readdirSync(projectDir).filter(f => f.endsWith('.jsonl'));

      for (const file of files) {
        const filePath = join(projectDir, file);
        const fileStat = statSync(filePath);

        // Skip old files
        if (fileStat.mtimeMs < cycleStartTime) continue;

        try {
          const content = readFileSync(filePath, 'utf-8');
          const lines = content.split('\n').filter(Boolean);

          for (const line of lines) {
            try {
              const entry = JSON.parse(line);

              // Only count actual user prompts (not tool results or assistant messages)
              if (entry.type !== 'user') continue;
              if (!entry.timestamp) continue;

              // Skip tool results - they have tool_use_id in message.content
              const content = entry.message?.content;
              if (Array.isArray(content)) {
                const hasToolResult = content.some((c: any) => c.type === 'tool_result');
                if (hasToolResult) continue;
              }

              // Must have actual text content from user
              const hasUserText = Array.isArray(content)
                ? content.some((c: any) => c.type === 'text' && c.text?.trim())
                : typeof content === 'string' && content.trim();

              if (!hasUserText) continue;

              const timestamp = new Date(entry.timestamp).getTime();
              if (timestamp >= cycleStartTime) {
                count++;
              }
            } catch {
              // Skip malformed lines
            }
          }
        } catch {
          // Skip unreadable files
        }
      }
    } catch {
      // Skip inaccessible directories
    }
  }

  return count;
}

function getUsageStats(): UsageStats {
  const cycleStart = get5HourCycleStart();
  const now = new Date();
  const cycleEnd = new Date(cycleStart.getTime() + 5 * 60 * 60 * 1000);
  const resetMinutes = Math.ceil((cycleEnd.getTime() - now.getTime()) / 60000);

  const prompts = countPromptsInCycle();
  const limit = LIMITS[TIER] || LIMITS['max_5x'];

  return {
    cyclePrompts: prompts,
    cycleLimit: limit,
    cyclePercent: Math.round((prompts / limit) * 100),
    cycleResetMinutes: resetMinutes,
    tier: TIER,
  };
}

// Main
const stats = getUsageStats();

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(stats));
} else {
  const resetHours = Math.floor(stats.cycleResetMinutes / 60);
  const resetMins = stats.cycleResetMinutes % 60;
  console.log(`${stats.cyclePrompts}/${stats.cycleLimit}p (${stats.cyclePercent}%) | Reset: ${resetHours}h${resetMins}m`);
}
