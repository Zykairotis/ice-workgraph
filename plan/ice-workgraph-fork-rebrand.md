# ICE Workgraph: Fork and Full Rebranding Plan

Status: PLAN ONLY. This plan does not authorize implementation, GitHub remote changes, installation, publishing, or a release.
Prepared: 2026-10-09
Source: /home/mewtwo/Zks/ice/.worktrees/all-worktrees-experimental/imported_extensions/pi-workgraph
Source commit: 1a72a6742a4c0055daf8a3fc45d97ba3cd399dd8
Upstream: https://github.com/gjtorikian/pi-workgraph
Proposed GitHub fork: https://github.com/Zykairotis/ice-workgraph (not created)
Proposed npm package: @zykairotis/ice-workgraph (not published)
Parent ICE source: /home/mewtwo/Zks/ice/.worktrees/all-worktrees-experimental

## Objective

Create an independently maintained, source-attributed fork branded ICE Workgraph, compatible with the ICE extension system and its safety architecture. Rebrand package identity, extension manifest, dependency imports, tool names, flags, environment variables, prompts, logs, context, TUI status, documentation, release automation, and support URLs. Retain essential Beads lease, fencing, recovery, execution protocol, independent review, and graph behavior.

Success: a standalone ICE-native package loads in ICE; nine documented ICE tools operate on an initialized Beads graph; safe and read-only ICE modes cannot silently mutate tasks; the original data and protocol remain interoperable; every test gate passes; the full upstream MIT notice is present.

## Naming decisions

| Surface | ICE identity | Compatibility decision |
| --- | --- | --- |
| Display name | ICE Workgraph | Historical upstream credit retained |
| Git repository | Zykairotis/ice-workgraph | gjtorikian/pi-workgraph stays as upstream |
| npm | @zykairotis/ice-workgraph | No implicit old-package dependency |
| Extension factory | iceWorkgraph | Keep exported adapter contracts where required |
| Manifest | package.json ice.extensions | Use ICE-native manifest, not legacy pi fallback |
| Tools | ice_workgraph_ready, claim, release, close, split, heartbeat, approve, override, status | All nine use ice_workgraph_ prefix |
| Config | --ice-workgraph-* and ICE_WORKGRAPH_* | Do not silently import old env flags that enable dispatch |
| UI, diagnostics, context | ICE Workgraph, [ice-workgraph], ice-workgraph status, <ice-workgraph> | Do not alter serialized task data |
| ICE SDK | @zykairotis/ice-coding-agent, @zykairotis/ice-ai | TypeBox remains a peer |
| External database/CLI | beads / bd / .beads | External product; DO NOT rename |
| Lease convention | lease_holder, lease_epoch, lease_expires_at | Frozen convention-v1 keys; DO NOT rename |
| Existing lifecycle fields | workgraph_* stored in Beads | Versioned persisted data; retain v1 readers and writers |
| Existing event bus | workgraph:v1:* (12 channels) | Frozen wire protocol; no cosmetic renaming |
| Run IDs/audit/workspaces | workgraph-run/, workgraph-lease, workgraph-verdict, workgraph/runs | Retain for recovery/interop unless an independent v2 migration is approved |

Interpretation of full rebranding: all active publisher-facing and user-facing surfaces become ICE-native. Frozen storage and protocol strings are intentional compatibility exceptions, not forgotten branding. A strict storage/protocol rename would be a new versioned migration project and is not a safe find-and-replace.

## Scope and non-goals

Included: standalone fork with provenance, ICE runtime/API compatibility, new tool/config names, safety review, tests, package manifest, docs, license, CI and controlled release preparation.

Not included: rewriting Beads, changing graph semantics, adding Kanban UI, implementing remote transports, adding a competing ICE model loop, changing ICE core without necessity, automatic ~/.ice installation, making a GitHub fork or publishing npm without explicit user authorization. Native ICE-subagent integration is an independently scoped follow-on; the current experimental pi-subagents bridge remains opt-in.

The imported extension is its own clean nested Git checkout on main. The containing ICE integration worktree has unrelated changes and untracked imported_extensions/. Preserve those; do not stage, reset, clean or overwrite other developers' work. Do not move this repo into parent npm workspaces without a separate decision.

## Current-state evidence

| Area | Local evidence | Impact |
| --- | --- | --- |
| Identity | package.json:2-35 | Version 0.3.1, upstream GitHub URLs, pi.extensions, exports, incorrect LICENSE file entry |
| Runtime SDK | package.json:66-77; src/index.ts:10; src/types.ts:10 | Pi-specific dependencies, not ICE |
| ICE conventions | parent packages/coding-agent/package.json:1-13,46-52,99-108 | @zykairotis/ice-* naming; Node >=22.19 |
| ICE package loading | parent packages/coding-agent/src/core/ice-manifest.ts:24-53 | ice resource manifest wins; pi is legacy fallback |
| ICE install | parent packages/coding-agent/docs/packages.md:18-49,167-173 | npm/git/local sources, trusted project, SDK peer dependencies |
| Extension entry | src/index.ts:26-121 | Tools, config, coordinator, sweep, adapters, context and compaction |
| Nine tools | src/tools.ts:123-135,160,202,239,307,383,485,556,624 | Every tool registered under workgraph_* |
| Configuration | src/config.ts:118-178,184-201,407-478; src/dispatch.ts:53-55 | workgraph-* flags and WORKGRAPH_* env |
| Core control plane | src/coordinator.ts:1-47; src/bd.ts:1-18,88-117 | No executor means no claim; serialized Beads operations |
| Lease/fencing | src/types.ts:47-85; src/lease.ts:1-21; README.md:200-305 | Frozen metadata, monotonic fencing epoch |
| Persisted lifecycle | src/types.ts:88-106; src/lifecycle.ts:1-24 | workgraph_* fields, approval/review semantics |
| Event contract | src/protocol.ts:24-44; test/protocol.test.ts:78-103 | Twelve workgraph:v1:* channels, protocolVersion=1 |
| Legacy adapter | src/adapters/pi-subagents.ts:1-23,68-99; src/protocol.ts:363-394 | Optional version-checked external event bridge |
| In-session adapter | src/adapters/in-session.ts:1-35,79-110 | Isolation none and imperfect turn-settled completion |
| Worktree state | src/adapters/workspace.ts:29-100 | Persistent Git common-dir manifests and branch names |
| Audit | src/audit.ts:24-25; src/verdict.ts:29-30 | Historical comment prefixes used by readers |
| UI / context | src/context.ts:1-34; src/status.ts:11-62; src/compaction.ts:1-18 | Prompt injection, status key, independent compaction invocation |
| Push guard | scripts/git-push-guard.mjs:1-37,50-95,112-160 | Depends on lease convention and existing Git-hook chain |
| CI | .github/workflows/ci.yml:9-68 | Node 22, bd 1.1.2 checksum pin, typecheck/full tests |
| Upstream release | .github/workflows/tag_and_release.yml:1-28 | Publishes through gjtorikian/actions@main with write and OIDC permissions |
| License | LICENSE.txt:1-13; package.json:29-36; README.md:694-696 | Mandatory original MIT notice; docs and files metadata mismatch |
| Missing doc | README.md:664-667; tracked file list | Links to nonexistent docs/agent-irc-transport.md |

Parent ICE AGENTS.md:5-42 is authoritative for parent-project direction: use extension hooks, preserve one ICE model loop, enforce trust/mode/permission boundaries, respect isolation, and protect provenance. Do not claim ICE-native subagent compatibility until actually tested.

## Invariants and safeguards

- Beads remains the graph backend. Its atomic --claim is the claim mutex; all Beads calls run through one serialized queue. Never directly overwrite an active assignee except epoch-fenced reclaim.
- A lease is claim -> stamp -> re-read -> verify. lease_epoch is monotonic across release/reclaim. Stale holders cannot renew, close, release or overwrite a newer lease.
- Every durable run completion, reviewer verdict, cancellation and escalation is correlated by issue ID, workflow-run ID, and lease epoch. No unapproved auto-dispatch; no unreviewed acceptance of reviewed/planned work.
- No mutation in ICE read-only plan/review modes; project trust precedes extension execution. No independent compaction, model router or recursive delegation.
- Preserve existing issue metadata, comments, workflow worktree manifests and run IDs. No automatic migration of active graphs.
- Failed checks are blockers, not skipped checks. Do not publish credentials, push branches, or release a package without explicit authorization.

## Architecture target

1. src/branding.ts centralizes ICE display strings, tool identifiers, CLI/env naming and diagnostics; frozen protocol/data constants stay in src/types.ts and src/protocol.ts.
2. src/index.ts is an ICE-compatible extension factory that registers canonical ICE tools, config, context and optional scheduling through ICE extension hooks.
3. src/config.ts maps ICE flags/env to typed WorkgraphConfig, with explicit default-disabled automatic dispatch in safe ICE profiles and no implicit legacy env overrides.
4. src/tools.ts registers nine canonical ICE tools without weakening their existing schemas, sequential mode or lease/approval guards.
5. The durable data layer and event protocol continue convention v1; a future v2 must be designed, backed up and migrated separately.
6. The current in-session executor is gated and labeled nonisolated. The experimental Pi subagent event bridge remains disabled unless explicitly selected, and is not advertised as ICE-native.
7. CI, publishing, documentation and licensing belong to Zykairotis after an audited fork, never implicitly to original upstream credentials.

## Execution phases and scoreable tasks

Each checklist row is an independently verifiable work item. The evidence paths are relative to this nested fork unless prefixed parent. The dependency is the previous phase unless otherwise specified. The tests must be run after the edit, not merely described.

### Phase 0: Baseline and fork custody

- [ ] P0.1 Snapshot commit, remotes, tree, dirty status, all manifest scripts and baseline test results in docs/fork-provenance.md. Acceptance: baseline reproducible and all parent changes untouched. Verify: git rev-parse HEAD; git remote -v; git status --short; npm run typecheck and focused test logs.
- [ ] P0.2 Document the GitHub fork operation, retaining original commit history, retaining upstream remote, and using a new verified Zykairotis origin. Acceptance: plan supports synchronization without ever publishing to upstream; no remote changes before user approval. Verify: proposed remote/branch table and history review.
- [ ] P0.3 Inventory every occurrence of pi-workgraph, workgraph, @earendil-works, pi-subagents, and Pi environment names across source, tests, docs, scripts, config, workflows and lockfiles; classify each as public rebrand, history/credit, external integration, or immutable v1 data. Acceptance: every remaining old string has written disposition. Verify: ripgrep results checked against exceptions table.

### Phase 1: ICE-native package and SDK

- [ ] P1.1 Update package.json with @zykairotis/ice-workgraph name, ICE description, tested version, owned repository/bugs/homepage, keywords, and fork maintenance identity. Acceptance: no upstream metadata presented as ICE ownership. Verify: npm pkg get name version repository homepage bugs; npm pack --dry-run --json. Evidence: package.json:2-48.
- [ ] P1.2 Replace package.json pi.extensions with ice.extensions and preserve functioning subpath exports; test real ICE's native manifest resolution. Acceptance: ICE reports source ice rather than legacy-pi. Verify: parent packages/coding-agent/src/core/ice-manifest.ts resolver check and ice -e against local fork. Evidence: package.json:18-28; parent ice-manifest.ts:24-53.
- [ ] P1.3 Migrate live SDK imports and peer/dev dependencies from @earendil-works/pi-* to @zykairotis/ice-* while keeping typebox peer; regenerate only this fork's lockfile with --ignore-scripts. Acceptance: no runtime import of upstream Pi SDK, correct ICE API types. Verify: grep/import inventory; npm install --package-lock-only --ignore-scripts; npm run typecheck. Evidence: package.json:66-77; src/index.ts:10; src/types.ts:10.
- [ ] P1.4 Inspect API behavior for registerTool, registration flags, ctx UI/exec, events, compaction, sendMessage and runtime type signatures on the actual ICE revision. Acceptance: implementation is tested rather than assuming upstream Pi behavior. Verify: focused ICE mock-extension and local launch smoke. Evidence: src/index.ts:26-121; parent packages/coding-agent/src/core/extensions/index.ts.
- [ ] P1.5 Preserve original LICENSE.txt copyright and notice, fix package files to actually include license and README link, add explicit Fork of attribution. Acceptance: pack tarball includes full MIT text, no copyright replacement. Verify: inspect npm pack output and license content. Evidence: LICENSE.txt:1-13; package.json:29-36.

### Phase 2: Public tools, flags, prompts, UI and docs branding

- [ ] P2.1 Introduce src/branding.ts with canonical product strings, names and diagnostics; update all active [pi-workgraph] errors and visible text without touching frozen protocol keys. Acceptance: branded logs/UI, original provenance retained. Verify: static name scan plus tests that capture logs. Evidence: src/audit.ts:53-62; src/config.ts:236-277; src/status.ts:11-62.
- [ ] P2.2 Update src/tools.ts to register the nine ice_workgraph_* names; update prompts, guidelines, errors, and tool references in src/context.ts, src/dispatch.ts, src/adapters/in-session.ts, src/coordinator.ts and tests. Acceptance: all nine exist with unchanged schemas, guarded state mutation, serialized Beads execution and no name collision. Verify: src/tools.test.ts, test/migration.test.ts, tool registry snapshot. Evidence: src/tools.ts:123-135,160,202,239,307,383,485,556,624.
- [ ] P2.3 Change src/config.ts CLI/env contract to --ice-workgraph-* and ICE_WORKGRAPH_*; include dispatch kill switch from src/dispatch.ts; keep flag > environment > default precedence. Acceptance: old env does not silently enable coordinator; malformed JSON handled safely. Verify: src/config.test.ts, conflict and malformed input tests. Evidence: src/config.ts:118-201,407-478; src/dispatch.ts:53-55.
- [ ] P2.4 Rebrand status bar key, injected prompt section, custom wake message labels, compaction instructions, README example output and help descriptions without changing persisted run fields. Acceptance: new status clears on release/close and prompt instructions mention real ICE tool names. Verify: src/context.test.ts; test/context.test.ts; test/recovery.test.ts; snapshot assertions. Evidence: src/status.ts:11-62; src/context.ts:1-34; src/compaction.ts:52-85.
- [ ] P2.5 Audit exported function/type identities and every package export subpath. Rename product-specific public exports when required; document breaking imports and deliberate v1 retained vocabulary. Acceptance: TS consumer imports the ICE fork without depending on pi-workgraph. Verify: packed-package TS fixture, test/migration.test.ts self-reference tests. Evidence: package.json:23-28; src/protocol.ts:24-44.

### Phase 3: Preserve v1 storage, wire, audit and graph migration

- [ ] P3.1 Protect lease_holder, lease_epoch and lease_expires_at as frozen v1 keys and preserve holder-write fencing and epoch monotonicity. Acceptance: existing v1 claims remain safe across reclaim. Verify: src/lease.test.ts; test/race.test.ts; test/fencing.test.ts; test/reclaim.test.ts. Evidence: src/types.ts:47-85; README.md:200-305.
- [ ] P3.2 Preserve workgraph_* lifecycle keys in Beads and allow old graph fixtures to be opened, approved and resumed by the ICE package. Acceptance: old metadata, acceptance criteria, dependencies and fields retained, without false legacy reinitialization. Verify: test/migration.test.ts and test/recovery.test.ts old-graph fixture. Evidence: src/types.ts:88-106; src/lifecycle.ts:1-24.
- [ ] P3.3 Preserve all 12 workgraph:v1:* channels, envelope version and v1 parsing rules; never rename event strings merely because product name changed. Acceptance: old executor can discover, offer, accept, complete, cancel and reconcile with ICE authority. Verify: test/protocol.test.ts and test/coordinator.test.ts. Evidence: src/protocol.ts:24-44; test/protocol.test.ts:78-103.
- [ ] P3.4 Preserve workgraph-lease/workgraph-verdict comments, workgraph-run/ holder identities, workgraph/runs manifests, workgraph/... branches and workgraph:ui:issue-halted as existing serialized contracts. Acceptance: old histories/worktrees readable and no duplicate authority created. Verify: test/workspace.test.ts; test/push-guard.test.ts; test/recovery.test.ts; an original-manifest fixture. Evidence: src/audit.ts:24-25; src/adapters/workspace.ts:29-100; src/issue-control.ts:1-30.
- [ ] P3.5 Write docs/protocol-v2-migration-proposal.md describing a *deferred* v2 option with snapshot, quiescence, dual-read period, bounded rollback, audit and lease epoch continuity, and a distinct channel version. Acceptance: v2 never enabled by a cosmetic branding edit. Verify: design review; all current contract-v1 test snapshots remain unchanged.

### Phase 4: ICE authorization and execution integration

- [ ] P4.1 Add explicit ICE mode/capability/trust checks around coordinator activation and state-changing tools. Acceptance: plan/review/read-only/untrusted/unauthorized headless use makes no Beads writes, spawns no executor and fails closed. Verify: ICE mode and tool-approval integration tests with a recording bd executor. Evidence: parent AGENTS.md:20-36; src/index.ts:26-87; src/tools.ts:109-121.
- [ ] P4.2 Make autonomous polling/dispatch opt-in in ICE safe profile; preserve manual tools-only operation and coordinator's discovery-before-claim guarantee. Acceptance: installing the extension never silently dispatches model work. Verify: test/coordinator.test.ts and test/dispatch.test.ts plus fresh session idle smoke. Evidence: src/coordinator.ts:8-31; src/dispatch.ts:53-62.
- [ ] P4.3 Adapt in-session executor to ICE hooks without claiming worktree isolation, reliable independent completion or reviewer independence. Acceptance: correct isolation=none advertisement, bounded retries and safe cancellation. Verify: focused adapter tests and ICE interactive/RPC smoke. Evidence: src/adapters/in-session.ts:1-35,79-110.
- [ ] P4.4 Keep experimental src/adapters/pi-subagents.ts as a disabled legacy external integration. Do not silently import its upstream code or treat it as the ICE native runner. Acceptance: zero bridge subscriptions unless explicitly configured and version gate satisfied. Verify: test/pi-subagents-adapter.test.ts and negative absent-package tests. Evidence: src/adapters/pi-subagents.ts:1-23,68-99; src/protocol.ts:363-394.
- [ ] P4.5 Inspect parent packages/coding-agent/src/subagents actual interfaces and write an optional native ICE executor adapter contract before any implementation. Acceptance: contract addresses role routing, isolated writer, independent review, cancellation, provenance and supervisor decisions; no second agent loop. Verify: compare to parent SDK code and an architecture review. Evidence: parent AGENTS.md:20-39; src/adapters/subagent-decision.ts:1-57.
- [ ] P4.6 Remove competing model compaction takeover in favor of native ICE compaction support or a safe context-only hook. Acceptance: user instructions, active issue/run ID, phase, attempt, evidence and acceptance criteria survive; ICE remains the compaction authority. Verify: compaction + recovery unit tests and live active-lease compaction smoke. Evidence: src/compaction.ts:1-18,52-85,101-128.
- [ ] P4.7 Verify approval, explicit audited human override, independent judgment, stale result rejection, bounded revisions, shutdown cancellation and headless behavior after ICE-specific wiring. Acceptance: no new guard bypass. Verify: test/invariants.test.ts; test/judgment.test.ts; test/recovery.test.ts; test/fencing.test.ts. Evidence: src/tools.ts:7-14; src/coordinator.ts:23-47.

### Phase 5: Docs, auxiliary hook and upstream policy

- [ ] P5.1 Rewrite README with ICE Workgraph install, local/Git/npm commands, required Beads version, nine named tools, canonical flags, approval and permissions, non-autonomous default. Acceptance: copy-paste tutorial works on disposable initialized Beads graph. Verify: manual local ICE quickstart. Evidence: README.md:1-163; parent docs/packages.md:18-49.
- [ ] P5.2 Update current-facing diagrams, example outputs, terminal labels and API help; preserve original historical changelog, original credit and explicitly noted protocol-v1 strings. Acceptance: static scan has no unexplained original branding. Verify: Markdown review and allowlisted grep. Evidence: README.md:19-57,200-228,459-478,620-696; CHANGELOG.md:1-29.
- [ ] P5.3 Resolve README's missing docs/agent-irc-transport.md citation without inventing an implemented transport. Acceptance: no broken internal links; unsupported feature not claimed. Verify: local Markdown link check. Evidence: README.md:664-667.
- [ ] P5.4 Update scripts/git-push-guard.mjs and docs/git-push-guard.md user-facing display and configuration with explicit migration policy for old workgraph.stackIssue and WORKGRAPH_WORKER_ID, but preserve lease detection, chaining and fail-closed guard behavior. Acceptance: no old hooks overwritten or silent changes to active sentinel. Verify: test/push-guard.test.ts with existing/foreign hooks. Evidence: scripts/git-push-guard.mjs:1-37,50-95,112-160.
- [ ] P5.5 Add UPSTREAM.md with original source author/license, baseline commit, reviewable upstream-sync strategy, conflict guidance and security advisories. Acceptance: fork can later incorporate upstream changes without erasing ICE work or source attribution. Verify: dry-run merge checklist (no remote push). Evidence: parent AGENTS.md:5-18,42.

### Phase 6: CI, artifact and release supply chain

- [ ] P6.1 Keep CI Node >=22.19, Beads version/checksum pin and serial test coverage; run typecheck and reviewed tests on the maintained branch. Acceptance: no skipped concurrency tests and runtime versions recorded. Verify: .github/workflows/ci.yml CI dry-run/review; actual CI report. Evidence: .github/workflows/ci.yml:9-68.
- [ ] P6.2 Remove dependence on gjtorikian/actions@main release workflow and replace with ICE-owned audited, initially publish-disabled workflow. Acceptance: no release or credentials can route to upstream owner; OIDC/trusted-publisher setup reviewed before activation. Verify: workflow syntax/security review and nonpublishing dry-run. Evidence: .github/workflows/tag_and_release.yml:1-28.
- [ ] P6.3 Verify packed file inventory, license, exports, native ICE manifest and installation using a clean temporary consumer outside the checkout. Acceptance: no runtime dependency on upstream Pi package, no missing license or repository-only path resolution. Verify: npm pack --dry-run --json, disposable npm install --ignore-scripts, ICE -e local package smoke. Evidence: package.json:18-36; test/migration.test.ts.
- [ ] P6.4 Add a static-branding regression gate with a curated allowlist for source credit, old protocol/storage fields and external Pi bridge only. Acceptance: active end-user original product strings fail CI and frozen v1 contract renames also fail CI. Verify: negative fixtures and exact-term search. Evidence: src/types.ts:47-106; src/protocol.ts:31-44.
- [ ] P6.5 Block publish/remote modification until completion of tests, provenance, license, permission, package ownership and dry-run artifact review. Acceptance: external side effects need explicit user authorization. Verify: documented release checklist; no publish credentials in build job. Evidence: parent AGENTS.md:26-42.

### Phase 7: End-to-end acceptance and independent review

- [ ] P7.1 Run typecheck, focused tools/config/protocol/adapter/migration suites and full serial standalone test suite with real bd when environment available. Acceptance: zero unwaived failures; capture runtime versions, commands and exit codes. Verify: npm run typecheck; npm run test:protocol; npm run test:migration; npm run test:adapter; npm test. Evidence: package.json:49-65.
- [ ] P7.2 Exercise approval -> claim -> heartbeat -> reviewed/judgment -> close, claim collision, stale holder, expired lease, recovery, fallback and human override in disposable Beads workspaces. Acceptance: no duplicate owner, stale close, unsafe review, unbounded retry or graph loss. Verify: test/race.test.ts; test/fencing.test.ts; test/reclaim.test.ts; test/invariants.test.ts; test/recovery.test.ts.
- [ ] P7.3 Smoke-test ICE interactive, RPC/headless, read-only, trusted/untrusted and executor-disabled/enabled modes against the tested ICE commit. Acceptance: headless never touches TUI, plan/review never write, authorized build may use approved hooks. Verify: dedicated ICE integration matrix and logs. Evidence: parent AGENTS.md:20-36; src/status.ts:43-62.
- [ ] P7.4 Verify original v1 graph and retained worktree reopening: compare metadata, epoch, audit, dependencies, assignee and run manifest before/after. Acceptance: no migration-induced data corruption or parallel authority. Verify: test/workspace.test.ts; test/migration.test.ts; test/recovery.test.ts and snapshot diff.
- [ ] P7.5 Complete release-readiness inventory with all original strings classified, security review, license/package review, changed-file review and independent reviewer sign-off. Acceptance: every task documented and each intentional legacy exception explained. Verify: git diff --check; git status --short; inventory and pack review.

### Phase 8: Activate fork/publication ONLY when expressly authorized

- [ ] P8.1 Create/verify owned Zykairotis/ice-workgraph GitHub fork, preserving original history; configure own origin and upstream. Acceptance: remote ownership correct, never pushes to source maintainer. Verify: git remote -v; git log and branch protection inspection. Depends on explicit owner approval.
- [ ] P8.2 Configure branch protection, maintainers, owned CI, trusted npm publisher and least-privilege OIDC permissions. Acceptance: unauthorized workflow cannot release. Verify: access/policy inspection and nonpublishing dry run. Depends on P8.1 and approval.
- [ ] P8.3 Tag/publish only the approved SHA to @zykairotis/ice-workgraph; smoke install exact version in disposable ICE. Do not automatically install into user's main ~/.ice or parent project. Acceptance: tag, package version, source SHA, tarball license and runtime match. Verify: npm view, verified tag and fresh installation. Depends on all gates and explicit publish approval.

## Verification matrix

| Gate | Relevant tests | Failure prevented |
| --- | --- | --- |
| SDK, manifest, packaging | typecheck; manifest resolver; npm pack; ICE -e | Broken imports, missing license, wrong manifest |
| Public config, tools, prompts | src/config.test.ts; src/tools.test.ts; test/context.test.ts | Old names, unsafe config, absent tools |
| Lease fencing | src/lease.test.ts; test/race.test.ts; test/fencing.test.ts; test/reclaim.test.ts | Double claims, stale writes, epoch reset |
| State/wire | test/protocol.test.ts; test/coordinator.test.ts; test/migration.test.ts | Broken adapters, lost metadata |
| Recovery, judgment | test/recovery.test.ts; test/judgment.test.ts; test/invariants.test.ts; test/planner.test.ts | Orphaned runs, self-acceptance |
| Executor/worktree | test/pi-subagents-adapter.test.ts; test/workspace.test.ts | Ungated legacy bridge, lost worktrees |
| Hook and docs | test/push-guard.test.ts; link checker; terminology scan | Stale config, hook loss, broken docs |
| ICE system | approved/denied modes in real ICE; interactive/RPC smoke | Bypassing trust and read-only safety |
| Release | CI + pack + workflow security review | Publishing upstream or losing copyright |

## Risks and rollback

| Risk | Severity | Mitigation and rollback |
| --- | --- | --- |
| Persisted key rename breaks fencing/recovery | Critical | Immutable exception list, v1 fixture tests, disable ICE package and restore last verified version without editing Beads metadata |
| Two coordinators own same issue graph | Critical | Duplicate-install detection, canonical names, one activation per session; deactivate old package before production |
| Mode/trust bypass triggers agent work | Critical | Dispatch default off, ICE policy gate, headless fail-closed, no autonomous actions during install |
| Legacy bridge falsely claims independent review | High | Disabled by default, verify actual upstream event/version, review-identity tests |
| Compaction takeover competes with ICE | High | Use ICE-native context/compaction hooks; remove standalone model-compactor path |
| Changed worktree directory strands a run | High | Keep old manifests and branch vocabulary; recovery/workspace snapshots |
| Original GitHub release publishes under wrong owner | Critical | Remove unreviewed upstream workflow; own dry-run-only release path |
| Missing copyright or packaged license | High | Preserve original MIT notice and tarball inspection |
| Parent worktree collision | High | Isolated nested checkout, path-scoped changes only, no git clean/reset/stash |
| Beads version semantic drift | High | Pinned bd, cross-process tests, block release on behavior change |

Rollback: stop/disable coordinator; retain original Beads graph/comments/lease epochs/worktree manifests; reinstall last known-good package; inspect active run and holder before restarting. Never erase lease metadata manually to force recovery; allow fenced expiry/reclaim.

## Definition of done

All public identities ICE-branded; package manifests/SDK work against actual ICE; exactly nine canonical ICE tools function; original v1 persisted/wire contracts survive; modes/trust/headless prevent unauthorized work; test suites and clean-room install pass; full MIT notice and upstream provenance retained; release pipeline belongs only to approved ICE owner; all remaining old terms are explicitly allowlisted. A native ICE subagent adapter or protocol-v2 migration can be planned separately without blocking a correctly bounded v1 rebrand.

## Ownership, sequencing and assumptions

Sequence: baseline -> manifest/deps -> public API/config -> wire/storage safeguards -> ICE safety integration -> docs -> CI -> tests -> authorized release. Safe parallel work after manifest: docs, protocol fixture analysis and release workflow design. Single writer for package.json, lockfile, src/index.ts, src/config.ts, src/tools.ts, src/types.ts and src/protocol.ts.

Assumed defaults: standalone ICE-only package, namespace @zykairotis, repository Zykairotis/ice-workgraph, canonical ice_workgraph_* names, frozen workgraph:v1 storage/wire vocabulary, dispatch opt-in, legacy Pi subagents bridge disabled. A separate native ICE subagent implementation is *not* claimed to exist. No remotes, global ICE installation or releases are altered by this plan.
