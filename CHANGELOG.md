# Changelog

## Unreleased — proposed 0.2.0, PR #14 (DRAFT; no release authorization)

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
- This is **not** published. The package version remains 0.1.3 pending the owner's future 0.2.0 GO decision. Manual accessibility/remote/platform and external usability gates remain open.


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
