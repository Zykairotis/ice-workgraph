#!/usr/bin/env node
/**
 * Static branding gate for ICE Workgraph.
 *
 * Every legacy Pi Workgraph token in shipped files must be either rebranded or
 * covered by an explicit, reasoned allowance below. Frozen convention-v1 data
 * (`workgraph_*` metadata, `workgraph:v1:*` channels, `WORKGRAPH_*_KEY`
 * constants) is not matched here and must never be renamed to satisfy a scan.
 *
 * Usage: node scripts/check-branding.mjs [root]  (exit 1 on violations)
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

/** Shipped and release-relevant surfaces. Test files may cite legacy names as fixtures. */
export const SCANNED_ROOTS = ["src", "scripts", "docs", "README.md", "UPSTREAM.md", "package.json", ".github"];

/** Legacy tokens. Each rule names the ICE replacement. */
export const LEGACY_RULES = [
  { id: "legacy-package", pattern: /pi-workgraph/, replacement: "@zykairotis/ice-workgraph" },
  { id: "legacy-sdk", pattern: /@earendil-works\//, replacement: "@zykairotis/ice-*" },
  { id: "legacy-upstream-owner", pattern: /gjtorikian/, replacement: "Zykairotis (provenance only)" },
  {
    id: "legacy-tool",
    pattern: /(?<![_a-z])workgraph_(ready|claim|release|close|split|heartbeat|approve|override|status)\b/,
    replacement: "ice_workgraph_*",
  },
  { id: "legacy-flag", pattern: /(?<![-a-z])--workgraph-/, replacement: "--ice-workgraph-*" },
  {
    id: "legacy-env",
    pattern: /(?<![A-Z_])WORKGRAPH_(?![A-Z_]*_KEY\b)[A-Z][A-Z_]*\b/,
    replacement: "ICE_WORKGRAPH_*",
  },
  { id: "legacy-tag", pattern: /\[workgraph\]|<\/?workgraph>/, replacement: "[ice-workgraph] / <ice-workgraph>" },
  { id: "legacy-pi-env", pattern: /\bPI_[A-Z][A-Z_]*/, replacement: "ICE_* or the pi-subagents adapter" },
  { id: "legacy-host", pattern: /\bPi\b/, replacement: "ICE" },
];

/**
 * Reasoned allowances: provenance and credit, the optional upstream pi-subagents
 * bridge (never relabeled ICE-native), and the push guard's legacy readers.
 */
export const ALLOWANCES = [
  { file: "UPSTREAM.md", rules: "*", reason: "upstream provenance and MIT credit" },
  { file: "docs/fork-provenance.md", rules: "*", reason: "fork provenance record" },
  { file: "docs/rebrand-inventory.md", rules: "*", reason: "legacy-to-ICE mapping table" },
  { file: "src/adapters/pi-subagents.ts", rules: "*", reason: "optional external pi-subagents bridge" },
  {
    file: "scripts/git-push-guard.mjs",
    rules: ["legacy-env"],
    match: /\bWORKGRAPH_(STACK_ISSUE|WORKER_ID)\b/,
    reason: "documented legacy push-guard readers",
  },
  {
    file: "scripts/git-push-guard.mjs",
    rules: ["legacy-pi-env"],
    match: /"PI_WORKGRAPH_PUSH_GUARD"/,
    reason: "recognizes hooks installed before the rebrand",
  },
  { file: "scripts/check-branding.mjs", rules: "*", reason: "defines the legacy token rules" },
  {
    file: "docs/git-push-guard.md",
    rules: ["legacy-env"],
    match: /\bWORKGRAPH_(STACK_ISSUE|WORKER_ID)\b/,
    reason: "documented legacy push-guard readers",
  },
  {
    file: "README.md",
    rules: ["legacy-host", "legacy-pi-env"],
    match: /pi-subagents|Pi subagents|Pi adapter|Pi executor|Pi's (model|native skill)|in Pi\b|pi-beads|PI_SUBAGENT/,
    reason: "README sections describing the optional pi-subagents bridge and prior art",
  },
  {
    file: "README.md",
    rules: ["legacy-package", "legacy-upstream-owner"],
    match: /gjtorikian\/pi-workgraph/,
    reason: "upstream credit link",
  },
  {
    file: "CHANGELOG.md",
    rules: "*",
    reason: "historical changelog is preserved verbatim",
  },
];

function walk(path, files) {
  const stats = statSync(path, { throwIfNoEntry: false });
  if (!stats) return;
  if (stats.isDirectory()) {
    for (const entry of readdirSync(path)) walk(join(path, entry), files);
  } else {
    files.push(path);
  }
}

function allowed(file, ruleId, line) {
  return ALLOWANCES.some(
    (allowance) =>
      allowance.file === file &&
      (allowance.rules === "*" || allowance.rules.includes(ruleId)) &&
      (!allowance.match || allowance.match.test(line)),
  );
}

/** Scan one file's text; `file` is the repository-relative POSIX path. */
export function scanText(file, text) {
  if (file.endsWith(".test.ts")) return [];
  const violations = [];
  text.split("\n").forEach((line, index) => {
    for (const rule of LEGACY_RULES) {
      if (rule.pattern.test(line) && !allowed(file, rule.id, line)) {
        violations.push({ file, line: index + 1, rule: rule.id, replacement: rule.replacement, text: line.trim() });
      }
    }
  });
  return violations;
}

export function scanRepository(root) {
  const files = [];
  for (const entry of SCANNED_ROOTS) walk(join(root, entry), files);
  return files.flatMap((path) => scanText(relative(root, path).split(sep).join("/"), readFileSync(path, "utf8")));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = process.argv[2] ?? join(fileURLToPath(new URL(".", import.meta.url)), "..");
  const violations = scanRepository(root);
  for (const violation of violations) {
    console.error(
      `${violation.file}:${violation.line}: ${violation.rule} (use ${violation.replacement}): ${violation.text.slice(0, 160)}`,
    );
  }
  if (violations.length > 0) {
    console.error(`check-branding: ${violations.length} unclassified legacy token(s).`);
    process.exit(1);
  }
  console.log("check-branding: no unclassified legacy tokens.");
}
