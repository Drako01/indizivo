# Indizivo — Unreleased Enterprise AAAA candidate verification

> Candidate marker, 2026-11-06. This file triggers the `Indizivo / Enterprise VSIX Candidate Gate` workflow for PR #14 only. **It does NOT authorize a version bump, tag, merge or publication.**

- Repository: https://github.com/Drako01/indizivo
- Implementation branch: `feat/indizivo-enterprise-aaaa`
- Draft PR: https://github.com/Drako01/indizivo/pull/14
- Published baseline: 0.1.3; this prerelease candidate must retain the same package version.
- Target release on future owner authorization: **0.2.0** (NOT set in package.json, NOT published).
- Source-code head verified: `225d7079b311d878455a90c2b35ff739ecc85a5f` ([Quality Gate 42311892097](https://github.com/Drako01/indizivo/actions/runs/42311892097), 4/4 PASS).
- Previous VSIX candidate `00276c9` passed [VSIX Gate 42307975194](https://github.com/Drako01/indizivo/actions/runs/42307975194) with SHA-256 `ae9370f9a418c1b8b3487f5bbc8e47958d828572bcd0023824fbe93bda2990f5`. Historical only; later process-control and report code is changed.
- New immutable candidate: THIS commit, documentation-only delta; its VSIX hash and installed Extension Host smoke must be checked by the triggered gate.
- Required: package from the exact candidate SHA, inspect VSIX contents, install in isolated VS Code Extension Host, execute packaged smoke, compute SHA-256; capture labelled small/medium/large synthetic p50/p95/RSS JSONL as candidate artifact.
- Result: **PENDING** until a workflow run for the exact SHA completes successfully.
- Non-goals: automatic release, published registry updates, GitHub tags, or any modification to `main`.
- Manual follow-up: actual UI keyboard/high contrast/screen reader tests and WSL/SSH/Dev Containers; these are not certified by headless Linux smoke.
