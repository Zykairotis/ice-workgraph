# ICE Workgraph: native ICE integration plan

Status: implemented (units 1-5); live-verified on `cx/gpt-6-luna` through RPC. Baseline: `0713b2f`.

## Objective

Run ICE Workgraph as a first-class ICE extension: its tools obey ICE modes and trust,
its executor work runs on ICE Subagents V2, its context survives ICE compaction, and
operators see and steer the work graph from the ICE TUI.

## Findings that shape the plan

- ICE `ice-safe-verify` only activates allowlisted tools. Fixed in ICE: tools declare
  `access: "read" | "write"`; read tools run in plan and build, write tools only in a
  trusted build. Workgraph declares all nine. Live smoke passed on `cx/gpt-6-luna`.
- ICE has no public API to launch a subagent from an extension, so a native executor is
  impossible without one. ICE must export a versioned controller over the existing V2
  runtime (same preflight, approvals, permission caps, depth limit).
- `session_before_compact` can only cancel or replace a compaction. ICE owns compaction;
  Workgraph re-injects its `<ice-workgraph>` section every turn, so a compacted session
  regains issue context on the next turn. The old takeover helper stays unwired.
- ICE has no built-in todo list. The work graph is the task list: the TUI shows it as a
  widget and a `/workgraph` command.

## Work units

1. **UI and todo view (Workgraph).**
   - Widget `ice-workgraph`: held issue with lease countdown, next ready issues, issues
     awaiting approval. Refreshed on session start, after Workgraph tools, and on settle;
     never more than one `bd` probe per refresh interval.
   - `/workgraph` command: `status` (default), `ready`, `refresh`. Approval stays the
     `ice_workgraph_approve` tool, so there is one authorization path.
   - Message renderer for dispatch wake messages. Deferred: an entry renderer for
     fencing-loss entries.
   - Tests with the mock ICE API.
2. **ICE subagent controller (ICE).**
   - `getIceSubagentController(events)` returning `{ version: 1, launch, run, stop, get }`,
     registered by the `ice-subagents` extension on its `ice.events` owner.
   - `launch` calls the V2 runtime `launch` (preflight, approval, permission and depth
     enforcement unchanged); `run` calls `runTurn` in the background; `stop` stops the child.
   - Tests in `packages/coding-agent/test`.
3. **Native executor adapter (Workgraph).**
   - `src/adapters/ice-subagents.ts`: discover/offer/accept/cancel/status over the
     existing protocol. Roles `implementer`, `reviewer`, `planner`. Implementers launch
     with ICE `isolation: "worktree"`; reviewers are separate children (independent
     provenance). Completion maps ICE turn outcomes to `success`/`failure`/`blocked`, with
     the child ID, patch reference and model provenance as artifacts and evidence.
   - Opt-in flag `--ice-workgraph-ice-subagents`; absent controller means no offer.
   - Patches stay in the ICE child worktree until applied through `agent_patch`.
   - Tests with a fake controller.
4. **Compaction.** Assert in tests that the context section survives a compaction entry;
   refresh status and widget on `session_compact`. Verify in a live session.
5. **Verification and docs.** Workgraph full suite, ICE targeted tests and
   `npm run check`, live smoke for each unit, README/CHANGELOG/contract doc, and ICE
   `idea.md` and changelogs for the ICE-side API.

## Non-goals

No competing planner or loop, no recursive delegation, no automatic patch application,
no publish or release.
