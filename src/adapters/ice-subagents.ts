/**
 * Native ICE executor: runs workgraph roles as ICE Subagents V2 children
 * through the controller ICE publishes on the shared `ice.events` object
 * (`Symbol.for("ice.subagents.controller.v1")`). The controller applies the
 * `agent` tool's preflight, launch approvals, permission caps and depth
 * limit, so this adapter never widens authority.
 *
 * - Implementers and revisions run in an ICE worktree (`worker` agent by
 *   default). Their patch stays open and uninspected; integration remains an
 *   explicit `agent_patch` decision. Completion artifacts carry
 *   `ice-subagent:<childId>` plus the changed paths.
 * - Reviewers are separate read-only children (independent provenance). They
 *   receive the author's diff, read through the controller's non-pinning
 *   preview of every `ice-subagent:<id>` artifact under review.
 * - Planner and reviewer verdicts ride the child's validated structured
 *   payload (`plan` / `verdict`); a missing payload is passed through as
 *   absent so the coordinator's invalid-result path decides.
 *
 * Opt-in (`--ice-workgraph-ice-subagents`), and silent when the host has no
 * controller. Runs die with the session: status requests about unknown runs
 * answer `missing`, as the in-session executor does.
 */
import type { ExtensionAPI } from "@zykairotis/ice-coding-agent";
import type { IceSubagentsRole, WorkgraphConfig } from "../config.ts";
import {
  CH,
  Discover,
  type ExecutorOfferT,
  newEnvelope,
  parseMessage,
  type RunCompletedT,
  RunCancel,
  RunRequest,
  type RunRequestT,
  RunStatusRequest,
  type RunStatusT,
} from "../protocol.ts";

export const ICE_SUBAGENTS_EXECUTOR_ID = "ice-subagents";
export const ICE_SUBAGENTS_ADAPTER_VERSION = "1.0.0";
export const ICE_SUBAGENTS_ROLES: IceSubagentsRole[] = ["planner", "implementer", "reviewer", "revision"];
export const ICE_SUBAGENTS_MAX_CONCURRENCY = 4;
/** Preferred over the in-session executor and the pi-subagents bridge when both offer. */
export const ICE_SUBAGENTS_PRIORITY = 20;
export const ICE_SUBAGENT_ARTIFACT_PREFIX = "ice-subagent:";
const CONTROLLER_KEY = Symbol.for("ice.subagents.controller.v1");
const MAX_PROMPT_CHARS = 60_000;
const MAX_REVIEW_DIFF_BYTES = 32 * 1024;
const MAX_EVIDENCE_TEXT = 2_000;

/** The v1 controller shape, declared structurally so older ICE hosts load this module unchanged. */
export interface IceSubagentControllerV1 {
  readonly version: 1;
  start(
    task: {
      agent?: string;
      model?: string;
      description: string;
      prompt: string;
      isolation?: "none" | "worktree";
      outputSchema?: Record<string, unknown>;
      scope?: { roots: string[] };
    },
    options?: { signal?: AbortSignal; onLaunched?: (id: string) => void },
  ): Promise<{
    id: string;
    agent: string;
    model?: { provider: string; id: string };
    outcome: "completed" | "failed" | "cancelled" | "interrupted" | "budget_exhausted";
    text: string;
    truncated: boolean;
    error?: string;
    patchState?: string;
    payload?: Readonly<Record<string, unknown>>;
  }>;
  stop(id: string): Promise<void>;
  /** Optional on early v1 hosts: children whose worktree patch awaits `agent_patch`. */
  openPatches?(): ReadonlyArray<{ id: string; name?: string; agent: string; description: string }>;
  preview(
    id: string,
    maxBytes?: number,
  ):
    | { root: string; changedPaths: ReadonlyArray<{ status: string; path: string }>; patch: string; truncated: boolean }
    | undefined;
}

/** The host controller, when ICE Subagents V2 publishes one on this event bus. */
export function findIceSubagentController(events: object): IceSubagentControllerV1 | undefined {
  const candidate = (events as Record<symbol, unknown>)[CONTROLLER_KEY] as Partial<IceSubagentControllerV1> | undefined;
  return candidate?.version === 1 &&
    typeof candidate.start === "function" &&
    typeof candidate.stop === "function" &&
    typeof candidate.preview === "function"
    ? (candidate as IceSubagentControllerV1)
    : undefined;
}

export interface IceSubagentsDeps {
  getConfig: () => WorkgraphConfig;
  /** Controller lookup (tests); defaults to the host's event-bus controller. */
  getController?: () => IceSubagentControllerV1 | undefined;
  now?: () => number;
}

interface ActiveRun {
  workflowRunId: string;
  executionId: string;
  issueId: string;
  leaseEpoch: number;
  abort: AbortController;
  childId?: string;
  cancelled: boolean;
}

export interface IceSubagentsController {
  activeRuns(): ReadonlyMap<string, Readonly<ActiveRun>>;
  teardown(): void;
}

/**
 * Project a protocol output schema onto ICE's strict subset (type,
 * properties, required, items; closed objects). Value constraints ICE cannot
 * express (`enum`) become prompt hints; the coordinator still validates the
 * returned payload against the full schema. Undefined when the schema uses a
 * shape ICE cannot represent (unions, open types).
 */
export function toIceOutputSchema(
  schema: unknown,
): { schema: Record<string, unknown>; hints: string[] } | undefined {
  const hints: string[] = [];
  const types = new Set(["object", "array", "string", "number", "integer", "boolean", "null"]);
  const project = (node: unknown, path: string): Record<string, unknown> | undefined => {
    if (node === null || typeof node !== "object" || Array.isArray(node)) return undefined;
    const value = node as Record<string, unknown>;
    if (typeof value.type !== "string" || !types.has(value.type)) return undefined;
    if (Array.isArray(value.enum)) hints.push(`${path || "payload"}: one of ${value.enum.map((item) => JSON.stringify(item)).join(", ")}`);
    if (value.type === "array") {
      const items = project(value.items, `${path}[]`);
      return items ? { type: "array", items } : undefined;
    }
    if (value.type !== "object") return { type: value.type };
    const properties: Record<string, unknown> = {};
    const raw = (value.properties ?? {}) as Record<string, unknown>;
    for (const [name, child] of Object.entries(raw)) {
      const projected = project(child, path ? `${path}.${name}` : name);
      if (!projected) return undefined;
      properties[name] = projected;
    }
    return {
      type: "object",
      properties,
      ...(Array.isArray(value.required) ? { required: value.required.filter((name) => name in properties) } : {}),
      additionalProperties: false,
    };
  };
  const projected = project(schema, "");
  return projected ? { schema: projected, hints } : undefined;
}

function isIceRole(role: string): role is IceSubagentsRole {
  return (ICE_SUBAGENTS_ROLES as string[]).includes(role);
}

function childIdsOf(artifacts: readonly string[] | undefined): string[] {
  return (artifacts ?? [])
    .filter((artifact) => artifact.startsWith(ICE_SUBAGENT_ARTIFACT_PREFIX))
    .map((artifact) => artifact.slice(ICE_SUBAGENT_ARTIFACT_PREFIX.length));
}

/** An author patch a reviewer reads: the open worktree and its bounded diff. */
export interface ReviewedPatch {
  root: string;
  changedPaths: readonly string[];
  diff: string;
}

/** An open ICE patch produced for a workgraph issue, awaiting `agent_patch`. */
export interface PendingIssuePatch {
  issueId: string;
  childId: string;
  childName?: string;
}

/** Open patches whose child this adapter launched (description `implementer|revision <issue>: ...`). */
export function pendingIssuePatches(controller: IceSubagentControllerV1 | undefined): PendingIssuePatch[] {
  return (controller?.openPatches?.() ?? []).flatMap((patch) => {
    const match = /^(?:implementer|revision) (\S+): /.exec(patch.description);
    return match ? [{ issueId: match[1]!, childId: patch.id, ...(patch.name ? { childName: patch.name } : {}) }] : [];
  });
}

/** The child's task prompt. Workgraph tools are not available to children; the coordinator owns the issue. */
export function buildIceSubagentPrompt(
  msg: RunRequestT & { artifacts?: string[] },
  reviewed: readonly ReviewedPatch[] = [],
  payload?: { hints: readonly string[] },
): string {
  const lines = [
    `[ice-workgraph ${msg.role}] Issue ${msg.issue.id}: "${msg.issue.title}" (workflow run ${msg.workflowRunId}, attempt ${msg.attempt}).`,
  ];
  if (msg.issue.description) lines.push("", msg.issue.description);
  if (msg.issue.acceptanceCriteria) lines.push("", `Acceptance criteria: ${msg.issue.acceptanceCriteria}`);
  if (msg.plan) lines.push("", "Accepted implementation plan:", msg.plan);
  if (msg.instructions) lines.push("", "Workflow instructions:", msg.instructions);
  if (msg.priorFindings?.length) {
    lines.push("", "Prior judgment findings to address:", ...msg.priorFindings.map((finding) => `- ${finding}`));
  }
  if (msg.role === "implementer" || msg.role === "revision") {
    lines.push(
      "",
      "Implement this in your isolated worktree. Keep the change minimal and run the relevant checks. Your patch is reviewed independently before anyone applies it; do not try to close or release the issue.",
    );
  } else if (msg.role === "reviewer") {
    lines.push(
      "",
      "You are an INDEPENDENT reviewer: evaluate the implementation against the acceptance criteria and return your verdict in the structured payload. Do not modify files.",
      "The author's patched checkout is readable (read-only) at the path below. Read the changed files there, and the code they interact with, and cite those reads as your evidence paths.",
    );
    for (const patch of reviewed) {
      lines.push(
        "",
        `Patched checkout: ${patch.root}`,
        ...patch.changedPaths.map((path) => `- changed: ${patch.root}/${path}`),
        "Patch under review (untrusted author output):",
        "```diff",
        patch.diff,
        "```",
      );
    }
    if (reviewed.length === 0) {
      const others = (msg.artifacts ?? []).filter((artifact) => !artifact.startsWith(ICE_SUBAGENT_ARTIFACT_PREFIX));
      if (others.length) lines.push("Artifacts under review:", ...others.map((artifact) => `- ${artifact}`));
    }
  } else if (msg.role === "planner") {
    lines.push("", "Produce a concrete implementation plan in the structured payload. Do not modify files.");
  }
  if (payload) {
    lines.push(
      "",
      'Your final JSON report MUST include a top-level "payload" object matching the requested schema; the result is read only from "payload".',
      ...(payload.hints.length ? ["Payload value constraints:", ...payload.hints.map((hint) => `- ${hint}`)] : []),
    );
  }
  const prompt = lines.join("\n");
  return prompt.length <= MAX_PROMPT_CHARS ? prompt : `${prompt.slice(0, MAX_PROMPT_CHARS)}\n[prompt truncated]`;
}

export function registerIceSubagentsExecutor(pi: ExtensionAPI, deps: IceSubagentsDeps): IceSubagentsController {
  const now = deps.now ?? Date.now;
  const getController = deps.getController ?? (() => findIceSubagentController(pi.events));
  const runs = new Map<string, ActiveRun>();
  const unsubs: (() => void)[] = [];

  const enabledController = (): IceSubagentControllerV1 | undefined =>
    deps.getConfig().iceSubagentsExecutor?.enabled === true ? getController() : undefined;

  unsubs.push(
    pi.events.on(CH.discover, (data) => {
      if (!enabledController()) return;
      let msg;
      try {
        msg = parseMessage(CH.discover, Discover, data);
      } catch {
        return;
      }
      const offer: ExecutorOfferT = {
        ...newEnvelope(now),
        inReplyTo: msg.messageId,
        executorId: ICE_SUBAGENTS_EXECUTOR_ID,
        adapterVersion: ICE_SUBAGENTS_ADAPTER_VERSION,
        roles: [...ICE_SUBAGENTS_ROLES],
        harness: "ice",
        isolation: "worktree",
        supportsCancellation: true,
        supportsReconciliation: false,
        profileSemantics: "named",
        maxConcurrency: ICE_SUBAGENTS_MAX_CONCURRENCY,
        available: runs.size < ICE_SUBAGENTS_MAX_CONCURRENCY,
        priority: ICE_SUBAGENTS_PRIORITY,
      };
      pi.events.emit(CH.offer, offer);
    }),
  );

  function reject(msg: RunRequestT, reason: string): void {
    pi.events.emit(CH.runRejected, {
      ...newEnvelope(now),
      inReplyTo: msg.messageId,
      workflowRunId: msg.workflowRunId,
      issueId: msg.issue.id,
      leaseEpoch: msg.leaseEpoch,
      executorId: ICE_SUBAGENTS_EXECUTOR_ID,
      reason,
    });
  }

  async function execute(
    controller: IceSubagentControllerV1,
    msg: RunRequestT & { artifacts?: string[] },
    run: ActiveRun,
  ): Promise<void> {
    const role = msg.role as IceSubagentsRole;
    const settings = deps.getConfig().iceSubagentsExecutor;
    const agent = settings?.agents[role];
    const model = settings?.models[role];
    const writer = role === "implementer" || role === "revision";
    const reviewed: ReviewedPatch[] =
      role === "reviewer"
        ? childIdsOf(msg.artifacts).flatMap((id) => {
            try {
              const preview = controller.preview(id, MAX_REVIEW_DIFF_BYTES);
              return preview
                ? [
                    {
                      root: preview.root,
                      changedPaths: preview.changedPaths.map((change) => change.path),
                      diff: `${preview.patch}${preview.truncated ? "\n[diff truncated]" : ""}`,
                    },
                  ]
                : [];
            } catch {
              return [];
            }
          })
        : [];
    const output = msg.outputSchema === undefined ? undefined : toIceOutputSchema(msg.outputSchema);
    const base = {
      ...newEnvelope(now),
      workflowRunId: run.workflowRunId,
      executionId: run.executionId,
      issueId: run.issueId,
      leaseEpoch: run.leaseEpoch,
    };
    let completed: RunCompletedT & { verdict?: unknown; plan?: unknown };
    try {
      const result = await controller.start(
        {
          ...(agent ? { agent } : {}),
          ...(model ? { model } : {}),
          description: `${role} ${msg.issue.id}: ${msg.issue.title}`.slice(0, 120),
          prompt: buildIceSubagentPrompt(msg, reviewed, output),
          ...(reviewed.length ? { scope: { roots: [".", ...reviewed.map((patch) => patch.root)] } } : {}),
          ...(writer ? { isolation: "worktree" as const } : {}),
          ...(output ? { outputSchema: output.schema } : {}),
        },
        {
          signal: run.abort.signal,
          onLaunched: (id) => {
            run.childId = id;
          },
        },
      );
      if (run.cancelled) return;
      const preview = writer && result.patchState === "open" ? controller.preview(result.id, 0) : undefined;
      const summary = result.text.length > MAX_EVIDENCE_TEXT ? `${result.text.slice(0, MAX_EVIDENCE_TEXT)}…` : result.text;
      completed = {
        ...base,
        outcome: result.outcome === "completed" ? "success" : "failure",
        ...(result.outcome === "completed"
          ? {}
          : { executionError: result.error ?? `ICE subagent turn ended ${result.outcome}` }),
        artifacts: [
          `${ICE_SUBAGENT_ARTIFACT_PREFIX}${result.id}`,
          ...(preview?.changedPaths.map((change) => `${change.status} ${change.path}`) ?? []),
        ],
        evidence: [
          `ICE subagent ${result.id} (${result.agent}) turn ${result.outcome}${result.patchState ? `; patch ${result.patchState}` : ""}`,
          ...(summary ? [`child report (untrusted): ${summary}`] : []),
        ],
        provenance: {
          harness: "ice",
          profile: result.agent,
          ...(result.model ? { model: result.model.id, provider: result.model.provider } : {}),
        },
        ...(role === "reviewer" && result.payload ? { verdict: result.payload } : {}),
        ...(role === "planner" && result.payload ? { plan: result.payload } : {}),
      };
    } catch (error) {
      if (run.cancelled) return;
      completed = {
        ...base,
        outcome: "failure",
        executionError: `ICE subagent launch failed: ${error instanceof Error ? error.message : String(error)}`,
        artifacts: run.childId ? [`${ICE_SUBAGENT_ARTIFACT_PREFIX}${run.childId}`] : [],
        evidence: [],
        provenance: { harness: "ice", ...(agent ? { profile: agent } : {}) },
      };
    } finally {
      runs.delete(run.workflowRunId);
    }
    pi.events.emit(CH.runCompleted, completed);
  }

  unsubs.push(
    pi.events.on(CH.runRequest, (data) => {
      let msg: RunRequestT & { artifacts?: string[] };
      try {
        msg = parseMessage(CH.runRequest, RunRequest, data);
      } catch {
        return;
      }
      if (msg.executorId !== ICE_SUBAGENTS_EXECUTOR_ID) return;
      const controller = enabledController();
      if (!controller) return reject(msg, "ice-subagents-unavailable");
      if (!isIceRole(msg.role)) return reject(msg, `unsupported-role: ${msg.role}`);
      if (runs.has(msg.workflowRunId)) return reject(msg, "duplicate-workflow-run");
      if (runs.size >= ICE_SUBAGENTS_MAX_CONCURRENCY) return reject(msg, "busy");
      const run: ActiveRun = {
        workflowRunId: msg.workflowRunId,
        executionId: crypto.randomUUID(),
        issueId: msg.issue.id,
        leaseEpoch: msg.leaseEpoch,
        abort: new AbortController(),
        cancelled: false,
      };
      runs.set(run.workflowRunId, run);
      pi.events.emit(CH.runAccepted, {
        ...newEnvelope(now),
        inReplyTo: msg.messageId,
        workflowRunId: run.workflowRunId,
        executionId: run.executionId,
        issueId: run.issueId,
        leaseEpoch: run.leaseEpoch,
        executorId: ICE_SUBAGENTS_EXECUTOR_ID,
        executionState: "starting",
      });
      void execute(controller, msg, run);
    }),
  );

  unsubs.push(
    pi.events.on(CH.runCancel, (data) => {
      let msg;
      try {
        msg = parseMessage(CH.runCancel, RunCancel, data);
      } catch {
        return;
      }
      const run = runs.get(msg.workflowRunId);
      if (!run || (msg.executionId !== undefined && msg.executionId !== run.executionId)) return;
      run.cancelled = true;
      run.abort.abort();
      runs.delete(run.workflowRunId);
      const stopped = run.childId ? getController()?.stop(run.childId).catch(() => {}) : undefined;
      void Promise.resolve(stopped).then(() =>
        pi.events.emit(CH.runCancelled, {
          ...newEnvelope(now),
          workflowRunId: run.workflowRunId,
          executionId: run.executionId,
          issueId: run.issueId,
        }),
      );
    }),
  );

  unsubs.push(
    pi.events.on(CH.runStatusRequest, (data) => {
      if (!enabledController()) return;
      let msg;
      try {
        msg = parseMessage(CH.runStatusRequest, RunStatusRequest, data);
      } catch {
        return;
      }
      if (msg.executorId !== ICE_SUBAGENTS_EXECUTOR_ID) return;
      const run = runs.get(msg.workflowRunId);
      const status: RunStatusT = {
        ...newEnvelope(now),
        inReplyTo: msg.messageId,
        workflowRunId: msg.workflowRunId,
        issueId: msg.issueId,
        status: run ? "active" : "missing",
        ...(run ? { executionId: run.executionId } : {}),
      };
      pi.events.emit(CH.runStatus, status);
    }),
  );

  pi.on("session_shutdown", () => {
    for (const run of runs.values()) {
      run.cancelled = true;
      run.abort.abort();
    }
    runs.clear();
  });

  return {
    activeRuns: () => runs,
    teardown: () => {
      for (const off of unsubs) off();
      unsubs.length = 0;
      for (const run of runs.values()) run.abort.abort();
      runs.clear();
    },
  };
}
