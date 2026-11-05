# Indizivo — CI and Trusted Publishing (Marketplace)

## Marketplace policy (publisher: armotusitio)

Use **Visual Studio Marketplace → Manage Publishers → ArmoTuSitio → Trusted Publishing → Create**.

| Policy field | Exact value |
| --- | --- |
| Policy name | Indizivo release |
| GitHub repository owner | Drako01 |
| Repository | indizivo |
| Workflow | publish.yml |
| GitHub environment | marketplace |

The Marketplace policy for Probato PR is a **different repository identity**; keep it unchanged. Policy creation does not run or authorize a release by itself.

Microsoft documentation: https://code.visualstudio.com/api/working-with-extensions/publishing-extension

## GitHub configuration required before the first OIDC release

1. Review and merge the CI PR into `main` **after quality gates pass**.
2. In `Drako01/indizivo`, create **Settings → Environments → marketplace** with required reviewer(s), branch restriction `main`, and an explicit human approval process when the plan permits.
3. In **Settings → Secrets and variables → Actions → Variables**, create `INDIZIVO_RELEASE_ENABLED` with initial value **`false`**. Publishing refuses any other value.
4. Marketplace Trusted Publishing must list the *exact* workflow filename and environment above. Do **not** create a PAT or share one.
5. Check that GitHub Actions is enabled for `Drako01/indizivo`. The quality workflow runs on PRs and `main`; the Marketplace workflow runs **only through manual `workflow_dispatch`**.

The OIDC job runs with `permissions: {contents: read, id-token: write}`. It validates the original VSIX checksum, checks a fixed `armotusitio.indizivo` identity, and publishes the **same packaged artifact** only after tests, Linux E2E, and an isolated VSIX smoke pass.

## Release procedure (owner approval only)

1. Open GitHub **Actions → Indizivo / Publish Marketplace → Run workflow** and select branch `main`.
2. Set `INDIZIVO_RELEASE_ENABLED=true` **only for an approved release window**. This variable is a second safety gate.
3. Set the manual input `confirm_publication=true` and run the workflow.
4. Approve the `marketplace` GitHub environment deployment if its protection requires it.
5. Verify the Marketplace listing and extension installation, record the artifact SHA-256 and workflow run URL.
6. Set `INDIZIVO_RELEASE_ENABLED=false` after publication.

A manual release run that still uses `false` fails in the `authorize` job **without publishing**. There are no automatic releases on pushes, PRs, or tags. An existing version is skipped safely via `--skip-duplicate`. No Git tag or GitHub Release is created automatically.

### Current release candidate

The validated Windows VSIX `indizivo-0.1.0.vsix` had SHA-256:

`1BD0A9455CCE5E77B94CC85CABFBA2E97770AA05F799762AA722B9E58A13AF01`

**Note:** GitHub Actions rebuilds the VSIX in a Linux runner. Its SHA-256 may differ from the Windows-built artifact; the workflow records and verifies its **own** VSIX checksum before publishing.

## Open VSX

Open VSX is **not activated** in the Marketplace workflow. It requires its own publisher/trust configuration. Preserve the inactive `.github/workflows-disabled/publish.yml` as a proposal only and add Open VSX to this release flow **after authorization and configuration**, reusing the exact packaged VSIX rather than rebuilding.

## Validation boundaries

The repository's Windows `npm run release:check` previously passed locally (78 Node tests, installed VSIX smoke). The new GitHub workflows and their Linux/macOS matrix require **real CI executions** before calling them validated; source-level checks are not a substitute. Do not weaken protected branches or publish while any release gate is failing.
