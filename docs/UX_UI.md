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


## Activity Bar legibility pass (2026-11-05)

The Activity Bar requires a **24x24 transparent, monochrome SVG** using `currentColor`; VS Code controls the selected/inactive color for light, dark and high-contrast themes. The product's colored Marketplace logo must **not** replace this resource.

- `media/indizivo-activity-bar.svg`: stronger 2.55–3.2px strokes, larger evidence point and near-full 24px footprint. The symbol retains the brand's `I + radar + evidence` motif, without extra details lost at native size.
- `media/indizivo-icon-128.png` and the full-color branding remain unchanged.
- Automated tests guard theme adaptation, 24px viewBox, absence of fixed colors and core glyph anatomy.
- Manual signoff still required: check **inactive / active** icons in Windows VS Code dark/light/high-contrast themes and at 100%/200% scale after installing the rebuilt VSIX. Do not classify this as verified until visually inspected.
