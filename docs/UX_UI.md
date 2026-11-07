# UI/UX specification

> **HISTORICAL RECORD — NOT THE CURRENT RELEASE STATE.**
> Refer to [CURRENT_STATE.md](CURRENT_STATE.md) for the published 0.1.3 baseline and active PR #14. Dated entries below may describe older branches, stale release decisions, inactive CI or unverified features. Only SHA-specific CI evidence and the [upgrade checklist](ENTERPRISE_AAAA_UPGRADE_CHECKLIST.md) establish current verified status.


**Everything implemented must be controllable inside the extension.**

Activity Bar: Indizivo Control Center. Tabs: Diagnostics, Services, History & Reports, Settings.

Golden path: select trusted project → Diagnose → inspect check and timestamped evidence → optionally add a localhost service → review exact active probe targets → Approve and run → recheck → export.

Design: spacious, professional and native to VS Code themes; modular panels, low visual noise, disclosure of evidence and limitations; consistent loading, empty, blocked, cancelled and error states. No fake “project healthy” message. Use English text first, Spanish required before the final AAA release. Accessible keyboard, reduced motion and screen-reader UX must be independently verified.

Brand accents: graphite/teal/amber; inside extension native VS Code tokens override brand colors for contrast and theme support.

The UI additionally provides per-finding Copy Evidence and a comparison panel between runs. These indicate observed differences, never automatically proven repairs.


## Enterprise UI increments (unverified in packaged VSIX)

- English and Spanish language selector under Settings; preference persists in VS Code workspaceState.
- History now persists up to ten recent full evidence snapshots; clicking one shows its findings, evidence and export. The current session remains available.
- ARIA tablist/tab/tabpanel identifiers, arrow/Home/End navigation, focus restoration and live announcements.
- Backend diagnostic suggestions are still in English; complete bilingual QA, high contrast and screen reader tests remain required.


## Activity Bar original artwork — restored (2026-11-05)

The product owner explicitly confirmed the **original Indizivo Activity Bar glyph** must be retained, with no redesign. The attempted stronger-stroke glyph from PR #2 was not approved.

- Restored `media/indizivo-activity-bar.svg` **byte-for-byte** from commit `151d6956e452191bbc554efb97d2d14b7d56d8c8` (before PR #2).
- Original silhouette: vertical I, two radar arcs, one evidence point; transparent 24×24 SVG with inherited `currentColor` for native VS Code theme behavior.
- No change to the 128px Marketplace icon, colored logo, manifest, UI, diagnostic logic or publishing workflows.
- Tests assert the original geometry and monochromatic theme adaptation. Any future visual redesign requires an explicit approved visual reference.
- Manual inspection of the restored icon in an installed VSIX remains pending, particularly active/inactive and different themes.
