# Indizivo — CI / CD prepared, inactive

**NO GITHUB ACTIONS WERE ENABLED. NO PUBLISHING, TAGS OR RELEASES PERFORMED.**

This is internal maintainer documentation. Do not link it from the public-facing README.

## Prepared workflows

- .github/workflows-disabled/verify.yml — PR/main quality gate: reproducible npm ci, Node tests on Windows/Linux/macOS, production audit, official VS Code Extension Host E2E (Linux/Xvfb).
- .github/workflows-disabled/publish.yml — release gating, checks, single VSIX, SHA-256, Marketplace + Open VSX publishing via short-lived OIDC, GitHub release.

GitHub only discovers workflows under **.github/workflows/**. Both files deliberately live **outside that directory**, so no workflow is eligible to run.

## Defense in depth when activating later

Even if an authorized maintainer moves publish.yml into .github/workflows/, no publish job can begin unless:
1. The repository Actions variable **INDIZIVO_RELEASE_ENABLED** equals string "true" (default missing = false).
2. The ref is **main**.
3. A push changes package.json.version, or a manually dispatched run has the explicit confirm_publication=true input.
4. The release quality matrix and VS Code Extension Host E2E pass.
5. Protected GitHub environments **marketplace** and **open-vsx** are configured and, where supported, require reviewer approval.

The workflow publishes the same exact checksum-verified artifact to both stores. GitHub release is gated on Marketplace publication. Open VSX failures are visible but do not block the Marketplace-dependent GitHub release. No secrets or long-lived tokens are stored in workflows.

## First-time account/provider setup — owner only

- Marketplace: verify publisher armotusitio and extension ID indizivo, complete brand/trademark checks. In Trusted Publishing create a policy for repository owner **Drako01**, repository **indizivo**, workflow **publish.yml**, environment **marketplace**.
- GitHub: create protected environments **marketplace** and **open-vsx** (availability of required reviewers depends on plan/visibility). Restrict deployments to main and add approvals when available.
- Open VSX: verify/claim namespace **armotusitio** and add a Trusted Publisher for **Drako01/indizivo**, workflow **publish.yml**, environment **open-vsx**.
- Marketplace OIDC needs @vscode/vsce >=4.0.2. Current local devDependency is older, so this template explicitly invokes the fixed supported 4.0.2 CLI only for publishing an already packaged VSIX. Open VSX uses ovsx@1.3.0 with --trusted-publishing.
- Marketplace private-repository Trusted Publishing policies have a first-use activation window; create the policy only when owner is ready. See official publishing docs: https://code.visualstudio.com/api/working-with-extensions/publishing-extension
- Open VSX reference: https://github.com/eclipse-openvsx/openvsx/blob/main/cli/README.md

## Activation checklist — do not execute without explicit approval

1. Pass the product release gates, including Windows clean VSIX install, accessible UI, cross-platform and adversarial security checks. Confirm branding/legal status.
2. Manually review action SHA pins and workflow YAML with actionlint and a staged dry run. Test the VSIX inventory script.
3. Move .github/workflows-disabled/verify.yml -> .github/workflows/verify.yml in an authorized PR **without changing publish**. Verify PR quality checks.
4. Move .github/workflows-disabled/publish.yml -> .github/workflows/publish.yml only with release authorization. Leave INDIZIVO_RELEASE_ENABLED false initially to confirm it cannot release.
5. Create Marketplace/Open VSX OIDC policies and protected environments, and after approval set INDIZIVO_RELEASE_ENABLED=true.
6. Publish by merging a version-bump PR into main, or manually dispatch with confirm_publication=true. Record exact hash, versions, and URLs.
7. To halt future publication: set INDIZIVO_RELEASE_ENABLED=false, disable workflow and revoke trusted publisher policies if necessary.

NO-GO: If any mandatory test is failed/skipped/not executed, legal clearance unfinished, or there is no owner authorization, do not activate or publish.

## Source visibility

Before switching repository public, move the internal PLAN.md and private audit notes to a separate private repository. Removing README links does not erase Git history.


## Additional gates (staged; not running)

The future package step additionally performs an isolated **installed VSIX** Extension Host smoke using `xvfb-run -a npm run smoke:vsix`. This prevents equating source E2E with actual shipped-package E2E. All CI workflows remain in `.github/workflows-disabled` and cannot run until owner action. Repository CODEOWNERS and ruleset JSON are also only staged; see `docs/RULESETS.md`. Do not enable required check rules before the matching CI statuses exist.
