# ICE Workgraph fork provenance

- Original repository: https://github.com/gjtorikian/pi-workgraph
- Source commit: `1a72a6742a4c0055daf8a3fc45d97ba3cd399dd8`
- Original package/version: `pi-workgraph@0.3.1`
- Independent ICE working branch: `ice-workgraph/rebrand`
- Local working directory: `imported_extensions/pi-workgraph` (not yet renamed or published)
- Current remote: `upstream` -> original repository, retained for source synchronization
- Intended owned origin: `https://github.com/Zykairotis/ice-workgraph.git`, not yet created or verified
- Intended npm identity: `@zykairotis/ice-workgraph@0.1.0`, not published
- License: MIT, original copyright preserved in `LICENSE.txt`

The rebrand preserves upstream Git history and changes working-tree source, tests,
documentation and package metadata. These changes are not committed, pushed, or
installed into the user's normal ICE profile. Parent ICE worktree changes are
out of scope.

## Validation environment

- ICE host: local `@zykairotis/ice-coding-agent@0.83.0` checkout
- Node: 24.21.0; npm: 12.0.2
- Beads: verified v1.1.2, downloaded as a temporary binary and checked
  against CI SHA-256 `a72d71ed374955dc9f83a0f90b54bd7b6a0016709dd1676ae2e368651ed401c2`
- Beads executable used for tests: `/tmp/ice-workgraph-bin/bd`, not a system install
- ICE CLI source-extension smoke: the CLI accepts src/index.ts and exposes
  the ICE_WORKGRAPH flags in --help without invoking a model.
- Package tarball inspection: npm pack --dry-run reports the original MIT license.
- Packed tarball installed cleanly into `/tmp/ice-workgraph-clean-consumer`
  using `npm install --prefix ... --ignore-scripts <local-tarball>`.
  The separately installed ICE CLI successfully loaded the packed extension
  source via `-e` and exposed `--ice-workgraph-*` flags in `--help`.
- Direct Node import of packed `src/protocol.ts` fails as expected without a
  TypeScript loader: Node cannot strip TypeScript under `node_modules`.

## Safe repository ownership transition

When the intended GitHub repository exists and ownership is confirmed, add it
as `origin` while keeping `upstream` pointing to the original author. Do not
push to upstream, rewrite inherited history, or use upstream release workflows.
Publishing requires an approved owned origin, passed CI, and configured
trusted publishing. The independent ICE changes should be reviewed before
any commit or push.