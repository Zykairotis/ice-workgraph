# Upstream provenance and maintenance

ICE Workgraph is a maintained fork of [gjtorikian/pi-workgraph](https://github.com/gjtorikian/pi-workgraph), based on source commit `1a72a6742a4c0055daf8a3fc45d97ba3cd399dd8`.

The original work is Copyright (c) 2026 Garen J. Torikian, licensed under MIT. The original copyright and grant remain in `LICENSE.txt`. ICE-specific changes are separately maintained by Zykairotis; this is not an official upstream distribution or endorsement.

Before synchronizing upstream, compare both protocol contracts (`src/types.ts` lease/lifecycle metadata and `src/protocol.ts` channels), inspect every dependency and licensing change, and run the race, fencing, recovery and integration suites. Do not overwrite the on-disk `workgraph_*` fields, `workgraph:v1:*` events, audit comments or workspace manifests as a branding-only operation.

The original nested checkout was not pushed or retargeted as part of the local rebrand. When an owned GitHub repository is created, configure its `origin` and keep the original URL as `upstream`. Publish and deployment require separate explicit approval.