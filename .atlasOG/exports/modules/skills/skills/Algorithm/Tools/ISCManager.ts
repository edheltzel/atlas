#!/usr/bin/env bun

/**
 * ISCManager - Manage Ideal State Criteria tables for THE ALGORITHM
 *
 * Creates, updates, and queries ISC tables that track work toward ideal state.
 *
 * Usage:
 *   bun run ISCManager.ts create --request "Add dark mode"
 *   bun run ISCManager.ts add --description "Tests pass" --source IMPLICIT
 *   bun run ISCManager.ts update --row 1 --status DONE
 *   bun run ISCManager.ts show
 */

import { parseArgs } from "util";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";

type Source = "EXPLICIT" | "INFERRED" | "IMPLICIT";
type Status = "PENDING" | "ACTIVE" | "DONE" | "ADJUSTED" | "BLOCKED";
type VerifyResult = "PASS" | "ADJUSTED" | "BLOCKED";

interface ISCRow {
  id: number;
  description: string;
  source: Source;
  status: Status;
  parallel: boolean;
  capability?: string;
  capabilityIcon?: string;
  result?: string;
  adjustedReason?: string;
  blockedReason?: string;
  verifyResult?: VerifyResult;
  timestamp: string;
}

interface ISCTable {
  request: string;
  effort: string;
  created: string;
  lastModified: string;
  phase: string;
  iteration: number;
  rows: ISCRow[];
  log: string[];
}

const CLAUDE_DIR = join(homedir(), '.claude');
const ISC_DIR = join(CLAUDE_DIR, 'MEMORY', 'Work');
const CURRENT_ISC_PATH = join(ISC_DIR, 'current-isc.json');

const CAPABILITY_ICONS: Record<string, string> = {
  research: "🔬",
  thinking: "💡",
  debate: "🗣️",
  analysis: "🔍",
  execution: "🤖",
  verification: "✅",
  models: "⚡",
  composition: "🧩",
};

function ensureDir() {
  if (!existsSync(ISC_DIR)) {
    mkdirSync(ISC_DIR, { recursive: true });
  }
}

function loadISC(): ISCTable | null {
  if (!existsSync(CURRENT_ISC_PATH)) {
    return null;
  }
  const content = readFileSync(CURRENT_ISC_PATH, "utf-8");
  if (!content.trim()) return null;
  return JSON.parse(content) as ISCTable;
}

function saveISC(isc: ISCTable) {
  ensureDir();
  isc.lastModified = new Date().toISOString();
  writeFileSync(CURRENT_ISC_PATH, JSON.stringify(isc, null, 2));
}

function createISC(request: string, effort: string): ISCTable {
  const isc: ISCTable = {
    request,
    effort,
    created: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    phase: "OBSERVE",
    iteration: 1,
    rows: [],
    log: [`[${new Date().toISOString()}] ISC created for: ${request}`],
  };
  saveISC(isc);
  return isc;
}

function addRow(isc: ISCTable, description: string, source: Source, parallel: boolean = true): ISCRow {
  const row: ISCRow = {
    id: isc.rows.length + 1,
    description,
    source,
    status: "PENDING",
    parallel,
    timestamp: new Date().toISOString(),
  };
  isc.rows.push(row);
  isc.log.push(`[${new Date().toISOString()}] Added row ${row.id}: ${description} (${source})`);
  saveISC(isc);
  return row;
}

function updateRowStatus(isc: ISCTable, rowId: number, status: Status, reason?: string): ISCRow | null {
  const row = isc.rows.find((r) => r.id === rowId);
  if (!row) return null;

  const oldStatus = row.status;
  row.status = status;

  if (status === "ADJUSTED" && reason) row.adjustedReason = reason;
  if (status === "BLOCKED" && reason) row.blockedReason = reason;

  isc.log.push(`[${new Date().toISOString()}] Row ${rowId}: ${oldStatus} → ${status}${reason ? ` (${reason})` : ""}`);
  saveISC(isc);
  return row;
}

function setVerifyResult(isc: ISCTable, rowId: number, result: VerifyResult, reason?: string): ISCRow | null {
  const row = isc.rows.find((r) => r.id === rowId);
  if (!row) return null;

  row.verifyResult = result;
  if (result === "ADJUSTED" && reason) {
    row.adjustedReason = reason;
    row.status = "ADJUSTED";
  }
  if (result === "BLOCKED" && reason) {
    row.blockedReason = reason;
    row.status = "BLOCKED";
  }

  isc.log.push(`[${new Date().toISOString()}] Verify row ${rowId}: ${result}${reason ? ` (${reason})` : ""}`);
  saveISC(isc);
  return row;
}

function setCapability(isc: ISCTable, rowId: number, capability: string): ISCRow | null {
  const row = isc.rows.find((r) => r.id === rowId);
  if (!row) return null;

  row.capability = capability;
  const category = capability.split(".")[0];
  row.capabilityIcon = CAPABILITY_ICONS[category] || "🤖";

  isc.log.push(`[${new Date().toISOString()}] Row ${rowId}: capability → ${capability}`);
  saveISC(isc);
  return row;
}

function setPhase(isc: ISCTable, phase: string) {
  const oldPhase = isc.phase;
  isc.phase = phase;
  isc.log.push(`[${new Date().toISOString()}] Phase: ${oldPhase} → ${phase}`);
  saveISC(isc);
}

function incrementIteration(isc: ISCTable) {
  isc.iteration++;
  isc.log.push(`[${new Date().toISOString()}] Starting iteration ${isc.iteration}`);
  saveISC(isc);
}

function formatTable(isc: ISCTable): string {
  let output = `## ISC: ${isc.request.slice(0, 50)}${isc.request.length > 50 ? '...' : ''}\n\n`;
  output += `**Effort:** ${isc.effort} | **Phase:** ${isc.phase} | **Iteration:** ${isc.iteration}\n\n`;
  output += `| # | What Ideal Looks Like | Source | Capability | Status |\n`;
  output += `|---|----------------------|--------|------------|--------|\n`;

  for (const row of isc.rows) {
    let desc = row.description;
    if (row.adjustedReason) desc += ` *(adjusted: ${row.adjustedReason})*`;
    if (row.blockedReason) desc += ` *(blocked: ${row.blockedReason})*`;

    let capDisplay = "—";
    if (row.capability) {
      const icon = row.capabilityIcon || "🤖";
      const capName = row.capability.split(".").pop() || row.capability;
      capDisplay = `${icon} ${capName}`;
      if (row.parallel) capDisplay += "×";
    }

    const statusEmoji: Record<Status, string> = {
      PENDING: "⏳",
      ACTIVE: "🔄",
      DONE: "✅",
      ADJUSTED: "🔧",
      BLOCKED: "🚫",
    };
    const statusDisplay = `${statusEmoji[row.status]} ${row.status}`;
    output += `| ${row.id} | ${desc} | ${row.source} | ${capDisplay} | ${statusDisplay} |\n`;
  }

  output += `\n**Legend:** 🔬 Research | 💡 Thinking | 🗣️ Debate | 🔍 Analysis | 🤖 Execution | ✅ Verify | × Parallel\n`;
  return output;
}

function formatLog(isc: ISCTable): string {
  let output = `## Evolution Log\n\n`;
  for (const entry of isc.log) {
    output += `${entry}\n`;
  }
  return output;
}

function getSummary(isc: ISCTable) {
  return {
    total: isc.rows.length,
    pending: isc.rows.filter((r) => r.status === "PENDING").length,
    active: isc.rows.filter((r) => r.status === "ACTIVE").length,
    done: isc.rows.filter((r) => r.status === "DONE").length,
    adjusted: isc.rows.filter((r) => r.status === "ADJUSTED").length,
    blocked: isc.rows.filter((r) => r.status === "BLOCKED").length,
    parallelizable: isc.rows.filter((r) => r.parallel && r.status === "PENDING").length,
  };
}

async function main() {
  const { values, positionals } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      request: { type: "string", short: "r" },
      effort: { type: "string", short: "e", default: "STANDARD" },
      description: { type: "string", short: "d" },
      source: { type: "string", short: "s" },
      row: { type: "string" },
      status: { type: "string" },
      result: { type: "string" },
      reason: { type: "string" },
      phase: { type: "string", short: "p" },
      capability: { type: "string", short: "c" },
      parallel: { type: "boolean", default: true },
      output: { type: "string", short: "o", default: "text" },
      help: { type: "boolean", short: "h" },
    },
    allowPositionals: true,
  });

  const command = positionals[0];

  if (values.help || !command) {
    console.log(`
ISCManager - Manage Ideal State Criteria tables

USAGE:
  bun run ISCManager.ts <command> [options]

COMMANDS:
  create     Create new ISC table
  add        Add a row to current ISC
  update     Update row status
  capability Set capability for a row
  verify     Set verification result
  phase      Set current phase
  iterate    Increment iteration counter
  show       Display current ISC table
  log        Show evolution log
  summary    Show status summary
  clear      Clear current ISC

OPTIONS:
  -r, --request <text>    Request text (for create)
  -e, --effort <level>    Effort level (for create)
  -d, --description <text> Row description (for add)
  -s, --source <type>     Source: EXPLICIT, INFERRED, IMPLICIT
  --row <id>              Row ID (for update/verify/capability)
  --status <status>       Status: PENDING, ACTIVE, DONE, ADJUSTED, BLOCKED
  -c, --capability <cap>  Capability name
  --result <result>       Verify result: PASS, ADJUSTED, BLOCKED
  --reason <text>         Reason for adjustment/block
  -p, --phase <phase>     Phase name
  -o, --output <fmt>      Output format: text, json, markdown
  -h, --help              Show this help
`);
    return;
  }

  switch (command) {
    case "create": {
      if (!values.request) {
        console.error("Error: --request is required");
        process.exit(1);
      }
      const isc = createISC(values.request, values.effort || "STANDARD");
      console.log(`ISC created for: ${values.request}`);
      console.log(`Effort: ${isc.effort}`);
      console.log(`Saved to: ${CURRENT_ISC_PATH}`);
      break;
    }

    case "add": {
      const isc = loadISC();
      if (!isc) {
        console.error("Error: No current ISC. Use 'create' first.");
        process.exit(1);
      }
      if (!values.description) {
        console.error("Error: --description is required");
        process.exit(1);
      }
      const source = (values.source?.toUpperCase() || "EXPLICIT") as Source;
      if (!["EXPLICIT", "INFERRED", "IMPLICIT"].includes(source)) {
        console.error("Error: --source must be EXPLICIT, INFERRED, or IMPLICIT");
        process.exit(1);
      }
      const row = addRow(isc, values.description, source, values.parallel);
      console.log(`Added row ${row.id}: ${row.description} (${row.source})`);
      break;
    }

    case "update": {
      const isc = loadISC();
      if (!isc) {
        console.error("Error: No current ISC.");
        process.exit(1);
      }
      if (!values.row || !values.status) {
        console.error("Error: --row and --status are required");
        process.exit(1);
      }
      const status = values.status.toUpperCase() as Status;
      if (!["PENDING", "ACTIVE", "DONE", "ADJUSTED", "BLOCKED"].includes(status)) {
        console.error("Error: Invalid status");
        process.exit(1);
      }
      const row = updateRowStatus(isc, parseInt(values.row), status, values.reason);
      if (!row) {
        console.error(`Error: Row ${values.row} not found`);
        process.exit(1);
      }
      console.log(`Row ${row.id}: ${row.status}`);
      break;
    }

    case "capability": {
      const isc = loadISC();
      if (!isc) {
        console.error("Error: No current ISC.");
        process.exit(1);
      }
      if (!values.row || !values.capability) {
        console.error("Error: --row and --capability are required");
        process.exit(1);
      }
      const row = setCapability(isc, parseInt(values.row), values.capability);
      if (!row) {
        console.error(`Error: Row ${values.row} not found`);
        process.exit(1);
      }
      console.log(`Row ${row.id}: capability → ${row.capability} (${row.capabilityIcon})`);
      break;
    }

    case "verify": {
      const isc = loadISC();
      if (!isc) {
        console.error("Error: No current ISC.");
        process.exit(1);
      }
      if (!values.row || !values.result) {
        console.error("Error: --row and --result are required");
        process.exit(1);
      }
      const result = values.result.toUpperCase() as VerifyResult;
      if (!["PASS", "ADJUSTED", "BLOCKED"].includes(result)) {
        console.error("Error: --result must be PASS, ADJUSTED, or BLOCKED");
        process.exit(1);
      }
      const row = setVerifyResult(isc, parseInt(values.row), result, values.reason);
      if (!row) {
        console.error(`Error: Row ${values.row} not found`);
        process.exit(1);
      }
      console.log(`Row ${row.id} verified: ${result}`);
      break;
    }

    case "phase": {
      const isc = loadISC();
      if (!isc) {
        console.error("Error: No current ISC.");
        process.exit(1);
      }
      if (!values.phase) {
        console.error("Error: --phase is required");
        process.exit(1);
      }
      setPhase(isc, values.phase.toUpperCase());
      console.log(`Phase set to: ${isc.phase}`);
      break;
    }

    case "iterate": {
      const isc = loadISC();
      if (!isc) {
        console.error("Error: No current ISC.");
        process.exit(1);
      }
      incrementIteration(isc);
      console.log(`Now on iteration: ${isc.iteration}`);
      break;
    }

    case "show": {
      const isc = loadISC();
      if (!isc) {
        console.error("No current ISC.");
        process.exit(1);
      }
      if (values.output === "json") {
        console.log(JSON.stringify(isc, null, 2));
      } else {
        console.log(formatTable(isc));
      }
      break;
    }

    case "log": {
      const isc = loadISC();
      if (!isc) {
        console.error("No current ISC.");
        process.exit(1);
      }
      console.log(formatLog(isc));
      break;
    }

    case "summary": {
      const isc = loadISC();
      if (!isc) {
        console.error("No current ISC.");
        process.exit(1);
      }
      const summary = getSummary(isc);
      if (values.output === "json") {
        console.log(JSON.stringify({ ...summary, phase: isc.phase, iteration: isc.iteration }, null, 2));
      } else {
        console.log(`ISC Summary: ${isc.request}`);
        console.log(`Phase: ${isc.phase} | Iteration: ${isc.iteration}`);
        console.log(`Total: ${summary.total} | Pending: ${summary.pending} | Active: ${summary.active}`);
        console.log(`Done: ${summary.done} | Adjusted: ${summary.adjusted} | Blocked: ${summary.blocked}`);
      }
      break;
    }

    case "clear": {
      if (existsSync(CURRENT_ISC_PATH)) {
        const isc = loadISC();
        if (isc) {
          const archivePath = join(ISC_DIR, `archive-${Date.now()}.json`);
          writeFileSync(archivePath, JSON.stringify(isc, null, 2));
          console.log(`Archived to: ${archivePath}`);
        }
        writeFileSync(CURRENT_ISC_PATH, "");
        console.log("Current ISC cleared.");
      } else {
        console.log("No current ISC to clear.");
      }
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

main().catch(console.error);
