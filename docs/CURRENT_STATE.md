# Indizivo — Current engineering state

**Updated:** 2026-11-09 (ART). Source of truth for release and candidate qualification.

## Published production baseline

- Latest public version: **0.2.2**, [GitHub release](https://github.com/Drako01/indizivo/releases/tag/v0.2.2).
- Exact main commit: `43844756d602ff49bef789be3b0c8eda36456a40`.
- Published VSIX digest: `sha256:064ff6474b90b7ab6e6519afb7d075c2e520c62b48f9c15fc018547e444a3c1a`.
- [Quality Gate](https://github.com/Drako01/indizivo/actions/runs/42370928962) and [multi-registry publish](https://github.com/Drako01/indizivo/actions/runs/42370928948) completed successfully. [Open VSX reconciliation](https://github.com/Drako01/indizivo/actions/runs/42485203110) passed 2026-11-08.
- No `0.3.0` tag, Marketplace version or public GitHub release is claimed.

## 0.3.0 implementation (not released)

- Work isolated in [Draft PR #17](https://github.com/Drako01/indizivo/pull/17), `feat/indizivo-0.3.0-engineering-ux`.
- `0.3.0` manifest and lockfile are in sync.
- Runtime: hyphenated Node engine constraints, atomic service-check session updates, editor-first Control Center with compact Activity Bar launcher.
- Test evidence: initial [CI run 42621924766](https://github.com/Drako01/indizivo/actions/runs/42621924766) exposed 2 stale tests; fixed on `2f05c568...` and [CI run 42622585222](https://github.com/Drako01/indizivo/actions/runs/42622585222) passed Windows/Linux/macOS and official Linux Extension Host.
- [E2E screenshot capture](https://github.com/Drako01/indizivo/actions/runs/42623253356): actual VS Code host + synthetic fixture; images versioned in `media/`. They demonstrate rendering, not cross-platform human acceptance.
- Exact latest branch SHA, CI and candidate VSIX must be recaptured at PR completion. Earlier successful SHAs do not qualify later edits.

## Remaining limitations / NO-GO for Enterprise claims

- The active `Protect main` GitHub ruleset has review requirements but was observed **without `required_status_checks`** through the API on 2026-11-09. Classic branch-protection API returned 403. Requires authorized administrator and effective negative test before claiming protected CI merges.
- [Manual acceptance matrix](ENTERPRISE_AAAA_MANUAL_ACCEPTANCE.md): 35 cases pending, 0 signed. WSL/SSH/Dev Containers, NVDA/VoiceOver, real OS click-through and external usability research are unqualified.
- No telemetry, required AI, cloud backend, remote network scanning, unconsented requests, project script execution or silent remediation. Indizivo is not an OS sandbox.
- Dependences exclusive to build/dev tooling may have moderate advisories; triage as WARN unless exploitability escalates. `npm audit --omit=dev` passed on published baseline.

See [0.3.0 evidence checklist](UPGRADE_0_3_0_CHECKLIST.md). The owner controls merge and publication.
