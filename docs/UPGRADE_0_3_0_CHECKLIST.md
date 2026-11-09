# Indizivo 0.3.0 — implementation ledger and acceptance

**Opened:** 2026-11-09. **PR:** [#17](https://github.com/Drako01/indizivo/pull/17) (Draft). **Base:** main `43844756d602ff49bef789be3b0c8eda36456a40`. **Target:** 0.3.0. **Publish:** NOT AUTHORIZED.

## Phase 0 — Baseline and governance

- [x] Repository baseline, main SHA, release 0.2.2, workflow jobs and active server rules inspected.
- [x] Correct four check names recorded in proposed JSON `config/rulesets/main-with-ci.json`.
- [ ] **BLOCKED (admin):** enable actual `required_status_checks` on live ruleset ID `26636048`, retain reviews, verify a failed check blocks merge. Classic protection API 403.
- [x] Current-state, changelog, roadmap and README candidate/release distinctions updated.

## Phase 1 — Engineering P1 corrections

- [x] Preserve hyphen ranges from `engines.node` through `discover()` into `diagnose()`; reject hostile syntax.
- [x] Stage service results until batch finishes; cancelled batches do not mutate completed session/history.
- [x] Regression tests for hyphen ranges, service cancellation and unchanged history.
- [x] Initial CI failures traced to stale 0.2.2 packaging assertion and sidebar view count; corrected and rerun.
- [x] [Run 42622585222](https://github.com/Drako01/indizivo/actions/runs/42622585222): Windows/Linux/macOS verify + Linux Extension Host PASS on `2f05c568`.
- [ ] Final SHA-specific quality, coverage, E2E and installed VSIX checks must pass after all docs/UI changes.

## Phase 2 — Security, reliability and evidence

- [x] Existing SSRF allowlist, symlink/TOCTOU, cancellable process tree, CSP and evidence redaction retained.
- [x] Existing risk-bearing per-file coverage floor and production-dependency audit run within verified CI.
- [ ] Real-project FP/FN baseline, Windows/macOS network/port-owner and remote namespace qualification pending.
- [ ] External manual security review pending.

## Phase 3 — UX-CENTER-001 (Editor Area)

- [x] Activity Bar view reduced to minimal EN/ES launcher, opens full `WebviewPanel` in Editor Area.
- [x] Reuses existing panel rather than opening duplicates; does not forcibly close Sidebar.
- [x] Editor layout widened and responsive metrics/hero spacing refined with native VS Code tokens.
- [x] Integration test covers launcher and idempotent panel reopen.
- [x] Real VS Code E2E screenshots: `media/indizivo-0.3.0-diagnostics.png`, `media/indizivo-0.3.0-services.png`, captured from synthetic fixture in [workflow 42623253356](https://github.com/Drako01/indizivo/actions/runs/42623253356).
- [ ] Manual click-through Windows/macOS/Linux and screenreader focus/contrast/zoom acceptance not signed.

## Phase 4 — CI/release/product performance

- [x] Existing OIDC release remains main-only and version-increase gated; no publication in the Draft PR.
- [x] Rebuild README screenshot references pinned to immutable screenshot commit `c788cd22d2d79fcaf56126f40466f43a153f5ded`.
- [ ] Safe CI de-duplication deferred until effective main status-check enforcement is established.
- [ ] Real-project p50/p95/RSS baseline not completed; synthetic benchmark alone cannot qualify production SLOs.
- [ ] Dev-only advisories tracked as WARN and require contextual triage.

## Phase 5 — Manual qualification and release decision

- [ ] 35/35 cases in `ENTERPRISE_AAAA_MANUAL_ACCEPTANCE.md` with exact VSIX hash.
- [ ] WSL2, Remote SSH, Dev Containers, NVDA/VoiceOver and external 10–15 developer trial.
- [ ] Owner accepts remaining gaps and reviews release checklist; merge to main, publish 0.3.0 and verify exact artifact only after explicit approval.

## Evidence rules

A checkbox implies actual source and/or named automated tests; it never implies unsigned human accessibility or remote-environment approval. Record each new CI run and exact head SHA in the PR. Build a reproducible VSIX with `npm ci && npm run release:check`. Do not claim release-ready or 100/100 with open P1 governance or manual gates.
