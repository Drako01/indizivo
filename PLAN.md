# Indizivo — PLAN.md
## Enterprise AAA end-to-end engineering, verification and release plan

**Project owner:** Alejandro Daniel Di Stefano
**Copyright holder:** ArmoTuSitio (armotusitio.com.ar)
**License:** MIT
**Date:** 2026-11-05
**Current release decision:** NO-GO for an Enterprise AAA public release. Development-extension E2E (VS Code 1.145.0) and VSIX packaging passed on Windows on 2026-11-05; clean packaged-VSIX installation, full UI/OS/security qualification and branding clearance are pending.

### 1. Product objective

Make a VS Code extension that helps developers understand why local projects fail to start or communicate. It must distinguish observation, possible cause and demonstrated resolution. It must work without accounts, AI, paid services, Docker or Redis.

Core user journey: **Open project → Diagnose → Inspect evidence → Approve optional probes → Act manually → Verify again → Export**.

MVP competitive distinction:
- NOT GumRun: no generic process launcher.
- NOT CodeVitals: no generic editor metrics dashboard.
- NOT Dev Env Diff: no plaintext .env comparison UI.
- This product does not include pull-request or code-review workflows.

### 2. Engineering standards

Apply KISS, DRY, YAGNI and SOLID pragmatically; separation of concerns; typed contracts (strict TypeScript target); small, testable modules; no unnecessary framework or cloud infrastructure; accessibility and privacy by default.

Current modules:
- src/extension.js — VS Code activation, commands, approvals and session persistence.
- src/diagnostics.js — local discovery/probes/evidence with no vscode dependency.
- src/ui.js — responsive, themed webview control center.
- test/diagnostics.test.js — initial Node fixtures.
- media — logo and monochrome Activity Bar mark.

Planned hardening: strict TypeScript migration, schema validation for UI messages/configuration, richer platform adapters, explicit E2E harness, metrics and localization.

### 3. Functional MVP checklist

- [x] Extension manifest, commands, Activity Bar and home controls authored.
- [x] Project selection and separate workspace state authored.
- [x] User-triggered diagnosis, progressive results and cancellation authored.
- [x] Node.js and Go runtime discovery with bounded version probes authored.
- [x] Declared local TCP port checks authored; no unsupported process ownership claim.
- [x] .env.example / .env key presence comparison without persisting values authored.
- [x] Loopback HTTP service configuration, approval and check authored.
- [x] Evidence, limitations, safe guidance, history, report export and evidence copy through UI authored.
- [x] Compare consecutive completed sessions without claiming resolution.
- [x] MIT copyright, brand logo, README and user credit authored.
- [x] Run Node syntax checks and 27/27 unit/integration tests on the tested Windows source (2026-11-05). Re-run after further code changes.
- [x] Author official @vscode/test-electron Extension Host suite for activation, diagnosis, service approval and UI panel opening.
- [x] Run the authored Extension Host suite in official VS Code 1.145.0: exit 0, no Webview disposed exception (2026-11-05).
- [ ] Test complete UI interactions in the actual installed VSIX (including keyboard, focus, accessibility, and history).
- [x] Package VSIX successfully: 21 files, 29.7 KB, without logs.log.
- [ ] Install the generated VSIX in a clean VS Code profile and execute smoke/E2E on the installed package.
- [ ] Finish EN/ES localization and accessibility validation.
- [x] Implement common Node.js/Go version requirement evaluations (limited-expression support; unrecognized requirements are inconclusive).
- [ ] Validate all version range semantics and edge cases on real runtimes.
- [x] Add read-only Windows/Linux/macOS process-owner parsers and probes.
- [ ] Execute platform-specific owner inspection on real target hosts, including permissions/namespace limitations.
- [ ] Verify host/WSL/SSH/container semantics and labels.
- [ ] Add evidence comparability/attribution rather than inventing causality.

An authored feature is NOT a verified PASS.

### 4. Diagnostic evidence and safety contracts

States: CREATED, RUNNING, COMPLETED, PARTIAL, CANCELLED, FAILED.
Results: PASS, WARN, INFO, SKIP, BLOCKED, INCONCLUSIVE.
Confidence: OBSERVED fact, CORRELATED evidence, HYPOTHESIS needing proof, INCONCLUSIVE, RESOLVED only by comparable recheck.

Never label a TCP listener as the cause of an application failure without contextual evidence. Never state a project is healthy merely because checks pass. Unavailable tools/permissions do not count as successful tests.

Operations:
- Discovery reads only bounded regular files below the selected workspace root.
- Runtime checks run allowlisted commands with shell disabled, timeout and output bounds.
- Local HTTP only, allowlisted loopback host, no credentials or external redirect follow.
- No repo script execution, package installation, process kill, auto-fix or silent remote requests.
- Any later mutating action MUST show impact, target and explicit approval before execution.
- Every check exposes timestamp, host, target, method, observation and known limits.
- Detect and redact synthetic secrets from persisted data and exported reports.

### 5. End-to-end testing matrix

| ID | Scenario | Acceptance |
|---|---|---|
| E2E-01 | Clean VSIX install on VS Code Stable | Activates and shows icon/control center |
| E2E-02 | First run on trusted project | No account, terminal or AI required |
| E2E-03 | Untrusted workspace | Active diagnostics disabled |
| E2E-04 | Node with required version declaration | Actual and declared versions distinguished |
| E2E-05 | Go module without Go installed | Missing tool reported, no invented version |
| E2E-06 | Declared port listening | Listener observed; no invented PID/conflict |
| E2E-07 | Declared port closed | Observation is accurate and actionable |
| E2E-08 | Missing .env required key | Only key name stored; values never leaked |
| E2E-09 | Local HTTP 200 | Requires exact endpoint approval; evidence correct |
| E2E-10 | Local HTTP refusal/timeout | Bounded, classified, no hangs |
| E2E-11 | Remote URL / embedded credentials | Rejected before request |
| E2E-12 | Multi-root workspace | Separate selected project state |
| E2E-13 | Cancellation during probe | No orphan process, state is CANCELLED |
| E2E-14 | Markdown and JSON export | Accurate, redacted, complete for performed checks |
| E2E-15 | Clear history | Confirmed and persisted removal |
| E2E-16 | Narrow sidebar and editor panel | Controls remain usable |
| E2E-17 | Keyboard/screen reader/high contrast | Accessible navigation and status |
| E2E-18 | Windows, Linux, macOS, WSL | Claim support only for actually tested targets |
| E2E-19 | Malformed/oversized/symlink config | Bounded failure, no escape |
| E2E-20 | Hostile webview message | No arbitrary command execution |
| E2E-21 | Real packed VSIX | Runtime/branding assets included; fresh profile passes |
| E2E-22 | Recheck after changing environment | Before/after evidence not over-attributed |

### 6. Quality and performance gates

- Syntax/build, strict TS migration, lint, typecheck, unit tests, integration tests, packaged E2E.
- Security review, dependency audit, license compliance, attack fixture suite.
- Performance sample projects: small/medium/large; measure startup, 95th-percentile diagnosis latency, peak memory, cancellations.
- False positive analysis: controlled root-cause fixtures plus external user trials.
- Product usability trials: 15–20 developers; measure time to first useful diagnosis and comprehensibility.
- Focus, keyboard, visual contrast and screen reader validation; no color-only status.
- All numbers from actual measured runs; never manufacture benchmark claims.

### 7. Build and release procedure

Prepare Node.js and npm; obtain developer dependencies legitimately:

    npm install
    npm run check
    npm test
    npm run test:e2e
    npm run package

Then launch the official VS Code Extension Development Host; use prepared fixtures to run E2E-01 through E2E-22; install the final generated VSIX into a clean profile and repeat smoke. Capture commands, timestamps, platform versions, outputs and commit hash in docs/RELEASE_READINESS.md.

Do not enable GitHub Actions, push public releases, open marketplace publisher access, make the repo public or register domains without explicit user approval.

### 8. Branding and legal release gates

- [x] Indizivo design selected, with diagnostic I/arcs/evidence point.
- [x] Copyright ArmoTuSitio and author/designer attribution.
- [x] MIT license written to LICENSE.
- [ ] INPI Argentina exact/phonetic, classes 9 and 42.
- [ ] Other planned-market trademark review.
- [ ] .com and .com.ar registration status with authoritative source.
- [ ] Marketplace / Open VSX namespace confirmation.
- [ ] Marketplace 128px PNG asset and actual VSIX package inspection.
- [ ] Owner explicitly approves publication.

Trademark availability is NOT confirmed.

### 9. Reporting and state discipline

Each test gate records PASS, FAIL, WARN, SKIP, BLOCKED or NOT STARTED. An omitted, mocked or unexecuted test NEVER counts as PASS. The release remains **NO-GO** while mandatory checks are failed, skipped, blocked or not started.

Enterprise AAA means observed quality in a real installed product, not merely a roadmap label.

### Recorded interim technical checks (2026-11-05)

- 10/10 mocked runtime-version and process-owner parser assertions passed in a V8 isolated runtime.
- 10/10 mocked VS Code controller assertions passed in a V8 isolated runtime, including consent, trust and evidence copying.
- JavaScript source syntax was parsed using V8 Function constructor after changes.
- These are **unit-like scripted checks**, not a clean Node test runner, browser accessibility, shipped VSIX or actual VS Code E2E.
- The mandatory release verdict therefore stays **NO-GO** until tests and package validation are run and failures corrected.

### Windows verified quality-gate rerun — 2026-11-05

User-supplied PowerShell log records: `npm ci` completed; `npm run release:check` exit code 0; 27/27 tests passed twice; VS Code 1.145.0 development Extension Host E2E passed without the prior Webview-disposal error; `indizivo-0.1.0.vsix` built with 21 files / 29.7 KB, without local logs; `npm audit --omit=dev` reported 0 vulnerabilities. The full dependency audit still reports 3 moderate development-tree advisories, requiring evaluation. This **does not** cover clean VSIX install, full interactive browser UI, Windows/Linux/macOS compatibility, accessibility, security adversarial QA or trademark release approval. Keep production Enterprise AAA verdict NO-GO.


### CI/CD disabled staging (2026-11-05)

- [x] Prepare cross-platform quality workflow at .github/workflows-disabled/verify.yml.
- [x] Prepare version-gated OIDC Marketplace/Open VSX workflow at .github/workflows-disabled/publish.yml.
- [x] Require missing-by-default INDIZIVO_RELEASE_ENABLED=true for future publishing even if templates are moved.
- [x] Add VSIX inventory validation with denylist for logs, private plans, source test fixtures, secrets and dev-only scripts.
- [x] Add tests asserting GitHub Actions remains disabled and release protection remains present.
- [ ] Run all new tests and inventory checks on Windows with npm run release:check; record results.
- [ ] Validate templates with actionlint on the exact final source.
- [ ] Validate three OS runners and official VS Code E2E after explicit owner approval to activate CI (not yet authorized).
- [ ] Configure Marketplace/Open VSX Trusted Publishing policies and protected environments when ready for release.
- [ ] Obtain explicit publication approval; do not assume staging templates authorizes activation.

CI state: **PREPARED / INACTIVE / NOT EXECUTED**. See docs/CI_RELEASE_PREPARATION.md. These templates are NOT under .github/workflows/.

### Final-turn isolated safety check — 2026-11-05

- JavaScript syntax of 9 recently modified core/test files parsed successfully in V8.
- 8/8 isolated V8 checks of src/messages.js passed (valid commands, invalid commands, bound payloads, invalid export, evidence identifiers).
- No workflow files are present under .github/workflows/; only .github/workflows-disabled/verify.yml and publish.yml exist.
- These checks are **NOT a replacement** for executing npm run release:check, VSIX inventory verification or a real installed VSIX smoke test.
- See docs/AAA_GATES.md for hard requirements before claiming Enterprise AAA 10/10.
