import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ICE_WORKGRAPH_NAME, ICE_WORKGRAPH_PACKAGE, ICE_WORKGRAPH_TOOL_PREFIX } from "./branding.ts";
import { CH, PROTOCOL_VERSION } from "./protocol.ts";
import { registerWorkgraphTools } from "./tools.ts";
import { LEASE_EPOCH_KEY, LEASE_EXPIRES_AT_KEY, LEASE_HOLDER_KEY } from "./types.ts";
import { asExtensionAPI, makeMockPi } from "../test/helpers/mock-pi.ts";

describe("ICE Workgraph branded public API and retained protocol", () => {
  it("publishes nine ICE-namespaced tools and no old public workgraph tools", () => {
    const mock = makeMockPi();
    registerWorkgraphTools(asExtensionAPI(mock));
    const names = [...mock.tools.keys()];
    expect(names).toHaveLength(9);
    expect(names.every((name) => name.startsWith(ICE_WORKGRAPH_TOOL_PREFIX))).toBe(true);
    expect(names).toContain("ice_workgraph_approve");
    expect(names).toContain("ice_workgraph_heartbeat");
  });

  it("declares ICE access classes: only ready and status are read-only", () => {
    const mock = makeMockPi();
    registerWorkgraphTools(asExtensionAPI(mock));
    const access = Object.fromEntries(
      [...mock.tools.entries()].map(([name, tool]) => [name, (tool as { access?: string }).access]),
    );
    expect(access).toEqual({
      ice_workgraph_ready: "read",
      ice_workgraph_claim: "write",
      ice_workgraph_release: "write",
      ice_workgraph_close: "write",
      ice_workgraph_split: "write",
      ice_workgraph_approve: "write",
      ice_workgraph_override: "write",
      ice_workgraph_status: "read",
      ice_workgraph_heartbeat: "write",
    });
  });

  it("ships an ICE-native package resource manifest and original license", () => {
    const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
      name: string;
      ice?: { extensions?: string[] };
      pi?: unknown;
      files?: string[];
    };
    expect(ICE_WORKGRAPH_NAME).toBe("ICE Workgraph");
    expect(pkg.name).toBe(ICE_WORKGRAPH_PACKAGE);
    expect(pkg.ice?.extensions).toEqual(["./src/index.ts"]);
    expect(pkg.pi).toBeUndefined();
    expect(pkg.files).toContain("LICENSE.txt");
  });

  it("does not rewrite frozen convention-v1 lease fields or protocol channels", () => {
    expect([LEASE_HOLDER_KEY, LEASE_EPOCH_KEY, LEASE_EXPIRES_AT_KEY]).toEqual([
      "lease_holder",
      "lease_epoch",
      "lease_expires_at",
    ]);
    expect(PROTOCOL_VERSION).toBe(1);
    expect(Object.values(CH)).toHaveLength(12);
    expect(Object.values(CH).every((channel) => channel.startsWith("workgraph:v1:"))).toBe(true);
  });
});