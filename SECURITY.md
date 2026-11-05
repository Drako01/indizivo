# Indizivo Security Policy

Indizivo is a local-first VS Code extension. The threat model, trust boundaries and outstanding release checks are documented in [docs/SECURITY.md](docs/SECURITY.md) and [PLAN.md](PLAN.md).

## Reporting a vulnerability

Use [GitHub private security advisories](https://github.com/Drako01/indizivo/security/advisories/new) when available. Because the repository is currently private, only authorized collaborators can access it. Do not publish exploit details as a public issue. Include the affected commit, OS, VS Code version, minimal reproduction and impact.

## Security guarantees and limitations

- No telemetry, cloud backend, AI requests, package installation or remote internet probes in the current MVP.
- User-triggered diagnostics only; local HTTP probes require separate explicit approval.
- VS Code workspace trust required.
- The extension is NOT sandboxed from the current user account.
- Host/process cancellation and cross-platform assurance need real E2E before public release.
- Only the newest eventual released version will be supported for security patches.

No claim of comprehensive security audit is made at this stage.
