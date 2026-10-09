# Audit: ICE Workgraph fork and rebrand

- Plan: `plan/ice-workgraph-fork-rebrand.md`
- Audited: 2026-10-09
- Source baseline: `1a72a6742a4c0055daf8a3fc45d97ba3cd399dd8`
- Local branch: `ice-workgraph/rebrand` (uncommitted working changes)
- Completion: **69.8%** (30 / 43 atomic units)
- Eligible for default >85% complete-remaining mode: **NO**
- User-authorized threshold override: **USED** — "execute and u do it for me instead"
- Remote publication: **NOT DONE** (proposed Zykairotis/ice-workgraph returned 404)
- Parent ICE worktree changes: **NONE**
- No push, commit, tag, release or global ICE install.

## Verdict

**Local rebrand substantially implemented and source/typecheck/focused Beads suites validated. Not release-ready.** Public name, nine ICE-prefixed tools, flags/env, SDK imports, package manifest, prompts, status, safety gates, package archive, provenance and publish-disabled CI are in place. Convention-v1 Beads metadata, lease epochs, event channels and retained worktrees are intentionally preserved. Actual end-to-end ICE interactive/RPC sessions, uninterrupted serial suite, native Node subpath import, CI execution, and GitHub/npm ownership remain unverified or blocked. A clean temporary npm install and packed ICE CLI extension-loader smoke passed.

## Coverage ledger

| ID | Plan unit | Status | Score | Evidence | Exact remaining work |
| --- | --- | --- | ---: | --- | --- |
| P0.1 | Snapshot commit, remotes, tree, dirty status, all manifest scripts and baseline test results in docs/fork-prov | PARTIAL | 0.5 | docs/fork-provenance.md; base SHA | Reconstruct complete baseline scripts/test output from pinned upstream commit |
| P0.2 | Document the GitHub fork operation, retaining original commit history, retaining upstream remote, and using a  | VERIFIED | 1.0 | UPSTREAM.md; git remote -v | — |
| P0.3 | Inventory every occurrence of pi-workgraph, workgraph, @earendil-works, pi-subagents, and Pi environment names | PARTIAL | 0.5 | docs/rebrand-inventory.md; source scans | Run a complete classification of all old tokens and add negative fixture inventory |
| P1.1 | Update package.json with @zykairotis/ice-workgraph name, ICE description, tested version, owned repository/bug | PARTIAL | 0.5 | package.json; npm pack | Owned GitHub repo missing (404); establish real URL and maintainer ownership |
| P1.2 | Replace package.json pi.extensions with ice.extensions and preserve functioning subpath exports; test real ICE | VERIFIED | 1.0 | package.json:ice; ICE CLI -e --help | — |
| P1.3 | Migrate live SDK imports and peer/dev dependencies from @earendil-works/pi-* to @zykairotis/ice-* while keepin | VERIFIED | 1.0 | package-lock.json; tsc PASS; ICE SDK imports | — |
| P1.4 | Inspect API behavior for registerTool, registration flags, ctx UI/exec, events, compaction, sendMessage and ru | PARTIAL | 0.5 | parent ICE extension types; live CLI flags | Exercise actual session tool hooks/exec/approval beyond CLI help |
| P1.5 | Preserve original LICENSE.txt copyright and notice, fix package files to actually include license and README l | VERIFIED | 1.0 | LICENSE.txt; 39-file pack manifest | — |
| P2.1 | Introduce src/branding.ts with canonical product strings, names and diagnostics; update all active [pi-workgra | VERIFIED | 1.0 | src/branding.ts; runtime log scan | — |
| P2.2 | Update src/tools.ts to register the nine ice_workgraph_* names; update prompts, guidelines, errors, and tool r | VERIFIED | 1.0 | src/tools.ts; tools 31/31; migration 13/13 | — |
| P2.3 | Change src/config.ts CLI/env contract to --ice-workgraph-* and ICE_WORKGRAPH_*; include dispatch kill switch f | VERIFIED | 1.0 | src/config.ts; finalization 8/8; config tests | — |
| P2.4 | Rebrand status bar key, injected prompt section, custom wake message labels, compaction instructions, README e | PARTIAL | 0.5 | src/status.ts; src/context.ts; context 14/14 | Audit custom dispatch entry tags and remaining prompt/compaction help references |
| P2.5 | Audit exported function/type identities and every package export subpath. Rename product-specific public expor | PARTIAL | 0.5 | package.json exports; self-reference migration test | Full export surface and independent TS consumer fixture |
| P3.1 | Protect lease_holder, lease_epoch and lease_expires_at as frozen v1 keys and preserve holder-write fencing and | VERIFIED | 1.0 | src/types.ts; fencing/race/reclaim PASS | — |
| P3.2 | Preserve workgraph_* lifecycle keys in Beads and allow old graph fixtures to be opened, approved and resumed b | VERIFIED | 1.0 | src/lifecycle.ts; migration 13/13; recovery 24/24 | — |
| P3.3 | Preserve all 12 workgraph:v1:* channels, envelope version and v1 parsing rules; never rename event strings mer | VERIFIED | 1.0 | src/protocol.ts; protocol 15/15; coordinator 28/28 | — |
| P3.4 | Preserve workgraph-lease/workgraph-verdict comments, workgraph-run/ holder identities, workgraph/runs manifest | VERIFIED | 1.0 | src/adapters/workspace.ts; workspace & push guard tests | — |
| P3.5 | Write docs/protocol-v2-migration-proposal.md describing a *deferred* v2 option with snapshot, quiescence, dual | VERIFIED | 1.0 | docs/protocol-v2-migration-proposal.md | — |
| P4.1 | Add explicit ICE mode/capability/trust checks around coordinator activation and state-changing tools | PARTIAL | 0.5 | src/ice-authorization.ts; 6 tests; sweep gate | Actual ICE interactive/RPC mode- and permission-denial integration test |
| P4.2 | Make autonomous polling/dispatch opt-in in ICE safe profile; preserve manual tools-only operation and coordina | PARTIAL | 0.5 | src/coordinator.ts default off; ICE CLI help | Prove no dispatch on idle real ICE sessions and explicit opt-in delivery |
| P4.3 | Adapt in-session executor to ICE hooks without claiming worktree isolation, reliable independent completion or | PARTIAL | 0.5 | src/adapters/in-session.ts; coordinator 28/28 | Real ICE in-session/RPC completion and isolation smoke |
| P4.4 | Keep experimental src/adapters/pi-subagents.ts as a disabled legacy external integration. Do not silently impo | VERIFIED | 1.0 | src/adapters/pi-subagents.ts; 43 pass/1 skipped | — |
| P4.5 | Inspect parent packages/coding-agent/src/subagents actual interfaces and write an optional native ICE executor | PARTIAL | 0.5 | docs/native-ice-subagents-contract.md; parent subagents source | Review versioned native ICE subagent API and write exact adapter interface/tests |
| P4.6 | Remove competing model compaction takeover in favor of native ICE compaction support or a safe context-only ho | PARTIAL | 0.5 | src/index.ts takeover unwired; context 14/14 | Full active-run compaction/recovery smoke under ICE host |
| P4.7 | Verify approval, explicit audited human override, independent judgment, stale result rejection, bounded revisi | VERIFIED | 1.0 | judgment 33/33; recovery 24/24; invariants 3/3 | — |
| P5.1 | Rewrite README with ICE Workgraph install, local/Git/npm commands, required Beads version, nine named tools, c | PARTIAL | 0.5 | README.md; ICE -e --help | Copy-paste quickstart in disposable ICE session, including approval |
| P5.2 | Update current-facing diagrams, example outputs, terminal labels and API help; preserve original historical ch | PARTIAL | 0.5 | README.md; docs; remaining legacy compatibility prose | Complete all Markdown link and terminology inspection; update stale examples |
| P5.3 | Resolve README's missing docs/agent-irc-transport.md citation without inventing an implemented transport | VERIFIED | 1.0 | README.md missing link removed | — |
| P5.4 | Update scripts/git-push-guard.mjs and docs/git-push-guard.md user-facing display and configuration with explic | VERIFIED | 1.0 | scripts/git-push-guard.mjs; 2/2 tests | — |
| P5.5 | Add UPSTREAM.md with original source author/license, baseline commit, reviewable upstream-sync strategy, confl | VERIFIED | 1.0 | UPSTREAM.md; provenance doc | — |
| P6.1 | Keep CI Node >=22.19, Beads version/checksum pin and serial test coverage; run typecheck and reviewed tests on | PARTIAL | 0.5 | .github/workflows/ci.yml; local test suites | Actual owned GitHub Actions CI run with Node version pin and bd |
| P6.2 | Remove dependence on gjtorikian/actions@main release workflow and replace with ICE-owned audited, initially pu | VERIFIED | 1.0 | tag_and_release.yml manual preflight; no publish permission | — |
| P6.3 | Verify packed file inventory, license, exports, native ICE manifest and installation using a clean temporary c | PARTIAL | 0.5 | npm pack 39 files; clean temp npm install and ICE CLI -e --help pass; Node raw import fails | Validate the TypeScript protocol export through a supported loader or provide compiled JS; live session still untested |
| P6.4 | Add a static-branding regression gate with a curated allowlist for source credit, old protocol/storage fields  | PARTIAL | 0.5 | src/branding.test.ts 3/3; inventory | Add strict source scan and failure fixtures to CI |
| P6.5 | Block publish/remote modification until completion of tests, provenance, license, permission, package ownershi | VERIFIED | 1.0 | publish-disabled workflow; no GitHub push | — |
| P7.1 | Run typecheck, focused tools/config/protocol/adapter/migration suites and full serial standalone test suite wi | PARTIAL | 0.5 | tsc PASS; >300 individual focused tests; full npm test timed out | Run uninterrupted full serial npm test with sufficient timeout and preserve report |
| P7.2 | Exercise approval -> claim -> heartbeat -> reviewed/judgment -> close, claim collision, stale holder, expired  | VERIFIED | 1.0 | Beads 1.1.2; judgment/reclaim/race/fencing/recovery tests | — |
| P7.3 | Smoke-test ICE interactive, RPC/headless, read-only, trusted/untrusted and executor-disabled/enabled modes aga | PARTIAL | 0.5 | ICE CLI source-extension flag help only | Interactive, RPC, trusted/untrusted, plan/build behavior matrix in real ICE |
| P7.4 | Verify original v1 graph and retained worktree reopening: compare metadata, epoch, audit, dependencies, assign | PARTIAL | 0.5 | migration/recovery/workspace suites pass | Explicit before/after snapshots on retained original v1 graph and worktree |
| P7.5 | Complete release-readiness inventory with all original strings classified, security review, license/package re | PARTIAL | 0.5 | git diff --check; audit, pack, inventory | Independent human review + repeat CI/release preflight |
| P8.1 | Create/verify owned Zykairotis/ice-workgraph GitHub fork, preserving original history; configure own origin an | BLOCKED | 0.0 | local ice-workgraph/rebrand; upstream remote; GitHub 404 | Create/verify owned repo, then set origin and push only on authorization |
| P8.2 | Configure branch protection, maintainers, owned CI, trusted npm publisher and least-privilege OIDC permissions | BLOCKED | 0.0 | no owned GitHub repo | Configure protected branch, trusted npm identity and CI in owned repo |
| P8.3 | Tag/publish only the approved SHA to @zykairotis/ice-workgraph; smoke install exact version in disposable ICE. | BLOCKED | 0.0 | no publication | Tag, release, publish and install only after P8.1/P8.2 and signoff |

## Verification performed

- Initial `npm run typecheck` failed on upstream SDK/package self-reference; repaired and subsequently **PASS**.
- `npm run test:protocol`: **15/15 pass**.
- `npm run test:migration`: **13/13 pass** against verified temporary Beads v1.1.2.
- `npm run test:coordinator`: **28/28 pass**.
- `npm run test:judgment`: **33/33 pass**.
- `npm run test:recovery`: **24/24 pass**.
- `npm run test:planner`: **14/14 pass**.
- `npm run test:adapter`: **43 pass, 1 skipped**.
- `npm run test:reclaim`: **4/4 pass**, after migrating the original test fixture flags.
- `npm run test:fencing`: **3/3 pass**.
- `npm run test:race`: **1/1 pass**.
- `npm run test:invariants`: **3/3 pass**.
- `npm run test:dispatch`: **1/1 pass**.
- `test/push-guard.test.ts`: **2/2 pass**.
- `src/tools.test.ts`: **31/31 pass**.
- `src/context.test.ts`: **14/14 pass**.
- `test/context.test.ts`: **1/1 pass**.
- `src/ice-authorization.test.ts`: **6/6 pass**; sweep refusal in plan mode included.
- `src/branding.test.ts`: **3/3 pass**.
- `src/config.test.ts`: **1/1 pass**.
- `test/finalization-config.test.ts`: **8/8 pass**, after updating its flag fixture.
- Additional `src/bd.test.ts`, `src/lease.test.ts`, `src/dispatch.test.ts`, `test/workspace.test.ts`, `test/subagent-decision.test.ts` all passed in a six-file isolated run (five configuration failures were corrected and re-tested).
- Local host CLI source-extension `-e .../src/index.ts --help`: **PASS**, registered ICE Workgraph flags visible.
- `npm pack --dry-run --json`: **PASS**; 39 files; includes `LICENSE.txt`, `UPSTREAM.md`, `src/index.ts`, `src/branding.ts`, `src/ice-authorization.ts`, and no `*.test.ts`.
- Clean temporary consumer `npm install --prefix ... --ignore-scripts <tarball>`: **PASS**; 134 dependencies installed. Its own ICE executable loaded packed `src/index.ts` via `-e` and displayed ICE-prefixed flags. Raw Node import of `src/protocol.ts` from `node_modules` failed because Node does not strip TS there (requires loader).
- `npm run typecheck` after source changes: **PASS**.
- `git diff --check`: **PASS** at audit preparation.
- `npm test` invoked once but **timed out** at the shell's 180-second limit during the larger serial suite. It did not finish; do not call it a passing full-suite run.
- npm install reported **seven dependency advisories**. No automatic package-major upgrades performed. Security triage remains advisable.
- Beads v1.1.2 binary checksum: SHA-256 `a72d71ed374955dc9f83a0f90b54bd7b6a0016709dd1676ae2e368651ed401c2` verified against CI.
- GitHub read of proposed `Zykairotis/ice-workgraph`: **404 / not accessible**.

## Plan gaps and cautions

1. The current working path still uses the original folder name `imported_extensions/pi-workgraph` for continuity; the independent branch and remote are `ice-workgraph/rebrand` and `upstream`. Do not represent this as an existing GitHub fork.
2. Source tests can intentionally contain legacy protocol names. Those must not be erased by cosmetic search-and-replace.
3. The current `pi-subagents` event bridge is experimental, opt-in and upstream-specific. A native ICE subagent executor is **not shipped** in this rebrand.
4. The original active model-compaction takeover was unwired from the extension factory to avoid competing with ICE; the helper remains in source for compatibility tests. Live compaction behavior needs host validation.
5. ICE plan/build authority is inferred from the trusted host-managed `ice-safe-verify-state` session record. Validate registration order and mode changes in actual interactive/RPC sessions before unattended use.
6. A compatibility alias for old `WORKGRAPH_*` coordinator settings was intentionally NOT added to avoid implicit automation; the Git push guard alone supports legacy sentinel/worker aliases.

## Next-agent fix queue (ordered; lossless from partial/blocked units)

1. **Confirm package/owner and baseline provenance (P0.1, P0.3, P1.1, P1.4).**
   - Inspect `docs/fork-provenance.md`, `docs/rebrand-inventory.md`, `package.json`, the original source commit and ICE `packages/coding-agent/src/core/extensions/types.ts`.
   - Run complete token classification and build real ICE extension factory/tool flag tests. Confirm whether the project destination `Zykairotis/ice-workgraph` is created and writable, without assuming ownership.
2. **Complete public-contract and docs cleanup (P2.4, P2.5, P5.1, P5.2, P6.4).**
   - Review `src/context.ts`, `src/dispatch.ts`, `src/index.ts`, `src/status.ts`, `README.md`, `docs/git-push-guard.md` and export paths.
   - Add a CI-enforced allowlist scan separating public ICE identities from frozen v1 data, plus negative fixtures. Verify a clean public TypeScript consumer.
3. **Finish ICE host safety and execution proof (P4.1, P4.2, P4.3, P4.6, P7.3).**
   - Test a fresh trusted build, plan, untrusted project, headless RPC and mode transition using the built ICE CLI with `-e` source.
   - Assert no `bd` writes, background sweep or coordinator startup in plan/untrusted; explicitly approved build dispatch operates and shuts down; isolated writer/reviewer requirements are not overclaimed.
   - Test active-run compaction, missing host-mode state at session start, cancellation and session resume.
4. **Validate native subagent contract (P4.5).**
   - Examine parent `packages/coding-agent/src/subagents` V2 concrete interfaces and update `docs/native-ice-subagents-contract.md` with exact APIs. Do not enable undocumented event or recursive delegation paths.
5. **Complete reproducible packaging/CI (P6.1, P6.3, P7.1).**
   - Run `npm ci --ignore-scripts` in an isolated consumer, `npm pack` install, `ice -e` startup, and full `npm test` with adequate timeout. Enable GitHub Actions only after owner repo exists. Review npm dependency advisories.
6. **Verify persisted state and release sign-off (P7.4, P7.5).**
   - Create original-v1 graph and retained workspace snapshots; run the new fork; compare lease epochs, metadata, audit, dependency edges and branch manifest before/after. Arrange independent security/code review.
7. **Activate owned fork, policies, publishing (P8.1, P8.2, P8.3).**
   - Existing owned target is not available. Create/verify GitHub ownership; add `origin` while keeping original `upstream`; configure branch protection, CI and trusted npm publishing. Only after explicit approval and all gates pass should a reviewed commit be pushed, tagged or published. No automatic global installation.

## Blockers

- `Zykairotis/ice-workgraph` repository is not accessible at audit time; no GitHub-owned origin or remote CI exists.
- No trusted npm publisher or release authorization in this local session.
- End-to-end ICE interactive/RPC remains unverified. Clean-room npm install and ICE CLI loader/help passed; raw Node protocol import requires a TypeScript loader.
- Full standalone serial `npm test` run timed out (individual affected suites passed).

## Rollback

Disable the ICE extension and opt-in coordinator; preserve the original Beads graph, comments, `lease_epoch`, workflow identifiers and worktrees. The last upstream SHA remains accessible via the `upstream` Git remote. No remote release needs reverting because none occurred.