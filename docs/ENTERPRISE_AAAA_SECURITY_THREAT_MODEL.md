# Indizivo — Threat model / Enterprise AAAA

**Estado:** engineering review (2026-11-06), NOT a penetration-test certification. Applies to unreleased PR #14. Repo: `Drako01/indizivo`.

## Architecture and trust boundaries

- **Workspace input is untrusted:** `package.json`, `go.mod`, `.nvmrc`, env variable names, marker files, lockfile metadata and symlinks originate in developer projects. Indizivo must not execute repository scripts, dereference external symlinks or trust arbitrary file content.
- **Extension Host privileges:** runtime/tool probes run with the OS permissions of the VS Code extension host, not in an OS sandbox. Local and remote hosts have distinct filesystem and network namespaces.
- **Webview is untrusted UI:** only a narrow set of validated messages crosses into the privileged Extension Host. CSP with nonces; HTML content is created using inert text nodes rather than HTML injection.
- **HTTP is an explicit opt-in capability:** only loopback targets (localhost / 127.0.0.1 / ::1), displayed and approved before GET; no credentials, querystrings, fragments or redirects, and no HTTP bodies are consumed. A GET can have side effects in a misbehaving service; keep consent user-visible.
- **Data exit points:** clipboard, Markdown/JSON export, local diagnostic history, VSIX package, GitHub Actions logs and Marketplace/Open VSX registry metadata.

## Threat register and mitigations

| ID | Threat / abuse case | Current mitigation | Status / missing evidence |
|---|---|---|---|
| SEC-01 | Repo scripts execute on scan | Explicit command allowlist, no shell; `tool-probes.ts` only fixed version args | Automated fixtures PASS; adversarial process-tree verification pending |
| SEC-02 | Symlink traversal or oversized config | Bounded open, lstat/realpath, nofollow plus fstat inode/dev identity and mtime/size check before accepting content | [run 42309190289](https://github.com/Drako01/indizivo/actions/runs/42309190289) 4/4 PASS; real concurrent TOCTOU/permissions matrix pending |
| SEC-03 | External HTTP / SSRF / DNS rebinding | URL allowlist, pinned loopback, user approval, no redirects/body; invalid targets => BLOCKED no network | [run 42309414688](https://github.com/Drako01/indizivo/actions/runs/42309414688) 4/4 PASS with 15 invalid URL corpus; fuzz/DNS/monitoring pending |
| SEC-04 | Webview XSS / arbitrary host command | Nonce CSP, inert text, runtime message validation | VM integration tests PASS; browser E2E and fuzzing pending |
| SEC-05 | Secret value leakage | `.env` names only, bounded reports, redact Bearer/Basic, cookies, URL userinfo, common GitHub/AWS tokens, JWT/private-key patterns | [run 42309414688](https://github.com/Drako01/indizivo/actions/runs/42309414688) 4/4 PASS synthetic; unknown formats and external assessment pending |
| SEC-06 | Restored state denial-of-service | History/check-size limits; schema migration; i18n key and comparison validation; workspaceState get/update exceptions are caught and surfaced without corrupting current findings | Automated failure-injection tests PASS on 0c97ed0; attack corpus and real OS/remote persistence failures pending |
| SEC-07 | False root-cause confidence | Labels observed/inferred/inconclusive, scope and target IDs, no automatic resolution | Unit tests PASS; externally labelled false-positive corpus pending |
| SEC-08 | Remote host confusion | Extension-kind workspace plus manifest declarations for limited untrusted/virtual workspaces, local/remote scoping and trust guards | [run 42309758459](https://github.com/Drako01/indizivo/actions/runs/42309758459) 4/4 PASS; WSL/SSH/Dev Containers E2E not certified |
| SEC-09 | Process-owner inspection | Read-only OS commands with bounded timeout/output and one batched snapshot | Platform parser fixtures PASS; real owner + cancellation matrix pending |
| SEC-10 | Export to arbitrary workspace/URI | Save dialog and VS Code workspace.fs, user-selected location | Integration test PASS, no automatic upload |
| SEC-11 | Supply-chain publishing compromise | OIDC identity-scoped environments, SHA-pinned actions, immutable VSIX and SHA256; no tokens in PR | Published 0.1.3 pipeline PASS; new PR14 release is explicitly unauthorized |
| SEC-12 | Unexpected persistent tracking | No telemetry, mandatory account, AI provider or hosted backend | Source review baseline; network-monitoring qualification pending |

## Mandatory fail-closed invariants

- No evidence, insufficient permissions, broken executable or unknown syntax => INCONCLUSIVE/SKIP/WARN, not an invented PASS.
- No project mutations, package installation, credential upload, arbitrary shell, process kill or external URL checks.
- Consent must be invalidated if selected workspace, trust, endpoint list or review session changes.
- Results from different workspace/host scopes must not be compared as equivalent.
- Unknown historical translations, report shapes or saved state must not execute code or break the Control Center.
- Failing third-party dependency audits are classified by exploitability and scope; a real exploitable production finding blocks release, development-only advisories may be WARN with documented rationale.

## Explicitly not yet certified

Security penetration assessment, real Windows/macOS process-tree cancellation, DNS/SSRF fuzz corpus, WSL/SSH/Dev Containers namespace tests, screenreader interactions and externally observed product quality. These must remain open in the checklist until actual evidence exists.

## Verification sources

- Tests: `test/security.test.js`, `test/hardening.test.js`, `test/config-boundaries.test.js`, `test/storage.test.js`, `test/redaction.test.js`, `test/ui-browser.integration.test.js`.
- Runtime: `src/typed/diagnostics.ts`, `src/typed/tool-probes.ts`, `src/typed/storage.ts`, `src/typed/messages.ts`, `src/typed/redaction.ts`.
- Release: `.github/workflows/verify.yml`, `.github/workflows/verify-packaged.yml`, `.github/workflows/publish.yml`.
- QA state: `docs/ENTERPRISE_AAAA_UPGRADE_CHECKLIST.md`.
