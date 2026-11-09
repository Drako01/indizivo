# Rulesets — reference: Drako01/probato-pr

> **HISTORICAL RECORD — NOT THE CURRENT RELEASE STATE.**
> Refer to [CURRENT_STATE.md](CURRENT_STATE.md) for the published 0.1.3 baseline and active PR #14. Dated entries below may describe older branches, stale release decisions, inactive CI or unverified features. Only SHA-specific CI evidence and the [upgrade checklist](ENTERPRISE_AAAA_UPGRADE_CHECKLIST.md) establish current verified status.


Last inspected: 2026-11-05.
Source rulesets:
- [Protect main](https://github.com/Drako01/probato-pr/rules/26362018)
- [Protect release tags](https://github.com/Drako01/probato-pr/rules/26362020)

At inspection time:
- Probato PR has **2 active rulesets**.
- Indizivo has **0 repository rulesets**.
- Ruleset reading through the GitHub connector succeeded; this connector does **not** expose a ruleset CREATE/UPDATE operation, so copying the JSON into Git is not equivalent to applying GitHub server-side policies.

## Exact protections to replicate

### main
- Protect default branch `~DEFAULT_BRANCH`.
- Reject deletion, non-fast-forward updates and non-linear history.
- PR mandatory; one approving review.
- Dismiss stale approvals when commits change.
- Require CODEOWNERS review and approval of the most recent push.
- Require all review threads resolved.
- Require extra approval for unattributed changes.
- Only squash merge allowed.
- Administrator repository-role bypass in `pull_request` mode, matching Probato's effective configuration.
- Avoid adding mandatory checks until the verification workflow is actually activated.

### release tags
- Protect `refs/tags/v*`.
- Reject updates, deletions and non-fast-forward.
- RepositoryRole actor_id 5 (`always` bypass) is taken from the Probato export; **verify its role meaning and effect in the destination repository** before applying.

## Prepared files

- `config/rulesets/main-development.json`: equivalent main protections **without** required status checks (compatible with the disabled CI).
- `config/rulesets/main-with-ci.json`: proposed future main protections with status check gates.
- `config/rulesets/release-tags.json`: release tag protection matching Probato's rule types.
- `.github/CODEOWNERS`: the repo owner is the default code owner so CODEOWNERS review is enforceable.

## IMPORTANT: future required-check contexts

Probato's exact check contexts are `Verify (ubuntu-latest)`, `Verify (windows-latest)` and `Verify (macos-latest)`; its integration_id 15368 must not be copied blindly.

Indizivo's staged workflow advertises `Node tests / <OS>` and `Official VS Code E2E / Linux`, but GitHub check names must be confirmed from a **real workflow run**. Therefore `main-with-ci.json` is a **draft**, not the final exact-check policy. Required contexts must match check runs before enforcing them.

## Application through GitHub Settings (manual / authorization required)

Only the repository owner can apply these GitHub server-side rules:

1. Open [Indizivo Settings → Rules → Rulesets](https://github.com/Drako01/indizivo/settings/rules).
2. Create a **branch ruleset** using `main-development.json`, apply to the default branch, activate it.
3. Create a **tag ruleset** using `release-tags.json`, apply to `v*`, activate it.
4. Check that the destination has the correct CODEOWNERS and bypass role; confirm status in the Rulesets list.
5. Keep `required_status_checks` **disabled** while workflows remain in `.github/workflows-disabled/`.
6. After explicit activation of CI, run the actual checks, record their exact names and GitHub App sources, then migrate from `main-development.json` to `main-with-ci.json`.
7. Re-read rulesets through GitHub API to confirm server-side state. Configuration files in the repository do not apply protection.

### GitHub CLI alternative

For repository administrators with `gh` authenticated and ruleset administration permission, the following commands can create rulesets **only after reviewing the source and confirming repository plan support**:

```powershell
gh api --method POST repos/Drako01/indizivo/rulesets --input config/rulesets/main-development.json
gh api --method POST repos/Drako01/indizivo/rulesets --input config/rulesets/release-tags.json
gh api repos/Drako01/indizivo/rulesets
```

Do **not** run `main-with-ci.json` while the CI is disabled.

## Private-repository constraints

GitHub rulesets are available for **public repositories on Free** and **public/private repositories on GitHub Pro, Team or Enterprise Cloud**. Since Indizivo is private, verify that its GitHub account/repository is eligible for enforcement before applying. See https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository . A ChatGPT Plus subscription does not determine GitHub plan eligibility.

## Repository governance

- Keep `Drako01/indizivo` private.
- Never activate workflows, modify repository visibility, tags or publish artifacts as part of this ruleset preparation.
- Keep the branch protections consistent with the independent source/PR engineering workflow.


### Safe PowerShell helper (Windows)

Run from the repository root after the feature branch has been reviewed and merged, with GitHub CLI authenticated:

~~~powershell
.\scripts\apply-rulesets.ps1           # read-only preview
.\scripts\apply-rulesets.ps1 -Apply    # create missing rulesets
~~~

The helper never updates or deletes existing rulesets and leaves mandatory CI checks disabled. Its repository target is hardcoded as \`Drako01/indizivo\`. The first real GitHub API POST changes server-side governance, so it requires explicit owner action.

**Important:** requiring one approving PR review in a solo-maintainer repository may block merges unless another reviewer is available or an appropriately authorized bypass is effective. Review the bypass behavior before enabling.

## 0.3.0 finding — active server policy is incomplete (2026-11-09)

The GitHub API confirmed `Protect main` (ruleset ID `26636048`) is active with mandatory PR reviews, but does **not** contain `required_status_checks`. The classic branch-protection endpoint returned HTTP 403, so another protection mechanism cannot be conclusively ruled out.

`config/rulesets/main-with-ci.json` is a **proposal**, now aligned to the four exact checks emitted by `verify.yml`; editing this file does not update GitHub server rules. An administrator must inspect and update the active ruleset using GitHub Settings or a correctly scoped `gh api` request, preserve existing review protections, require the current checks, then test a deliberately failing PR cannot be merged. No server-side rule change is claimed by PR #17.

Do not eliminate push-main verification while this enforcement is unconfirmed; it is a defense-in-depth gate. The release workflow also verifies a newly created merge SHA independently before publishing.
