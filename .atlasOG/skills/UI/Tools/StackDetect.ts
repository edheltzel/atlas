#!/usr/bin/env bun

/**
 * StackDetect - Detect UI framework/stack for constraint set selection
 *
 * Analyzes package.json and project files to determine which constraint
 * set to use from Data/ConstraintSets.yaml
 *
 * Usage:
 *   bun run StackDetect.ts
 *   bun run StackDetect.ts --path /path/to/project
 *   bun run StackDetect.ts --output json
 */

import { parseArgs } from "util";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

type StackType = "tailwind" | "css-modules" | "styled-components" | "vanilla-css" | "universal";
type Confidence = "high" | "medium" | "low";

interface DetectionResult {
  detected: StackType;
  confidence: Confidence;
  indicators: string[];
  constraintSet: string;
  recommendations: string[];
}

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    path: { type: "string", short: "p", default: process.cwd() },
    output: { type: "string", short: "o", default: "text" },
    help: { type: "boolean", short: "h", default: false },
  },
});

if (values.help) {
  console.log(`
StackDetect - Detect UI framework/stack for UI skill constraint selection

Usage:
  bun run StackDetect.ts [options]

Options:
  -p, --path <dir>    Project directory to analyze (default: cwd)
  -o, --output <fmt>  Output format: text, json (default: text)
  -h, --help          Show this help

Examples:
  bun run StackDetect.ts
  bun run StackDetect.ts --path ~/projects/myapp
  bun run StackDetect.ts --output json
`);
  process.exit(0);
}

function detectStack(projectPath: string): DetectionResult {
  const indicators: string[] = [];
  const recommendations: string[] = [];
  let detected: StackType = "universal";
  let confidence: Confidence = "low";

  // Check for package.json
  const packageJsonPath = join(projectPath, "package.json");
  let packageJson: PackageJson = {};

  if (existsSync(packageJsonPath)) {
    try {
      packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
      indicators.push("package.json found");
    } catch {
      indicators.push("package.json found but unreadable");
    }
  } else {
    indicators.push("No package.json found");
    recommendations.push("Create package.json for better detection");
  }

  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  // Check for Tailwind CSS
  if (allDeps["tailwindcss"]) {
    indicators.push("tailwindcss in dependencies");
    detected = "tailwind";
    confidence = "high";

    // Check for Tailwind config
    const tailwindConfigs = [
      "tailwind.config.js",
      "tailwind.config.ts",
      "tailwind.config.mjs",
      "tailwind.config.cjs",
    ];

    for (const config of tailwindConfigs) {
      if (existsSync(join(projectPath, config))) {
        indicators.push(`${config} exists`);
        break;
      }
    }

    // Check for recommended utilities
    if (!allDeps["clsx"] && !allDeps["tailwind-merge"]) {
      recommendations.push("Add clsx and tailwind-merge for cn utility");
    }
    if (!allDeps["framer-motion"] && !allDeps["motion"]) {
      recommendations.push("Consider motion/react for JS animations");
    }
  }

  // Check for styled-components / Emotion
  if (allDeps["styled-components"] || allDeps["@emotion/styled"] || allDeps["@emotion/react"]) {
    if (detected === "universal") {
      detected = "styled-components";
      confidence = "high";
    }
    if (allDeps["styled-components"]) {
      indicators.push("styled-components in dependencies");
    }
    if (allDeps["@emotion/styled"] || allDeps["@emotion/react"]) {
      indicators.push("Emotion in dependencies");
    }
  }

  // Check for CSS Modules (via file patterns)
  const cssModulePatterns = ["*.module.css", "*.module.scss", "*.module.sass"];
  try {
    const glob = new Bun.Glob("**/*.module.{css,scss,sass}");
    const files = Array.from(glob.scanSync({ cwd: projectPath, onlyFiles: true }));
    if (files.length > 0) {
      if (detected === "universal") {
        detected = "css-modules";
        confidence = "medium";
      }
      indicators.push(`${files.length} CSS module file(s) found`);
    }
  } catch {
    // Glob scan failed, skip this check
  }

  // If nothing detected, check for plain CSS
  if (detected === "universal") {
    try {
      const cssGlob = new Bun.Glob("**/*.css");
      const cssFiles = Array.from(cssGlob.scanSync({
        cwd: projectPath,
        onlyFiles: true,
      })).filter(f => !f.includes("node_modules") && !f.includes(".module."));

      if (cssFiles.length > 0) {
        detected = "vanilla-css";
        confidence = "low";
        indicators.push(`${cssFiles.length} CSS file(s) found`);
        recommendations.push("Consider Tailwind CSS for utility-first styling");
      }
    } catch {
      // Glob scan failed
    }
  }

  // If still universal, add recommendations
  if (detected === "universal") {
    recommendations.push("No CSS framework detected");
    recommendations.push("Universal constraints will be applied");
  }

  return {
    detected,
    confidence,
    indicators,
    constraintSet: detected,
    recommendations,
  };
}

function formatText(result: DetectionResult): string {
  const lines = [
    "UI Stack Detection",
    "==================",
    "",
    `Detected: ${result.detected}`,
    `Confidence: ${result.confidence}`,
    `Constraint Set: ${result.constraintSet}`,
    "",
    "Indicators:",
    ...result.indicators.map(i => `  - ${i}`),
  ];

  if (result.recommendations.length > 0) {
    lines.push("", "Recommendations:", ...result.recommendations.map(r => `  - ${r}`));
  }

  return lines.join("\n");
}

// Main execution
const result = detectStack(values.path!);

if (values.output === "json") {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(formatText(result));
}
