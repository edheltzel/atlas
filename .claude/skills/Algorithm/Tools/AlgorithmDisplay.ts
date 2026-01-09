#!/usr/bin/env bun

/**
 * AlgorithmDisplay - LCARS-style visual display for THE ALGORITHM
 *
 * Shows current effort level, phase progression, and ISC status with
 * Star Trek LCARS-inspired design. Supports voice announcements.
 *
 * Usage:
 *   bun run AlgorithmDisplay.ts show                    # Full display
 *   bun run AlgorithmDisplay.ts phase THINK             # Update phase + voice
 *   bun run AlgorithmDisplay.ts effort THOROUGH         # Show effort banner
 *   bun run AlgorithmDisplay.ts start STANDARD -r "..."  # Start algorithm
 */

import { parseArgs } from "util";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const CLAUDE_DIR = join(homedir(), '.claude');
const STATE_DIR = join(CLAUDE_DIR, 'MEMORY', 'State');
const ISC_PATH = join(CLAUDE_DIR, 'MEMORY', 'Work', 'current-isc.json');
const ALGORITHM_STATE_PATH = join(STATE_DIR, 'algorithm-state.json');

// ANSI color codes - LCARS palette
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";

const LCARS = {
  ORANGE: "\x1b[38;2;255;153;0m",
  GOLD: "\x1b[38;2;204;153;0m",
  YELLOW: "\x1b[38;2;255;204;0m",
  BLUE: "\x1b[38;2;153;204;255m",
  PURPLE: "\x1b[38;2;204;153;255m",
  PINK: "\x1b[38;2;255;153;204m",
  RED: "\x1b[38;2;255;102;102m",
  GREEN: "\x1b[38;2;153;255;153m",
  CYAN: "\x1b[38;2;102;255;255m",
};

const EFFORT_COLORS: Record<string, { fg: string; bg: string; emoji: string }> = {
  TRIVIAL: { fg: LCARS.BLUE, bg: "\x1b[48;2;50;80;120m", emoji: "💭" },
  QUICK: { fg: LCARS.GREEN, bg: "\x1b[48;2;40;100;40m", emoji: "⚡" },
  STANDARD: { fg: LCARS.YELLOW, bg: "\x1b[48;2;120;100;20m", emoji: "📊" },
  THOROUGH: { fg: LCARS.ORANGE, bg: "\x1b[48;2;140;80;0m", emoji: "🔬" },
  DETERMINED: { fg: LCARS.RED, bg: "\x1b[48;2;140;40;40m", emoji: "🎯" },
};

const PHASES = [
  { name: "OBSERVE", icon: "👁️", color: LCARS.CYAN, description: "Understanding request" },
  { name: "THINK", icon: "🧠", color: LCARS.PURPLE, description: "Analyzing requirements" },
  { name: "PLAN", icon: "📋", color: LCARS.BLUE, description: "Sequencing steps" },
  { name: "BUILD", icon: "🔨", color: LCARS.YELLOW, description: "Making testable" },
  { name: "EXECUTE", icon: "⚡", color: LCARS.ORANGE, description: "Doing the work" },
  { name: "VERIFY", icon: "✅", color: LCARS.GREEN, description: "Testing results" },
  { name: "LEARN", icon: "📚", color: LCARS.PINK, description: "Capturing learnings" },
] as const;

type PhaseName = (typeof PHASES)[number]["name"];

interface AlgorithmState {
  currentPhase: PhaseName;
  effortLevel: string;
  iteration: number;
  startTime: string;
  lastPhaseChange: string;
  request?: string;
}

// Voice notification via Atlas voice server
async function announceVoice(message: string): Promise<void> {
  try {
    await fetch("http://localhost:8888/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
  } catch {
    // Voice server not running - silent fail
  }
}

function ensureStateDir(): void {
  if (!existsSync(STATE_DIR)) {
    mkdirSync(STATE_DIR, { recursive: true });
  }
}

function loadState(): AlgorithmState | null {
  try {
    if (existsSync(ALGORITHM_STATE_PATH)) {
      return JSON.parse(readFileSync(ALGORITHM_STATE_PATH, "utf-8"));
    }
  } catch {}
  return null;
}

function saveState(state: AlgorithmState): void {
  ensureStateDir();
  writeFileSync(ALGORITHM_STATE_PATH, JSON.stringify(state, null, 2));
}

function loadISC(): { request: string; effort: string; phase: string; rows: any[]; iteration: number } | null {
  try {
    if (existsSync(ISC_PATH)) {
      const data = readFileSync(ISC_PATH, "utf-8");
      if (data.trim()) {
        return JSON.parse(data);
      }
    }
  } catch {}
  return null;
}

function getPhaseIndex(phase: string): number {
  return PHASES.findIndex((p) => p.name === phase.toUpperCase());
}

function renderEffortBanner(effort: string): string {
  const config = EFFORT_COLORS[effort.toUpperCase()] || EFFORT_COLORS.STANDARD;
  const lines: string[] = [];
  const width = 40;

  const barContent = `${config.emoji} EFFORT: ${effort.toUpperCase()} `.padEnd(width - 4);
  lines.push(`${config.fg}${config.bg}╭${"━".repeat(width - 2)}╮${RESET}`);
  lines.push(`${config.fg}${config.bg}│ ${BOLD}${barContent}${RESET}${config.fg}${config.bg}│${RESET}`);
  lines.push(`${config.fg}${config.bg}╰${"━".repeat(width - 2)}╯${RESET}`);

  return lines.join("\n");
}

function renderFullDisplay(): string {
  const isc = loadISC();
  const state = loadState();

  const effort = isc?.effort || state?.effortLevel || "STANDARD";
  const phase = isc?.phase || state?.currentPhase || "OBSERVE";
  const iteration = isc?.iteration || state?.iteration || 1;
  const request = isc?.request || state?.request || "";

  const lines: string[] = [];

  // Title banner
  lines.push("");
  lines.push(`${LCARS.ORANGE}${"\x1b[48;2;255;153;0m"} THE ${RESET}${LCARS.GOLD}${"\x1b[48;2;204;153;0m"} ALGORITHM ${RESET}${LCARS.ORANGE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮${RESET}`);

  // Request line
  if (request) {
    const truncatedRequest = request.length > 50 ? request.slice(0, 47) + "..." : request;
    lines.push(`${LCARS.ORANGE}│${RESET} ${DIM}Request:${RESET} ${truncatedRequest}`);
  }

  // Effort and iteration
  const effortConfig = EFFORT_COLORS[effort.toUpperCase()] || EFFORT_COLORS.STANDARD;
  lines.push(`${LCARS.ORANGE}│${RESET} ${effortConfig.emoji} ${effortConfig.fg}${effort.toUpperCase()}${RESET} ${DIM}|${RESET} Iteration ${BOLD}${iteration}${RESET}`);
  lines.push(`${LCARS.ORANGE}├━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯${RESET}`);

  // Phase icons row
  const phaseIdx = getPhaseIndex(phase);
  lines.push(`${LCARS.ORANGE}│${RESET}`);

  let phaseIcons = `${LCARS.ORANGE}│${RESET}  `;
  for (let i = 0; i < PHASES.length; i++) {
    const p = PHASES[i];
    const isActive = i === phaseIdx;
    const isComplete = i < phaseIdx;

    if (isActive) {
      phaseIcons += `${"\x1b[48;2;60;60;80m"}${BOLD}${p.color}[${p.icon}]${RESET} `;
    } else if (isComplete) {
      phaseIcons += `${LCARS.GREEN}${p.icon}${RESET} `;
    } else {
      phaseIcons += `${DIM}${p.icon}${RESET} `;
    }
  }
  lines.push(phaseIcons);

  // Phase names row
  let phaseNames = `${LCARS.ORANGE}│${RESET}  `;
  for (let i = 0; i < PHASES.length; i++) {
    const p = PHASES[i];
    const isActive = i === phaseIdx;
    const isComplete = i < phaseIdx;

    const shortName = p.name.slice(0, 3);
    if (isActive) {
      phaseNames += `${BOLD}${p.color}${shortName}${RESET}  `;
    } else if (isComplete) {
      phaseNames += `${LCARS.GREEN}${shortName}${RESET}  `;
    } else {
      phaseNames += `${DIM}${shortName}${RESET}  `;
    }
  }
  lines.push(phaseNames);

  // Current phase description
  if (phaseIdx >= 0) {
    const active = PHASES[phaseIdx];
    lines.push(`${LCARS.ORANGE}│${RESET}`);
    lines.push(`${LCARS.ORANGE}│${RESET}  ${BOLD}${active.color}▶ ${active.name}${RESET} ${DIM}— ${active.description}${RESET}`);
  }

  lines.push(`${LCARS.ORANGE}│${RESET}`);

  // ISC summary if available
  if (isc && isc.rows && isc.rows.length > 0) {
    const pending = isc.rows.filter((r: any) => r.status === "PENDING").length;
    const active = isc.rows.filter((r: any) => r.status === "ACTIVE").length;
    const done = isc.rows.filter((r: any) => r.status === "DONE").length;

    lines.push(`${LCARS.ORANGE}│${RESET}  ${LCARS.BLUE}ISC:${RESET} ${isc.rows.length} rows  ${DIM}|${RESET}  ⏳${pending}  🔄${active}  ${LCARS.GREEN}✅${done}${RESET}`);
  }

  // Footer
  lines.push(`${LCARS.ORANGE}╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯${RESET}`);
  lines.push("");

  return lines.join("\n");
}

async function transitionPhase(newPhase: string, announce: boolean = true): Promise<void> {
  const isc = loadISC();
  const state = loadState() || {
    currentPhase: "OBSERVE" as PhaseName,
    effortLevel: "STANDARD",
    iteration: 1,
    startTime: new Date().toISOString(),
    lastPhaseChange: new Date().toISOString(),
  };

  const oldPhase = isc?.phase || state.currentPhase;
  const normalizedNewPhase = newPhase.toUpperCase() as PhaseName;

  const phaseInfo = PHASES.find((p) => p.name === normalizedNewPhase);
  if (!phaseInfo) {
    console.error(`Invalid phase: ${newPhase}`);
    console.error(`Valid phases: ${PHASES.map((p) => p.name).join(", ")}`);
    process.exit(1);
  }

  state.currentPhase = normalizedNewPhase;
  state.lastPhaseChange = new Date().toISOString();
  saveState(state);

  if (announce) {
    const announcement = `Algorithm entering ${normalizedNewPhase} phase. ${phaseInfo.description}.`;
    await announceVoice(announcement);
  }

  console.log("");
  console.log(`${LCARS.ORANGE}━━━━━ PHASE TRANSITION ━━━━━${RESET}`);
  console.log(`${DIM}${oldPhase}${RESET} ${LCARS.GOLD}→${RESET} ${BOLD}${phaseInfo.color}${normalizedNewPhase}${RESET}`);
  console.log(`${phaseInfo.icon} ${phaseInfo.description}`);
  console.log("");
  console.log(renderFullDisplay());
}

async function startAlgorithm(effort: string, request?: string, announce: boolean = true): Promise<void> {
  const normalizedEffort = effort.toUpperCase();
  const config = EFFORT_COLORS[normalizedEffort];

  if (!config) {
    console.error(`Invalid effort level: ${effort}`);
    console.error(`Valid levels: ${Object.keys(EFFORT_COLORS).join(", ")}`);
    process.exit(1);
  }

  const state: AlgorithmState = {
    currentPhase: "OBSERVE",
    effortLevel: normalizedEffort,
    iteration: 1,
    startTime: new Date().toISOString(),
    lastPhaseChange: new Date().toISOString(),
    request,
  };
  saveState(state);

  if (announce) {
    const announcement = `Starting THE ALGORITHM at ${normalizedEffort} effort level.`;
    await announceVoice(announcement);
  }

  console.log("");
  console.log(renderEffortBanner(normalizedEffort));
  console.log("");
  console.log(renderFullDisplay());
}

async function main() {
  const { values, positionals } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      voice: { type: "boolean", short: "v", default: true },
      request: { type: "string", short: "r" },
      help: { type: "boolean", short: "h" },
    },
    allowPositionals: true,
  });

  const command = positionals[0]?.toLowerCase() || "show";

  if (values.help) {
    console.log(`
AlgorithmDisplay - LCARS-style visual display for THE ALGORITHM

USAGE:
  bun run AlgorithmDisplay.ts [command] [args] [options]

COMMANDS:
  show                    Full algorithm status display (default)
  phase <PHASE>           Transition to phase with voice announcement
  effort <LEVEL>          Show effort level banner
  start <LEVEL>           Start algorithm at effort level

OPTIONS:
  -v, --voice             Enable voice announcements (default: true)
  --no-voice              Disable voice announcements
  -r, --request <text>    Request text for context
  -h, --help              Show this help

PHASES:
  OBSERVE  - Understanding the request
  THINK    - Analyzing requirements
  PLAN     - Sequencing steps
  BUILD    - Making criteria testable
  EXECUTE  - Doing the work
  VERIFY   - Testing results
  LEARN    - Capturing learnings

EFFORT LEVELS:
  TRIVIAL, QUICK, STANDARD, THOROUGH, DETERMINED
`);
    return;
  }

  switch (command) {
    case "show":
      console.log(renderFullDisplay());
      break;

    case "phase": {
      const phase = positionals[1];
      if (!phase) {
        console.error("Error: Phase name required");
        process.exit(1);
      }
      await transitionPhase(phase, values.voice);
      break;
    }

    case "effort": {
      const effort = positionals[1];
      if (!effort) {
        console.error("Error: Effort level required");
        process.exit(1);
      }
      console.log("");
      console.log(renderEffortBanner(effort));
      console.log("");
      break;
    }

    case "start": {
      const effort = positionals[1] || "STANDARD";
      await startAlgorithm(effort, values.request, values.voice);
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

main().catch(console.error);
