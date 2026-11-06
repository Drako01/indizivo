# Indizivo — Current engineering state

> **Source of truth**, updated 2026-11-06. Historical PLAN.md, HANDOFF.md and RELEASE_READINESS.md contain dated, superseded statements and are not release evidence.

## Published preview
- [Main branch](https://github.com/Drako01/indizivo/tree/main) at SHA `9bad7cca3c08dda4018dc3f6c98e22dffe80def1`, version **0.1.3**, publisher `armotusitio`.
- [Quality Gate](https://github.com/Drako01/indizivo/actions/runs/42130183859) at that exact SHA: Node verification PASS on Ubuntu/Windows/macOS; official VS Code Extension Host E2E Linux PASS.
- [Published release pipeline](https://github.com/Drako01/indizivo/actions/runs/42130183807): release quality 3-OS PASS, packaged VSIX Linux smoke PASS, immutable VSIX checksum and Marketplace/Open VSX jobs successful.
- [Release v0.1.3](https://github.com/Drako01/indizivo/releases/tag/v0.1.3) attaches the VSIX and checksum.
- GitHub rulesets Protect main and Protect release tags **active** (API verified 2026-11-06); `.github/workflows/verify.yml` and `publish.yml` active.
- Scope: Node/Go environment probes, local port/process-owner observation, .env name presence, approved loopback HTTP, history and EN/ES interface. The published code is not an operating-system sandbox.

## Current development
- [PR #13](https://github.com/Drako01/indizivo/pull/13): audit/planning, **Draft; remains untouched and unmerged** by explicit owner decision.
- [PR #14](https://github.com/Drako01/indizivo/pull/14): implementation of **all phases**, Draft, target main; branch `feat/indizivo-enterprise-aaaa`. No merge, release, tag, version bump or brand change authorized.
- The [CTO audit](CTO_AUDIT_2026-11-06.md) and [upgrade checklist](ENTERPRISE_AAAA_UPGRADE_CHECKLIST.md) define scope, statuses and acceptance evidence.
- The last verified source-code SHA is `225d7079b311d878455a90c2b35ff739ecc85a5f`: [Quality Gate](https://github.com/Drako01/indizivo/actions/runs/42311892097), 4/4 PASS on Windows/Linux/macOS and official Linux Extension Host E2E. Subsequent docs-only edits do not inherit a new PASS without diff/provenance review.
- Code in #14 is **not** published; avoid presenting its improvements as features of 0.1.3. The proposed eventual release is **0.2.0**, still contingent on owner GO/NO-GO, tests and version approval. The manifest remains at 0.1.3.

## Enterprise AAAA is not certified
- No full WSL/SSH/Containers topology matrix, Windows/macOS interactive UI E2E, NVDA/VoiceOver usability, external customer trial or security penetration test has been completed.
- The "10/10" goal is internal, **not a Microsoft certification**.
- Synthetic benchmarks alone are not evidence of production performance.
- Use measured release gates and owner GO/NO-GO. A submitted implementation cannot be marked PASS until verification for its exact SHA.

## Engineering operating contract
- Baseline testing is reusable only for identical code/dependency/platform scope; use changed-file impact tests, full gates at integration/release.
- No telemetrics, mandatory accounts/AI, remote scans, project script execution, silent writes, installs or process kills.
- Explicit localhost target approval, workspace trust, reliable diagnostic evidence and redaction remain mandatory.
