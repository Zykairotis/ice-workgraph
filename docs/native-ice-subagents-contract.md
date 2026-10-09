# Native ICE subagent executor: integration contract

Status: implemented and opt-in (`--ice-workgraph-ice-subagents`). The inherited
`pi-subagents` event bridge stays a separate, disabled-by-default legacy adapter
and is not an ICE V2 adapter.

## ICE surface used

ICE Subagents V2 publishes a versioned controller on the shared `ice.events`
object under `Symbol.for("ice.subagents.controller.v1")` (exported by
`@zykairotis/ice-coding-agent` as `getIceSubagentController` and
`ICE_SUBAGENT_CONTROLLER_KEY`). The adapter declares the v1 shape structurally
and reads the symbol, so older ICE hosts load Workgraph unchanged and simply
receive no offer.

| Controller call | ICE behaviour |
| --- | --- |
| `start(task, { signal, onLaunched })` | The `agent` tool's launch path: task schema, context packet, preflight, launch approval, permission caps, depth limit. Runs the first turn without delivering it to the parent conversation. Returns the turn outcome, text, frozen model, worktree `patchState`, and the validated structured `payload`. |
| `stop(id)` | Stops the child's turn. |
| `preview(id, maxBytes)` | Read-only diff, changed paths and worktree root of an open patch. Never inspects or pins it, so `agent_patch` still gates integration. |

While a child's patch is open, another child of the same parent may **read**
(never write) that worktree without an external-directory approval. This is how
an independent reviewer reads the patched files.

## Adapter contract

- **Discover:** offers `executorId: "ice-subagents"`, roles `planner`,
  `implementer`, `reviewer`, `revision`, isolation `worktree`, cancellation, no
  reconciliation, priority 20, only when enabled and the controller exists.
- **Accept:** acknowledges with `executionState: "starting"`, bound to the issue,
  workflow run, lease epoch and a fresh execution ID. A refused launch completes
  with `outcome: "failure"` and an `executionError`.
- **Writer:** implementers and revisions run the `worker` agent in an ICE
  worktree. Artifacts are `ice-subagent:<childId>` plus changed paths. Patches are
  never applied by Workgraph.
- **Review:** a separate `review` child receives the author's diff and read
  access to the author's worktree. Its validated payload is the verdict.
  Medium/high risk also needs a different reviewer model (`models.reviewer`).
- **Planner:** a `plan` child; its validated payload is the plan.
- **Schemas:** protocol output schemas are projected onto ICE's closed subset;
  `enum` constraints become prompt hints and the coordinator re-validates the
  payload against the full schema.
- **Cancel:** aborts the turn, stops the child, acknowledges `run:cancelled`, and
  never reports completion for the cancelled run.
- **Recovery:** runs end with their session; status requests for unknown runs
  answer `missing`.
- **Provenance:** `harness: "ice"`, `profile` = ICE agent, `model`/`provider` =
  the child's frozen model.

The adapter never replaces ICE's reasoning loop, mode or permission policy,
session store, model router or compactor.
