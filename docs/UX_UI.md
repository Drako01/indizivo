# UI/UX specification

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
