# Indizivo — Release readiness

**Assessment date:** 2026-11-05
**Decision:** **NO-GO for public release.** The first VSIX packaged and a VS Code E2E ran, but an exception occurred during Webview disposal. Fixes are committed and require a fresh rerun.

| Gate | Recorded status | Supporting evidence / limitation |
| --- | --- | --- |
| Repository and brand | PASS (source present) | Private repository, MIT/LICENSE, logo README and Marketplace icon |
| Manifest and source syntax | PASS (isolated static parse) | JavaScript source parsed successfully through V8 syntax construction |
| Targeted module checks | PASS (mocked) | 10 in-memory checks for version requirements and process-owner parsers, plus 10 mocked extension workflow checks (activation, commands, consent, history, trust, copy evidence and CSP); not Node test runner or desktop Extension Host |
| Local Node.js unit suite | PASS on previous commit; RETEST REQUIRED | Windows PowerShell log: 24/24 passed; new regression tests added. |
| Integration fixtures in repository | PASS (authored only) | test/extension.integration.test.js; not executed on final commit |
| Official Extension Host suite | PASS (authored only) | test/e2e/ with @vscode/test-electron |
| Actual Extension Host test | WARN; RETEST REQUIRED | VS Code 1.145.0: E2E exited 0 but Webview disposed error occurred during teardown; fix committed. |
| Clean VSIX package/install | PARTIAL; RETEST REQUIRED | 0.1.0 VSIX generated (23 files, 33.36 KB) but included logs.log; exclusion added, fresh install not verified. |
| Runtime requirement compatibility | WARN | Restricted expressions only; actual Node/Go fixture execution pending |
| Port ownership process evidence | WARN | Parsers checked; Windows, Linux and macOS OS-tool runs pending |
| Security/SSRF/hardened cancellation | WARN | Loopback HTTP targets pinned; adversarial real-host tests still required |
| UI/UX accessibility EN/ES | NOT STARTED | English UI exists; Spanish localization and keyboard/screen-reader test pending |
| Cross-platform qualification | NOT STARTED | Windows/Linux/macOS/WSL/remote host runs needed |
| Trademark and domains | BLOCKED | Indizivo availability not legally certified |
| Publication authorization | BLOCKED | Remains private; user decides release timing |

**Never turn authored source or mocked checks into a claimed packaged E2E PASS.** Source review is not a replacement for actual installation.

## Owner execution commands

On a developer machine with Node.js 22+, npm, networking for development dependencies, and a GUI-capable VS Code host:

    npm install
    npm run verify
    npm run test:e2e
    npm run package

For existing official VS Code binary: set environment variable `INDIZIVO_VSCODE_EXECUTABLE_PATH` to its executable path before `npm run test:e2e`.

Keep full logs, terminal outputs, commit SHA and platform info. Record PASS/FAIL/WARN/SKIP/BLOCKED for every mandatory E2E scenario in PLAN.md.

## Additional current-turn mocked-controller check

A V8 sandbox evaluated the exact GitHub source for src/extension.js, src/ui.js and src/comparison.js with mocked VS Code APIs. 10/10 scoped behavior checks returned true. This confirms those isolated paths under stubs only; actual Extension Host activation, UI rendering, node:test and VSIX installation remain NOT STARTED.

## Windows owner execution evidence — 2026-11-05

- npm install finished, reporting three moderate audit advisories; assess direct vs development-only impact separately.
- npm run verify: syntax checks and 24 Node tests passed.
- Official VS Code 1.145.0 Extension Host E2E: launched; the suite exited with code 0 but a disposal callback attempted to access a disposed Webview.
- Packaging produced 0.1.0 VSIX at F:\\indizivo\\indizivo-0.1.0.vsix; logs.log was erroneously included.
- Lifecycle callbacks and packaging exclusions were fixed and regression tests added to the repository. The corrected source requires a rerun on Windows and clean packaged-VSIX installation.
- No public-release approval is implied by a zero E2E exit code when logs reveal an exception.
