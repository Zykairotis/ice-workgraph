# Native ICE subagent executor: integration contract

Status: not shipped. ICE Workgraph ships no native ICE subagent executor. The
inherited `pi-subagents` event bridge remains an optional, disabled-by-default
legacy adapter (`--ice-workgraph-subagents-executor`); its upstream event
vocabulary is not part of ICE's subagent API and must not be presented as an
ICE V2 adapter.

## What ICE Subagents V2 exposes today

Reviewed against `@zykairotis/ice-coding-agent` 0.83.0
(`packages/coding-agent/src/subagents/`, exported from `src/index.ts`):

| Surface | Exact API | Usable by an executor? |
| --- | --- | --- |
| Model-facing tools | `agent`, `agent_control`, `agent_patch` | No. Only the model calls them; an extension cannot invoke a tool and await its typed result. |
| Parent hooks | `registerIceSubagentHook(owner: object, id: string, handler: IceHookHandler): () => void` | Observe and gate only. Configured hooks run on `subagent.beforeLaunch`, `subagent.beforeTool`, `subagent.afterTool`, `subagent.beforeAccept`, `subagent.started`, `subagent.checkpoint`, `subagent.attention`, `subagent.completed`, `subagent.failed`, `subagent.cancelled`, `subagent.timedOut`. Hooks cannot launch a child. |
| SDK embedding | `createIceSubagents(options?): IceSubagentsSdk` with `attach(session)`, `overview(): IceSubagentOverview \| undefined`, `respondToApproval(approvalId, answer): boolean` | Read-only status (`IceSubagentOverviewChild`: `id`, `agent`, `name`, `state`, `running`, `turns`, `tokens`, `cost`, ...) and approval answers. No launch, await, or cancel. |
| MCP bridge | `registerIceSubagentMcpAdapter(...)` | Supplies tools to children; not an execution API. |

There is no public, versioned ICE API that lets an extension launch a child,
bind it to an external identity, await a typed result, or cancel it. A native
executor therefore cannot be built on the current surface without calling
internal modules (`subagents/v2/runtime.ts`), which this fork must not do.

## Required ICE API before a native adapter

A native executor needs ICE to export, with a version number:

1. `launch({ agent, task, isolation, correlation })` returning a child ID once
   the run is durably accepted.
2. Await or subscribe to a typed terminal outcome (`completed`, `failed`,
   `cancelled`, `timed_out`) carrying the final text, patch reference, and
   effective model provenance.
3. `cancel(childId)` that resolves only after the run stops.
4. Lookup by correlation for restart reconciliation.

Until then, the coordinator runs only with the in-session compatibility
executor or an explicitly enabled external executor.

## Invariants for any future adapter

- **Discover:** advertise `executorId`, adapter version, exact roles,
  available capacity, isolation, cancellation and reconciliation.
- **Accept:** only acknowledge execution once a real ICE-native run is bound
  to issue ID, workflow-run ID, lease epoch and execution ID.
- **Writer:** use ICE worktree isolation (`isolation: "worktree"`, applied only
  through `agent_patch`) or an approved permission boundary. No permission
  escalation through a subagent and no recursive delegation.
- **Review:** use a separately launched reviewer with independent author
  provenance; self-reported acceptance is not an independent verdict.
- **Planner/verifier:** publish a schema-validated plan/evidence bundle;
  enforce workflow class and risk policy in the workgraph authority.
- **Cancel/repair:** acknowledge cancellation after the run stops or returns
  an explicit terminal state. Never treat silence as completion.
- **Recovery:** reconcile unknown, missing, active and terminal runs on
  restart with no duplicated irreversible mutation.
- **Observability:** bounded progress, artifacts, effective provider/model
  provenance and typed supervisor decision requests; no private chain of
  thought or secrets in the evidence payload.

The adapter must not replace ICE's reasoning loop, mode/permission policy,
session store, model router or compactor.
