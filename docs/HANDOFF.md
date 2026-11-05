# Indizivo — Technical handoff / current engineering state

> **CANONICAL CONTINUATION STATUS. Updated 2026-11-05.**
>
> Read this file before making changes or reporting progress. It supersedes older, dated notes in PLAN.md, docs/RELEASE_READINESS.md and docs/AAA_GATES.md when those older entries conflict. Those files retain historical evidence rather than representing the latest branch state.

## 1. Repository and source-of-truth

- GitHub private repository: `Drako01/indizivo`. Do **not** make it public or publish the extension without an explicit new owner instruction.
- Stable `main` baseline: `701444a46b30ecdae399dbb4f61098a8822ab6e1` (original Activity Bar glyph restored in merged PR #3).
- **Current work branch**: `feat/enterprise-aaa-full-typescript-i18n`.
- **Last implementation commit before handoff documentation**: `ab6cec321710e68c1215a0da6fded41587dd07f7`. Documentation commits follow this source snapshot; read the current branch HEAD before working.
- Branch is **NOT yet merged or release-qualified**. Keep commits small; open/review a PR rather than pushing to protected main.
- Product identity: Indizivo, copyright ArmoTuSitio, MIT, icon `media/indizivo-activity-bar.svg` **must remain the original design**. Do not redesign without explicit approval.
- Owner wants an Enterprise AAA level, KISS/DRY/SOLID, careful security and no regressions.
- Never falsely report tests as PASS because code was authored.

## 2. Engineering objective for this iteration

1. **Full strong TypeScript conversion** of actual runnable code, including VS Code Extension Host, diagnostics, ports/OS adapters and Webview, not merely type-only interface files.
2. **Complete English and Spanish internationalization** of UI, native VS Code manifest strings, diagnostic findings, evidence, errors, confirmations, history, clipboard and Markdown/JSON report presentation. Preserve unmodified technical values (URLs, versions, PIDs, port numbers, key names).
3. **Quality AAA**: strict compiler, checked package-lock, no suppressions/unsafe any, tests and instrumented UI, adversarial security, smoke of installed VSIX, coverage and benchmark regression compared with stable `main`.
4. Keep user-facing root-level `verify-indizivo.ps1` script and `logs.log` output; script may be deleted by owner when no longer needed. It is excluded from VSIX.

## 3. What has actually been committed on the working branch

- `src/typed/i18n.ts`: catalog with **188 EN/ES translation keys** plus interpolation and recursive descriptors; `src/i18n.js` is the CJS adapter. Includes text for UI, diagnostic descriptions, errors and exports.
- `package.nls.json` and `package.nls.es.json`: native VS Code command and view localization.
- `src/ui.js`: thin adapter to `dist/typed/ui.js`. `src/typed/ui.ts`: authored migration of Webview logic (unverified TypeScript compilation, browser tests pending).
- `src/diagnostics.js`: thin adapter to `dist/typed/diagnostics.js`. `src/typed/diagnostics.ts`: authored migration of probe engine; attaches structured i18n descriptors (not yet compile/test verified).
- `src/port-owners.js`: thin adapter to `dist/typed/port-owners.js`, with `src/typed/port-owners.ts` authored.
- `src/typed/versions.ts`: localized verdict descriptors.
- `src/extension.js`: **still substantial JavaScript**, enhanced with localization for many host errors, clipboard and reports. **Not yet migrated to TypeScript**.
- `src/typed/contracts.ts`, `src/typed/comparison.ts`, `src/typed/messages.ts` remain typed.
- `@types/node` and `@types/vscode` entries added to package.json/package-lock.json; **lockfile integrity, dependency resolution and npm ci have NOT been verified on this new branch**.
- `verify-indizivo.ps1` at repository root, writing `logs.log`. Both script exclusion and test guard added to `.vscodeignore`.
- Additional localization and package tests authored. They have **NOT been executed against the latest branch**.

### IMPORTANT: work not complete / probable failure points

- `tsc --noEmit` has NOT run on this branch. Typed Webview and diagnostics are new and may have compile errors. Treat as **DRAFT, NOT PASS**.
- `src/extension.js` must be migrated to `src/typed/extension.ts` and compiled; keep `src/extension.js` as a minimal compatibility entry point or explicitly adjust manifest and fixtures.
- Update `tsconfig`, lint, scripts, test inventory and VSIX mandatory entries for **all** compiled modules.
- Validate `npm ci` lockfile entries (metadata/integrity/version) rather than assuming additions are correct. Regenerate using an npm lockfile generator if needed.
- Prevent any test from silently passing because it loads stale `dist/typed` build output. Require clean compile and package from known Git SHA.
- Translation metadata is added, but there may be hard-coded text left in diagnostics, DOM, host, reports and README. Audit all runtime output.
- Existing tests may assume English strings, old source layout or 59-test baseline. Update without weakening behavior, safety or original icon.
- Accessibility and EN/ES selection must be tested **in the actual VS Code Webview**, not just with source regex assertions.
- Do not activate GitHub workflows or publish.

## 4. Prior verified baseline vs new branch

**Previously verified by owner on stable Windows `main` (commit `701444a46b30ecdae399dbb4f61098a8822ab6e1`):**
- `npm run release:check`: **59/59 Node tests PASS**, official VS Code Extension Host E2E PASS, packaged VSIX smoke PASS, inventory PASS; no test failures.
- Production dependency audit: **0 vulnerabilities**; full dev tree: **3 moderate advisories** (WARN).
- Coverage: **67.68% lines**, **69.40% branches**, **71.43% functions**; old `src/ui.js` approximately **11.66% lines**.
- Synthetic benchmark: p50 ~39.2ms, p95 ~44.0ms, peak RSS ~52.3 MiB.
- Original Activity Bar SVG restored and checked by git blob SHA; this design is an owner requirement.

**Working branch:** no Windows `npm ci`, `tsc`, `npm test`, VSIX E2E, or actual cross-platform run **yet**. Do **not** apply 59/59 or baseline performance values to current branch.

## 5. GitHub governance / release policy

- Repository rulesets **ACTIVE** (confirmed via GitHub API):
  - `Protect main`: ID **26636048**, PR/review/CODEOWNERS/squash/protection rules.
  - `Protect release tags`: ID **26636049**, protects `v*`.
- CI templates stay under `.github/workflows-disabled/`. There are **0 active workflow YAMLs** under `.github/workflows/`.
- Publication guard (for future authorized activation): `INDIZIVO_RELEASE_ENABLED=true` plus protected environments/OIDC. **Not activated**.
- Repo remains private, and no Marketplace/Open VSX publication has been authorized.

## 6. Exact continuation instructions for another AI / engineer

1. Read `docs/HANDOFF.md` (this file), `PLAN.md`, `docs/AAA_GATES.md`, `docs/RELEASE_READINESS.md`, `package.json`, `tsconfig.json`.
2. `git fetch origin`; checkout `feat/enterprise-aaa-full-typescript-i18n`; inspect commit history/diff vs `main`. Do not change `main` or activate workflows.
3. Finish TypeScript migration and fix strict typecheck failures, including host/Webview integration. Commit frequently to work branch.
4. Audit EN/ES completeness and make static strings, runtime descriptors, status/evidence, history, clipboard and exports consistently localized.
5. Validate the dependency lockfile. Run `npm ci` then `npm run typecheck`, `npm run lint:types`, `npm test`, followed by full `npm run release:check`.
6. From Windows PowerShell 7 run `./verify-indizivo.ps1` in the repository root. Review and attach `logs.log`, including failures, WARN and regression comparison against baseline.
7. Update `PLAN.md`, `docs/RELEASE_READINESS.md`, `docs/AAA_GATES.md` and this handoff with **exact commit SHA** and PASS/FAIL/WARN/SKIP/BLOCKED for each gate.
8. Open a reviewable PR; do not merge while required gates remain failing. Do not publish.

### Suggested operator commands (do not execute automatically on the owner's host)

```powershell
cd F:\indizivo
git fetch origin
git switch feat/enterprise-aaa-full-typescript-i18n
git pull --ff-only origin feat/enterprise-aaa-full-typescript-i18n
.\verify-indizivo.ps1
# Send F:\indizivo\logs.log for regression review
```

## 7. Acceptance / definition of DONE

- All runnable functional implementation in strict TS; only deliberate tiny JS bootstrap adapters remain.
- Complete EN/ES parity including messages from actual diagnostics; no sensitive values leaked, no network beyond consented loopback.
- Clean `npm ci`, `npm run typecheck`, `npm run release:check`, installed VSIX E2E and full tests PASS from exact branch SHA.
- No regression in privacy, Workspace Trust, cancellation, service approval, history and report exports.
- Review results against baseline and coverage; do not claim full AAA 10/10 without real UI accessibility, Linux/macOS, security and UX evidence.

**Current verdict: IN PROGRESS / NOT READY TO MERGE OR RELEASE.**
