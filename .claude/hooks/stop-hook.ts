#!/usr/bin/env bun
// $PAI_DIR/hooks/stop-hook.ts
// Captures main agent work summaries and learnings

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { getLocalTimestamp, getYearMonth, generateFilename } from './lib/timestamps';

// Constants
const MIN_RESPONSE_LENGTH = 50;
const MAX_SUMMARY_LENGTH = 100;
const MAX_RESPONSE_SIZE = 5000;
const MAX_FILENAME_DESC_LENGTH = 60;
const MIN_LEARNING_INDICATORS = 2;

// Types
interface ContentBlock {
  type?: string;
  text?: string;
  content?: string;
}

interface StopPayload {
  stop_hook_active: boolean;
  transcript_path?: string;
  response?: string;
  session_id?: string;
}

function hasLearningIndicators(text: string): boolean {
  const indicators = [
    'problem', 'solved', 'discovered', 'fixed', 'learned', 'realized',
    'figured out', 'root cause', 'debugging', 'issue was', 'turned out',
    'mistake', 'error', 'bug', 'solution'
  ];
  const lowerText = text.toLowerCase();
  let count = 0;
  for (const indicator of indicators) {
    if (lowerText.includes(indicator) && ++count >= MIN_LEARNING_INDICATORS) {
      return true;
    }
  }
  return false;
}

function extractSummary(response: string): string {
  // Look for COMPLETED section
  const completedMatch = response.match(/🎯\s*COMPLETED[:\s]*(.+?)(?:\n|$)/i);
  if (completedMatch) {
    return completedMatch[1].trim().slice(0, MAX_SUMMARY_LENGTH);
  }

  // Look for SUMMARY section
  const summaryMatch = response.match(/📋\s*SUMMARY[:\s]*(.+?)(?:\n|$)/i);
  if (summaryMatch) {
    return summaryMatch[1].trim().slice(0, MAX_SUMMARY_LENGTH);
  }

  // Fallback: first meaningful line
  const lines = response.split('\n').filter(l => l.trim().length > 10);
  if (lines.length > 0) {
    return lines[0].trim().slice(0, MAX_SUMMARY_LENGTH);
  }

  return 'work-session';
}


/**
 * Extract the last assistant response from a transcript file.
 * Claude Code sends transcript_path but not response in Stop events.
 */
function extractResponseFromTranscript(transcriptPath: string): string | null {
  try {
    if (!existsSync(transcriptPath)) {
      return null;
    }

    const content = readFileSync(transcriptPath, 'utf-8');
    const lines = content.trim().split('\n').filter(l => l.trim());

    if (lines.length === 0) {
      return null;
    }

    // Find the last assistant message by iterating backwards
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const entry = JSON.parse(lines[i]);
        if (entry.type === 'assistant' && entry.message?.content) {
          // Extract text from content array
          const contentArray = Array.isArray(entry.message.content)
            ? entry.message.content
            : [entry.message.content];

          const response = contentArray
            .map((c: string | ContentBlock) => {
              if (typeof c === 'string') return c;
              if (c?.text) return c.text;
              if (c?.content) return String(c.content);
              return '';
            })
            .join('\n')
            .trim();

          if (response && response.length > MIN_RESPONSE_LENGTH) {
            return response;
          }
        }
      } catch {
        continue; // Skip malformed lines
      }
    }

    return null;
  } catch {
    return null;
  }
}

async function main() {
  try {
    const stdinData = await Bun.stdin.text();
    if (!stdinData.trim()) {
      process.exit(0);
    }

    const parsed = JSON.parse(stdinData);

    // Validate payload structure
    if (typeof parsed !== 'object' || parsed === null) {
      process.exit(0);
    }
    const payload = parsed as StopPayload;

    // Try to get response from payload first, then from transcript
    let response = payload.response;
    if (!response && payload.transcript_path) {
      response = extractResponseFromTranscript(payload.transcript_path) || undefined;
    }

    if (!response) {
      process.exit(0);
    }

    const paiDir = process.env.PAI_DIR || join(homedir(), '.config', 'pai');
    const historyDir = join(paiDir, 'history');

    const isLearning = hasLearningIndicators(response);
    const type = isLearning ? 'LEARNING' : 'SESSION';
    const subdir = isLearning ? 'learnings' : 'sessions';

    const yearMonth = getYearMonth();
    const outputDir = join(historyDir, subdir, yearMonth);

    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const summary = extractSummary(response);
    const filename = generateFilename(type, summary, MAX_FILENAME_DESC_LENGTH);
    const filepath = join(outputDir, filename);

    // Limit response size to prevent huge files
    const truncatedResponse = response.slice(0, MAX_RESPONSE_SIZE);

    const content = `---
capture_type: ${type}
timestamp: ${getLocalTimestamp()}
session_id: ${payload.session_id || 'unknown'}
executor: main
---

# ${type}: ${summary}

${truncatedResponse}

---

*Captured by PAI History System stop-hook*
`;

    writeFileSync(filepath, content);
    console.log(`📝 Captured ${type} to ${subdir}/${yearMonth}/${filename}`);

  } catch (error) {
    console.error('Stop hook error:', error);
  }

  process.exit(0);
}

main();
