# ICE Workgraph naming and protocol inventory

## Canonical public surfaces

| Area | Legacy | ICE |
| --- | --- | --- |
| npm package | `pi-workgraph` | `@zykairotis/ice-workgraph` |
| manifest | `pi.extensions` | `ice.extensions` |
| SDK imports | `@earendil-works/pi-*` | `@zykairotis/ice-*` |
| tool names | `workgraph_ready/claim/release/close/split/heartbeat/approve/override/status` | same nine with `ice_` prefix |
| config flags | `--workgraph-*` | `--ice-workgraph-*` |
| environment | `WORKGRAPH_*` | `ICE_WORKGRAPH_*` |
| logs/status/context | `[pi-workgraph]`, `workgraph`, `<workgraph>` | `[ice-workgraph]`, `ice-workgraph`, `<ice-workgraph>` |
| Git push guard | `workgraph.stackIssue`, `WORKGRAPH_WORKER_ID` | `ice.workgraphStackIssue`, `ICE_WORKGRAPH_WORKER_ID`; retains old readers |

## Do not rename in protocol v1

- `lease_holder`, `lease_epoch`, `lease_expires_at`, including monotonically
  increasing epoch and native Beads `bd` issue/claim interfaces.
- All persisted `workgraph_*` lifecycle metadata; all 12
  `workgraph:v1:*` channel strings and protocolVersion=1.
- `workgraph-run/` workflow identities, `workgraph-lease` audit comments,
  `workgraph-verdict` records, retained `workgraph/runs` worktrees, the
  `workgraph:ui:issue-halted` event and `pre-push.pre-workgraph` hook chain.
- `pi-subagents` in the *optional external bridge* and in source-accurate
  discussion of its upstream API; do not relabel it ICE-native.
- Original `gjtorikian/pi-workgraph` repository references in provenance,
  original MIT copyright and historical changelog.

## Release audit gates

Source files must not import an upstream Pi SDK, register old `workgraph_*`
tool names, or publish via `gjtorikian/actions`. Never change frozen v1
storage or wire constants solely to satisfy a branding scan. The release
workflow remains publication-disabled until a new organization-controlled
publisher and GitHub origin are explicitly configured and approved.