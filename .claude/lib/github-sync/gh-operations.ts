/**
 * GitHub CLI Operations
 *
 * Wrapper functions for `gh` CLI commands.
 * Uses Bun's shell for subprocess execution.
 */

import { z } from 'zod';
import type {
  GitHubIssue,
  CreateIssueOptions,
  UpdateIssueOptions,
  IssueState,
  GraphQLRepoQueryResponse,
  GraphQLLabelsQueryResponse,
  GraphQLBatchMutationResponse,
  ProgressCallback,
} from './types';
import {
  GitHubIssueApiSchema,
  GraphQLRepoQuerySchema,
  GraphQLLabelsQuerySchema,
  GraphQLBatchMutationSchema,
  logger,
  NetworkError,
  RateLimitError,
  AuthenticationError,
} from './types';

// =============================================================================
// Helpers
// =============================================================================

interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

interface ParsedRepo {
  owner: string;
  name: string;
}

function parseRepo(repo: string): ParsedRepo | null {
  const parts = repo.split('/');
  const owner = parts[0];
  const name = parts[1];
  if (!owner || !name) return null;
  return { owner, name };
}

// =============================================================================
// Retry Logic
// =============================================================================

interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  timeoutMs?: number;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  timeoutMs: 30000,
};

/**
 * Wrap a promise with a timeout.
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new NetworkError(`Request timed out after ${ms}ms`)), ms)
    ),
  ]);
}

/**
 * Execute a function with exponential backoff retry.
 * Handles rate limits (HTTP 429) and server errors (5xx).
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxAttempts, baseDelayMs, maxDelayMs, timeoutMs } = {
    ...DEFAULT_RETRY_OPTIONS,
    ...options,
  };

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await withTimeout(fn(), timeoutMs);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if error is retryable
      const isRateLimit = lastError.message.includes('429');
      const isServerError = /5\d{2}/.test(lastError.message);
      const isNetworkError =
        lastError.message.includes('ECONNRESET') ||
        lastError.message.includes('ETIMEDOUT') ||
        lastError.message.includes('timed out') ||
        lastError.message.includes('fetch failed') ||
        lastError instanceof NetworkError;

      if (!isRateLimit && !isServerError && !isNetworkError) {
        throw lastError; // Non-retryable error
      }

      if (attempt === maxAttempts) {
        logger.error('Max retry attempts reached', {
          attempts: maxAttempts,
          error: lastError.message,
        });
        if (isRateLimit) {
          throw new RateLimitError(lastError.message, undefined, lastError);
        }
        if (isNetworkError) {
          throw new NetworkError(lastError.message, lastError);
        }
        throw lastError;
      }

      // Calculate delay with exponential backoff + jitter
      const exponentialDelay = baseDelayMs * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 0.3 * exponentialDelay;
      const delay = Math.min(exponentialDelay + jitter, maxDelayMs);

      logger.debug('Retrying after error', {
        attempt,
        maxAttempts,
        delayMs: Math.round(delay),
        error: lastError.message,
      });

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError ?? new Error('Retry failed');
}

async function runGh(args: string[], cwd?: string): Promise<CommandResult> {
  const spawnOpts = cwd
    ? { cwd, stdout: 'pipe' as const, stderr: 'pipe' as const }
    : { stdout: 'pipe' as const, stderr: 'pipe' as const };
  const proc = Bun.spawn(['gh', ...args], spawnOpts);

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;

  return { stdout, stderr, exitCode };
}

// =============================================================================
// Cache (avoids redundant API calls)
// =============================================================================

const cache = {
  token: null as string | null,
  authChecked: false,
  authValid: false,
  repoIds: new Map<string, string>(),
  labelIds: new Map<string, Map<string, string>>(),
};

async function getToken(): Promise<string> {
  if (cache.token) return cache.token;
  const result = await runGh(['auth', 'token']);
  if (result.exitCode !== 0) {
    throw new Error('Failed to get GitHub token');
  }
  cache.token = result.stdout.trim();
  return cache.token;
}

function escapeGraphQL(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

async function graphqlRequest<T>(
  query: string,
  schema: { parse: (data: unknown) => T }
): Promise<T> {
  return withRetry(async () => {
    const token = await getToken();
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status}`);
    }

    const json: unknown = await response.json();
    return schema.parse(json);
  });
}

async function getRepoNodeId(owner: string, repo: string): Promise<string> {
  const cacheKey = `${owner}/${repo}`;
  const cached = cache.repoIds.get(cacheKey);
  if (cached) {
    return cached;
  }

  const query = `query { repository(owner: "${owner}", name: "${repo}") { id } }`;
  const data = await graphqlRequest(query, GraphQLRepoQuerySchema);

  const repoId = data.data?.repository?.id;
  if (!repoId) {
    throw new Error(`Repository ${cacheKey} not found`);
  }

  cache.repoIds.set(cacheKey, repoId);
  return repoId;
}

async function getLabelNodeIds(
  owner: string,
  repo: string,
  labelNames: string[]
): Promise<string[]> {
  if (labelNames.length === 0) return [];

  const cacheKey = `${owner}/${repo}`;
  let repoLabelCache = cache.labelIds.get(cacheKey);
  if (!repoLabelCache) {
    repoLabelCache = new Map();
    cache.labelIds.set(cacheKey, repoLabelCache);
  }

  // Check which labels we need to fetch
  const missingLabels = labelNames.filter((name) => !repoLabelCache.has(name));

  if (missingLabels.length > 0) {
    // Fetch all labels for the repo (more efficient than individual queries)
    const query = `query {
      repository(owner: "${owner}", name: "${repo}") {
        labels(first: 100) {
          nodes { id name }
        }
      }
    }`;
    const data = await graphqlRequest(query, GraphQLLabelsQuerySchema);

    const labels = data.data?.repository?.labels?.nodes ?? [];
    for (const label of labels) {
      repoLabelCache.set(label.name, label.id);
    }
  }

  // Return IDs for requested labels (skip any not found)
  return labelNames
    .map((name) => repoLabelCache.get(name))
    .filter((id): id is string => id !== undefined);
}

// =============================================================================
// Repository Detection
// =============================================================================

/**
 * Detect GitHub repo from git remote origin.
 * Returns owner/repo format or null if not a GitHub repo.
 */
export async function detectRepo(cwd?: string): Promise<string | null> {
  try {
    // Check if in a git repo
    const gitCheckOpts = cwd
      ? { cwd, stdout: 'pipe' as const, stderr: 'pipe' as const }
      : { stdout: 'pipe' as const, stderr: 'pipe' as const };
    const gitCheck = Bun.spawn(
      ['git', 'rev-parse', '--is-inside-work-tree'],
      gitCheckOpts
    );
    if ((await gitCheck.exited) !== 0) return null;

    // Get remote URL
    const remoteProc = Bun.spawn(
      ['git', 'remote', 'get-url', 'origin'],
      gitCheckOpts
    );
    const remoteUrl = await new Response(remoteProc.stdout).text();
    if ((await remoteProc.exited) !== 0) return null;

    // Parse GitHub URL
    // Handles: git@github.com:owner/repo.git
    //          https://github.com/owner/repo.git
    const url = remoteUrl.trim();

    // SSH format
    const sshMatch = url.match(/git@github\.com:([^/]+)\/(.+?)(?:\.git)?$/);
    if (sshMatch) return `${sshMatch[1]}/${sshMatch[2]}`;

    // HTTPS format
    const httpsMatch = url.match(/github\.com\/([^/]+)\/(.+?)(?:\.git)?$/);
    if (httpsMatch) return `${httpsMatch[1]}/${httpsMatch[2]}`;

    return null;
  } catch {
    return null;
  }
}

/**
 * Check if gh CLI is installed and authenticated.
 * Results are cached to avoid repeated checks.
 */
export async function checkGhAuth(): Promise<{ ok: boolean; error?: string }> {
  // Return cached result if available
  if (cache.authChecked) {
    return cache.authValid
      ? { ok: true }
      : { ok: false, error: 'Not authenticated. Run: gh auth login' };
  }

  try {
    const result = await runGh(['auth', 'status']);
    cache.authChecked = true;

    if (result.exitCode !== 0) {
      cache.authValid = false;
      logger.warn('GitHub CLI not authenticated');
      return { ok: false, error: 'Not authenticated. Run: gh auth login' };
    }

    cache.authValid = true;
    logger.debug('GitHub CLI authentication verified');
    return { ok: true };
  } catch (error) {
    cache.authChecked = true;
    cache.authValid = false;
    logger.error('GitHub CLI not found', {
      error: error instanceof Error ? error.message : String(error),
    });
    return { ok: false, error: 'gh CLI not found. Install: brew install gh' };
  }
}

// =============================================================================
// Issue Operations
// =============================================================================

/**
 * Create a new GitHub issue.
 * Uses --json flag to get issue details in a single API call.
 */
export async function createIssue(
  repo: string,
  options: CreateIssueOptions
): Promise<GitHubIssue> {
  const args = [
    'issue',
    'create',
    '-R',
    repo,
    '-t',
    options.title,
    '-b',
    options.body || '',
  ];

  if (options.labels.length > 0) {
    args.push('-l', options.labels.join(','));
  }

  if (options.project) {
    args.push('-p', options.project);
  }

  const result = await runGh(args);

  if (result.exitCode !== 0) {
    throw new Error(`Failed to create issue: ${result.stderr}`);
  }

  // gh issue create returns URL like "https://github.com/owner/repo/issues/123"
  const issueUrl = result.stdout.trim();
  const issueNumber = parseInt(issueUrl.split('/').pop() || '0', 10);

  // Return minimal issue data without extra API call
  return {
    number: issueNumber,
    title: options.title,
    body: options.body || '',
    state: 'open',
    labels: options.labels,
    updatedAt: new Date().toISOString(),
    url: issueUrl,
  };
}

/**
 * Create multiple issues in parallel using REST API directly.
 * Much faster than spawning multiple gh CLI processes.
 */
export async function createIssuesBatch(
  repo: string,
  issues: CreateIssueOptions[],
  onProgress?: ProgressCallback
): Promise<{ results: GitHubIssue[]; errors: string[] }> {
  const parsed = parseRepo(repo);
  const results: GitHubIssue[] = [];
  const errors: string[] = [];
  let completed = 0;

  if (!parsed) {
    errors.push(`Invalid repo format: ${repo}`);
    return { results, errors };
  }

  // Get GitHub token from gh CLI
  const tokenResult = await runGh(['auth', 'token']);
  if (tokenResult.exitCode !== 0) {
    throw new Error('Failed to get GitHub token');
  }
  const token = tokenResult.stdout.trim();

  // Create all issues in parallel using fetch with retry
  const promises = issues.map(async (options, index) => {
    try {
      const data = await withRetry(async () => {
        const response = await fetch(
          `https://api.github.com/repos/${parsed.owner}/${parsed.name}/issues`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/vnd.github+json',
              'X-GitHub-Api-Version': '2022-11-28',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: options.title,
              body: options.body || '',
              labels: options.labels,
              assignees: options.assignees ?? [],
            }),
          }
        );

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`HTTP ${response.status}: ${error}`);
        }

        const json: unknown = await response.json();
        return GitHubIssueApiSchema.parse(json);
      });

      return {
        index,
        issue: {
          number: data.number,
          title: data.title,
          body: data.body ?? '',
          state: data.state,
          labels: data.labels.map((l) => l.name),
          updatedAt: data.updated_at,
          url: data.html_url,
        },
      };
    } catch (error) {
      return {
        index,
        error: error instanceof Error ? error.message : String(error),
      };
    } finally {
      completed++;
      onProgress?.({
        current: completed,
        total: issues.length,
        message: `Creating issues (${completed}/${issues.length})`,
      });
    }
  });

  // Wait for all to complete
  const settled = await Promise.all(promises);

  // Sort by index to maintain order
  settled.sort((a, b) => a.index - b.index);

  for (const result of settled) {
    if ('issue' in result) {
      results.push(result.issue);
    } else {
      errors.push(result.error);
    }
  }

  return { results, errors };
}

/**
 * Close multiple issues in parallel using REST API.
 */
export async function closeIssuesBatch(
  repo: string,
  issueNumbers: number[],
  onProgress?: ProgressCallback
): Promise<{ closed: number[]; errors: string[] }> {
  const parsed = parseRepo(repo);
  const closed: number[] = [];
  const errors: string[] = [];
  let completed = 0;

  if (!parsed) {
    errors.push(`Invalid repo format: ${repo}`);
    return { closed, errors };
  }

  const tokenResult = await runGh(['auth', 'token']);
  if (tokenResult.exitCode !== 0) {
    throw new Error('Failed to get GitHub token');
  }
  const token = tokenResult.stdout.trim();

  const promises = issueNumbers.map(async (number) => {
    try {
      await withRetry(async () => {
        const response = await fetch(
          `https://api.github.com/repos/${parsed.owner}/${parsed.name}/issues/${number}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/vnd.github+json',
              'X-GitHub-Api-Version': '2022-11-28',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ state: 'closed' }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
      });

      return { number, success: true };
    } catch (error) {
      return {
        number,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    } finally {
      completed++;
      onProgress?.({
        current: completed,
        total: issueNumbers.length,
        message: `Closing issues (${completed}/${issueNumbers.length})`,
      });
    }
  });

  const results = await Promise.all(promises);

  for (const result of results) {
    if (result.success) {
      closed.push(result.number);
    } else {
      errors.push(`#${result.number}: ${result.error}`);
    }
  }

  return { closed, errors };
}

/**
 * Get issue details by number.
 */
export async function getIssue(
  repo: string,
  number: number
): Promise<GitHubIssue> {
  const result = await runGh([
    'issue',
    'view',
    String(number),
    '-R',
    repo,
    '--json',
    'number,title,body,state,labels,updatedAt,url',
  ]);

  if (result.exitCode !== 0) {
    throw new Error(`Failed to get issue #${number}: ${result.stderr}`);
  }

  const data = JSON.parse(result.stdout);
  return {
    number: data.number,
    title: data.title,
    body: data.body || '',
    state: data.state.toLowerCase() as IssueState,
    labels: data.labels?.map((l: { name: string }) => l.name) || [],
    updatedAt: data.updatedAt,
    url: data.url,
  };
}

/**
 * Update an existing issue.
 */
export async function updateIssue(
  repo: string,
  number: number,
  options: UpdateIssueOptions
): Promise<void> {
  const args = ['issue', 'edit', String(number), '-R', repo];

  if (options.title) args.push('-t', options.title);
  if (options.body !== undefined) args.push('-b', options.body);

  const result = await runGh(args);

  if (result.exitCode !== 0) {
    throw new Error(`Failed to update issue #${number}: ${result.stderr}`);
  }
}

/**
 * Close an issue.
 */
export async function closeIssue(repo: string, number: number): Promise<void> {
  const result = await runGh(['issue', 'close', String(number), '-R', repo]);

  if (result.exitCode !== 0) {
    throw new Error(`Failed to close issue #${number}: ${result.stderr}`);
  }
}

/**
 * Reopen an issue.
 */
export async function reopenIssue(repo: string, number: number): Promise<void> {
  const result = await runGh(['issue', 'reopen', String(number), '-R', repo]);

  if (result.exitCode !== 0) {
    throw new Error(`Failed to reopen issue #${number}: ${result.stderr}`);
  }
}

/**
 * List issues with filters.
 * Uses REST API with pagination for large issue lists (>100).
 */
export async function listIssues(
  repo: string,
  filters?: { labels?: string[]; state?: 'open' | 'closed' | 'all'; maxPages?: number }
): Promise<GitHubIssue[]> {
  const parsed = parseRepo(repo);
  if (!parsed) {
    logger.warn('Invalid repo format for listIssues', { repo });
    return [];
  }

  const token = await getToken();
  const allIssues: GitHubIssue[] = [];
  const perPage = 100;
  const maxPages = filters?.maxPages ?? 10; // Default to 1000 issues max
  let page = 1;

  while (page <= maxPages) {
    try {
      // Build query params
      const params = new URLSearchParams({
        per_page: String(perPage),
        page: String(page),
      });

      if (filters?.labels?.length) {
        params.set('labels', filters.labels.join(','));
      }

      if (filters?.state && filters.state !== 'all') {
        params.set('state', filters.state);
      } else {
        params.set('state', 'all');
      }

      const response = await withRetry(async () => {
        const res = await fetch(
          `https://api.github.com/repos/${parsed.owner}/${parsed.name}/issues?${params}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/vnd.github+json',
              'X-GitHub-Api-Version': '2022-11-28',
            },
          }
        );

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        return res;
      });

      const json: unknown = await response.json();
      const issues = z.array(GitHubIssueApiSchema).parse(json);

      for (const issue of issues) {
        allIssues.push({
          number: issue.number,
          title: issue.title,
          body: issue.body ?? '',
          state: issue.state,
          labels: issue.labels.map((l) => l.name),
          updatedAt: issue.updated_at,
          url: issue.html_url,
        });
      }

      // Check if we've fetched all issues
      if (issues.length < perPage) {
        break;
      }

      page++;
    } catch (error) {
      logger.error('Failed to fetch issues', {
        page,
        error: error instanceof Error ? error.message : String(error),
      });
      break;
    }
  }

  logger.debug('Listed issues', { count: allIssues.length, pages: page });
  return allIssues;
}

/**
 * List issues with filters (legacy gh CLI version).
 * @deprecated Use listIssues instead
 */
export async function listIssuesLegacy(
  repo: string,
  filters?: { labels?: string[]; state?: 'open' | 'closed' | 'all' }
): Promise<GitHubIssue[]> {
  const args = [
    'issue',
    'list',
    '-R',
    repo,
    '--json',
    'number,title,body,state,labels,updatedAt,url',
    '-L',
    '100',
  ];

  if (filters?.labels?.length) {
    args.push('-l', filters.labels.join(','));
  }

  if (filters?.state) {
    args.push('-s', filters.state);
  }

  const result = await runGh(args);

  if (result.exitCode !== 0) {
    return [];
  }

  const data = JSON.parse(result.stdout);
  return data.map(
    (issue: {
      number: number;
      title: string;
      body: string;
      state: string;
      labels: { name: string }[];
      updatedAt: string;
      url: string;
    }) => ({
      number: issue.number,
      title: issue.title,
      body: issue.body || '',
      state: issue.state.toLowerCase() as IssueState,
      labels: issue.labels?.map((l) => l.name) || [],
      updatedAt: issue.updatedAt,
      url: issue.url,
    })
  );
}

// =============================================================================
// Label Operations
// =============================================================================

/**
 * Ensure required labels exist in the repo.
 */
export async function ensureLabels(
  repo: string,
  labels: string[]
): Promise<void> {
  for (const label of labels) {
    // Create label if it doesn't exist (--force makes it idempotent)
    await runGh([
      'label',
      'create',
      label,
      '-R',
      repo,
      '--force',
      '-d',
      `Atlas sync label: ${label}`,
    ]);
  }
}

/**
 * Add labels to an issue.
 */
export async function addLabels(
  repo: string,
  number: number,
  labels: string[]
): Promise<void> {
  const result = await runGh([
    'issue',
    'edit',
    String(number),
    '-R',
    repo,
    '--add-label',
    labels.join(','),
  ]);

  if (result.exitCode !== 0) {
    throw new Error(`Failed to add labels to issue #${number}: ${result.stderr}`);
  }
}

/**
 * Remove labels from an issue.
 */
export async function removeLabels(
  repo: string,
  number: number,
  labels: string[]
): Promise<void> {
  const result = await runGh([
    'issue',
    'edit',
    String(number),
    '-R',
    repo,
    '--remove-label',
    labels.join(','),
  ]);

  if (result.exitCode !== 0) {
    throw new Error(`Failed to remove labels from issue #${number}: ${result.stderr}`);
  }
}

// =============================================================================
// GraphQL Batch Operations (Fastest)
// =============================================================================

/**
 * Create multiple issues using GraphQL batched mutations.
 * Single HTTP request for all issues - fastest method.
 */
export async function createIssuesGraphQL(
  repo: string,
  issues: CreateIssueOptions[]
): Promise<{ results: GitHubIssue[]; errors: string[] }> {
  const parsed = parseRepo(repo);
  const results: GitHubIssue[] = [];
  const errors: string[] = [];

  if (issues.length === 0) {
    return { results, errors };
  }

  if (!parsed) {
    errors.push(`Invalid repo format: ${repo}`);
    return { results, errors };
  }

  try {
    // Get repo node ID (cached)
    const repoId = await getRepoNodeId(parsed.owner, parsed.name);

    // Get label IDs for all unique labels (cached)
    const allLabels = [...new Set(issues.flatMap((i) => i.labels))];
    await getLabelNodeIds(parsed.owner, parsed.name, allLabels);
    const labelCache = cache.labelIds.get(repo) ?? new Map<string, string>();

    // Build batched mutation with aliases
    const mutations = await Promise.all(
      issues.map(async (issue, i) => {
        const labelIds = issue.labels
          .map((name) => labelCache.get(name))
          .filter((id): id is string => id !== undefined);

        const labelIdsStr = labelIds.map((id) => `"${id}"`).join(', ');

        return `
      i${i}: createIssue(input: {
        repositoryId: "${repoId}"
        title: "${escapeGraphQL(issue.title)}"
        body: "${escapeGraphQL(issue.body || '')}"
        ${labelIds.length > 0 ? `labelIds: [${labelIdsStr}]` : ''}
      }) {
        issue {
          number
          url
          title
          state
          updatedAt
        }
      }`;
      })
    );

    const query = `mutation BatchCreateIssues {\n${mutations.join('\n')}\n}`;

    // Single HTTP request for all issues
    const data = await graphqlRequest(query, GraphQLBatchMutationSchema);

    // Check for top-level errors
    if (data.errors && data.errors.length > 0) {
      for (const err of data.errors) {
        errors.push(err.message);
      }
    }

    // Parse results
    for (let i = 0; i < issues.length; i++) {
      const result = data.data?.[`i${i}`];
      const issueData = result?.issue;
      const originalIssue = issues[i];
      if (issueData && originalIssue) {
        results.push({
          number: issueData.number,
          url: issueData.url,
          title: issueData.title,
          body: originalIssue.body || '',
          state: issueData.state.toLowerCase() as IssueState,
          labels: originalIssue.labels,
          updatedAt: issueData.updatedAt,
        });
      } else if (originalIssue) {
        errors.push(`Failed to create issue ${i}: ${originalIssue.title}`);
      }
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  return { results, errors };
}
