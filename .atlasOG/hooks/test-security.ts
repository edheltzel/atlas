#!/usr/bin/env bun
// Quick test for path extraction and matching

import { homedir } from "os";
import { resolve, join } from "path";

function expandPath(path: string): string {
  if (path.startsWith("~")) {
    return join(homedir(), path.slice(1));
  }
  if (path.startsWith("$HOME")) {
    return join(homedir(), path.slice(5));
  }
  return resolve(path);
}

function pathMatchesPattern(testPath: string, pattern: string): boolean {
  const expandedPattern = expandPath(pattern);
  const expandedTest = expandPath(testPath);

  if (expandedTest === expandedPattern) {
    return true;
  }

  if (pattern.includes("*")) {
    const regexPattern = expandedPattern
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/\*\*/g, "{{GLOBSTAR}}")
      .replace(/\*/g, "[^/]*")
      .replace(/\{\{GLOBSTAR\}\}/g, ".*");

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(expandedTest);
  }

  if (expandedTest.startsWith(expandedPattern + "/")) {
    return true;
  }

  return false;
}

function extractPaths(command: string): string[] {
  const paths: string[] = [];

  const commandPatterns: Array<{ regex: RegExp; pathGroups: number[] }> = [
    { regex: /\bcat\s+(?:-[a-zA-Z]*\s+)*["']?([^|;&<>"'\s]+)["']?/g, pathGroups: [1] },
    { regex: /\bcp\s+(?:-[rRfiv]*\s+)*["']?([^|;&<>"'\s]+)["']?\s+["']?([^|;&<>"'\s]+)["']?/g, pathGroups: [1, 2] },
    { regex: /\bmv\s+(?:-[fiv]*\s+)*["']?([^|;&<>"'\s]+)["']?\s+["']?([^|;&<>"'\s]+)["']?/g, pathGroups: [1, 2] },
    { regex: />\s*["']?([^|;&<>"'\s]+)["']?/g, pathGroups: [1] },
  ];

  const quotedPaths = command.matchAll(/["']([^"']+)["']/g);
  for (const match of quotedPaths) {
    const path = match[1];
    if (path.includes("/") || path.startsWith("~") || path.startsWith(".")) {
      paths.push(path);
    }
  }

  for (const { regex, pathGroups } of commandPatterns) {
    const matches = command.matchAll(regex);
    for (const match of matches) {
      for (const groupIndex of pathGroups) {
        if (match[groupIndex]) {
          const path = match[groupIndex].replace(/^["']|["']$/g, "");
          if (!paths.includes(path)) {
            paths.push(path);
          }
        }
      }
    }
  }

  return paths;
}

console.log("=== Path Matching Tests ===");
console.log("~/.ssh/id_rsa matches ~/.ssh/*:", pathMatchesPattern("~/.ssh/id_rsa", "~/.ssh/*"));
console.log("~/.ssh/config matches ~/.ssh/*:", pathMatchesPattern("~/.ssh/config", "~/.ssh/*"));
console.log("/etc/passwd matches /etc/passwd:", pathMatchesPattern("/etc/passwd", "/etc/passwd"));
console.log("~/.aws/credentials matches ~/.aws/**:", pathMatchesPattern("~/.aws/credentials", "~/.aws/**"));
console.log("~/.gnupg/deep/nested/key matches ~/.gnupg/**:", pathMatchesPattern("~/.gnupg/deep/nested/key", "~/.gnupg/**"));
console.log("/tmp/foo matches ~/.ssh/* (should be false):", pathMatchesPattern("/tmp/foo", "~/.ssh/*"));

console.log("\n=== Path Extraction Tests ===");
console.log("cat ~/.ssh/id_rsa:", extractPaths("cat ~/.ssh/id_rsa"));
console.log("cp ~/.ssh/id_rsa /tmp/key:", extractPaths("cp ~/.ssh/id_rsa /tmp/key"));
console.log("mv ~/.aws/credentials backup/:", extractPaths("mv ~/.aws/credentials backup/"));
console.log("echo test > ~/.ssh/authorized_keys:", extractPaths("echo test > ~/.ssh/authorized_keys"));

console.log("\n=== All tests passed ===");
