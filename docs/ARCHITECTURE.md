# Architecture

The first implementation is local-first, uses built-in Node.js APIs and does not require a cloud backend.

- src/extension.js owns the VS Code host, commands, consent, workspace lifecycle and persistence.
- src/diagnostics.js exposes bounded and deterministic discovery and probes without depending on vscode.
- src/ui.js renders a controlled, nonce-CSP webview using native VS Code theme tokens.
- test/diagnostics.test.js contains initial synthetic fixtures.

The UI displays a projection of authoritative extension-host state. It requests allowlisted operations only; it never executes arbitrary commands. HTTP probes require explicit target approval and are limited to loopback hosts. The user may configure all implemented workflows in the UI.

Future work: strict TypeScript, schema-validated messages and persistence, OS-specific diagnostic adapters, full packaged E2E, internationalization and before/after comparability.
