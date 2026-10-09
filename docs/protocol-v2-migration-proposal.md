# Deferred protocol/storage v2 migration

This document is a proposal, not an implemented migration. The ICE Workgraph
fork maintains the original version-1 wire/storage contract even though the
public package, tools, flags and user-interface names are now ICE-branded.

## Frozen v1 data and messages

The three lease metadata keys (`lease_holder`, `lease_epoch`,
`lease_expires_at`) are immutable in convention v1. The Beads lifecycle
`workgraph_*` keys, audit prefixes, `workgraph-run/` holder identifiers,
persisted `workgraph/runs` Git-common-dir manifests and the twelve
`workgraph:v1:*` event channels remain unchanged. No automatic upgrade
or one-off regex replacement is allowed.

## Preconditions for v2

1. Inventory every active graph, in-flight lease, executor, observer and hook.
2. Quiesce coordinators and workers; preserve journal, graph, lease epochs,
   comments and worktree manifest snapshots with checksums.
3. Define a new protocol version and channel namespace; do not broadcast
   two versions as if they were one shared run authority.
4. Implement explicit v1 and v2 readers before any new writer, with a
   one-owner/write authority per graph and a bounded compatibility window.
5. A writer migration must never reset epochs, change assignees, drop
   accepted/reviewed provenance, or duplicate a workflow-run identity.
6. Perform a reversible migration in isolated fixtures, then in a
   quiesced staging workspace, with a rollback verification.
7. Ship separate tests for v1 observer compatibility, crash during
   migration, partially converted metadata, stale completion/reclaim,
   duplicate subscriptions, idempotent replay and audit preservation.

Only after an explicit user decision to break or migrate the v1 contract should
v2 implementation begin. ICE-branded runtime display is not a reason to
invalidate existing durable tasks.