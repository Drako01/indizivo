# Rulesets — reference: Drako01/probato-pr

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

GitHub's enforcement of rulesets and required reviews can depend on subscription/organization settings for private repositories. Confirm the rules actually enforce restrictions rather than assuming that creation or UI display implies enforcement.

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
