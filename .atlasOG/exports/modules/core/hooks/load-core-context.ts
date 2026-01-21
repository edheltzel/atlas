#!/usr/bin/env bun
// Core module: load-core-context.ts
// SessionStart hook: Inject CORE skill into Claude's context

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

interface SessionStartPayload {
  session_id: string;
  [key: string]: any;
}

function isSubagentSession(): boolean {
  return process.env.CLAUDE_CODE_AGENT !== undefined ||
         process.env.SUBAGENT === 'true';
}

function getLocalTimestamp(): string {
  const date = new Date();
  const tz = process.env.TIME_ZONE || Intl.DateTimeFormat().resolvedOptions().timeZone;

  try {
    const localDate = new Date(date.toLocaleString('en-US', { timeZone: tz }));
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    const hours = String(localDate.getHours()).padStart(2, '0');
    const minutes = String(localDate.getMinutes()).padStart(2, '0');
    const seconds = String(localDate.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} PST`;
  } catch {
    return new Date().toISOString();
  }
}

async function main() {
  try {
    // Skip for subagents
    if (isSubagentSession()) {
      process.exit(0);
    }

    const stdinData = await Bun.stdin.text();
    if (!stdinData.trim()) {
      process.exit(0);
    }

    const claudeDir = process.env.PAI_DIR || join(homedir(), '.claude');
    const coreSkillPath = join(claudeDir, 'skills', 'CORE', 'SKILL.md');

    if (!existsSync(coreSkillPath)) {
      process.exit(0);
    }

    const skillContent = readFileSync(coreSkillPath, 'utf-8');
    const identityName = process.env.DA || 'Atlas';

    const output = `<system-reminder>
CORE CONTEXT (Auto-loaded at Session Start)

📅 CURRENT DATE/TIME: ${getLocalTimestamp()}

The following context has been loaded from ${coreSkillPath}:

${skillContent}

This context is now active for this session.
</system-reminder>

✅ Context loaded...

Hello, Ed. ${identityName}, standing by.`;

    console.log(output);

  } catch (error) {
    console.error('Context loading error:', error);
  }

  process.exit(0);
}

main();
