# Indizivo

**Developer Environment Diagnostics**  
**Find the cause. Fix with confidence.**

> Product definition and visual identity baseline. **Not yet an implemented VS Code extension.**

Indizivo will diagnose why a development project fails to start or why its local components cannot communicate. It will correlate observed facts about runtimes, ports, processes, local services and approved project configuration, show evidence, distinguish facts from hypotheses, and suggest reversible actions requiring user approval.

## Product principles

- **Evidence before action.** Never claim a root cause without supporting diagnostics.
- **UI-first.** The developer can discover, initiate, inspect, configure, cancel, export and approve every supported workflow from VS Code, without editing JSON or using a terminal.
- **Local-first and free core.** No account, cloud, paid AI, telemetry or backend needed for diagnostics.
- **Read-only by default.** No process termination, code changes, downloads, installs or external requests without contextual consent.
- **Clarity over noise.** This is not a generic process launcher, port dashboard, resource monitor or .env comparator.
- **VS Code native.** Follow themes, accessibility, keyboard navigation and remote extension host boundaries.

## Current status

**DESIGN APPROVED / IMPLEMENTATION NOT STARTED.** This repository currently defines the market positioning, brand direction, architecture, UX and MVP acceptance. Branding and name are provisional until trademark/domain clearance. Platform compatibility and QA remain to be implemented and proven.

## Design documentation

- [Product and differentiation](docs/PRODUCT_BRIEF.md)
- [Enterprise AAA technical architecture](docs/ARCHITECTURE.md)
- [Full UI/UX specification](docs/UX_UI.md)
- [Evidence, diagnostics and safety](docs/DIAGNOSTICS_AND_SECURITY.md)
- [MVP scope and acceptance](docs/MVP_ACCEPTANCE.md)
- [Roadmap and release gates](docs/ROADMAP.md)
- [Brand identity](docs/BRAND_IDENTITY.md)
- [Name verification / unresolved items](docs/NAMING_DUE_DILIGENCE.md)
- [Engineering practices drawn from Probato PR](docs/ENGINEERING_STANDARDS.md)
- [Editable vector brand assets](media/brand/)

## Prototype onboarding target

Install extension → open trusted project → click **Diagnose project** → review checks and approve optional active probes → inspect observations, evidence, possible causes and proposed actions → apply only approved remedies → rerun affected checks → export report.

## Project governance

- Repository stays private until an authorized public release.
- The logo concept and brand name are design choices, **not registered trademarks**.
- No CI, marketplace publishing, automated fixes or remote writes without explicit authorization.
- Work in feature branches and use review/PR before merging when the repository is initialized for implementation.
- Maintain a traceable PASS / FAIL / WARN / SKIP / BLOCKED release evidence record.

© 2026 Indizivo project. License is **TBD**; do not assume MIT merely because Probato PR uses MIT.
