# Indizivo Privacy

Indizivo is designed for local-only environment inspection. There is no built-in analytics, telemetry, account creation or cloud backend.

## What is read
- Project manifests (bounded, regular files).
- Node.js or Go version output when the developer clicks Diagnose.
- Declared local port and loopback connectivity results.
- Variable **names only** between .env.example and .env; values are not saved.
- Optional loopback HTTP endpoints submitted by the user.

## What is saved
Workspace-scoped settings (timeout and approved service target list), a bounded diagnosis history and the current session. Evidence contains timestamps, observed states, and target identities. These data can include local project names, key names or URLs; do not configure an endpoint containing secrets in the path.

## What is transmitted
No data is transmitted to ArmoTuSitio or external services. Approved HTTP probes reach only the configured loopback endpoints and do not follow redirects. No third-party AI is used.

## User controls
From the Control Center, you can remove service targets, clear history, and explicitly export Markdown or JSON to a chosen location. Deleting the extension's VS Code workspace storage clears remaining local data.

## Security limits
The extension runs with the permissions of the VS Code extension host; it is not an OS sandbox. See SECURITY.md and PLAN.md before public deployment.
