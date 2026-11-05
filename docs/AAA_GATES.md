# Enterprise AAA acceptance gates — Indizivo

**Current implementation snapshot (2026-11-05, source through `8cf2bc3238e0a5540096d894cf4185da23f2cf48`):** Extension Host, diagnostic probes, platform port ownership and Webview logic now have authored strict TypeScript implementations in `src/typed/`. CommonJS wrappers preserve stable VS Code imports. Native manifest and runtime EN/ES dictionaries, evidence descriptors, Webview controls, integration-test adaptation and required VSIX inventory were updated. **Validation remains NOT EXECUTED for this new source** (`npm ci`, `tsc`, Node integration, real Extension Host and installed VSIX); no Enterprise AAA or release PASS is claimed. Stable `main` remains unchanged. Refer to `docs/HANDOFF.md`.


> **Latest state / handoff (2026-11-05):** Current work is on `feat/enterprise-aaa-full-typescript-i18n` (last implementation commit `ab6cec321710`); not yet typechecked or tested. See **[docs/HANDOFF.md](HANDOFF.md)** for authoritative work-in-progress status. Earlier dated sections below are historical and may be superseded.

**Updated acceptance state:** TS migration **AUTHORED, NOT VERIFIED** (host moved to `src/typed/extension.ts`, CommonJS bootstrap remains); EN/ES **AUTHORED/PARTIAL** (dynamic content unverified); Windows regression for new branch **NOT EXECUTED**; Linux/macOS/a11y **NOT EXECUTED**; rulesets **ACTIVE**; release **NO-GO**.


This is the engineering acceptance contract. It is NOT a certification and does not supersede actual test results. Never present unexecuted checks as PASS.

## A. Engineering quality

| Gate | Acceptance | Current evidence |
|---|---|---|
| A1 Architecture | Strict TypeScript contracts across extension host, diagnostics, UI messages, storage and reports; typecheck clean | **PARTIAL — authored**; host, probes, Webview, messages, comparisons and versions have typed source; exact-branch compiler and runtime checks pending |
| A2 Clean code | KISS, DRY, SOLID used pragmatically; no circular dependencies or monolithic control layer | **PARTIAL** |
| A3 Quality automation | Lint, typecheck, complete node tests, deterministic coverage budget, no hidden skipped tests | **PARTIAL — authored**; tsc typecheck, typed AST lint, runtime security lint and coverage report added; final-branch execution and coverage threshold pending |
| A4 Reproducible installs | npm ci from committed package-lock.json succeeds | **PASS on Windows prior commit**; re-run after changes |

## B. Security and privacy

| Gate | Acceptance | Current evidence |
|---|---|---|
| B1 Workspace Trust | No active diagnostics on untrusted workspace, including command palette and Webview | **PREVIOUS TEST PASS**, final-commit rerun pending |
| B2 Webview request validation | Allowlisted commands and payload sizes, no executable dynamic dispatch | **IMPLEMENTED, NOT TESTED on final commit**; src/messages.js and tests |
| B3 Read-only defaults | No unexpected downloads, executable repo scripts, process kill, write or off-device HTTP | **IMPLEMENTED BASELINE**, adversarial regression pending |
| B4 Secret safety | Synthetic credentials never persisted/exported; log and VSIX redaction verified | **PARTIAL**, dedicated corpus pending |
| B5 Cancellation | No hanging subprocesses or orphan process tree on Windows/Linux/macOS | **NOT VERIFIED** |
| B6 Dependencies | No critical/high production vulnerability; moderate development advisories reviewed and documented | **PROD AUDIT PASS**, 3 moderate full-tree advisories remain |
| B7 Adversarial probes | SSRF, DNS rebinding, redirects, path races, malicious symlinks, Webview payloads tested | **PARTIAL** |

## C. Reliability and user experience

| Gate | Acceptance | Current evidence |
|---|---|---|
| C1 Clean install | Install final VSIX in empty VS Code profile, open Activity Bar, diagnose, approve, export, uninstall | **NOT EXECUTED** |
| C2 OS compatibility | Windows, Linux, macOS validated with real owning process, runtime and HTTP scenarios | **NOT VERIFIED** |
| C3 Remote topology | Explicitly distinguish local/WSL/SSH/devcontainer host & service namespaces | **NOT IMPLEMENTED**; should not claim support |
| C4 Accessibility | Keyboard, 200% zoom, high contrast, screen reader and focus restoration across 4 tabs | **NOT VERIFIED** |
| C5 Internationalization | EN/ES translations complete with no UI hard-coded leftovers | **PARTIAL — authored**; ES/EN selector and static interface copy implemented, dynamic diagnostic text translation incomplete |
| C6 Evidence integrity | Each observed failure backed by reproducible check; no causal claim from mere port occupancy | **PARTIAL; unit coverage exists** |
| C7 Performance | Measured startup, worst-case cancellation, peak memory, p95 latency on 3 fixture sizes | **NOT MEASURED** |
| C8 UX evaluation | At least 15 external developers test prepared diagnosis scenarios | **NOT EXECUTED** |

## D. Packaging and release

| Gate | Acceptance | Current evidence |
|---|---|---|
| D1 Content inventory | No logs, .env, PLAN.md, development tools, tests or secrets inside VSIX | **NEW SCRIPT IMPLEMENTED; final-run required** |
| D2 Package fingerprint | SHA-256 recorded for immutable release artifact | **FUTURE CI PREPARED** |
| D3 Multi-OS CI | PR checks on Windows/Linux/macOS; Linux VS Code Extension Host integration | **DISABLED / NOT EXECUTED** |
| D4 Trusted publishing | Marketplace and Open VSX use short-lived OIDC tokens, permission-scoped roles, protected environments | **DISABLED TEMPLATES PREPARED** |
| D5 Legal | Brand/trademark clearance, copyright and license, clear privacy and support policies | **PARTIAL** |
| D6 Owner approval | Explicit GO decision before activating CI/public repository/publishing | **REQUIRED; NOT GRANTED** |

## Current release verdict

**Development build:** available for local testing, after current checkout and tools verified.

**Enterprise AAA 10/10:** **NO**. Achieving that score requires passing all mandatory security, UX, compatibility and packaged E2E gates with actual evidence. CI templates stored in .github/workflows-disabled do not count as CI runs.

## Next implementation sequence

1. Run the final-code Node tests and VSIX inventory on Windows; resolve failures without weakening tests.
2. Move the core to TypeScript strict in small additive changes, keeping runtime behavior and VS Code commands compatible.
3. Add ESLint, deterministic coverage threshold and reproducible local test harness.
4. Address cancel/timeout process ownership and OS-specific host namespaces.
5. Implement complete EN/ES UI and a keyboard-accessible history/evidence workflow.
6. Build an actual packaged-VSIX E2E harness and test independently of development source activation.
7. Cross-platform security and performance validation plus external usability study.
8. Only with authorized GO: enable verify workflow, later enable protected publication with OIDC.

Do not compress these steps into an untested all-in-one change. The initial successful 27/27 tests from November 5 predate the new packaging, schema and CI checks.


### Current ruleset and branch caveat

Protect main and Protect release tags are present as **DISABLED JSON templates only**; the GitHub API still reports no rulesets for Indizivo. The templates must be registered and activated separately with owner approval and a viable code-review path. CI remains completely inactive. Branch `feat/enterprise-aaa-phases-1-4` contains unverified implementation and is not merged.
