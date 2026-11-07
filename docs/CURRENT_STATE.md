# Indizivo — Current engineering state

> **Source of truth**, updated 2026-11-07. Historical PLAN.md, HANDOFF.md and RELEASE_READINESS.md contain dated, superseded statements and are not release evidence.

## Published preview
- Baseline: **0.2.0** on [main @ 4d81290](https://github.com/Drako01/indizivo/commit/4d81290b28d5f2be1f3daf610833dea9e16eb0dd) ([release](https://github.com/Drako01/indizivo/releases/tag/v0.2.0)), VSIX SHA-256 `8cdafec982d019d6d5c41b562bcb4a2289918eb180d1bfec380f199f7816cec7`; [Quality Gate](https://github.com/Drako01/indizivo/actions/runs/42316225544) and [Publish](https://github.com/Drako01/indizivo/actions/runs/42316225513) PASS.
- **0.2.1** hardens 0.2.0: IPv6 loopback port observation, npm hyphen ranges, remote-topology labelling in sessions, and a de-duplicated publish pipeline. See CHANGELOG. Its publication evidence is recorded in the checklist ledger once the pipeline completes.
- Publisher `armotusitio`, extension ID, branding and `preview: true` are unchanged.
- Scope: Node/Go environment probes, optional Python/PHP/Java/Docker version probes, local port/process-owner observation, `.env` name presence, approved loopback HTTP, history and EN/ES interface. The code is not an OS sandbox.

## Not certified (unchanged)
- [Manual acceptance](ENTERPRISE_AAAA_MANUAL_ACCEPTANCE.md): 35 cases pending, 0 signed. No WSL/SSH/Dev Containers matrix, no NVDA/VoiceOver evaluation, no click-through UI run on Windows/macOS, no external usability study or pentest.
- "Enterprise AAAA / 10-10" is an internal engineering goal, not a Microsoft certification. Synthetic benchmarks are not production SLOs.
- [PR #13](https://github.com/Drako01/indizivo/pull/13) is a planning-only PR and stays open and unmerged.

## Engineering operating contract
- Reuse evidence only for identical code/dependency/platform scope; impact tests per change, full gates for integration and release.
- No telemetry, mandatory accounts/AI, remote scans, project script execution, silent writes, installs or process kills.
- Explicit loopback target approval, Workspace Trust, bounded reads and redaction remain mandatory.
