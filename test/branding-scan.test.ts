/**
 * The static branding gate (`scripts/check-branding.mjs`) as a black box: it
 * passes on this repository, fails on every legacy public token, and leaves
 * frozen convention-v1 identities and reasoned allowances alone.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const SCRIPT = fileURLToPath(new URL("../scripts/check-branding.mjs", import.meta.url));
const REPO = fileURLToPath(new URL("..", import.meta.url));

const temps: string[] = [];
afterEach(() => {
  for (const dir of temps.splice(0)) rmSync(dir, { recursive: true, force: true });
});

function fixture(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "ice-workgraph-branding-"));
  temps.push(root);
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return root;
}

function scan(root: string): { status: number; output: string } {
  try {
    return { status: 0, output: execFileSync(process.execPath, [SCRIPT, root], { encoding: "utf8", stdio: "pipe" }) };
  } catch (error) {
    const e = error as { status?: number; stdout?: string; stderr?: string };
    return { status: e.status ?? -1, output: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
}

describe("static branding gate", () => {
  it("passes on the shipped repository surfaces", () => {
    expect(scan(REPO)).toMatchObject({ status: 0 });
  });

  it("fails on every legacy public token outside an allowance", () => {
    const result = scan(
      fixture({
        "src/leak.ts": [
          'import { x } from "@earendil-works/pi-coding-agent";',
          'const name = "pi-workgraph";',
          'pi.registerTool({ name: "workgraph_claim" });',
          'pi.registerFlag("--workgraph-poll-ms");',
          "const ttl = process.env.WORKGRAPH_LEASE_TTL_MS;",
          'log("[workgraph] started");',
          "const dir = process.env.PI_CODING_AGENT_DIR;",
          "// Pi validates arguments",
          "// see gjtorikian",
        ].join("\n"),
      }),
    );
    expect(result.status).toBe(1);
    for (const rule of [
      "legacy-sdk",
      "legacy-package",
      "legacy-tool",
      "legacy-flag",
      "legacy-env",
      "legacy-tag",
      "legacy-pi-env",
      "legacy-host",
      "legacy-upstream-owner",
    ]) {
      expect(result.output).toContain(`src/leak.ts`);
      expect(result.output).toContain(rule);
    }
  });

  it("leaves frozen v1 identities, provenance, and the optional pi-subagents bridge alone", () => {
    const result = scan(
      fixture({
        "src/types.ts": [
          'export const WORKGRAPH_PHASE_KEY = "workgraph_phase";',
          'export const CH = { offer: "workgraph:v1:offer" };',
          'export const LEASE = "lease_epoch";',
          'pi.registerTool({ name: "ice_workgraph_claim" });',
          "const ttl = process.env.ICE_WORKGRAPH_LEASE_TTL_MS;",
        ].join("\n"),
        "src/adapters/pi-subagents.ts": "// Pi's child runtime; process.env.PI_SUBAGENT_RUN_ID\n",
        "UPSTREAM.md": "Fork of gjtorikian/pi-workgraph.\n",
        "src/legacy.test.ts": 'const old = "workgraph_claim";\n',
      }),
    );
    expect(result).toMatchObject({ status: 0 });
  });
});
