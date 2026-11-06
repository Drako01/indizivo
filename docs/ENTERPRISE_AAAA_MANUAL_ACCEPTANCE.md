# Indizivo — Manual, accessibility and external validation matrix

**Status:** OPEN / NOT YET VERIFIED. This document defines work that automated CI and a Linux packaged-VSIX smoke cannot certify. Keep all unchecked until someone tests the **exact immutable VSIX hash** from the active candidate workflow.

## Capture an evidence row for each test

| Field | Required evidence |
|---|---|
| Commit / VSIX | Full Git SHA, version, SHA-256, exact GitHub Actions run or local build |
| Environment | OS/version, VS Code Stable version, hardware/architecture, extension host topology |
| Steps | Specific fixture, keyboard or navigation actions, expected result |
| Result | PASS / FAIL / WARN / SKIP / BLOCKED, with screenshot/log and timestamp |
| Reviewer | Tester/reviewer and remediation issue ID |
| Scope | Note whether result is for local host, WSL, SSH, container or virtual filesystem |

## A. Real UI and installation

- [ ] UI-01 Install PR14 candidate VSIX into clean VS Code Stable profile on Windows, launch Activity Bar Control Center directly, verify logo unchanged.
- [ ] UI-02 Repeat clean install on macOS with original light/dark/high-contrast icon legible.
- [ ] UI-03 Repeat clean install on Linux and validate non-headless interactions.
- [ ] UI-04 First-use trusted workspace: choose project, run, cancel, inspect finding, copy evidence, recheck, export and clear history.
- [ ] UI-05 Multi-root + monorepo project selection; scope isolated by project and no symlink escape.
- [ ] UI-06 Filter All/Warnings/Inconclusive in EN/ES; show source, confidence and limitations without unclear status.
- [ ] UI-07 Service consent: add exact localhost endpoints, review targets, decline, change target invalidates approval, approve, cancel; redirected/external/credentials rejected.
- [ ] UI-08 Corrupt/old history restore: no crash, no false PASS, historic session view remains safe, export redacted.

## B. Accessibility

- [ ] A11Y-01 Navigate entire Control Center from keyboard only; meaningful Tab and arrow order, visible focus, no keyboard traps.
- [ ] A11Y-02 Screenreader NVDA/Windows: tabs/panels, filter state, progress, warnings, copy controls and result changes are announced.
- [ ] A11Y-03 Screenreader VoiceOver/macOS: same functional announcement checklist.
- [ ] A11Y-04 UI at 200% zoom, narrow Activity Bar and editor panel; no hidden/overlapping controls.
- [ ] A11Y-05 VS Code light/dark/high contrast/forced colors: discernible status, no color-only semantics, WCAG contrast measured.
- [ ] A11Y-06 Reduced motion, EN/ES completeness, focus restoration on switching history and after error.

## C. OS, host and network topology

- [ ] OS-01 Windows local: Node, Go, Python, PHP, Java, Docker CLI version fixtures; missing tool classifications, netstat actual PID and cancellation.
- [ ] OS-02 Linux local: same fixtures, ss PID permissions/inconclusive and IPv6 loopback.
- [ ] OS-03 macOS local: same fixtures, lsof exact port (e.g. 3000 vs 30001), Ctrl+C and cancellation.
- [ ] OS-04 WSL2: distinguish Linux Extension Host and TCP listener namespace from Windows host.
- [ ] OS-05 Remote SSH: avoid claiming local machine port-owner evidence for remote processes.
- [ ] OS-06 Dev Containers: show container toolchain and loopback scope explicitly; no Docker daemon operations without opt-in.
- [ ] OS-07 Workspace Trust transitions, multi-root changes, revoked consent and virtual/remote report URI.
- [ ] OS-08 Process-tree cancellation under real supported OS, verify no orphan child remains; permission-denied must be inconclusive.

## D. Diagnostic truth corpus

- [ ] DQ-01 Compare Node/npm range results against reference npm semver for supported expressions; unsupported remain inconclusive.
- [ ] DQ-02 Toolchain `go` vs `toolchain` directives and invalid modules across actual Go versions.
- [ ] DQ-03 IPv4/IPv6/localhost: listening, refused, timed out and unsupported; never infer root cause from TCP alone.
- [ ] DQ-04 `.env.example` keys: missing, unreadable, symlink outside workspace, secrets; no values in JSON/MD/clipboard.
- [ ] DQ-05 Lockfile ambiguity in npm/pnpm/yarn/bun roots including mixed monorepos; no automatic dependency fixes.
- [ ] DQ-06 Compare before/after services reordered; stable target identities and status changes accurately attributed.
- [ ] DQ-07 Performance: small/medium/large real projects; measure p50/p95 latency, memory, activation and cancellation.
- [ ] DQ-08 No unexpected requests, file writes or subprocesses in externally monitored read-only run.

## E. Usability trial and business-value gate

- [ ] UX-01 Recruit 10–15 external developers across Windows/macOS/Linux and multiple ecosystems.
- [ ] UX-02 Prepare labelled failing environments and a structured study capturing time to first actionable finding.
- [ ] UX-03 Measure precision, false positives/negatives, task success, ability to act on safe next steps and willingness to repeat use.
- [ ] UX-04 Evaluate accessibility issues, confusing confidence labels and excessive manual steps.
- [ ] UX-05 Record raw observations, sample size, fixtures, measurement method and threshold decisions in a reproducible report.

## Decision

Current decision: **NO-GO for an Enterprise AAAA / 10/10 claim** until the required checks above have actual evidence. Passing CI/build alone does not complete manual acceptance. The owner retains sole authority to approve merge, version bump, tag or publication.
