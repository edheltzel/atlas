/**
 * GitHub CLI Operations
 *
 * Wrapper functions for `gh` CLI commands.
 * Uses Bun's shell for subprocess execution.
 */

import type {
  GitHubIssue,
  CreateIssueOptions,
  UpdateIssueOptions,
  IssueState,
} from './types';

// =============================================================================
// Helpers
// =============================================================================

interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

async function runGh(args: string[], cwd?: string): Promise<CommandResult> {
  const proc = Bun.spawn(['gh', ...args], {
    cwd,
    stdout: 'pipe',
    stderr: 'pipe',
  });

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

async function graphqlRequest(query: string): Promise<any> {
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

  return response.json();
}

async function getRepoNodeId(owner: string, repo: string): Promise<string> {
  const cacheKey = `${owner}/${repo}`;
  if (cache.repoIds.has(cacheKey)) {
    return cache.repoIds.get(cacheKey)!;
  }

  const query = `query { repository(owner: "${owner}", name: "${repo}") { id } }`;
  const data = await graphqlRequest(query);

  if (!data.data?.repository?.id) {
    throw new Error(`Repository ${cacheKey} not found`);
  }

  cache.repoIds.set(cacheKey, data.data.repository.id);
  return data.data.repository.id;
}

async function getLabelNodeIds(
  owner: string,
  repo: string,
  labelNames: string[]
): Promise<string[]> {
  if (labelNames.length === 0) return [];

  const cacheKey = `${owner}/${repo}`;
  if (!cache.labelIds.has(cacheKey)) {
    cache.labelIds.set(cacheKey, new Map());
  }
  const repoLabelCache = cache.labelIds.get(cacheKey)!;

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
    const data = await graphqlRequest(query);

    for (const label of data.data?.repository?.labels?.nodes || []) {
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
    const gitCheck = Bun.spawn(['git', 'rev-parse', '--is-inside-work-tree'], {
      cwd,
      stdout: 'pipe',
      stderr: 'pipe',
    });
    if ((await gitCheck.exited) !== 0) return null;

    // Get remote URL
    const remoteProc = Bun.spawn(['git', 'remote', 'get-url', 'origin'], {
      cwd,
      stdout: 'pipe',
      stderr: 'pipe',
    });
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
 */
export async function checkGhAuth(): Promise<{ ok: boolean; error?: string }> {
  try {
    const result = await runGh(['auth', 'status']);
    if (result.exitCode !== 0) {
      return { ok: false, error: 'Not authenticated. Run: gh auth login' };
    }
    return { ok: true };
  } catch {
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
  issues: CreateIssueOptions[]
): Promise<{ results: GitHubIssue[]; errors: string[] }> {
  const [owner, repoName] = repo.split('/');
  const results: GitHubIssue[] = [];
  const errors: string[] = [];

  // Get GitHub token from gh CLI
  const tokenResult = await runGh(['auth', 'token']);
  if (tokenResult.exitCode !== 0) {
    throw new Error('Failed to get GitHub token');
  }
  const token = tokenResult.stdout.trim();

  // Create all issues in parallel using fetch
  const promises = issues.map(async (options, index) => {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}/issues`,
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
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`HTTP ${response.status}: ${error}`);
      }

      const data = await response.json();
      return {
        index,
        issue: {
          number: data.number,
          title: data.title,
          body: data.body || '',
          state: data.state as IssueState,
          labels: data.labels?.map((l: { name: string }) => l.name) || [],
          updatedAt: data.updated_at,
          url: data.html_url,
        },
      };
    } catch (error) {
      return {
        index,
        error: error instanceof Error ? error.message : String(error),
      };
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
  issueNumbers: number[]
): Promise<{ closed: number[]; errors: string[] }> {
  const [owner, repoName] = repo.split('/');
  const closed: number[] = [];
  const errors: string[] = [];

  const tokenResult = await runGh(['auth', 'token']);
  if (tokenResult.exitCode !== 0) {
    throw new Error('Failed to get GitHub token');
  }
  const token = tokenResult.stdout.trim();

  const promises = issueNumbers.map(async (number) => {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}/issues/${number}`,
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

      return { number, success: true };
    } catch (error) {
      return {
        number,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
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
 */
export async function listIssues(
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
  const [owner, repoName] = repo.split('/');
  const results: GitHubIssue[] = [];
  const errors: string[] = [];

  if (issues.length === 0) {
    return { results, errors };
  }

  try {
    // Get repo node ID (cached)
    const repoId = await getRepoNodeId(owner, repoName);

    // Get label IDs for all unique labels (cached)
    const allLabels = [...new Set(issues.flatMap((i) => i.labels))];
    await getLabelNodeIds(owner, repoName, allLabels);
    const labelCache = cache.labelIds.get(`${owner}/${repoName}`)!;

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
    const data = await graphqlRequest(query);

    // Check for top-level errors
    if (data.errors && data.errors.length > 0) {
      for (const err of data.errors) {
        errors.push(err.message);
      }
    }

    // Parse results
    for (let i = 0; i < issues.length; i++) {
      const result = data.data?.[`i${i}`];
      if (result?.issue) {
        results.push({
          number: result.issue.number,
          url: result.issue.url,
          title: result.issue.title,
          body: issues[i].body || '',
          state: result.issue.state.toLowerCase() as IssueState,
          labels: issues[i].labels,
          updatedAt: result.issue.updatedAt,
        });
      } else {
        errors.push(`Failed to create issue ${i}: ${issues[i].title}`);
      }
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  return { results, errors };
}
