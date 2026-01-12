/**
 * State Manager
 *
 * Manage sync state between plan items and GitHub issues.
 * State is stored in the plan file's frontmatter.
 */

import type {
  SyncState,
  IssueMapping,
  PlanItem,
  GitHubIssue,
  PlanItemStatus,
  GitHubSyncConfig,
} from './types';
import { parsePlanFile, updateSyncState } from './plan-parser';

// =============================================================================
// State Operations
// =============================================================================

/**
 * Load sync state from a plan file.
 */
export function loadState(planPath: string): SyncState | null {
  const plan = parsePlanFile(planPath);
  return plan.syncState;
}

/**
 * Save sync state to a plan file.
 */
export function saveState(planPath: string, state: SyncState): void {
  updateSyncState(planPath, state);
}

/**
 * Initialize empty sync state for a repo.
 */
export function initState(repo: string): SyncState {
  return {
    repo,
    mappings: [],
    last_sync: new Date().toISOString(),
  };
}

// =============================================================================
// Mapping Operations
// =============================================================================

/**
 * Find mapping for a plan item.
 */
export function findMapping(
  state: SyncState,
  itemContent: string
): IssueMapping | undefined {
  return state.mappings.find((m) => m.step === itemContent);
}

/**
 * Add or update a mapping.
 */
export function upsertMapping(
  state: SyncState,
  itemContent: string,
  issueNumber: number,
  issueUrl?: string
): SyncState {
  const existingIndex = state.mappings.findIndex((m) => m.step === itemContent);
  const now = new Date().toISOString();

  const mapping: IssueMapping = {
    step: itemContent,
    issue: issueNumber,
    url: issueUrl,
    synced_at: now,
  };

  if (existingIndex >= 0) {
    state.mappings[existingIndex] = mapping;
  } else {
    state.mappings.push(mapping);
  }

  state.last_sync = now;
  return state;
}

/**
 * Remove a mapping.
 */
export function removeMapping(
  state: SyncState,
  itemContent: string
): SyncState {
  state.mappings = state.mappings.filter((m) => m.step !== itemContent);
  return state;
}

// =============================================================================
// Sync Logic
// =============================================================================

export interface SyncAction {
  type: 'create' | 'update' | 'close' | 'reopen' | 'skip';
  item: PlanItem;
  issue?: GitHubIssue;
  reason?: string;
}

/**
 * Determine sync actions needed for push operation.
 * Compares local plan items against existing issues.
 */
export function determinePushActions(
  items: PlanItem[],
  state: SyncState | null,
  existingIssues: GitHubIssue[],
  config: GitHubSyncConfig
): SyncAction[] {
  const actions: SyncAction[] = [];
  const issueByNumber = new Map(existingIssues.map((i) => [i.number, i]));

  for (const item of items) {
    const mapping = state ? findMapping(state, item.content) : undefined;

    if (!mapping) {
      // No mapping exists - create new issue
      actions.push({ type: 'create', item });
      continue;
    }

    const issue = issueByNumber.get(mapping.issue);
    if (!issue) {
      // Issue was deleted - recreate
      actions.push({ type: 'create', item, reason: 'Issue not found' });
      continue;
    }

    // Compare states
    const localCompleted = item.status === 'completed';
    const remoteCompleted = issue.state === 'closed';

    if (localCompleted && !remoteCompleted) {
      // Local completed, remote open - close issue
      actions.push({ type: 'close', item, issue });
    } else if (!localCompleted && remoteCompleted) {
      // Local not completed, remote closed - handle by conflict strategy
      if (config.conflict_strategy === 'local_wins') {
        actions.push({ type: 'reopen', item, issue });
      } else {
        actions.push({
          type: 'skip',
          item,
          issue,
          reason: `Conflict: local=${item.status}, remote=closed`,
        });
      }
    } else {
      // States match - skip
      actions.push({ type: 'skip', item, issue, reason: 'Already synced' });
    }
  }

  return actions;
}

/**
 * Determine sync actions needed for pull operation.
 * Updates local plan items based on issue state changes.
 */
export function determinePullActions(
  items: PlanItem[],
  state: SyncState | null,
  existingIssues: GitHubIssue[],
  config: GitHubSyncConfig
): Array<{ item: PlanItem; newStatus: PlanItemStatus; issue: GitHubIssue }> {
  const updates: Array<{
    item: PlanItem;
    newStatus: PlanItemStatus;
    issue: GitHubIssue;
  }> = [];

  if (!state) return updates;

  const issueByNumber = new Map(existingIssues.map((i) => [i.number, i]));
  const itemByContent = new Map(items.map((i) => [i.content, i]));

  for (const mapping of state.mappings) {
    const issue = issueByNumber.get(mapping.issue);
    const item = itemByContent.get(mapping.step);

    if (!issue || !item) continue;

    const localCompleted = item.status === 'completed';
    const remoteCompleted = issue.state === 'closed';

    if (remoteCompleted && !localCompleted) {
      // Remote closed, local open - update local
      if (
        config.conflict_strategy === 'remote_wins' ||
        config.conflict_strategy === 'newer_wins'
      ) {
        updates.push({ item, newStatus: 'completed', issue });
      }
    } else if (!remoteCompleted && localCompleted) {
      // Remote open, local closed - might have been reopened
      if (config.conflict_strategy === 'remote_wins') {
        updates.push({ item, newStatus: 'pending', issue });
      } else if (config.conflict_strategy === 'newer_wins') {
        // Compare timestamps
        const issueUpdated = new Date(issue.updatedAt);
        const mappingSynced = new Date(mapping.synced_at);
        if (issueUpdated > mappingSynced) {
          updates.push({ item, newStatus: 'pending', issue });
        }
      }
    }
  }

  return updates;
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Get all issue numbers from state.
 */
export function getAllIssueNumbers(state: SyncState): number[] {
  return state.mappings.map((m) => m.issue);
}

/**
 * Get unsynced items (items without mappings).
 */
export function getUnsyncedItems(
  items: PlanItem[],
  state: SyncState | null
): PlanItem[] {
  if (!state) return items;
  const syncedContents = new Set(state.mappings.map((m) => m.step));
  return items.filter((item) => !syncedContents.has(item.content));
}

/**
 * Get sync status summary.
 */
export function getSyncSummary(
  items: PlanItem[],
  state: SyncState | null
): {
  total: number;
  synced: number;
  pending: number;
  completed: number;
  lastSync: string | null;
} {
  const synced = state?.mappings.length || 0;
  const pending = items.filter((i) => i.status === 'pending').length;
  const completed = items.filter((i) => i.status === 'completed').length;

  return {
    total: items.length,
    synced,
    pending,
    completed,
    lastSync: state?.last_sync || null,
  };
}
