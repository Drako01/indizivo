# Architecture

> **HISTORICAL RECORD — NOT THE CURRENT RELEASE STATE.**
> Refer to [CURRENT_STATE.md](CURRENT_STATE.md) for the published 0.1.3 baseline and active PR #14. Dated entries below may describe older branches, stale release decisions, inactive CI or unverified features. Only SHA-specific CI evidence and the [upgrade checklist](ENTERPRISE_AAAA_UPGRADE_CHECKLIST.md) establish current verified status.


**Current implementation snapshot (2026-11-05, source through `8cf2bc3238e0a5540096d894cf4185da23f2cf48`):** Extension Host, diagnostic probes, platform port ownership and Webview logic now have authored strict TypeScript implementations in `src/typed/`. CommonJS wrappers preserve stable VS Code imports. Native manifest and runtime EN/ES dictionaries, evidence descriptors, Webview controls, integration-test adaptation and required VSIX inventory were updated. **Validation remains NOT EXECUTED for this new source** (`npm ci`, `tsc`, Node integration, real Extension Host and installed VSIX); no Enterprise AAA or release PASS is claimed. Stable `main` remains unchanged. Refer to `docs/HANDOFF.md`.


> **Latest state / handoff (2026-11-05):** Current work is on `feat/enterprise-aaa-full-typescript-i18n` (last implementation commit `ab6cec321710`); not yet typechecked or tested. See **[docs/HANDOFF.md](HANDOFF.md)** for authoritative work-in-progress status. Earlier dated sections below are historical and may be superseded.

Current migration routes `diagnostics.js`, `ui.js`, `port-owners.js` and earlier adapters into `src/typed/*.ts` compiled to `dist/typed/`. `src/typed/extension.ts` now contains the authored Extension Host logic, while `src/extension.js` is a CommonJS bootstrap. These source changes are **not yet verified by tsc**; do not assume `src/typed/ui.ts` or `src/typed/diagnostics.ts` works until tests pass.


The first implementation is local-first, uses built-in Node.js APIs and does not require a cloud backend.

- src/typed/extension.ts owns the VS Code host, commands, consent, workspace lifecycle and persistence. src/extension.js is a minimal compatibility adapter.
- src/typed/diagnostics.ts exposes bounded and deterministic discovery and probes without depending on vscode; src/diagnostics.js is a compatibility adapter.
- src/typed/ui.ts renders a controlled, nonce-CSP webview using native VS Code theme tokens; src/ui.js is a compatibility adapter.
- test/diagnostics.test.js contains initial synthetic fixtures.

The UI displays a projection of authoritative extension-host state. It requests allowlisted operations only; it never executes arbitrary commands. HTTP probes require explicit target approval and are limited to loopback hosts. The user may configure all implemented workflows in the UI.

Future work: strict TypeScript, schema-validated messages and persistence, OS-specific diagnostic adapters, full packaged E2E, internationalization and before/after comparability.

- src/versions.js: restricted semver-like Node ranges and Go minimum evaluation; unsupported expressions remain inconclusive.
- src/port-owners.js: optional, read-only OS-specific process PID inspection; no process termination.
- src/comparison.js: non-causal observation trend mapping across comparable completed sessions.
- test/e2e: official Extension Host launch harness using @vscode/test-electron; execution evidence pending.


## Strict TypeScript transition (implementation branch)

The original `src/extension.js`, `src/diagnostics.js`, `src/ui.js` and platform probes remain CommonJS. `src/messages.js`, `src/versions.js`, `src/comparison.js` are compatibility adapters to `dist/typed/` generated from `src/typed/*.ts`. This preserves existing imports while enforcing strict typing on shared contracts and pure logic. `npm run build:types` runs before the test suite; publishing requires the generated runtime files in the VSIX.

Until all host/probe/UI modules have been migrated with appropriate platform typings, the project is **PARTIALLY TYPED** and does not satisfy the complete AAA type coverage gate.
