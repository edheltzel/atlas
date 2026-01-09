#!/usr/bin/env bun
// ~/.claude/hooks/capture-history.ts
// Captures Claude Code hook events to JSONL for history tracking
// Adapted from PAI history system for Atlas

import { readFileSync, appendFileSync, mkdirSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

interface HookEvent {
  source_app: string;
  session_id: string;
  hook_event_type: string;
  payload: Record<string, any>;
  timestamp: number;
  timestamp_local: string;
}

function getLocalTimestamp(): string {
  const date = new Date();
  const tz = process.env.TIME_ZONE || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const localDate = new Date(date.toLocaleString('en-US', { timeZone: tz }));

  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  const hours = String(localDate.getHours()).padStart(2, '0');
  const minutes = String(localDate.getMinutes()).padStart(2, '0');
  const seconds = String(localDate.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function getEventsFilePath(): string {
  const claudeDir = join(homedir(), '.claude');
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  const monthDir = join(claudeDir, 'MEMORY', 'History', 'raw', `${year}-${month}`);
  if (!existsSync(monthDir)) {
    mkdirSync(monthDir, { recursive: true });
  }

  return join(monthDir, `${year}-${month}-${day}_events.jsonl`);
}

function getSessionMappingFile(): string {
  const claudeDir = join(homedir(), '.claude');
  return join(claudeDir, 'MEMORY', 'State', 'agent-sessions.json');
}

function getAgentForSession(sessionId: string): string {
  try {
    const mappingFile = getSessionMappingFile();
    if (existsSync(mappingFile)) {
      const mappings = JSON.parse(readFileSync(mappingFile, 'utf-8'));
      return mappings[sessionId] || 'main';
    }
  } catch (error) {}
  return 'main';
}

function setAgentForSession(sessionId: string, agentName: string): void {
  try {
    const mappingFile = getSessionMappingFile();
    const stateDir = join(homedir(), '.claude', 'MEMORY', 'State');
    if (!existsSync(stateDir)) {
      mkdirSync(stateDir, { recursive: true });
    }
    let mappings: Record<string, string> = {};
    if (existsSync(mappingFile)) {
      mappings = JSON.parse(readFileSync(mappingFile, 'utf-8'));
    }
    mappings[sessionId] = agentName;
    writeFileSync(mappingFile, JSON.stringify(mappings, null, 2), 'utf-8');
  } catch (error) {}
}

// Categorize event for routing to appropriate history directory
function categorizeEvent(eventType: string, payload: Record<string, any>): string {
  // Check for specific patterns in the payload
  const payloadStr = JSON.stringify(payload).toLowerCase();

  if (payloadStr.includes('research') || payloadStr.includes('explore')) {
    return 'research';
  }
  if (payloadStr.includes('decision') || payloadStr.includes('architect')) {
    return 'decisions';
  }
  if (payloadStr.includes('learn') || payloadStr.includes('solved') || payloadStr.includes('root cause')) {
    return 'learnings';
  }
  if (eventType === 'Stop' || eventType === 'SubagentStop') {
    return 'sessions';
  }
  return 'execution';
}

async function main() {
  try {
    const args = process.argv.slice(2);
    const eventTypeIndex = args.indexOf('--event-type');

    if (eventTypeIndex === -1) {
      console.error('Missing --event-type argument');
      process.exit(0);
    }

    const eventType = args[eventTypeIndex + 1];
    const stdinData = await Bun.stdin.text();
    const hookData = JSON.parse(stdinData);

    const sessionId = hookData.session_id || 'main';
    let agentName = getAgentForSession(sessionId);

    // Track agent type from Task tool calls
    if (hookData.tool_name === 'Task' && hookData.tool_input?.subagent_type) {
      agentName = hookData.tool_input.subagent_type;
      setAgentForSession(sessionId, agentName);
    } else if (eventType === 'SubagentStop' || eventType === 'Stop') {
      agentName = 'main';
      setAgentForSession(sessionId, 'main');
    } else if (process.env.CLAUDE_CODE_AGENT) {
      agentName = process.env.CLAUDE_CODE_AGENT;
      setAgentForSession(sessionId, agentName);
    }

    const event: HookEvent = {
      source_app: agentName,
      session_id: hookData.session_id || 'main',
      hook_event_type: eventType,
      payload: hookData,
      timestamp: Date.now(),
      timestamp_local: getLocalTimestamp()
    };

    // Write to raw events file
    const eventsFile = getEventsFilePath();
    appendFileSync(eventsFile, JSON.stringify(event) + '\n', 'utf-8');

    // Also categorize and route to appropriate directory
    const category = categorizeEvent(eventType, hookData);
    const categoryDir = join(homedir(), '.claude', 'MEMORY', 'History', category);
    if (!existsSync(categoryDir)) {
      mkdirSync(categoryDir, { recursive: true });
    }

  } catch (error) {
    // Silent fail - don't interrupt Claude Code
    console.error('Event capture error:', error);
  }

  process.exit(0);
}

main();
