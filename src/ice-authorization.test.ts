import { describe, expect, it } from "vitest";
import type { ExtensionContext } from "@zykairotis/ice-coding-agent";
import { canMutateWorkgraph, requireWorkgraphMutation } from "./ice-authorization.ts";
import { registerSweep } from "./sweep.ts";
import { asExtensionAPI, makeEventContext, makeMockPi } from "../test/helpers/mock-pi.ts";

const context = (trusted: boolean, modes: unknown[]): ExtensionContext => ({
  isProjectTrusted: () => trusted,
  sessionManager: { getBranch: () => modes.map((mode) => ({
    type: "custom",
    customType: "ice-safe-verify-state",
    data: { mode },
  })) },
}) as unknown as ExtensionContext;

describe("ICE Workgraph mutation authorization", () => {
  it("denies without a host-managed mode state", () => {
    expect(canMutateWorkgraph(context(true, []))).toBe(false);
  });
  it("denies in plan even when trusted", () => {
    expect(canMutateWorkgraph(context(true, ["plan"]))).toBe(false);
  });
  it("denies untrusted build work", () => {
    expect(canMutateWorkgraph(context(false, ["build"]))).toBe(false);
  });
  it("uses the latest host-managed mode record", () => {
    expect(canMutateWorkgraph(context(true, ["build", "plan"]))).toBe(false);
    expect(canMutateWorkgraph(context(true, ["plan", "build"]))).toBe(true);
  });
  it("fails closed before any mutation", () => {
    expect(() => requireWorkgraphMutation(context(true, ["plan"]))).toThrow(/trusted ICE build/);
    expect(() => requireWorkgraphMutation(context(true, ["build"]))).not.toThrow();
  });
  it("does not start the expiry sweep or query Beads in plan mode", async () => {
    const mock = makeMockPi();
    const sweep = registerSweep(asExtensionAPI(mock), {
      getConfig: () => { throw new Error("plan mode must not resolve sweep config"); },
    });
    const { ctx } = makeEventContext("/tmp/ice-workgraph-read-only", { iceMode: "plan" });
    await mock.emit("session_start", { type: "session_start" }, ctx);
    await sweep.tick(ctx);
    expect(sweep.timerActive()).toBe(false);
    expect(mock.execCalls).toHaveLength(0);
    sweep.teardown();
  });
});