/**
 * GitHub Issues Sync - Type Definitions
 *
 * Types for syncing DeepPlan task_plan.md checkboxes with GitHub Issues.
 */

import { z } from 'zod';

// =============================================================================
// Error Types
// =============================================================================

/** Base error class for github-sync operations */
export class GitHubSyncError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'GitHubSyncError';
  }
}

/** Error for authentication failures */
export class AuthenticationError extends GitHubSyncError {
  constructor(message: string, cause?: Error) {
    super(message, 'AUTH_ERROR', cause);
    this.name = 'AuthenticationError';
  }
}

/** Error for rate limit issues */
export class RateLimitError extends GitHubSyncError {
  constructor(
    message: string,
    public readonly retryAfter?: number,
    cause?: Error
  ) {
    super(message, 'RATE_LIMIT', cause);
    this.name = 'RateLimitError';
  }
}

/** Error for network/connectivity issues */
export class NetworkError extends GitHubSyncError {
  constructor(message: string, cause?: Error) {
    super(message, 'NETWORK_ERROR', cause);
    this.name = 'NetworkError';
  }
}

/** Error for validation failures */
export class ValidationError extends GitHubSyncError {
  constructor(message: string, cause?: Error) {
    super(message, 'VALIDATION_ERROR', cause);
    this.name = 'ValidationError';
  }
}

// =============================================================================
// Logging
// =============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

/** Simple structured logger */
export class Logger {
  private level: LogLevel;
  private static levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(level: LogLevel = 'info') {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return Logger.levelPriority[level] >= Logger.levelPriority[this.level];
  }

  private format(entry: LogEntry): string {
    const ctx = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
    return `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}${ctx}`;
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(context !== undefined && { context }),
    };

    const formatted = this.format(entry);
    switch (level) {
      case 'error':
        console.error(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      default:
        console.log(formatted);
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.log('error', message, context);
  }
}

/** Default logger instance */
export const logger = new Logger(
  (process.env['LOG_LEVEL'] as LogLevel) ?? 'info'
);

// =============================================================================
// Progress Reporting
// =============================================================================

export interface ProgressInfo {
  current: number;
  total: number;
  message?: string;
}

export type ProgressCallback = (info: ProgressInfo) => void;

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
  assignees?: string[];
  project?: string;
}

export interface UpdateIssueOptions {
  title?: string;
  body?: string;
  state?: IssueState;
  labels?: string[];
}

// =============================================================================
// Zod Schemas for API Response Validation
// =============================================================================

/** Schema for GitHub REST API issue label */
export const GitHubLabelSchema = z.object({
  id: z.number(),
  name: z.string(),
  color: z.string().optional(),
  description: z.string().nullable().optional(),
});

/** Schema for GitHub REST API issue response */
export const GitHubIssueApiSchema = z.object({
  number: z.number(),
  title: z.string(),
  body: z.string().nullable(),
  state: z.enum(['open', 'closed']),
  labels: z.array(GitHubLabelSchema).default([]),
  updated_at: z.string(),
  html_url: z.string(),
});

/** Schema for batch issue creation response */
export const GitHubIssueApiResponseSchema = z.array(GitHubIssueApiSchema);

/** Schema for GraphQL error */
export const GraphQLErrorSchema = z.object({
  message: z.string(),
  path: z.array(z.string()).optional(),
  locations: z
    .array(
      z.object({
        line: z.number(),
        column: z.number(),
      })
    )
    .optional(),
});

/** Schema for GraphQL issue result */
export const GraphQLIssueSchema = z.object({
  number: z.number(),
  url: z.string(),
  title: z.string(),
  state: z.enum(['OPEN', 'CLOSED']),
  updatedAt: z.string(),
});

/** Schema for GraphQL createIssue mutation result */
export const GraphQLCreateIssueResultSchema = z.object({
  issue: GraphQLIssueSchema.nullable(),
});

/** Schema for GraphQL repository query result */
export const GraphQLRepoQuerySchema = z.object({
  data: z
    .object({
      repository: z
        .object({
          id: z.string(),
        })
        .nullable(),
    })
    .nullable(),
  errors: z.array(GraphQLErrorSchema).optional(),
});

/** Schema for GraphQL labels query result */
export const GraphQLLabelsQuerySchema = z.object({
  data: z
    .object({
      repository: z
        .object({
          labels: z
            .object({
              nodes: z.array(
                z.object({
                  id: z.string(),
                  name: z.string(),
                })
              ),
            })
            .nullable(),
        })
        .nullable(),
    })
    .nullable(),
  errors: z.array(GraphQLErrorSchema).optional(),
});

/** Generic GraphQL response schema for batch mutations */
export const GraphQLBatchMutationSchema = z.object({
  data: z.record(z.string(), GraphQLCreateIssueResultSchema.nullable()).nullable(),
  errors: z.array(GraphQLErrorSchema).optional(),
});

/** Inferred types from schemas */
export type GitHubIssueApiResponse = z.infer<typeof GitHubIssueApiSchema>;
export type GraphQLRepoQueryResponse = z.infer<typeof GraphQLRepoQuerySchema>;
export type GraphQLLabelsQueryResponse = z.infer<typeof GraphQLLabelsQuerySchema>;
export type GraphQLBatchMutationResponse = z.infer<typeof GraphQLBatchMutationSchema>;

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
  default_assignees: string[];
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
  default_assignees: ['edheltzel'],
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
  plan?: string | undefined;
  repo?: string | undefined;
  dryRun?: boolean | undefined;
}
