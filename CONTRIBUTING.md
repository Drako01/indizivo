# Contributing to Indizivo

Indizivo is currently a private prerelease project.

## Engineering expectations
- KISS, DRY, YAGNI, cohesive modules and simple contracts before abstractions.
- Respect the UI-first principle: user workflows must be operable without the terminal.
- No automatic destructive action or execution of scripts from checked-out repositories.
- Any diagnosis needs reproducible evidence and limitation wording.
- Use feature branches, review and a PR before changes merge once repository governance is configured.
- Keep all new changes backwards-compatible or document a migration.

## Local commands
    npm install
    npm run check
    npm test
    npm run package

Do not state that a test passed unless executed against the actual commit. A successful syntax check is not an Extension Host E2E.

## Reporting
Use issues for bugs with repro steps and OS/VS Code versions, without providing real secrets, customer data or private repository contents. Report security issues privately using SECURITY.md.

© 2026 ArmoTuSitio (armotusitio.com.ar). Designed and developed by Alejandro Daniel Di Stefano. Licensed under MIT.
