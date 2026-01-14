#!/usr/bin/env bun
// Security module: security-validator.ts
// PreToolUse hook: Validates commands and blocks dangerous operations

import { parse as parseYaml } from 'yaml';
import { homedir } from 'os';
import { resolve, join } from 'path';

interface PreToolUsePayload {
  session_id: string;
  tool_name: string;
  tool_input: Record<string, any>;
}

interface PathRule {
  path: string;
  severity: 'BLOCK' | 'WARN' | 'AUDIT';
  reason: string;
}

interface PatternsConfig {
  protected_paths?: PathRule[];
  blocked_commands?: Array<{
    pattern: string;
    severity: string;
    reason: string;
  }>;
}

// Cache for patterns.yaml
let patternsCache: PatternsConfig | null = null;
let patternsCacheTime = 0;
const CACHE_TTL_MS = 5000;

// Attack pattern categories
const ATTACK_PATTERNS = {
  catastrophic: {
    patterns: [
      /rm\s+(-rf?|--recursive)\s+[\/~]/i,
      /rm\s+(-rf?|--recursive)\s+\*/i,
      />\s*\/dev\/sd[a-z]/i,
      /mkfs\./i,
      /dd\s+if=.*of=\/dev/i,
    ],
    action: 'block',
    message: 'BLOCKED: Catastrophic deletion/destruction detected'
  },

  reverseShell: {
    patterns: [
      /bash\s+-i\s+>&\s*\/dev\/tcp/i,
      /nc\s+(-e|--exec)\s+\/bin\/(ba)?sh/i,
      /python.*socket.*connect/i,
      /perl.*socket.*connect/i,
      /ruby.*TCPSocket/i,
      /php.*fsockopen/i,
      /socat.*exec/i,
      /\|\s*\/bin\/(ba)?sh/i,
    ],
    action: 'block',
    message: 'BLOCKED: Reverse shell pattern detected'
  },

  credentialTheft: {
    patterns: [
      /curl.*\|\s*(ba)?sh/i,
      /wget.*\|\s*(ba)?sh/i,
      /curl.*(-o|--output).*&&.*chmod.*\+x/i,
      /base64\s+-d.*\|\s*(ba)?sh/i,
    ],
    action: 'block',
    message: 'BLOCKED: Remote code execution pattern detected'
  },

  promptInjection: {
    patterns: [
      /ignore\s+(all\s+)?previous\s+instructions/i,
      /disregard\s+(all\s+)?prior\s+instructions/i,
      /you\s+are\s+now\s+(in\s+)?[a-z]+\s+mode/i,
      /new\s+instruction[s]?:/i,
      /system\s+prompt:/i,
      /\[INST\]/i,
      /<\|im_start\|>/i,
    ],
    action: 'block',
    message: 'BLOCKED: Prompt injection pattern detected'
  },

  envManipulation: {
    patterns: [
      /export\s+(ANTHROPIC|OPENAI|AWS|AZURE)_/i,
      /echo\s+\$\{?(ANTHROPIC|OPENAI)_/i,
      /env\s*\|.*KEY/i,
      /printenv.*KEY/i,
    ],
    action: 'warn',
    message: 'WARNING: Environment/credential access detected'
  },

  gitDangerous: {
    patterns: [
      /git\s+push.*(-f|--force)/i,
      /git\s+reset\s+--hard/i,
      /git\s+clean\s+-fd/i,
      /git\s+checkout\s+--\s+\./i,
    ],
    action: 'confirm',
    message: 'CONFIRM: Potentially destructive git operation'
  },

  exfiltration: {
    patterns: [
      /curl.*(@|--upload-file)/i,
      /tar.*\|.*curl/i,
      /zip.*\|.*nc/i,
    ],
    action: 'block',
    message: 'BLOCKED: Data exfiltration pattern detected'
  },

  configProtection: {
    patterns: [
      /rm.*\.claude/i,
      /rm.*\.config\/claude/i,
    ],
    action: 'block',
    message: 'BLOCKED: Configuration protection triggered'
  }
};

async function loadPatternsConfig(): Promise<PatternsConfig | null> {
  const now = Date.now();

  if (patternsCache && (now - patternsCacheTime) < CACHE_TTL_MS) {
    return patternsCache;
  }

  const claudeDir = process.env.PAI_DIR || join(homedir(), '.claude');
  const patternsPath = join(claudeDir, 'security', 'patterns.yaml');

  try {
    const file = Bun.file(patternsPath);
    const exists = await file.exists();

    if (!exists) {
      return null;
    }

    const content = await file.text();
    const config = parseYaml(content) as PatternsConfig;

    patternsCache = config;
    patternsCacheTime = now;

    return config;
  } catch (error) {
    console.error('[Security] Failed to load patterns.yaml:', error);
    return null;
  }
}

function expandPath(path: string): string {
  if (path.startsWith('~')) {
    return join(homedir(), path.slice(1));
  }
  if (path.startsWith('$HOME')) {
    return join(homedir(), path.slice(5));
  }
  return resolve(path);
}

function pathMatchesPattern(testPath: string, pattern: string): boolean {
  const expandedPattern = expandPath(pattern);
  const expandedTest = expandPath(testPath);

  if (expandedTest === expandedPattern) return true;

  if (pattern.includes('*')) {
    const regexPattern = expandedPattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*\*/g, '{{GLOBSTAR}}')
      .replace(/\*/g, '[^/]*')
      .replace(/\{\{GLOBSTAR\}\}/g, '.*');

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(expandedTest);
  }

  if (expandedTest.startsWith(expandedPattern + '/')) return true;

  return false;
}

function extractPaths(command: string): string[] {
  const paths: string[] = [];

  const commandPatterns: Array<{ regex: RegExp; pathGroups: number[] }> = [
    { regex: /\bcat\s+(?:-[a-zA-Z]*\s+)*["']?([^|;&<>"'\s]+)["']?/g, pathGroups: [1] },
    { regex: /\brm\s+(?:-[rRfiv]*\s+)*["']?([^|;&<>"'\s]+)["']?/g, pathGroups: [1] },
    { regex: /\bcp\s+(?:-[rRfiv]*\s+)*["']?([^|;&<>"'\s]+)["']?\s+["']?([^|;&<>"'\s]+)["']?/g, pathGroups: [1, 2] },
    { regex: /\bmv\s+(?:-[fiv]*\s+)*["']?([^|;&<>"'\s]+)["']?\s+["']?([^|;&<>"'\s]+)["']?/g, pathGroups: [1, 2] },
    { regex: />\s*["']?([^|;&<>"'\s]+)["']?/g, pathGroups: [1] },
  ];

  const quotedPaths = command.matchAll(/["']([^"']+)["']/g);
  for (const match of quotedPaths) {
    const path = match[1];
    if (path.includes('/') || path.startsWith('~') || path.startsWith('.')) {
      paths.push(path);
    }
  }

  for (const { regex, pathGroups } of commandPatterns) {
    const matches = command.matchAll(regex);
    for (const match of matches) {
      for (const groupIndex of pathGroups) {
        if (match[groupIndex]) {
          const path = match[groupIndex].replace(/^["']|["']$/g, '');
          if (!paths.includes(path)) {
            paths.push(path);
          }
        }
      }
    }
  }

  return paths;
}

async function checkProtectedPaths(
  paths: string[],
  config: PatternsConfig
): Promise<{ allowed: boolean; message?: string; action?: string }> {
  if (!config.protected_paths || config.protected_paths.length === 0) {
    return { allowed: true };
  }

  for (const testPath of paths) {
    for (const rule of config.protected_paths) {
      if (pathMatchesPattern(testPath, rule.path)) {
        const severity = rule.severity.toUpperCase();

        if (severity === 'BLOCK') {
          return {
            allowed: false,
            message: `BLOCKED: Protected path access - ${rule.reason}`,
            action: 'block'
          };
        } else if (severity === 'WARN') {
          console.error(`[Security] WARNING: Accessing protected path ${testPath} - ${rule.reason}`);
          return { allowed: true, message: `WARNING: ${rule.reason}`, action: 'warn' };
        }
      }
    }
  }

  return { allowed: true };
}

function validateCommandPatterns(command: string): { allowed: boolean; message?: string; action?: string } {
  if (!command || command.length < 3) {
    return { allowed: true };
  }

  for (const [tierName, tier] of Object.entries(ATTACK_PATTERNS)) {
    for (const pattern of tier.patterns) {
      if (pattern.test(command)) {
        console.error(`[Security] ${tierName}: ${tier.message}`);
        return {
          allowed: tier.action !== 'block',
          message: tier.message,
          action: tier.action
        };
      }
    }
  }

  return { allowed: true };
}

async function validateCommand(command: string): Promise<{ allowed: boolean; message?: string; action?: string }> {
  const patternResult = validateCommandPatterns(command);
  if (!patternResult.allowed) {
    return patternResult;
  }

  const config = await loadPatternsConfig();

  if (config) {
    const paths = extractPaths(command);

    if (paths.length > 0) {
      const pathResult = await checkProtectedPaths(paths, config);
      if (!pathResult.allowed) {
        return pathResult;
      }
    }

    if (config.blocked_commands) {
      for (const rule of config.blocked_commands) {
        try {
          const regex = new RegExp(rule.pattern, 'i');
          if (regex.test(command)) {
            if (rule.severity.toUpperCase() === 'BLOCK') {
              return { allowed: false, message: `BLOCKED: ${rule.reason}`, action: 'block' };
            }
          }
        } catch (e) {
          console.error(`[Security] Invalid regex: ${rule.pattern}`);
        }
      }
    }
  }

  return { allowed: true };
}

async function main() {
  try {
    const stdinData = await Bun.stdin.text();
    if (!stdinData.trim()) {
      process.exit(0);
    }

    const payload: PreToolUsePayload = JSON.parse(stdinData);

    if (payload.tool_name !== 'Bash') {
      process.exit(0);
    }

    const command = payload.tool_input?.command;
    if (!command) {
      process.exit(0);
    }

    const validation = await validateCommand(command);

    if (!validation.allowed) {
      console.log(validation.message);
      process.exit(2);
    }

    if (validation.action === 'warn' || validation.action === 'confirm') {
      console.log(validation.message);
    }

  } catch (error) {
    console.error('Security validator error:', error);
  }

  process.exit(0);
}

main();
