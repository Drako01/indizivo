# Indizivo — Unreleased Enterprise AAAA candidate verification

> Candidate marker, 2026-11-06. This file triggers the `Indizivo / Enterprise VSIX Candidate Gate` workflow for PR #14 only. **It does NOT authorize a version bump, tag, merge or publication.**

- Repository: https://github.com/Drako01/indizivo
- Implementation branch: `feat/indizivo-enterprise-aaaa`
- Draft PR: https://github.com/Drako01/indizivo/pull/14
- Published baseline: 0.1.3; candidate must retain the same package version.
- Required: package from the exact candidate SHA, inspect VSIX contents, install in isolated VS Code Extension Host, execute packaged smoke, compute SHA-256.
- Result: **PENDING** until a workflow run for the exact SHA completes successfully.
- Non-goals: automatic release, published registry updates, GitHub tags, or any modification to `main`.
- Manual follow-up: actual UI keyboard/high contrast/screen reader tests and WSL/SSH/Dev Containers; these are not certified by headless Linux smoke.
