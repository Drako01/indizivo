# Indizivo — Engineering roadmap

> Published baseline: 0.1.3 (2026-11-06). This is a plan, not a release commitment. The current source of truth is [docs/CURRENT_STATE.md](docs/CURRENT_STATE.md); acceptance and handoff live in [docs/ENTERPRISE_AAAA_UPGRADE_CHECKLIST.md](docs/ENTERPRISE_AAAA_UPGRADE_CHECKLIST.md).

## Published 0.1.3

- Local Node.js and Go runtime discovery, bounded version and port checks, optional process-owner inspection.
- Environment-variable **names** only; read-only by default, no scripts executed.
- User-approved localhost HTTP checks, local session history, EN/ES interface, export and recheck comparison.
- Automated quality gates on Windows/Linux/macOS; real VS Code Extension Host and packaged VSIX smoke tests on Linux.

## Enterprise AAAA milestones (work in PR #14, not released)

1. Accuracy: version ranges, loopback IP families, file observability, stable evidence identities, source attribution.
2. Security: explicit consent, storage and workspace hardening, cancellation, host namespace accuracy.
3. Product utility: actionable findings, monorepo awareness, opt-in dependency checks, demand-backed language adapters.
4. Engineering: modular typed contracts, real UI E2E/a11y, focused coverage and realistic performance baselines.
5. Release: immutable VSIX, provenance-based gates, registry reconciliation, user validation and explicit owner GO/NO-GO.

A feature is not complete merely because code is written. No version, date, tag or publication is authorized by this roadmap.
