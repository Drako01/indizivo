# Changelog

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
