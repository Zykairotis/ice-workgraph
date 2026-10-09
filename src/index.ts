/**
 * ICE Workgraph — ICE extension exposing the beads (bd) work graph as nine
 * typed tools for coordinated agent workers, plus (Phase 3) an in-session
 * dispatch loop, per-turn context injection, ICE-owned compaction, and a
 * status-bar surface.
 *
 * Loads with no build step: ICE's jiti loader consumes this TypeScript
 * directly via the `"ice": { "extensions": ["./src/index.ts"] }` manifest.
 */
import type { ExtensionAPI } from "@zykairotis/ice-coding-agent";
import { registerInSessionExecutor } from "./adapters/in-session.ts";
import { isPiSubagentProcess, registerPiSubagentsExecutor } from "./adapters/pi-subagents.ts";
import { bdBinaryAvailable, bindExec } from "./bd.ts";
import { registerConfigFlags, resolveConfig } from "./config.ts";
import { registerContextInjection } from "./context.ts";
import { registerCoordinator } from "./coordinator.ts";
// registerDispatch is DEPRECATED (phase 2) and no longer wired here — the
// coordinator owns scheduling; MIN_POLL_MS remains the wiring-layer floor.
import { MIN_POLL_MS } from "./dispatch.ts";
import { noteSessionId, setWorkerIdOverride } from "./identity.ts";
import { registerSweep } from "./sweep.ts";
import { registerWorkgraphTools } from "./tools.ts";

export default function iceWorkgraph(pi: ExtensionAPI): void {
  registerConfigFlags(pi);
  bindExec((command, args, options) => pi.exec(command, args, options));
  registerWorkgraphTools(pi);
  // Executor children retain tools, while scheduling and recovery belong to
  // the parent coordinator. pi-subagents child detection stays in that optional adapter.
  if (isPiSubagentProcess()) return;

  // The in-session compatibility executor MUST register before the
  // coordinator: both listen for `agent_settled`, and registration order
  // guarantees the adapter observes the run state from the PREVIOUS tick —
  // a run the coordinator requests during this settle completes on the
  // next one, never instantly (see the adapter's header). It gates itself
  // on `compatInSessionExecutor` (default true) at every event, so a
  // disabled adapter never offers.
  registerInSessionExecutor(pi, { getConfig: () => resolveConfig(pi) });

  // The OPTIONAL pi-subagents bridge (phase 5) — DOUBLE-gated: this outer
  // gate never calls the register function unless `subagentsExecutor` is
  // enabled, and the register function re-checks config + the upstream
  // version gate before subscribing to anything. Registration is deferred
  // to session_start because flags are not readable at load; this handler
  // is registered BEFORE the coordinator's, so a configured bridge's bus
  // subscriptions exist before the first reconciliation/discovery pass.
  let subagentsRegistered = false;
  pi.on("session_start", () => {
    if (subagentsRegistered) return;
    if (resolveConfig(pi).subagentsExecutor?.enabled !== true) return;
    subagentsRegistered = true;
    registerPiSubagentsExecutor(pi, { getConfig: () => resolveConfig(pi) });
  });

  // The coordinator resolves config lazily; the 5 s poll floor lives HERE
  // (the wiring layer), never inside coordinator.ts, so tests inject tiny
  // timers. It registers its own session_start handler, which runs startup
  // RECONCILIATION (src/recovery.ts — re-adopt/complete/abandon/reclaim
  // persisted runs) before the first coordination pass (ticks no-op behind
  // the reconciling latch), then the poll timer; plus an agent_settled tick
  // and an idempotent session_shutdown graceful teardown (in-session runs
  // release immediately; isolated executions get cancel-first semantics).
  registerCoordinator(pi, {
    getConfig: () => {
      const config = resolveConfig(pi);
      return { ...config, pollMs: Math.max(config.pollMs, MIN_POLL_MS) };
    },
  });

  // The production expiry sweep: trusted ICE build sessions only. Each tick calls
  // findExpired() and reclaims each expired lease (fenced — concurrent
  // sweepers elect exactly one winner), then releases it so the issue lands
  // back in the ready pool. The same MIN_POLL_MS floor as dispatch is
  // applied HERE (the wiring layer), never inside sweep.ts, so tests inject
  // tiny intervals.
  registerSweep(pi, {
    getConfig: () => {
      const config = resolveConfig(pi);
      return {
        ...config,
        sweepIntervalMs: Math.max(config.sweepIntervalMs, MIN_POLL_MS),
      };
    },
  });

  registerContextInjection(pi);

  pi.on("session_start", (_event, ctx) => {
    // Probe bd availability up front (the tools throw a one-line install
    // hint when it's missing — the extension itself stays loaded), wire the
    // identity override, and resolve the session-id component of workerId()
    // now that a ctx exists.
    bdBinaryAvailable(true);
    setWorkerIdOverride(resolveConfig(pi).workerIdOverride);
    noteSessionId(ctx.sessionManager.getSessionId());
  });
}
