# Indizivo 0.1.0 — Manual release gate

### Icono Activity Bar + QA final Windows (2026-11-05 17:27 ART)

- **Run realmente validado:** `f1edf967c300ade273d05ab6104147ed232d37b6`, `logs(4).log` local, **18 gates: 17 PASS / 0 FAIL / 1 WARN**. TypeScript estricto PASS, **77/77** tests Node PASS, Extension Host E2E real PASS, VSIX instalado aislado PASS. Cobertura total **73,23 % líneas / 70,86 % ramas / 73,17 % funciones**; benchmark sintético **25 rondas**, p50 **38,4 ms**, p95 **40,3 ms**, RSS pico **55,1 MiB**. Auditoría producción **0 vulnerabilidades**; advertencia: **3 moderadas** en `glob`/`minimatch`, transitivas dev `@vscode/vsce`.
- **Cambio posterior al log (PENDIENTE de rerun):** el usuario aprobó la imagen completa del logo radar monocromo. `media/indizivo-activity-bar.svg` fue reemplazado por el glyph completo (barra vertical, **tres** ondas, trazo diagonal y punto terminal), SVG `viewBox 0 0 24 24`, `currentColor`, sin fondo; geometría fiel al logo original a color y legible en sidebar. El asset `media/indizivo-icon.svg` y `media/indizivo-icon-128.png` del Marketplace no se alteraron. `test/activity-bar-icon.test.js` fue actualizado para exigir la marca completa y la separación Activity Bar/Marketplace.
- **QA exacto del nuevo SVG:** inspección estática de composición/color y parseo JS del test actualizados; **no se ejecutó de nuevo el VSIX ni se vio el ícono cargado en VS Code después del cambio**. Antes de publicar, ejecutar `.\\verify-indizivo.ps1`, instalar el VSIX nuevo y confirmar visualmente en tema claro/oscuro y a escala real la fidelidad del ícono. No confundir la captura de referencia con un test de aplicación real.
- **Release:** PR #4 DRAFT; no fusionar, publicar, tagear ni activar CI. `main` intacta.


**Target:** Visual Studio Code Marketplace, publisher `armotusitio`, extension `indizivo`, version `0.1.0` (preview scope).

**Ownership:** No tool, bot, script or assistant may merge, publish, enable Actions, tag a release or expose the private repository without the owner's explicit instruction. All active source work remains on `feat/enterprise-aaa-full-typescript-i18n` and PR #4 until review.

## Evidence and release decision

- Verified baseline **before** the final hardening: Windows, commit `e883932fa3c344af5018ad32226e33d8a845b086`, 17/18 harness gates PASS, one full dev dependency audit WARN, 67/67 Node tests PASS, real VS Code Extension Host E2E PASS, and isolated packaged VSIX smoke PASS.
- **Latest 0.1.0 hardening commits have not yet passed the owner-machine regression suite.** The baseline result does **not** qualify their new SHA. A candidate must be rebuilt and retested from the final commit.
- Remaining tracked warning: moderate `glob`/`minimatch` advisories introduced via development-only `@vscode/vsce`. `npm audit --omit=dev` was clean at the baseline. Do not use `npm audit fix --force` without migration and packaging regression.
- HTML-in-script DOM simulation covers UI interactions, but it is **not** the same as a browser-host accessibility audit or a screen-reader certification.
- Linux, macOS, WSL, SSH and dev-container hosts are not qualified to the same depth as Windows; do not market cross-platform parity until verified.

## Required automated tests (Windows, final candidate SHA)

Run in a clean worktree (PowerShell 7+):

```powershell
git fetch origin
git switch feat/enterprise-aaa-full-typescript-i18n
git pull --ff-only origin feat/enterprise-aaa-full-typescript-i18n
git status --short
.\verify-indizivo.ps1
```

Inspect the generated `logs.log` and record the tested commit SHA. **Release gate:** 0 FAIL and no SKIP on typecheck, test, security, real Extension Host E2E, VSIX packaging and installed-package smoke. Repeat `npm audit --omit=dev` and review *all* development advisory details. Test the hardened Windows CLI with paths containing spaces.

The script also reports coverage and a longer (25-round default) synthetic benchmark. Coverage is informative until a strict project-specific budget has been calibrated; benchmark comparisons require the same host, Node, fixture and enough repeated measurements.

## Required manual user acceptance

- [ ] Open the **installed VSIX** in desktop VS Code in a new, local, trusted workspace. Activity Bar icon remains the original Indizivo monochrome radar glyph.
- [ ] Test an existing Node.js project and a Go project: required runtimes, config presence, declared ports, restricted expressions, honest inconclusive findings, no automatic remediation.
- [ ] Check a missing `.env` key, then inspect history, copy evidence and export Markdown/JSON. Confirm no secret values appear.
- [ ] Verify that local HTTP requests do **not** occur until the target plan is explicitly reviewed and approved; cancellation and expired approval are safe. Invalid service URLs remain editable.
- [ ] Switch English ↔ Spanish and inspect *all four sections*, dynamic findings, service consent, status comparisons, settings and exported report text.
- [ ] Verify keyboard Tab/Shift+Tab, arrow/Home/End on tablist, focus restoration after history updates, 200% zoom, narrow sidebar width and high-contrast theme. Record whether NVDA/VoiceOver testing was performed.
- [ ] Confirm a clear error or inconclusive result when an OS tool is absent or permissions prevent process-owner inspection.
- [ ] Check no private repository URLs, private source references, disabled CI files or developer logs appear in the VSIX or Marketplace-facing README.
- [ ] Review the product name **Indizivo** for conflicts (Argentina INPI and intended distribution markets). A web search is not trademark clearance.

## Publication procedure (owner only, after gates PASS)

1. Review and merge PR #4 into `main` **only when approved**. Do not publish from an unreviewed feature branch.
2. Checkout the approved `main` SHA and rerun `npm ci`, `npm run release:check` and `npm run inspect:vsix`. Ensure `package.json` still declares `0.1.0`.
3. Compute and retain `Get-FileHash .\indizivo-0.1.0.vsix -Algorithm SHA256`, along with the commit SHA and final logs.
4. Sign into the [VS Code Marketplace publisher management page](https://marketplace.visualstudio.com/manage/publishers/), verify ownership of the **armotusitio** publisher, and upload the **tested** `indizivo-0.1.0.vsix` manually. Verify metadata, support link, license and preview description.
5. Verify the public listing and fresh installation from the Marketplace. Only then consider creating the annotated `v0.1.0` tag/release and publishing the announcement.

**Important:** `package.json`'s `private:true` protects against accidental *npm* publication, but is **not** a private-publication setting for the VS Code Marketplace. Uploading a VSIX there creates a publicly distributed extension. The code repository remains private.

VS Code supports a distinct pre-release channel using `--pre-release`, but that consumes a separate version number for the next stable release. For the requested first `0.1.0`, prefer a regular upload with the documented preview scope unless the owner explicitly chooses the pre-release channel.

## Sign-off record (fill with real results)

| Gate | Status | Evidence |
| --- | --- | --- |
| Final SHA and clean tree | PENDING | |
| TypeScript, unit tests, Webview VM tests | PENDING | |
| Real Extension Host and isolated VSIX | PENDING | |
| Release audit (prod and dev) | PENDING | |
| UI/UX, EN/ES, keyboard and visual | PENDING | |
| Product name and publisher authorization | PENDING | |
| Owner release authorization | PENDING | |

Never replace a PENDING status with PASS solely because a test was authored or passed on an older commit.
