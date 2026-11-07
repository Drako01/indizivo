# Changelog

## 0.2.2 — Preview flag removed

- Removed `"preview": true` from the manifest so the Marketplace no longer labels Indizivo as a preview (owner decision). No functional changes.
- Manual accessibility, remote-topology and external usability qualification remain pending and are still documented as such; removing the label is not a certification.

## 0.2.1 — Diagnostic accuracy and release-pipeline hardening

- **Fixed:** a TCP listener bound only to IPv6 loopback (`::1`, e.g. `localhost` on dual-stack hosts) was reported as "not listening" because only `127.0.0.1` was probed. Both families are now probed; the finding states which address answered, and "not listening" is reported only when both refuse (an unavailable IPv6 stack counts as no listener). English and Spanish strings added; stored 0.2.0 sessions keep rendering with their original keys.
- **Fixed:** npm hyphen ranges (`1.2.3 - 2.1.0`, partial bounds such as `1 - 2` or `1.2.3 - 2.3`) were INCONCLUSIVE; they are now evaluated with npm's partial-bound semantics. Prerelease/build identifiers and malformed hyphens remain INCONCLUSIVE. Frozen reference corpus extended.
- **Security:** probes spawned by Indizivo are now cancelled when the extension deactivates; a pending HTTP approval is revoked whenever the workspace folders change; on Windows the port-owner lookup now uses `netstat -ano` so IPv6 (`::1`) listeners get an owner (`-p tcp` was IPv4-only).
- Added read-only real-project measurement to the benchmark (`INDIZIVO_BENCH_ROOT`) and regression tests for cancellation under load, consecutive runs and time budgets.
- Sessions record the remote topology name (WSL, SSH, Dev Containers) in `host`, so sessions from different hosts are never compared. Real remote qualification remains pending and is documented as such.
- CI: the publish workflow no longer repeats the full `verify` inside the packaging job; that job `needs` the three-OS verify and the Extension Host job for the same SHA, and still builds, inspects, installs and smoke-tests the real VSIX. `npm run package` (local) keeps verify + package via the new `package:vsix` script.
- Documentation brought in line with the published 0.2.0 baseline (current state, roadmap, handoff, checklist).

## 0.2.0 — Enterprise diagnostics upgrade

- More precise Node/npm compatibility evaluation including wildcard caret/tilde cases and a frozen corpus of expectations cross-checked against semver 7.6.3.
- Unsupported .nvmrc requirements remain explicitly inconclusive; unknown workspace text is never copied into diagnostics.
- Reject unknown future history schemas and unexpected Webview message fields; preserve legacy v1 history safely.
- Fail gracefully when VS Code workspaceState cannot be read/written: preserve the current diagnosis in memory, report persistence limitations clearly in EN/ES, and never invent stored history.
- Rejected HTTP health targets create explicit BLOCKED evidence without requests or credential-bearing URL disclosure.
- Strict Go module minimum and recommended toolchain handling, including implicit Go 1.16 and invalid-directive detection; Go CLI version probe disables automatic toolchain downloads.
- File-descriptor identity and final file mutation checks, plus expanded SSRF and synthetic credential redaction cases.
- Additive JSON report format metadata and evidence/provenance-rich Markdown exports.
- Explicit localized limited Workspace Trust and virtual-workspace declarations in the extension manifest.
- Additive versioned Finding v1 check/target identifiers and conservative unassessed severity, with safe history migration and EN/ES provenance limitations.
- Bounded subprocess orchestration and real child-tree cancellation tested on Linux, macOS and Windows. Replaced execFile with spawn after an adversarial test exposed leaked descendants.
- Extracted pure JSON/Markdown report rendering from the Control Center, with per-format redaction and contract tests.
- Added opt-in, non-publishing VSIX candidate measurements for synthetic small/medium/large fixtures (p50/p95/RSS), explicitly not customer SLO evidence.
- Additional unreleased PR #14 engineering: monorepo selection, evidence provenance, explicit port inference, stable service identities, optional toolchain checks, safer exports and consent.
- Fixed a Windows-only defect where NTFS file IDs above 2^53 made legitimate project files read as blocked; file identity now uses exact bigint stats.
- Added per-module coverage floors and a labeled discovery corpus with an error-rate budget to the quality gates.
- The package version is 0.2.0. Publication, tag and merge still require the owner's GO; manual accessibility, remote and external usability gates remain open.


## 0.1.3 — Marketplace OIDC release verification

- Patch-version increment to validate the automatic multi-registry publishing pipeline after merging a pull request to `main`.
- Uses the corrected `@vscode/vsce` 4.1.0 OIDC exchange for Visual Studio Marketplace and the existing Open VSX Trusted Publishing integration.
- No functional changes to diagnostics, localization, interface, or extension APIs.


## 0.1.2 — Multi-registry delivery verification

- Version bump to verify the complete automatic release pipeline following a PR merge to `main`.
- Non-functional TypeScript source comment; no changes to diagnostics, UI, runtime behavior or APIs.
- Target distribution: Visual Studio Marketplace and Open VSX via the same verified VSIX using OIDC.


## 0.1.1 — Delivery pipeline verification

- Non-functional source annotation to validate the 0.1.1 release pipeline.
- CI quality gates and OIDC delivery preparation for Visual Studio Marketplace and Open VSX.
- No changes to runtime behavior, user-facing diagnostics or extension APIs.

## 0.1.0 — First Preview (release candidate; not published)

Indizivo introduces a local-first diagnostic Control Center for Visual Studio Code 1.99+.

### Added
- Node.js and Go runtime discovery with bounded, evidence-backed compatibility checks.
- Local port inspection and best-effort process-owner identification on supported hosts.
- Presence-only comparison of `.env.example` and `.env` variable names; values are never recorded.
- Explicitly approved loopback-only HTTP GET health checks, without following redirects.
- Diagnostic history, rechecks, cautious status comparisons, evidence copying and Markdown/JSON reports.
- English and Spanish interface, four keyboard-navigable sections and accessible focus states.
- Strict TypeScript core and Webview host, with stable packaged CommonJS entry points.

### Security and delivery
- Workspace Trust enforcement, bounded file reads, symlink protections and validated UI messages.
- Cancellation and timeouts, CSP-constrained Webview and inert evidence rendering.
- Reproducible npm lockfile, TypeScript/security lint, unit/integration tests and real VS Code Extension Host E2E.
- VSIX inventory validation and isolated installed-package smoke test.
- Local owner-controlled release process; no automated CI publishing.

### Scope and known limitations
- Windows desktop is the first automated platform verified; Linux/macOS and remote/WSL/SSH/container setups are not fully qualified for 0.1.0.
- There is no automatic remediation, cloud service, mandatory AI account or telemetry.
- Local tool permissions and operating-system capabilities determine process ownership visibility.
- Moderate advisories in development-only packaging dependencies are tracked separately; no production dependency advisories were found in the last validated Windows run.

**Release candidate QA:** The pre-hardening Windows revision `e883932fa3c` passed 17/18 harness checks with one development dependency audit warning. This candidate requires one new complete regression run after the final commits; do not treat the earlier run as validation of this exact source.
