# Indizivo — PLAN.md
## Enterprise AAA end-to-end engineering, verification and release plan

**Project owner:** Alejandro Daniel Di Stefano
**Copyright holder:** ArmoTuSitio (armotusitio.com.ar)
**License:** MIT
**Date:** 2026-11-05
**Current release decision:** NO-GO — extension source is present, but real Extension Host E2E and clean VSIX install have not been verified.

### 1. Product objective

Make a VS Code extension that helps developers understand why local projects fail to start or communicate. It must distinguish observation, possible cause and demonstrated resolution. It must work without accounts, AI, paid services, Docker or Redis.

Core user journey: **Open project → Diagnose → Inspect evidence → Approve optional probes → Act manually → Verify again → Export**.

MVP competitive distinction:
- NOT GumRun: no generic process launcher.
- NOT CodeVitals: no generic editor metrics dashboard.
- NOT Dev Env Diff: no plaintext .env comparison UI.
- NOT Probato PR: no PR/code review workflow.

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
- [x] Evidence, limitations, safe guidance, history, report export authored.
- [x] MIT copyright, brand logo, README and user credit authored.
- [ ] Build/test code against exact released commit.
- [ ] Verify all UI actions inside official VS Code on an actual project.
- [ ] Create and test installable VSIX.
- [ ] Finish EN/ES localization and accessibility validation.
- [ ] Implement consistent runtime version compatibility checks (currently shows declared/current only).
- [ ] Implement OS-specific process ownership, with permissions/namespace evidence.
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
