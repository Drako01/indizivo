# Indizivo — Unreleased Enterprise AAAA candidate verification

> Candidate marker, 2026-11-06. This file triggers the `Indizivo / Enterprise VSIX Candidate Gate` workflow for PR #14 only. **It does NOT authorize a version bump, tag, merge or publication.**

- Repository: https://github.com/Drako01/indizivo
- Implementation branch: `feat/indizivo-enterprise-aaaa`
- Draft PR: https://github.com/Drako01/indizivo/pull/14
- Published baseline: 0.1.3; this prerelease candidate must retain the same package version.
- Target release on future owner authorization: **0.2.0** (NOT set in package.json, NOT published).
- Source-code head verified: `0c97ed06a458666254109dfd14c877adfadbccf5` ([Quality Gate 42307778143](https://github.com/Drako01/indizivo/actions/runs/42307778143), 4/4 PASS).
- Earlier docs candidate `6977fb6` passed [VSIX Gate 42307501547](https://github.com/Drako01/indizivo/actions/runs/42307501547) with SHA-256 `bcbf7f1f33e987002358832afccb5f1043baff609d4f9acd8e1fadd5749559c3`. This was **before** latest storage hardening; no evidence reuse for modified runtime.
- New immutable candidate: THIS commit, documentation-only delta; its VSIX hash and installed Extension Host smoke must be checked by the triggered gate.
- Required: package from the exact candidate SHA, inspect VSIX contents, install in isolated VS Code Extension Host, execute packaged smoke, compute SHA-256.
- Result: **PENDING** until a workflow run for the exact SHA completes successfully.
- Non-goals: automatic release, published registry updates, GitHub tags, or any modification to `main`.
- Manual follow-up: actual UI keyboard/high contrast/screen reader tests and WSL/SSH/Dev Containers; these are not certified by headless Linux smoke.
