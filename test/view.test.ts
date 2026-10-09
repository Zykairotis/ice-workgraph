/**
 * The ICE TUI surface: widget rendering, refresh triggers, the /workgraph
 * command, and the dispatch-message renderer, against a real scratch graph.
 */
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { bindExec } from "../src/bd.ts";
import { type GraphState, resetContextCacheForTest } from "../src/context.ts";
import { DISPATCH_MESSAGE_TYPE } from "../src/dispatch.ts";
import { resetLeasesForTest } from "../src/lease.ts";
import { type BeadsIssue, WORKGRAPH_LIFECYCLE_VERSION_KEY, WORKGRAPH_PHASE_KEY } from "../src/types.ts";
import {
  dispatchSummary,
  registerWorkgraphView,
  renderWorkgraphReport,
  renderWorkgraphWidget,
  WIDGET_KEY,
} from "../src/view.ts";
import { asExtensionAPI, makeEventContext, makeMockPi } from "./helpers/mock-pi.ts";
import { makeScratchGraph, type ScratchGraph } from "./helpers/scratch.ts";

const NOW = Date.parse("2026-10-09T00:00:00Z");
const graphs: ScratchGraph[] = [];

afterEach(() => {
  resetContextCacheForTest();
  resetLeasesForTest();
});
afterAll(() => {
  for (const graph of graphs) graph.cleanup();
});

function issue(id: string, title = `task ${id}`): BeadsIssue {
  return { id, title, status: "open", priority: 2, issue_type: "task" } as BeadsIssue;
}

function state(overrides: Partial<GraphState> = {}): GraphState {
  return {
    initialized: true,
    readyCount: 0,
    readyTop: [],
    approvedCount: 0,
    approvedTop: [],
    awaitingApprovalCount: 0,
    awaitingApprovalTop: [],
    fetchedAt: NOW,
    ...overrides,
  };
}

describe("widget rendering", () => {
  it("hides the widget for an uninitialized or empty graph", () => {
    expect(renderWorkgraphWidget(state({ initialized: false }), [], NOW)).toBeUndefined();
    expect(renderWorkgraphWidget(state(), [], NOW)).toBeUndefined();
  });

  it("lists the held lease, ready work and approvals, folding overflow into counts", () => {
    const lines = renderWorkgraphWidget(
      state({
        approvedCount: 5,
        approvedTop: ["a1", "a2", "a3", "a4", "a5"].map((id) => issue(id)),
        awaitingApprovalCount: 1,
        awaitingApprovalTop: [issue("l1", "x".repeat(100))],
      }),
      [
        {
          cwd: "/w",
          issueId: "h1",
          epoch: 2,
          expiresAt: new Date(NOW + 90_000).toISOString(),
          actor: { worker: "w" },
        } as never,
      ],
      NOW,
    );
    expect(lines).toEqual([
      "ICE Workgraph · 1 held · 5 ready · 1 awaiting approval",
      "▸ h1 · lease 1:30 · epoch 2",
      "○ a1 [P2] task a1",
      "○ a2 [P2] task a2",
      "○ a3 [P2] task a3",
      "  …2 more ready",
      `? l1 [P2] ${"x".repeat(72)}…`,
    ]);
  });

  it("reports ready work and explains an uninitialized workspace", () => {
    expect(renderWorkgraphReport(state({ initialized: false }), [], NOW, false)).toMatch(/bd init/);
    expect(renderWorkgraphReport(state(), [], NOW, true)).toMatch(/no approved issues/);
    expect(renderWorkgraphReport(state({ approvedCount: 1, approvedTop: [issue("a1")] }), [], NOW, true)).toBe(
      "ICE Workgraph: 1 ready\n○ a1 [P2] task a1",
    );
  });

  it("summarizes a dispatch wake message by its first line", () => {
    expect(dispatchSummary("[workgraph dispatch] You are assigned x.\n\nbody")).toBe(
      "[workgraph dispatch] You are assigned x.",
    );
    expect(dispatchSummary([{ type: "text", text: "line one\nline two" }])).toBe("line one");
  });
});

describe("registered view", () => {
  function harness() {
    const graph = makeScratchGraph({ prefix: "view" });
    graphs.push(graph);
    const approved = graph.createIssue("approved work");
    graph.bd([
      "update",
      approved,
      "--set-metadata",
      `${WORKGRAPH_LIFECYCLE_VERSION_KEY}=1`,
      "--set-metadata",
      `${WORKGRAPH_PHASE_KEY}=ready`,
    ]);
    const legacy = graph.createIssue("legacy work");
    const mock = makeMockPi();
    bindExec((command, args, options) => mock.exec(command, args, options));
    registerWorkgraphView(asExtensionAPI(mock), { now: () => NOW });
    return { graph, approved, legacy, mock };
  }

  it("renders on session start, refreshes after Workgraph tools, and clears on shutdown", async () => {
    const { graph, approved, legacy, mock } = harness();
    const event = makeEventContext(graph.dir);
    await mock.emit("session_start", { type: "session_start" }, event.ctx);
    const first = event.widgetCalls.at(-1);
    expect(first?.key).toBe(WIDGET_KEY);
    expect(first?.content?.[0]).toBe("ICE Workgraph · 0 held · 1 ready · 1 awaiting approval");
    expect(first?.content).toEqual(expect.arrayContaining([expect.stringContaining(approved), expect.stringContaining(legacy)]));

    // A Workgraph tool invalidates the cache, so the refresh sees the new state at once.
    graph.bd(["update", legacy, "--status", "closed"]);
    await mock.emit("tool_execution_end", { type: "tool_execution_end", toolName: "ice_workgraph_close" }, event.ctx);
    expect(event.widgetCalls.at(-1)?.content?.[0]).toBe("ICE Workgraph · 0 held · 1 ready · 0 awaiting approval");

    // Other tools never trigger a probe.
    const calls = mock.execCalls.length;
    await mock.emit("tool_execution_end", { type: "tool_execution_end", toolName: "read" }, event.ctx);
    expect(mock.execCalls.length).toBe(calls);

    // A compaction re-renders the widget; the context section is re-injected on the next turn.
    const before = event.widgetCalls.length;
    await mock.emit("session_compact", { type: "session_compact" }, event.ctx);
    expect(event.widgetCalls.length).toBe(before + 1);

    await mock.emit("session_shutdown", { type: "session_shutdown" }, event.ctx);
    expect(event.widgetCalls.at(-1)).toEqual({ key: WIDGET_KEY, content: undefined });
  });

  it("never touches the UI without one", async () => {
    const { graph, mock } = harness();
    const event = makeEventContext(graph.dir, { hasUI: false });
    await mock.emit("session_start", { type: "session_start" }, event.ctx);
    await mock.commands.get("workgraph")?.handler("", event.ctx);
    expect(event.widgetCalls).toEqual([]);
    expect(event.notifications).toEqual([]);
  });

  it("answers /workgraph status and ready, and rejects unknown subcommands", async () => {
    const { graph, approved, mock } = harness();
    const event = makeEventContext(graph.dir);
    const command = mock.commands.get("workgraph");
    expect(command).toBeDefined();
    await command?.handler("ready", event.ctx);
    expect(event.notifications.at(-1)).toEqual({ message: expect.stringContaining(approved), type: "info" });
    await command?.handler("", event.ctx);
    expect(event.notifications.at(-1)?.message).toMatch(/^ICE Workgraph · 0 held · 1 ready · 1 awaiting approval/);
    await command?.handler("bogus", event.ctx);
    expect(event.notifications.at(-1)?.type).toBe("warning");
    expect(mock.messageRenderers.has(DISPATCH_MESSAGE_TYPE)).toBe(true);
  });
});
