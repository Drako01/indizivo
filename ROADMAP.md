# Indizivo — Current roadmap

**Latest published release:** [0.2.2](https://github.com/Drako01/indizivo/releases/tag/v0.2.2) (2026-11-07). **Current development candidate:** 0.3.0 in [Draft PR #17](https://github.com/Drako01/indizivo/pull/17). No 0.3.0 publication has been authorized.

## Implemented in the 0.3.0 branch (verification ongoing)

- Correct Node engine hyphen-range handling across the discovery/evaluation boundary.
- Transactional approved localhost service results: no cancelled batch is persisted as successful complete evidence.
- Editor Area is the primary Control Center when opening from the Activity Bar; narrow Sidebar is a launcher.
- Real VS Code Extension Host screenshots from synthetic fixtures and an updated onboarding README.

## Remaining release-readiness gates

1. **Repository enforcement:** verify and enable real required status checks on the *active* GitHub main ruleset (not merely local JSON templates).
2. **Runtime qualification:** Windows/macOS/Linux installed-VSIX click-through, WSL2/Remote SSH/Dev Containers and owner/process semantics.
3. **Accessibility:** keyboard-only navigation, NVDA, VoiceOver, 200% zoom, light/dark/high contrast and EN/ES.
4. **External evidence:** actual project false-positive/false-negative corpus, real-project p50/p95/RSS and user research.
5. **Release authorization:** owner review, clean PR CI, exact VSIX hash, manual GO/NO-GO, then merge; the existing main-only publish pipeline handles the released version.

Detailed IDs and evidence: [docs/UPGRADE_0_3_0_CHECKLIST.md](docs/UPGRADE_0_3_0_CHECKLIST.md). [docs/CURRENT_STATE.md](docs/CURRENT_STATE.md) is the source of truth. Earlier plans and handoff notes are historical, not current release evidence.
