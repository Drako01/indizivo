# Indizivo — Release readiness

**Assessment date:** 2026-11-05
**Decision:** **NO-GO** — actual VSIX packaging and installed official VS Code E2E still unverified.

| Gate | Recorded status | Supporting evidence / limitation |
| --- | --- | --- |
| Repository and brand | PASS (source present) | Private repository, MIT/LICENSE, logo README and Marketplace icon |
| Manifest and source syntax | PASS (isolated static parse) | JavaScript source parsed successfully through V8 syntax construction |
| Targeted module checks | PASS (mocked) | 10 in-memory checks for version requirements and process-owner parsers; not Node test runner |
| Local Node.js unit suite | NOT STARTED | npm test has not executed on final commit |
| Integration fixtures in repository | PASS (authored only) | test/extension.integration.test.js; not executed on final commit |
| Official Extension Host suite | PASS (authored only) | test/e2e/ with @vscode/test-electron |
| Actual Extension Host test | NOT STARTED | No VS Code desktop binary or compatible GUI runtime in this environment |
| Clean VSIX package/install | NOT STARTED | npx @vscode/vsce requires install and package checks |
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
