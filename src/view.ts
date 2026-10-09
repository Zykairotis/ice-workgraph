/**
 * ICE TUI surface for the work graph: a task-list widget above the editor,
 * the `/workgraph` command, and a compact renderer for dispatch wake
 * messages. Every UI call is guarded by `ctx.hasUI`, so print, JSON and RPC
 * sessions never touch the UI.
 *
 * Reads reuse the TTL-cached graph state from context.ts (one `bd ready`
 * probe per TTL); Workgraph tool executions invalidate it so the widget shows
 * a claim, release or approval on the next refresh.
 */
import type { ExtensionAPI, ExtensionContext } from "@zykairotis/ice-coding-agent";
import { Box, Text } from "@zykairotis/ice-tui";
import { ICE_WORKGRAPH_NAME, ICE_WORKGRAPH_TOOL_PREFIX } from "./branding.ts";
import { cachedGraphState, type GraphState, invalidateGraphState } from "./context.ts";
import { DISPATCH_MESSAGE_TYPE } from "./dispatch.ts";
import { heldLeases, type HeldLease } from "./lease.ts";
import { formatCountdown } from "./status.ts";
import type { BeadsIssue } from "./types.ts";

/** The `setWidget` key this extension owns. */
export const WIDGET_KEY = "ice-workgraph";
/** Issues listed per section; counts cover the rest. */
export const WIDGET_LIST_LIMIT = 3;

export interface WorkgraphViewOptions {
  /** Clock injection (tests). */
  now?: () => number;
  /** Cache TTL override (tests). */
  ttlMs?: number;
}

function issueLine(marker: string, issue: BeadsIssue): string {
  const title = issue.title.length > 72 ? `${issue.title.slice(0, 72)}…` : issue.title;
  return `${marker} ${issue.id} [P${issue.priority}] ${title}`;
}

/** Widget lines for the work graph, or undefined when there is nothing to show. */
export function renderWorkgraphWidget(
  state: GraphState,
  held: HeldLease[],
  nowMs: number,
): string[] | undefined {
  if (!state.initialized) return undefined;
  if (held.length === 0 && state.approvedCount === 0 && state.awaitingApprovalCount === 0) return undefined;
  const lines = [
    `${ICE_WORKGRAPH_NAME} · ${held.length} held · ${state.approvedCount} ready · ${state.awaitingApprovalCount} awaiting approval`,
  ];
  for (const lease of held) {
    lines.push(`▸ ${lease.issueId} · lease ${formatCountdown(Date.parse(lease.expiresAt) - nowMs)} · epoch ${lease.epoch}`);
  }
  for (const issue of state.approvedTop.slice(0, WIDGET_LIST_LIMIT)) lines.push(issueLine("○", issue));
  if (state.approvedCount > WIDGET_LIST_LIMIT) lines.push(`  …${state.approvedCount - WIDGET_LIST_LIMIT} more ready`);
  for (const issue of state.awaitingApprovalTop.slice(0, WIDGET_LIST_LIMIT)) lines.push(issueLine("?", issue));
  if (state.awaitingApprovalCount > WIDGET_LIST_LIMIT)
    lines.push(`  …${state.awaitingApprovalCount - WIDGET_LIST_LIMIT} more awaiting approval`);
  return lines;
}

/** Plain-text report for `/workgraph`; always returns something to show. */
export function renderWorkgraphReport(state: GraphState, held: HeldLease[], nowMs: number, ready: boolean): string {
  if (!state.initialized) return `${ICE_WORKGRAPH_NAME}: no beads workspace here (run \`bd init\`), or bd is not installed.`;
  if (ready) {
    if (state.approvedCount === 0) return `${ICE_WORKGRAPH_NAME}: no approved issues ready to dispatch.`;
    return [
      `${ICE_WORKGRAPH_NAME}: ${state.approvedCount} ready`,
      ...state.approvedTop.map((issue) => issueLine("○", issue)),
    ].join("\n");
  }
  return (
    renderWorkgraphWidget(state, held, nowMs)?.join("\n") ??
    `${ICE_WORKGRAPH_NAME}: nothing held, ready, or awaiting approval.`
  );
}

/** Short display text for a dispatch wake message: its first line. */
export function dispatchSummary(content: unknown): string {
  const text =
    typeof content === "string"
      ? content
      : Array.isArray(content)
        ? content
            .map((part) => (part && typeof part === "object" && "text" in part ? String(part.text) : ""))
            .join("")
        : "";
  return text.split("\n", 1)[0] ?? "";
}

export function registerWorkgraphView(pi: ExtensionAPI, opts: WorkgraphViewOptions = {}): void {
  const now = opts.now ?? Date.now;
  const cacheOpts = { now, ...(opts.ttlMs !== undefined ? { ttlMs: opts.ttlMs } : {}) };
  let refreshing: Promise<void> | undefined;

  async function refresh(ctx: ExtensionContext): Promise<void> {
    if (!ctx.hasUI) return;
    const state = await cachedGraphState(ctx.cwd, cacheOpts);
    ctx.ui.setWidget(WIDGET_KEY, renderWorkgraphWidget(state, heldLeases(ctx.cwd), now()));
  }

  // One refresh at a time; overlapping triggers coalesce into the running one.
  function schedule(ctx: ExtensionContext): Promise<void> {
    refreshing ??= refresh(ctx)
      .catch(() => {})
      .finally(() => {
        refreshing = undefined;
      });
    return refreshing;
  }

  pi.on("session_start", (_event, ctx) => schedule(ctx));
  pi.on("agent_settled", (_event, ctx) => schedule(ctx));
  pi.on("session_compact", (_event, ctx) => schedule(ctx));
  pi.on("tool_execution_end", (event, ctx) => {
    if (!event.toolName.startsWith(ICE_WORKGRAPH_TOOL_PREFIX)) return;
    invalidateGraphState(ctx.cwd);
    return schedule(ctx);
  });
  pi.on("session_shutdown", (_event, ctx) => {
    if (ctx.hasUI) ctx.ui.setWidget(WIDGET_KEY, undefined);
  });

  pi.registerCommand("workgraph", {
    description: "Show the work graph: held, ready, and awaiting-approval issues (/workgraph [status|ready|refresh])",
    getArgumentCompletions: (prefix) =>
      ["status", "ready", "refresh"]
        .filter((name) => name.startsWith(prefix.trim()))
        .map((name) => ({ value: name, label: name })),
    handler: async (args, ctx) => {
      const sub = args.trim() || "status";
      if (!["status", "ready", "refresh"].includes(sub)) {
        if (ctx.hasUI) ctx.ui.notify(`Unknown /workgraph subcommand "${sub}". Use status, ready, or refresh.`, "warning");
        return;
      }
      invalidateGraphState(ctx.cwd);
      const state = await cachedGraphState(ctx.cwd, cacheOpts);
      if (!ctx.hasUI) return;
      ctx.ui.setWidget(WIDGET_KEY, renderWorkgraphWidget(state, heldLeases(ctx.cwd), now()));
      if (sub !== "refresh") ctx.ui.notify(renderWorkgraphReport(state, heldLeases(ctx.cwd), now(), sub === "ready"), "info");
    },
  });

  pi.registerMessageRenderer(DISPATCH_MESSAGE_TYPE, (message, { expanded, outputPad }, theme) => {
    const summary = dispatchSummary(message.content);
    const text = expanded
      ? `${theme.fg("accent", summary)}\n${String(typeof message.content === "string" ? message.content : "")
          .split("\n")
          .slice(1)
          .join("\n")}`
      : `${theme.fg("accent", summary)} ${theme.fg("dim", "(expand for the work prompt)")}`;
    const box = new Box(outputPad, 1, (line) => theme.bg("customMessageBg", line));
    box.addChild(new Text(text.trimEnd(), 0, 0));
    return box;
  });
}
