#!/usr/bin/env bun
/**
 * GitHub Issues Sync - Main CLI
 *
 * Sync DeepPlan task_plan.md checkboxes with GitHub Issues.
 *
 * Usage:
 *   bun run index.ts sync [--plan path] [--dry-run]
 *   bun run index.ts push [--plan path] [--dry-run]
 *   bun run index.ts pull [--plan path]
 *   bun run index.ts status [--plan path]
 *   bun run index.ts init [--repo owner/repo]
 */

import { parseArgs } from 'util';
import { resolve } from 'path';
import { existsSync } from 'fs';
import { homedir } from 'os';

import type {
  Command,
  CLIOptions,
  SyncResult,
  GitHubSyncConfig,
  SyncState,
  PlanItem,
} from './types';
import { DEFAULT_CONFIG } from './types';

import {
  detectRepo,
  checkGhAuth,
  createIssue,
  closeIssue,
  reopenIssue,
  listIssues,
  ensureLabels,
} from './gh-operations';

import {
  findPlanFile,
  parsePlanFile,
  itemToIssueTitle,
  itemToIssueBody,
  statusToLabels,
  updateMultipleItems,
} from './plan-parser';

import {
  loadState,
  saveState,
  initState,
  findMapping,
  upsertMapping,
  determinePushActions,
  determinePullActions,
  getSyncSummary,
} from './state-manager';

// =============================================================================
// Config Loading
// =============================================================================

function loadConfig(): GitHubSyncConfig {
  const paiDir = process.env.PAI_DIR || resolve(homedir(), '.claude');
  const configPath = resolve(paiDir, 'atlas.yaml');

  if (!existsSync(configPath)) {
    return DEFAULT_CONFIG;
  }

  try {
    const { parse } = require('yaml');
    const content = Bun.file(configPath).text();
    const config = parse(content);
    return { ...DEFAULT_CONFIG, ...config?.github_sync };
  } catch {
    return DEFAULT_CONFIG;
  }
}

// =============================================================================
// Commands
// =============================================================================

async function cmdInit(options: CLIOptions): Promise<void> {
  console.log('Initializing GitHub sync...\n');

  // Check gh auth
  const auth = await checkGhAuth();
  if (!auth.ok) {
    console.error(`Error: ${auth.error}`);
    process.exit(1);
  }

  // Detect repo
  const repo = options.repo || (await detectRepo(process.cwd()));
  if (!repo) {
    console.error('Error: Not a GitHub repository.');
    console.error('Use --repo owner/repo to specify manually.');
    process.exit(1);
  }

  console.log(`Repository: ${repo}`);

  // Load config
  const config = loadConfig();

  // Create labels
  const labels = [
    config.labels.sync_marker,
    config.labels.status_pending,
    config.labels.status_in_progress,
    config.labels.status_completed,
  ];

  console.log('Creating labels...');
  await ensureLabels(repo, labels);

  console.log('\nLabels created:');
  for (const label of labels) {
    console.log(`  - ${label}`);
  }

  console.log('\nInitialization complete!');
  console.log('Run `/atlas:sync-issues push` to sync your plan.');
}

async function cmdStatus(options: CLIOptions): Promise<void> {
  const planPath = options.plan || findPlanFile(process.cwd());
  if (!planPath) {
    console.error('No plan file found. Create one with DeepPlan first.');
    process.exit(1);
  }

  console.log(`Plan: ${planPath}\n`);

  const plan = parsePlanFile(planPath);
  const state = plan.syncState;
  const summary = getSyncSummary(plan.items, state);

  console.log('Status:');
  console.log(`  Total items:  ${summary.total}`);
  console.log(`  Synced:       ${summary.synced}`);
  console.log(`  Pending:      ${summary.pending}`);
  console.log(`  Completed:    ${summary.completed}`);

  if (summary.lastSync) {
    console.log(`  Last sync:    ${new Date(summary.lastSync).toLocaleString()}`);
  } else {
    console.log('  Last sync:    Never');
  }

  if (state?.repo) {
    console.log(`\nLinked to: ${state.repo}`);
  } else {
    console.log('\nNot linked to a repository. Run `init` first.');
  }
}

async function cmdPush(options: CLIOptions): Promise<SyncResult> {
  const result: SyncResult = {
    created: 0,
    updated: 0,
    closed: 0,
    conflicts: [],
    errors: [],
  };

  // Check auth
  const auth = await checkGhAuth();
  if (!auth.ok) {
    result.errors.push(auth.error!);
    return result;
  }

  // Find plan
  const planPath = options.plan || findPlanFile(process.cwd());
  if (!planPath) {
    result.errors.push('No plan file found.');
    return result;
  }

  // Parse plan
  const plan = parsePlanFile(planPath);
  if (plan.items.length === 0) {
    console.log('No items to sync.');
    return result;
  }

  // Detect repo
  const repo = options.repo || plan.syncState?.repo || (await detectRepo(process.cwd()));
  if (!repo) {
    result.errors.push('No repository detected. Run `init` first.');
    return result;
  }

  console.log(`Pushing to ${repo}...`);
  if (options.dryRun) console.log('(dry run)\n');

  // Load config and state
  const config = loadConfig();
  let state = plan.syncState || initState(repo);
  state.repo = repo;

  // Get existing issues
  const existingIssues = await listIssues(repo, {
    labels: [config.labels.sync_marker],
    state: 'all',
  });

  // Determine actions
  const actions = determinePushActions(plan.items, state, existingIssues, config);

  for (const action of actions) {
    try {
      switch (action.type) {
        case 'create': {
          console.log(`Creating: ${action.item.content}`);
          if (!options.dryRun) {
            const labels = [
              config.labels.sync_marker,
              ...statusToLabels(action.item.status, {
                pending: config.labels.status_pending,
                in_progress: config.labels.status_in_progress,
                completed: config.labels.status_completed,
              }),
            ];

            const issue = await createIssue(repo, {
              title: itemToIssueTitle(action.item),
              body: itemToIssueBody(action.item, plan.project),
              labels,
              project: config.project || undefined,
            });

            state = upsertMapping(state, action.item.content, issue.number, issue.url);
            console.log(`  -> Issue #${issue.number}`);
          }
          result.created++;
          break;
        }

        case 'close': {
          console.log(`Closing: #${action.issue!.number} - ${action.item.content}`);
          if (!options.dryRun) {
            await closeIssue(repo, action.issue!.number);
            state = upsertMapping(
              state,
              action.item.content,
              action.issue!.number,
              action.issue!.url
            );
          }
          result.closed++;
          break;
        }

        case 'reopen': {
          console.log(`Reopening: #${action.issue!.number} - ${action.item.content}`);
          if (!options.dryRun) {
            await reopenIssue(repo, action.issue!.number);
            state = upsertMapping(
              state,
              action.item.content,
              action.issue!.number,
              action.issue!.url
            );
          }
          result.updated++;
          break;
        }

        case 'skip': {
          // Silent skip
          break;
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      result.errors.push(`${action.item.content}: ${msg}`);
      console.error(`  Error: ${msg}`);
    }
  }

  // Save state
  if (!options.dryRun) {
    saveState(planPath, state);
  }

  // Summary
  console.log('\nPush complete:');
  console.log(`  Created: ${result.created}`);
  console.log(`  Closed:  ${result.closed}`);
  console.log(`  Updated: ${result.updated}`);
  if (result.errors.length > 0) {
    console.log(`  Errors:  ${result.errors.length}`);
  }

  return result;
}

async function cmdPull(options: CLIOptions): Promise<SyncResult> {
  const result: SyncResult = {
    created: 0,
    updated: 0,
    closed: 0,
    conflicts: [],
    errors: [],
  };

  // Check auth
  const auth = await checkGhAuth();
  if (!auth.ok) {
    result.errors.push(auth.error!);
    return result;
  }

  // Find plan
  const planPath = options.plan || findPlanFile(process.cwd());
  if (!planPath) {
    result.errors.push('No plan file found.');
    return result;
  }

  // Parse plan
  const plan = parsePlanFile(planPath);
  const state = plan.syncState;

  if (!state?.repo) {
    result.errors.push('Plan not synced. Run `push` first.');
    return result;
  }

  console.log(`Pulling from ${state.repo}...\n`);

  // Load config
  const config = loadConfig();

  // Get existing issues
  const existingIssues = await listIssues(state.repo, {
    labels: [config.labels.sync_marker],
    state: 'all',
  });

  // Determine pull actions
  const updates = determinePullActions(plan.items, state, existingIssues, config);

  if (updates.length === 0) {
    console.log('Everything up to date.');
    return result;
  }

  // Apply updates
  const itemUpdates = updates.map(({ item, newStatus }) => ({
    content: item.content,
    status: newStatus,
  }));

  console.log('Updating local plan:');
  for (const update of updates) {
    console.log(`  [${update.newStatus}] ${update.item.content}`);
    result.updated++;
  }

  updateMultipleItems(planPath, itemUpdates);

  // Update sync timestamps
  const newState = { ...state, last_sync: new Date().toISOString() };
  for (const update of updates) {
    upsertMapping(newState, update.item.content, update.issue.number, update.issue.url);
  }
  saveState(planPath, newState);

  console.log(`\nPull complete: ${result.updated} items updated.`);
  return result;
}

async function cmdSync(options: CLIOptions): Promise<SyncResult> {
  console.log('Running two-way sync...\n');

  // Push first
  console.log('--- PUSH ---');
  const pushResult = await cmdPush(options);

  console.log('\n--- PULL ---');
  const pullResult = await cmdPull(options);

  // Combine results
  return {
    created: pushResult.created,
    updated: pushResult.updated + pullResult.updated,
    closed: pushResult.closed,
    conflicts: [...pushResult.conflicts, ...pullResult.conflicts],
    errors: [...pushResult.errors, ...pullResult.errors],
  };
}

// =============================================================================
// Main
// =============================================================================

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      plan: { type: 'string', short: 'p' },
      repo: { type: 'string', short: 'r' },
      'dry-run': { type: 'boolean', short: 'n' },
      help: { type: 'boolean', short: 'h' },
    },
    allowPositionals: true,
  });

  if (values.help || positionals.length === 0) {
    console.log(`
GitHub Issues Sync - Sync DeepPlan with GitHub Issues

Usage:
  bun run index.ts <command> [options]

Commands:
  sync      Two-way sync (push + pull)
  push      Push plan items to GitHub issues
  pull      Pull issue updates to plan
  status    Show sync status
  init      Initialize repo with labels

Options:
  -p, --plan <path>   Path to task_plan.md
  -r, --repo <repo>   GitHub repo (owner/repo)
  -n, --dry-run       Show what would be done
  -h, --help          Show this help
`);
    process.exit(0);
  }

  const command = positionals[0] as Command;
  const options: CLIOptions = {
    command,
    plan: values.plan,
    repo: values.repo,
    dryRun: values['dry-run'],
  };

  try {
    switch (command) {
      case 'init':
        await cmdInit(options);
        break;
      case 'status':
        await cmdStatus(options);
        break;
      case 'push':
        await cmdPush(options);
        break;
      case 'pull':
        await cmdPull(options);
        break;
      case 'sync':
        await cmdSync(options);
        break;
      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
