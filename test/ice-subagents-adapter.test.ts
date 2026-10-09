/**
 * The native ICE executor against a fake ICE subagent controller: offers,
 * role routing, worktree artifacts, reviewer diffs, structured verdicts,
 * launch failures, cancellation and status.
 */
import { describe, expect, it } from "vitest";
import {
  findIceSubagentController,
  ICE_SUBAGENTS_EXECUTOR_ID,
  type IceSubagentControllerV1,
  registerIceSubagentsExecutor,
  toIceOutputSchema,
} from "../src/adapters/ice-subagents.ts";
import { DEFAULT_ICE_SUBAGENT_AGENTS, type WorkgraphConfig } from "../src/config.ts";
import { CH, newEnvelope, type RunRequestT } from "../src/protocol.ts";
import { Plan, Verdict } from "../src/types.ts";
import { asExtensionAPI, makeMockPi } from "./helpers/mock-pi.ts";

type StartArgs = Parameters<IceSubagentControllerV1["start"]>;

function fakeController(behavior: {
  result?: Partial<Awaited<ReturnType<IceSubagentControllerV1["start"]>>>;
  fail?: string;
  hold?: boolean;
} = {}) {
  const starts: StartArgs[] = [];
  const stops: string[] = [];
  let release: (() => void) | undefined;
  const controller: IceSubagentControllerV1 = {
    version: 1,
    async start(task, options) {
      starts.push([task, options]);
      if (behavior.fail) throw new Error(behavior.fail);
      options?.onLaunched?.("child-1");
      if (behavior.hold) {
        await new Promise<void>((resolve) => {
          release = resolve;
          options?.signal?.addEventListener("abort", () => resolve(), { once: true });
        });
      }
      return {
        id: "child-1",
        agent: task.agent ?? "general",
        model: { provider: "omni", id: "author-model" },
        outcome: "completed",
        text: "child report",
        truncated: false,
        ...behavior.result,
      };
    },
    async stop(id) {
      stops.push(id);
    },
    preview: (id) =>
      id === "author-1"
        ? { root: "/wt/author-1", changedPaths: [{ status: "M", path: "a.txt" }], patch: "-old\n+new", truncated: false }
        : id === "child-1"
          ? { root: "/wt/child-1", changedPaths: [{ status: "M", path: "a.txt" }], patch: "", truncated: true }
          : undefined,
  };
  return { controller, starts, stops, release: () => release?.() };
}

function setup(options: { enabled?: boolean; controller?: IceSubagentControllerV1 } = {}) {
  const mock = makeMockPi();
  const config = {
    iceSubagentsExecutor:
      options.enabled === false
        ? undefined
        : { enabled: true, agents: { ...DEFAULT_ICE_SUBAGENT_AGENTS }, models: { reviewer: "omni/reviewer-model" } },
  } as WorkgraphConfig;
  registerIceSubagentsExecutor(asExtensionAPI(mock), {
    getConfig: () => config,
    getController: () => options.controller,
  });
  return mock;
}

function request(role: RunRequestT["role"], extra: Partial<RunRequestT> & { artifacts?: string[] } = {}) {
  return {
    ...newEnvelope(),
    executorId: ICE_SUBAGENTS_EXECUTOR_ID,
    issue: { id: "wg-1", title: "Fix the thing", acceptanceCriteria: "tests pass" },
    workflowRunId: `run-${role}`,
    leaseEpoch: 3,
    role,
    attempt: 1,
    workspace: { baseRevision: "HEAD", requiresIsolation: false },
    ...extra,
  };
}

const emitted = (mock: ReturnType<typeof makeMockPi>, channel: string) =>
  mock.busEvents.filter((event) => event.channel === channel).map((event) => event.data as Record<string, unknown>);

describe("ICE subagents executor", () => {
  it("offers only when enabled and the host publishes a controller", () => {
    const { controller } = fakeController();
    for (const [mock, offers] of [
      [setup({ enabled: false, controller }), 0],
      [setup({ controller: undefined }), 0],
      [setup({ controller }), 1],
    ] as const) {
      mock.events.emit(CH.discover, newEnvelope());
      expect(emitted(mock, CH.offer)).toHaveLength(offers);
    }
    const mock = setup({ controller });
    mock.events.emit(CH.discover, newEnvelope());
    expect(emitted(mock, CH.offer)[0]).toMatchObject({
      executorId: "ice-subagents",
      harness: "ice",
      isolation: "worktree",
      roles: ["planner", "implementer", "reviewer", "revision"],
      supportsCancellation: true,
    });
  });

  it("runs implementers in a worktree and reports the child, changed paths and model", async () => {
    const fake = fakeController({ result: { patchState: "open" } });
    const mock = setup({ controller: fake.controller });
    mock.events.emit(CH.runRequest, request("implementer"));
    await mock.flushEvents();
    await new Promise((resolve) => setImmediate(resolve));
    expect(emitted(mock, CH.runAccepted)[0]).toMatchObject({ workflowRunId: "run-implementer", executionState: "starting" });
    const [task] = fake.starts[0]!;
    expect(task).toMatchObject({ agent: "worker", isolation: "worktree" });
    expect(task.prompt).toContain('Issue wg-1: "Fix the thing"');
    expect(task.prompt).toContain("Acceptance criteria: tests pass");
    expect(emitted(mock, CH.runCompleted)[0]).toMatchObject({
      outcome: "success",
      leaseEpoch: 3,
      artifacts: ["ice-subagent:child-1", "M a.txt"],
      provenance: { harness: "ice", profile: "worker", model: "author-model", provider: "omni" },
    });
  });

  it("gives reviewers the author's diff, a separate model, and returns the structured verdict", async () => {
    const verdict = { decision: "accept", findings: [] };
    const fake = fakeController({ result: { payload: verdict, model: { provider: "omni", id: "reviewer-model" } } });
    const mock = setup({ controller: fake.controller });
    mock.events.emit(CH.runRequest, request("reviewer", { artifacts: ["ice-subagent:author-1", "M a.txt"], outputSchema: Verdict }));
    await new Promise((resolve) => setImmediate(resolve));
    const [task] = fake.starts[0]!;
    expect(task).toMatchObject({ agent: "review", model: "omni/reviewer-model" });
    expect(task.outputSchema).toMatchObject({ type: "object", additionalProperties: false });
    expect(task.prompt).toContain('findings[].severity: one of "blocking", "advisory"');
    expect(task.prompt).toContain('top-level "payload" object');
    expect(task.isolation).toBeUndefined();
    expect(task.prompt).toContain("+new");
    expect(task.prompt).toContain("- changed: /wt/author-1/a.txt");
    expect(task.scope).toEqual({ roots: [".", "/wt/author-1"] });
    expect(task.prompt).not.toContain("ice-subagent:author-1");
    expect(emitted(mock, CH.runCompleted)[0]).toMatchObject({ outcome: "success", verdict });
  });

  it("reports a refused launch as a failed execution and rejects unsupported roles", async () => {
    const fake = fakeController({ fail: "Delegation to worker was not approved (deny)." });
    const mock = setup({ controller: fake.controller });
    mock.events.emit(CH.runRequest, request("implementer"));
    await new Promise((resolve) => setImmediate(resolve));
    expect(emitted(mock, CH.runCompleted)[0]).toMatchObject({
      outcome: "failure",
      executionError: expect.stringContaining("not approved"),
      artifacts: [],
    });
    mock.events.emit(CH.runRequest, request("finalizer"));
    expect(emitted(mock, CH.runRejected)[0]).toMatchObject({ reason: "unsupported-role: finalizer" });
  });

  it("cancels a running child without reporting completion, and answers status", async () => {
    const fake = fakeController({ hold: true });
    const mock = setup({ controller: fake.controller });
    mock.events.emit(CH.runRequest, request("implementer"));
    await new Promise((resolve) => setImmediate(resolve));
    mock.events.emit(CH.runStatusRequest, {
      ...newEnvelope(),
      executorId: ICE_SUBAGENTS_EXECUTOR_ID,
      workflowRunId: "run-implementer",
      issueId: "wg-1",
    });
    expect(emitted(mock, CH.runStatus)[0]).toMatchObject({ status: "active" });
    mock.events.emit(CH.runCancel, { ...newEnvelope(), workflowRunId: "run-implementer", issueId: "wg-1" });
    await new Promise((resolve) => setImmediate(resolve));
    expect(fake.stops).toEqual(["child-1"]);
    expect(emitted(mock, CH.runCancelled)).toHaveLength(1);
    expect(fake.starts[0]![1]?.signal?.aborted).toBe(true);
    expect(emitted(mock, CH.runCompleted)).toHaveLength(0);
    mock.events.emit(CH.runStatusRequest, {
      ...newEnvelope(),
      executorId: ICE_SUBAGENTS_EXECUTOR_ID,
      workflowRunId: "run-implementer",
      issueId: "wg-1",
    });
    expect(emitted(mock, CH.runStatus)[1]).toMatchObject({ status: "missing" });
  });

  it("projects workgraph schemas onto ICE's closed subset and keeps enums as hints", () => {
    expect(toIceOutputSchema(Verdict)).toEqual({
      schema: {
        type: "object",
        properties: {
          findings: {
            type: "array",
            items: {
              type: "object",
              properties: {
                criterion: { type: "string" },
                severity: { type: "string" },
                note: { type: "string" },
                evidence: { type: "string" },
              },
              required: ["criterion", "severity"],
              additionalProperties: false,
            },
          },
          summary: { type: "string" },
        },
        required: ["findings"],
        additionalProperties: false,
      },
      hints: ['findings[].severity: one of "blocking", "advisory"'],
    });
    expect(toIceOutputSchema(Plan)?.schema).toMatchObject({ type: "object", additionalProperties: false });
    expect(toIceOutputSchema({ anyOf: [{ type: "string" }, { type: "number" }] })).toBeUndefined();
  });

  it("finds a v1 controller by its global symbol and ignores other shapes", () => {
    const { controller } = fakeController();
    const events = {};
    Object.defineProperty(events, Symbol.for("ice.subagents.controller.v1"), { value: controller });
    expect(findIceSubagentController(events)).toBe(controller);
    const stale = {};
    Object.defineProperty(stale, Symbol.for("ice.subagents.controller.v1"), { value: { version: 2 } });
    expect(findIceSubagentController(stale)).toBeUndefined();
    expect(findIceSubagentController({})).toBeUndefined();
  });
});
