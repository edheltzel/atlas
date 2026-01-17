#!/usr/bin/env bun
/**
 * WorkCompletionLearning.hook.ts - Extract Learnings at Session End
 *
 * PURPOSE:
 * When a session ends with significant work completed, captures work metadata
 * and creates a learning file for future reference and improvement analysis.
 *
 * TRIGGER: SessionEnd
 *
 * INPUT:
 * - session_id: Current session identifier
 * - transcript_path: Path to conversation transcript
 *
 * OUTPUT:
 * - stdout: None (no context injection)
 * - exit(0): Normal completion
 *
 * SIDE EFFECTS:
 * - Writes to: MEMORY/Learning/<category>/<YYYY-MM>/*.md
 *
 * INTER-HOOK RELATIONSHIPS:
 * - DEPENDS ON: None (works without current-work.json)
 * - COORDINATES WITH: capture-session-summary.ts
 * - MUST RUN BEFORE: Session cleanup hooks
 * - MUST RUN AFTER: Sentiment capture hooks
 *
 * SIGNIFICANT WORK CRITERIA:
 * - Transcript has multiple turns (> 3 user messages)
 * - OR current-work.json exists with files_changed
 * - OR session duration > 5 minutes
 *
 * Adapted from PAI v2.3.0 for Atlas compatibility
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { getISOTimestamp, getPSTDate } from './lib/time';
import { getLearningCategory } from './lib/learning-utils';

const baseDir = process.env.PAI_DIR || join(process.env.HOME!, '.claude');
const MEMORY_DIR = join(baseDir, 'MEMORY');
const STATE_DIR = join(MEMORY_DIR, 'State');
const CURRENT_WORK_FILE = join(STATE_DIR, 'current-work.json');

interface HookInput {
  session_id: string;
  transcript_path?: string;
  hook_event_name: string;
}

interface CurrentWork {
  session_id?: string;
  work_dir?: string;
  title?: string;
  created_at?: string;
  item_count?: number;
  source?: string;
  files_changed?: string[];
  tools_used?: string[];
}

interface WorkMeta {
  id: string;
  title: string;
  created_at: string;
  completed_at?: string;
  source: string;
  status: string;
  session_id: string;
  lineage?: {
    tools_used: string[];
    files_changed: string[];
    agents_spawned: string[];
  };
}

interface SessionSummary {
  userMessageCount: number;
  assistantMessageCount: number;
  toolsUsed: Set<string>;
  lastSummary: string;
  firstUserMessage: string;
}

/**
 * Read stdin with timeout
 */
async function readStdinWithTimeout(timeout: number = 5000): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    const timer = setTimeout(() => reject(new Error('Timeout')), timeout);
    process.stdin.on('data', (chunk) => { data += chunk.toString(); });
    process.stdin.on('end', () => { clearTimeout(timer); resolve(data); });
    process.stdin.on('error', (err) => { clearTimeout(timer); reject(err); });
  });
}

/**
 * Extract session summary from transcript
 */
function extractSessionSummary(transcriptPath: string): SessionSummary | null {
  try {
    if (!transcriptPath || !existsSync(transcriptPath)) return null;

    const content = readFileSync(transcriptPath, 'utf-8');
    const lines = content.trim().split('\n');

    const summary: SessionSummary = {
      userMessageCount: 0,
      assistantMessageCount: 0,
      toolsUsed: new Set(),
      lastSummary: '',
      firstUserMessage: '',
    };

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const entry = JSON.parse(line);

        if (entry.type === 'user' && entry.message?.content) {
          summary.userMessageCount++;
          if (!summary.firstUserMessage) {
            const text = typeof entry.message.content === 'string'
              ? entry.message.content
              : Array.isArray(entry.message.content)
                ? entry.message.content.filter((c: any) => c.type === 'text').map((c: any) => c.text).join(' ')
                : '';
            summary.firstUserMessage = text.slice(0, 200);
          }
        }

        if (entry.type === 'assistant' && entry.message?.content) {
          summary.assistantMessageCount++;
          const text = typeof entry.message.content === 'string'
            ? entry.message.content
            : Array.isArray(entry.message.content)
              ? entry.message.content.filter((c: any) => c.type === 'text').map((c: any) => c.text).join(' ')
              : '';

          // Extract SUMMARY line if present
          const summaryMatch = text.match(/SUMMARY:\s*([^\n]+)/i);
          if (summaryMatch) {
            summary.lastSummary = summaryMatch[1].trim();
          }

          // Extract tool uses from content
          if (Array.isArray(entry.message.content)) {
            for (const block of entry.message.content) {
              if (block.type === 'tool_use') {
                summary.toolsUsed.add(block.name);
              }
            }
          }
        }

        // Track tool results
        if (entry.type === 'tool_result' && entry.tool_use_id) {
          // Tool was used
        }
      } catch { /* skip invalid lines */ }
    }

    return summary;
  } catch {
    return null;
  }
}

/**
 * Read current work state (optional - may not exist)
 */
function readCurrentWork(): CurrentWork | null {
  try {
    if (!existsSync(CURRENT_WORK_FILE)) return null;
    return JSON.parse(readFileSync(CURRENT_WORK_FILE, 'utf-8'));
  } catch {
    return null;
  }
}

/**
 * Read work META.yaml if exists
 */
function readWorkMeta(workDir: string): WorkMeta | null {
  try {
    const workPath = join(MEMORY_DIR, 'Work', workDir);
    const metaPath = join(workPath, 'META.yaml');

    if (!existsSync(metaPath)) return null;

    // Simple YAML parse (just key: value pairs)
    const content = readFileSync(metaPath, 'utf-8');
    const meta: any = {};

    for (const line of content.split('\n')) {
      const match = line.match(/^(\w+):\s*(.*)$/);
      if (match) {
        let value: any = match[2].trim();
        // Handle quoted strings
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        meta[match[1]] = value;
      }
    }

    return meta as WorkMeta;
  } catch {
    return null;
  }
}

/**
 * Determine if work was significant enough to capture
 */
function isSignificantWork(
  currentWork: CurrentWork | null,
  sessionSummary: SessionSummary | null,
  workMeta: WorkMeta | null
): boolean {
  // Check current work state
  if (currentWork) {
    if (currentWork.files_changed && currentWork.files_changed.length > 0) return true;
    if (currentWork.item_count && currentWork.item_count > 1) return true;
    if (currentWork.source === 'MANUAL') return true;
  }

  // Check work META
  if (workMeta?.lineage) {
    if (workMeta.lineage.files_changed?.length > 0) return true;
  }

  // Check session summary
  if (sessionSummary) {
    // Multiple user turns indicates meaningful conversation
    if (sessionSummary.userMessageCount >= 3) return true;
    // Multiple tool uses indicates work was done
    if (sessionSummary.toolsUsed.size >= 3) return true;
  }

  return false;
}

/**
 * Create learning file
 */
function writeLearning(
  title: string,
  context: string,
  toolsUsed: string[],
  filesChanged: string[],
  sessionId: string
): void {
  const date = getPSTDate();
  const [year, month] = date.split('-');
  const yearMonth = `${year}-${month}`;

  const category = getLearningCategory(context, title);
  const learningsDir = join(MEMORY_DIR, 'Learning', category, yearMonth);

  if (!existsSync(learningsDir)) {
    mkdirSync(learningsDir, { recursive: true });
  }

  const timestamp = getISOTimestamp();
  const timeSlug = timestamp.replace(/[:.]/g, '').slice(0, 15);
  const titleSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30);
  const filename = `${date}_${timeSlug}_work_${titleSlug}.md`;
  const filepath = join(learningsDir, filename);

  // Don't overwrite existing
  if (existsSync(filepath)) {
    console.error(`[WorkCompletionLearning] Learning already exists: ${filename}`);
    return;
  }

  const content = `---
capture_type: LEARNING
timestamp: ${timestamp}
source: work-completion
category: ${category}
session_id: ${sessionId}
auto_captured: true
tags: [work-completion, ${category.toLowerCase()}]
---

# ${title}

**Date:** ${date}
**Category:** ${category}
**Session:** ${sessionId}

---

## Context

${context}

---

## What Was Done

${filesChanged.length > 0 ? `- **Files Changed:** ${filesChanged.length}\n  - ${filesChanged.slice(0, 10).join('\n  - ')}${filesChanged.length > 10 ? `\n  - ... and ${filesChanged.length - 10} more` : ''}` : '- No file changes tracked'}

${toolsUsed.length > 0 ? `- **Tools Used:** ${toolsUsed.join(', ')}` : '- No tools tracked'}

---

## Insights

*This work session completed. Review for patterns and improvements.*

**What worked well:**
- [To be analyzed]

**What could be improved:**
- [To be analyzed]

---

*Auto-captured by WorkCompletionLearning hook at session end*
`;

  writeFileSync(filepath, content, 'utf-8');
  console.error(`[WorkCompletionLearning] Created learning: ${filepath}`);
}

async function main() {
  try {
    console.error('[WorkCompletionLearning] Hook started');

    const input = await readStdinWithTimeout();
    const data: HookInput = JSON.parse(input);

    // Gather all available context
    const currentWork = readCurrentWork();
    const sessionSummary = extractSessionSummary(data.transcript_path || '');
    const workMeta = currentWork?.work_dir ? readWorkMeta(currentWork.work_dir) : null;

    // Check if significant
    if (!isSignificantWork(currentWork, sessionSummary, workMeta)) {
      console.error('[WorkCompletionLearning] Trivial session, skipping learning capture');
      process.exit(0);
    }

    // Determine title
    let title = 'Work Session';
    if (currentWork?.title) {
      title = currentWork.title;
    } else if (workMeta?.title) {
      title = workMeta.title;
    } else if (sessionSummary?.firstUserMessage) {
      // Use first user message as title (truncated)
      title = sessionSummary.firstUserMessage.slice(0, 60);
      if (sessionSummary.firstUserMessage.length > 60) title += '...';
    }

    // Gather context
    let context = '';
    if (sessionSummary?.lastSummary) {
      context = sessionSummary.lastSummary;
    } else if (sessionSummary?.firstUserMessage) {
      context = `Session started with: "${sessionSummary.firstUserMessage}"`;
    } else {
      context = 'Work session completed.';
    }

    // Gather tools and files
    const toolsUsed: string[] = [];
    if (sessionSummary?.toolsUsed) {
      toolsUsed.push(...sessionSummary.toolsUsed);
    }
    if (workMeta?.lineage?.tools_used) {
      for (const t of workMeta.lineage.tools_used) {
        if (!toolsUsed.includes(t)) toolsUsed.push(t);
      }
    }
    if (currentWork?.tools_used) {
      for (const t of currentWork.tools_used) {
        if (!toolsUsed.includes(t)) toolsUsed.push(t);
      }
    }

    const filesChanged: string[] = [];
    if (workMeta?.lineage?.files_changed) {
      filesChanged.push(...workMeta.lineage.files_changed);
    }
    if (currentWork?.files_changed) {
      for (const f of currentWork.files_changed) {
        if (!filesChanged.includes(f)) filesChanged.push(f);
      }
    }

    // Create learning
    writeLearning(title, context, toolsUsed, filesChanged, data.session_id);

    console.error('[WorkCompletionLearning] Done');
    process.exit(0);
  } catch (err) {
    console.error(`[WorkCompletionLearning] Error: ${err}`);
    process.exit(0);
  }
}

main();
