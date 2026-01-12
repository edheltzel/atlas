/**
 * Plan Parser
 *
 * Parse and update DeepPlan task_plan.md files.
 * Extracts checkboxes and manages frontmatter sync state.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import type { PlanItem, ParsedPlan, SyncState, PlanItemStatus } from './types';

// =============================================================================
// Plan Discovery
// =============================================================================

/**
 * Find task_plan.md in the current directory or .claude/plans/
 */
export function findPlanFile(cwd: string): string | null {
  // Check current directory first
  const localPlan = join(cwd, 'task_plan.md');
  if (existsSync(localPlan)) return localPlan;

  // Check .claude/plans/ directory
  const plansDir = join(cwd, '.claude', 'plans');
  if (existsSync(plansDir)) {
    const files = Bun.spawnSync(['ls', '-1', plansDir]).stdout.toString().trim().split('\n');
    const planFile = files.find(f => f.endsWith('task_plan.md') || f.endsWith('_plan.md'));
    if (planFile) return join(plansDir, planFile);
  }

  return null;
}

/**
 * List all plan files in a directory.
 */
export function listPlanFiles(cwd: string): string[] {
  const plans: string[] = [];

  // Check current directory
  const localPlan = join(cwd, 'task_plan.md');
  if (existsSync(localPlan)) plans.push(localPlan);

  // Check .claude/plans/
  const plansDir = join(cwd, '.claude', 'plans');
  if (existsSync(plansDir)) {
    const files = Bun.spawnSync(['ls', '-1', plansDir]).stdout.toString().trim().split('\n');
    for (const file of files) {
      if (file.endsWith('.md') && !file.endsWith('.notes.md')) {
        plans.push(join(plansDir, file));
      }
    }
  }

  return plans;
}

// =============================================================================
// Parsing
// =============================================================================

/**
 * Parse a task_plan.md file.
 */
export function parsePlanFile(filePath: string): ParsedPlan {
  const content = readFileSync(filePath, 'utf-8');
  return parsePlanContent(content);
}

/**
 * Parse plan content from string.
 */
export function parsePlanContent(content: string): ParsedPlan {
  const lines = content.split('\n');
  let frontmatter: Record<string, unknown> = {};
  let syncState: SyncState | null = null;
  let bodyStartLine = 0;

  // Parse frontmatter
  if (lines[0]?.trim() === '---') {
    let frontmatterEnd = -1;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i]?.trim() === '---') {
        frontmatterEnd = i;
        break;
      }
    }

    if (frontmatterEnd > 0) {
      const yamlContent = lines.slice(1, frontmatterEnd).join('\n');
      try {
        frontmatter = parseYaml(yamlContent) || {};
        const ghSync = frontmatter['github_sync'];
        if (ghSync) {
          syncState = ghSync as SyncState;
        }
      } catch {
        // Invalid YAML, continue with empty frontmatter
      }
      bodyStartLine = frontmatterEnd + 1;
    }
  }

  // Parse body for checkboxes
  const items: PlanItem[] = [];
  let currentPhase = '';

  for (let i = bodyStartLine; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1; // 1-indexed

    // Phase header (### Phase N: Name)
    const phaseMatch = line?.match(/^###\s+(.+)$/);
    const phaseContent = phaseMatch?.[1];
    if (phaseContent) {
      currentPhase = phaseContent.trim();
      continue;
    }

    // Checkbox item (- [ ] or - [x])
    const checkboxMatch = line?.match(/^(\s*)-\s*\[([ xX])\]\s*(.+)$/);
    const checkChar = checkboxMatch?.[2];
    const itemContent = checkboxMatch?.[3];
    if (checkboxMatch && checkChar && itemContent) {
      const isChecked = checkChar.toLowerCase() === 'x';

      items.push({
        content: itemContent.trim(),
        status: isChecked ? 'completed' : 'pending',
        phase: currentPhase,
        lineNumber,
        isPhase: false,
      });
    }
  }

  return {
    project: String(frontmatter['project'] ?? ''),
    directory: String(frontmatter['directory'] ?? ''),
    items,
    syncState,
    frontmatter,
    rawContent: content,
  };
}

// =============================================================================
// Updating
// =============================================================================

/**
 * Update the sync state in frontmatter.
 */
export function updateSyncState(
  filePath: string,
  syncState: SyncState
): void {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Find frontmatter bounds
  if (lines[0]?.trim() !== '---') {
    // No frontmatter, add it
    const newFrontmatter = stringifyYaml({ github_sync: syncState });
    const newContent = `---\n${newFrontmatter}---\n${content}`;
    writeFileSync(filePath, newContent);
    return;
  }

  let frontmatterEnd = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i]?.trim() === '---') {
      frontmatterEnd = i;
      break;
    }
  }

  if (frontmatterEnd < 0) {
    throw new Error('Invalid frontmatter: missing closing ---');
  }

  // Parse existing frontmatter
  const yamlContent = lines.slice(1, frontmatterEnd).join('\n');
  let frontmatter: Record<string, unknown> = {};
  try {
    frontmatter = parseYaml(yamlContent) || {};
  } catch {
    frontmatter = {};
  }

  // Update github_sync
  frontmatter['github_sync'] = syncState;

  // Rebuild file
  const newYaml = stringifyYaml(frontmatter);
  const bodyLines = lines.slice(frontmatterEnd + 1);
  const newContent = `---\n${newYaml}---\n${bodyLines.join('\n')}`;

  writeFileSync(filePath, newContent);
}

/**
 * Update a checkbox item's status.
 */
export function updateItemStatus(
  filePath: string,
  content: string,
  newStatus: PlanItemStatus
): void {
  const fileContent = readFileSync(filePath, 'utf-8');
  const lines = fileContent.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const checkboxMatch = line?.match(/^(\s*-\s*\[)([ xX])(\]\s*)(.+)$/);
    const prefix = checkboxMatch?.[1];
    const suffix = checkboxMatch?.[3];
    const matchContent = checkboxMatch?.[4];

    if (prefix && suffix && matchContent && matchContent.trim() === content) {
      const newCheckbox = newStatus === 'completed' ? 'x' : ' ';
      lines[i] = `${prefix}${newCheckbox}${suffix}${matchContent}`;
      break;
    }
  }

  writeFileSync(filePath, lines.join('\n'));
}

/**
 * Batch update multiple items.
 */
export function updateMultipleItems(
  filePath: string,
  updates: Array<{ content: string; status: PlanItemStatus }>
): void {
  let fileContent = readFileSync(filePath, 'utf-8');

  for (const { content, status } of updates) {
    const lines = fileContent.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const checkboxMatch = line?.match(/^(\s*-\s*\[)([ xX])(\]\s*)(.+)$/);
      const prefix = checkboxMatch?.[1];
      const suffix = checkboxMatch?.[3];
      const matchContent = checkboxMatch?.[4];

      if (prefix && suffix && matchContent && matchContent.trim() === content) {
        const newCheckbox = status === 'completed' ? 'x' : ' ';
        lines[i] = `${prefix}${newCheckbox}${suffix}${matchContent}`;
        break;
      }
    }

    fileContent = lines.join('\n');
  }

  writeFileSync(filePath, fileContent);
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Generate issue title from plan item.
 */
export function itemToIssueTitle(item: PlanItem): string {
  // Prefix with phase if available
  if (item.phase) {
    const phaseNum = item.phase.match(/Phase\s*(\d+)/i)?.[1];
    if (phaseNum) {
      return `[P${phaseNum}] ${item.content}`;
    }
  }
  return item.content;
}

/**
 * Generate issue body from plan item.
 */
export function itemToIssueBody(item: PlanItem, project: string): string {
  return `## Plan Item

**Project:** ${project}
**Phase:** ${item.phase || 'N/A'}
**Status:** ${item.status}

---

*Synced from DeepPlan via Atlas*`;
}

/**
 * Map plan item status to issue labels.
 */
export function statusToLabels(
  status: PlanItemStatus,
  labels: { pending: string; in_progress: string; completed: string }
): string[] {
  switch (status) {
    case 'pending':
      return [labels.pending];
    case 'in_progress':
      return [labels.in_progress];
    case 'completed':
      return [labels.completed];
    default:
      return [];
  }
}
