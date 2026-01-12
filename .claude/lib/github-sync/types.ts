/**
 * GitHub Issues Sync - Type Definitions
 *
 * Types for syncing DeepPlan task_plan.md checkboxes with GitHub Issues.
 */

// =============================================================================
// Plan Item Types
// =============================================================================

export type PlanItemStatus = 'pending' | 'in_progress' | 'completed';

export interface PlanItem {
  /** The text content of the checkbox item */
  content: string;
  /** Current status based on checkbox state */
  status: PlanItemStatus;
  /** Parent phase name (e.g., "Phase 1: Research") */
  phase: string;
  /** Line number in the task_plan.md file */
  lineNumber: number;
  /** Whether this is a phase header vs a step */
  isPhase: boolean;
}

export interface ParsedPlan {
  /** Plan project name from frontmatter */
  project: string;
  /** Directory path from frontmatter */
  directory: string;
  /** All plan items (phases and steps) */
  items: PlanItem[];
  /** Existing GitHub sync state from frontmatter */
  syncState: SyncState | null;
  /** Raw frontmatter for preservation */
  frontmatter: Record<string, unknown>;
  /** Full file content for updates */
  rawContent: string;
}

// =============================================================================
// Sync State Types
// =============================================================================

export interface IssueMapping {
  /** The plan item content (used as key) */
  step: string;
  /** GitHub issue number */
  issue: number;
  /** Issue URL for quick access */
  url?: string;
  /** Last sync timestamp */
  synced_at: string;
}

export interface SyncState {
  /** GitHub repo in owner/repo format */
  repo: string;
  /** Mappings between plan items and issues */
  mappings: IssueMapping[];
  /** Last full sync timestamp */
  last_sync?: string;
}

// =============================================================================
// GitHub Types
// =============================================================================

export type IssueState = 'open' | 'closed';

export interface GitHubIssue {
  number: number;
  title: string;
  body: string;
  state: IssueState;
  labels: string[];
  updatedAt: string;
  url: string;
}

export interface CreateIssueOptions {
  title: string;
  body: string;
  labels: string[];
  project?: string;
}

export interface UpdateIssueOptions {
  title?: string;
  body?: string;
  state?: IssueState;
  labels?: string[];
}

// =============================================================================
// Configuration Types
// =============================================================================

export interface GitHubSyncLabels {
  sync_marker: string;
  status_pending: string;
  status_in_progress: string;
  status_completed: string;
}

export interface GitHubSyncConfig {
  enabled: boolean;
  auto_sync_on_session_end: boolean;
  labels: GitHubSyncLabels;
  project: string | null;
  conflict_strategy: 'local_wins' | 'remote_wins' | 'newer_wins' | 'prompt';
}

export const DEFAULT_CONFIG: GitHubSyncConfig = {
  enabled: true,
  auto_sync_on_session_end: true,
  labels: {
    sync_marker: 'atlas-sync',
    status_pending: 'pending',
    status_in_progress: 'in-progress',
    status_completed: 'completed',
  },
  project: null,
  conflict_strategy: 'newer_wins',
};

// =============================================================================
// Sync Result Types
// =============================================================================

export interface SyncConflict {
  item: string;
  localStatus: PlanItemStatus;
  remoteStatus: IssueState;
  resolution: 'local' | 'remote' | 'skipped';
}

export interface SyncResult {
  created: number;
  updated: number;
  closed: number;
  conflicts: SyncConflict[];
  errors: string[];
}

// =============================================================================
// CLI Types
// =============================================================================

export type Command = 'sync' | 'push' | 'pull' | 'status' | 'init';

export interface CLIOptions {
  command: Command;
  plan?: string;
  repo?: string;
  dryRun?: boolean;
}
