#!/usr/bin/env bun
// $PAI_DIR/hooks/security-validator.ts
// PreToolUse hook: Validates commands and blocks dangerous operations
// Includes path-level security protection from patterns.yaml

import { sendEventToObservability, getCurrentTimestamp, getSourceApp } from './lib/observability';
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
const CACHE_TTL_MS = 5000; // 5 second cache

// Attack pattern categories
const ATTACK_PATTERNS = {
  // Tier 1: Catastrophic - Always block
  catastrophic: {
    patterns: [
      /rm\s+(-rf?|--recursive)\s+[\/~]/i,           // rm -rf /
      /rm\s+(-rf?|--recursive)\s+\*/i,              // rm -rf *
      />\s*\/dev\/sd[a-z]/i,                        // Overwrite disk
      /mkfs\./i,                                     // Format filesystem
      /dd\s+if=.*of=\/dev/i,                        // dd to device
    ],
    action: 'block',
    message: 'BLOCKED: Catastrophic deletion/destruction detected'
  },

  // Tier 2: Reverse shells - Always block
  reverseShell: {
    patterns: [
      /bash\s+-i\s+>&\s*\/dev\/tcp/i,              // Bash reverse shell
      /nc\s+(-e|--exec)\s+\/bin\/(ba)?sh/i,        // Netcat shell
      /python.*socket.*connect/i,                   // Python socket
      /perl.*socket.*connect/i,                     // Perl socket
      /ruby.*TCPSocket/i,                          // Ruby socket
      /php.*fsockopen/i,                           // PHP socket
      /socat.*exec/i,                              // Socat exec
      /\|\s*\/bin\/(ba)?sh/i,                      // Pipe to shell
    ],
    action: 'block',
    message: 'BLOCKED: Reverse shell pattern detected'
  },

  // Tier 3: Credential theft - Always block
  credentialTheft: {
    patterns: [
      /curl.*\|\s*(ba)?sh/i,                       // curl pipe to shell
      /wget.*\|\s*(ba)?sh/i,                       // wget pipe to shell
      /curl.*(-o|--output).*&&.*chmod.*\+x/i,      // Download and execute
      /base64\s+-d.*\|\s*(ba)?sh/i,                // Base64 decode to shell
    ],
    action: 'block',
    message: 'BLOCKED: Remote code execution pattern detected'
  },

  // Tier 4: Prompt injection indicators - Block and log
  promptInjection: {
    patterns: [
      /ignore\s+(all\s+)?previous\s+instructions/i,
      /disregard\s+(all\s+)?prior\s+instructions/i,
      /you\s+are\s+now\s+(in\s+)?[a-z]+\s+mode/i,
      /new\s+instruction[s]?:/i,
      /system\s+prompt:/i,
      /\[INST\]/i,                                  // LLM injection
      /<\|im_start\|>/i,                           // ChatML injection
    ],
    action: 'block',
    message: 'BLOCKED: Prompt injection pattern detected - logging incident'
  },

  // Tier 5: Environment manipulation - Warn
  envManipulation: {
    patterns: [
      /export\s+(ANTHROPIC|OPENAI|AWS|AZURE)_/i,   // API key export
      /echo\s+\$\{?(ANTHROPIC|OPENAI)_/i,          // Echo API keys
      /env\s*\|.*KEY/i,                            // Dump env with keys
      /printenv.*KEY/i,                            // Print env keys
    ],
    action: 'warn',
    message: 'WARNING: Environment/credential access detected'
  },

  // Tier 6: Git dangerous operations - Require confirmation
  gitDangerous: {
    patterns: [
      /git\s+push.*(-f|--force)/i,                 // Force push
      /git\s+reset\s+--hard/i,                     // Hard reset
      /git\s+clean\s+-fd/i,                        // Clean untracked
      /git\s+checkout\s+--\s+\./i,                 // Discard all changes
    ],
    action: 'confirm',
    message: 'CONFIRM: Potentially destructive git operation'
  },

  // Tier 7: System modification - Log
  systemMod: {
    patterns: [
      /chmod\s+777/i,                              // World writable
      /chown\s+root/i,                             // Change to root
      /sudo\s+/i,                                  // Sudo usage
      /systemctl\s+(stop|disable)/i,               // Stop services
    ],
    action: 'log',
    message: 'LOGGED: System modification command'
  },

  // Tier 8: Network operations - Log
  network: {
    patterns: [
      /ssh\s+/i,                                   // SSH connections
      /scp\s+/i,                                   // SCP transfers
      /rsync.*:/i,                                 // Rsync remote
      /curl\s+(-X\s+POST|--data)/i,               // POST requests
    ],
    action: 'log',
    message: 'LOGGED: Network operation'
  },

  // Tier 9: Data exfiltration patterns - Block
  exfiltration: {
    patterns: [
      /curl.*(@|--upload-file)/i,                  // Upload file
      /tar.*\|.*curl/i,                            // Tar and send
      /zip.*\|.*nc/i,                              // Zip and netcat
    ],
    action: 'block',
    message: 'BLOCKED: Data exfiltration pattern detected'
  },

  // Tier 10: PAI-specific protection - Block
  paiProtection: {
    patterns: [
      /rm.*\.config\/pai/i,                        // Delete PAI config
      /rm.*\.claude/i,                             // Delete Claude config
      /git\s+push.*PAI.*public/i,                  // Push PAI to public
    ],
    action: 'block',
    message: 'BLOCKED: PAI infrastructure protection triggered'
  }
};

/**
 * Load patterns.yaml configuration
 * Returns null if file doesn't exist or has errors
 */
async function loadPatternsConfig(): Promise<PatternsConfig | null> {
  const now = Date.now();

  // Return cached config if still valid
  if (patternsCache && (now - patternsCacheTime) < CACHE_TTL_MS) {
    return patternsCache;
  }

  const patternsPath = join(homedir(), '.dotfiles/atlas/.claude/security/patterns.yaml');

  try {
    const file = Bun.file(patternsPath);
    const exists = await file.exists();

    if (!exists) {
      // File doesn't exist yet - gracefully handle
      return null;
    }

    const content = await file.text();
    const config = parseYaml(content) as PatternsConfig;

    // Update cache
    patternsCache = config;
    patternsCacheTime = now;

    return config;
  } catch (error) {
    console.error('[Security] Failed to load patterns.yaml:', error);
    return null;
  }
}

/**
 * Expand ~ to home directory and resolve path
 */
function expandPath(path: string): string {
  if (path.startsWith('~')) {
    return join(homedir(), path.slice(1));
  }
  if (path.startsWith('$HOME')) {
    return join(homedir(), path.slice(5));
  }
  return resolve(path);
}

/**
 * Check if a path matches a pattern (supports glob-like matching)
 */
function pathMatchesPattern(testPath: string, pattern: string): boolean {
  const expandedPattern = expandPath(pattern);
  const expandedTest = expandPath(testPath);

  // Exact match
  if (expandedTest === expandedPattern) {
    return true;
  }

  // Handle glob patterns
  if (pattern.includes('*')) {
    // Convert glob to regex
    const regexPattern = expandedPattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape special chars
      .replace(/\*\*/g, '{{GLOBSTAR}}')     // Preserve **
      .replace(/\*/g, '[^/]*')              // * matches anything except /
      .replace(/\{\{GLOBSTAR\}\}/g, '.*');  // ** matches anything

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(expandedTest);
  }

  // Check if test path is under the pattern directory
  if (expandedTest.startsWith(expandedPattern + '/')) {
    return true;
  }

  return false;
}

/**
 * Extract file paths from a command string
 * Handles quoted paths, common commands, and various patterns
 */
function extractPaths(command: string): string[] {
  const paths: string[] = [];

  // Common command patterns with their path argument positions
  const commandPatterns: Array<{ regex: RegExp; pathGroups: number[] }> = [
    // Single path commands
    { regex: /\bcat\s+(?:-[a-zA-Z]*\s+)*["']?([^|;&<>"'\s]+)["']?/g, pathGroups: [1] },
    { regex: /\bless\s+["']?([^|;&<>"'\s]+)["']?/g, pathGroups: [1] },
    { regex: /\bhead\s+(?:-[0-9n]+\s+)*["']?([^|;&<>"'\s]+)["']?/g, pathGroups: [1] },
    { regex: /\btail\s+(?:-[0-9nf]+\s+)*["']?([^|;&<>"'\s]+)["']?/g, pathGroups: [1] },
    { regex: /\brm\s+(?:-[rRfiv]*\s+)*["']?([^|;&<>"'\s]+)["']?/g, pathGroups: [1] },
    { regex: /\bmkdir\s+(?:-[p]*\s+)*["']?([^|;&<>"'\s]+)["']?/g, pathGroups: [1] },
    { regex: /\brmdir\s+["']?([^|;&<>"'\s]+)["']?/g, pathGroups: [1] },
    { regex: /\btouch\s+["']?([^|;&<>"'\s]+)["']?/g, pathGroups: [1] },
    { regex: /\bchmod\s+[0-7]+\s+["']?([^|;&<>"'\s]+)["']?/g, pathGroups: [1] },
    { regex: /\bchown\s+\S+\s+["']?([^|;&<>"'\s]+)["']?/g, pathGroups: [1] },

    // Two path commands (source, dest)
    { regex: /\bcp\s+(?:-[rRfiv]*\s+)*["']?([^|;&<>"'\s]+)["']?\s+["']?([^|;&<>"'\s]+)["']?/g, pathGroups: [1, 2] },
    { regex: /\bmv\s+(?:-[fiv]*\s+)*["']?([^|;&<>"'\s]+)["']?\s+["']?([^|;&<>"'\s]+)["']?/g, pathGroups: [1, 2] },
    { regex: /\bln\s+(?:-[sf]*\s+)*["']?([^|;&<>"'\s]+)["']?\s+["']?([^|;&<>"'\s]+)["']?/g, pathGroups: [1, 2] },
    { regex: /\bscp\s+(?:-[rP]*\s+)*["']?([^|;&<>"'\s]+)["']?\s+["']?([^|;&<>"'\s]+)["']?/g, pathGroups: [1, 2] },

    // Output redirection
    { regex: />\s*["']?([^|;&<>"'\s]+)["']?/g, pathGroups: [1] },
    { regex: />>\s*["']?([^|;&<>"'\s]+)["']?/g, pathGroups: [1] },

    // vim/nano/editors
    { regex: /\b(?:vim?|nano|emacs|code)\s+["']?([^|;&<>"'\s]+)["']?/g, pathGroups: [1] },

    // Source command
    { regex: /\bsource\s+["']?([^|;&<>"'\s]+)["']?/g, pathGroups: [1] },
    { regex: /\.\s+["']?([^|;&<>"'\s]+)["']?/g, pathGroups: [1] },
  ];

  // Extract quoted paths (handles spaces)
  const quotedPaths = command.matchAll(/["']([^"']+)["']/g);
  for (const match of quotedPaths) {
    const path = match[1];
    // Only add if it looks like a path
    if (path.includes('/') || path.startsWith('~') || path.startsWith('.')) {
      paths.push(path);
    }
  }

  // Extract paths from command patterns
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

/**
 * Check extracted paths against protected paths from patterns.yaml
 */
async function checkProtectedPaths(
  paths: string[],
  config: PatternsConfig
): Promise<{ allowed: boolean; message?: string; action?: string; severity?: string }> {
  if (!config.protected_paths || config.protected_paths.length === 0) {
    return { allowed: true };
  }

  for (const testPath of paths) {
    for (const rule of config.protected_paths) {
      if (pathMatchesPattern(testPath, rule.path)) {
        const severity = rule.severity.toUpperCase();

        switch (severity) {
          case 'BLOCK':
            return {
              allowed: false,
              message: `BLOCKED: Protected path access - ${rule.reason}`,
              action: 'block',
              severity
            };

          case 'WARN':
            console.error(`[Security] WARNING: Accessing protected path ${testPath} - ${rule.reason}`);
            return {
              allowed: true,
              message: `WARNING: Protected path access - ${rule.reason}`,
              action: 'warn',
              severity
            };

          case 'AUDIT':
            console.error(`[Security] AUDIT: Accessing path ${testPath} - ${rule.reason}`);
            return {
              allowed: true,
              action: 'audit',
              severity
            };
        }
      }
    }
  }

  return { allowed: true };
}

/**
 * Validate command against attack patterns
 */
function validateCommandPatterns(command: string): { allowed: boolean; message?: string; action?: string } {
  // Fast path: Most commands are safe
  if (!command || command.length < 3) {
    return { allowed: true };
  }

  // Check each tier
  for (const [tierName, tier] of Object.entries(ATTACK_PATTERNS)) {
    for (const pattern of tier.patterns) {
      if (pattern.test(command)) {
        const result = {
          allowed: tier.action !== 'block',
          message: tier.message,
          action: tier.action
        };

        // Log security event
        console.error(`[Security] ${tierName}: ${tier.message}`);
        console.error(`[Security] Command: ${command.substring(0, 100)}...`);

        return result;
      }
    }
  }

  return { allowed: true };
}

/**
 * Main validation function combining pattern and path checks
 */
async function validateCommand(command: string): Promise<{ allowed: boolean; message?: string; action?: string }> {
  // First check command patterns (existing functionality)
  const patternResult = validateCommandPatterns(command);
  if (!patternResult.allowed) {
    return patternResult;
  }

  // Load patterns config for path checking
  const config = await loadPatternsConfig();

  if (config) {
    // Extract paths from command
    const paths = extractPaths(command);

    if (paths.length > 0) {
      // Check paths against protected paths
      const pathResult = await checkProtectedPaths(paths, config);

      if (!pathResult.allowed) {
        return pathResult;
      }

      // If there was a warning or audit, merge with pattern result
      if (pathResult.action) {
        return {
          allowed: true,
          message: pathResult.message,
          action: pathResult.action
        };
      }
    }

    // Check against blocked commands from patterns.yaml
    if (config.blocked_commands) {
      for (const rule of config.blocked_commands) {
        try {
          const regex = new RegExp(rule.pattern, 'i');
          if (regex.test(command)) {
            const severity = rule.severity.toUpperCase();

            if (severity === 'BLOCK') {
              return {
                allowed: false,
                message: `BLOCKED: ${rule.reason}`,
                action: 'block'
              };
            } else if (severity === 'WARN') {
              console.error(`[Security] WARNING: ${rule.reason}`);
              return {
                allowed: true,
                message: `WARNING: ${rule.reason}`,
                action: 'warn'
              };
            }
          }
        } catch (e) {
          console.error(`[Security] Invalid regex pattern: ${rule.pattern}`);
        }
      }
    }
  }

  // If pattern check had a non-blocking action, return it
  if (patternResult.action && patternResult.action !== 'block') {
    return patternResult;
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

    // Only validate Bash commands
    if (payload.tool_name !== 'Bash') {
      process.exit(0);
    }

    const command = payload.tool_input?.command;
    if (!command) {
      process.exit(0);
    }

    const validation = await validateCommand(command);

    // Send to observability if configured
    if (validation.action) {
      await sendEventToObservability({
        source_app: getSourceApp(),
        session_id: payload.session_id,
        hook_event_type: 'PreToolUse',
        timestamp: getCurrentTimestamp(),
        tool_name: 'Bash',
        tool_input: { command: command.substring(0, 200) },
        security_action: validation.action,
        security_message: validation.message
      });
    }

    if (!validation.allowed) {
      // Output the block message - Claude Code will see this
      console.log(validation.message);
      console.log(`Command blocked: ${command.substring(0, 100)}...`);

      // Exit with code 2 to signal block (Claude Code specific)
      process.exit(2);
    }

    // Log warnings but allow execution
    if (validation.action === 'warn' || validation.action === 'confirm') {
      console.log(validation.message);
    }

  } catch (error) {
    // Never crash - log error and allow command
    console.error('Security validator error:', error);
  }

  // Exit 0 = allow the command
  process.exit(0);
}

main();
