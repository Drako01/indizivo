# Changelog

## 0.1.0 — Local MVP (not released)
- Diagnostics and UI for Node/Go runtime discovery, local ports, environment key presence and approved loopback HTTP service checks.
- Package and Extension Host E2E pending.

### Unreleased engineering increments
- Restricted Node and Go version requirement compatibility evaluation.
- Read-only process-owner detection adapters (Windows netstat, Linux ss, macOS lsof).
- Local session status comparison without causal claims; Copy Evidence in the UI.
- Additional safety for workspace identity, active-probe mutations, localhost DNS pinning.
- Official VS Code Extension Host E2E harness authored; execution remains pending.


### Enterprise delivery hardening — not released
- Prepared disabled GitHub Actions templates for three-OS verification and future OIDC Marketplace/Open VSX releases.
- Added explicit opt-in release variable and environment approval expectations.
- Added VSIX ZIP inventory verifier; prevent internal plans, logs, secrets, tests and development scripts entering the extension package.
- Added allowlisted and bounded Webview message schema validation and malicious payload unit/integration cases.
- New tests and package gate require an actual owner-machine run before claiming PASS.
