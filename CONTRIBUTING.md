# Contributing to Indizivo

Indizivo is currently maintained in a private repository. External contributions will open after the owner authorizes a public release.

Engineering baseline: KISS, DRY, YAGNI, SOLID where applicable, native VS Code UX, reproducible diagnostic evidence and no automatic destructive actions.

Before proposing code:
1. Review [Architecture](docs/ARCHITECTURE.md) and [Security](SECURITY.md).
2. Keep changes scoped and backward compatible.
3. Write deterministic unit tests and appropriate integration fixtures.
4. Run npm run verify and, on GUI-capable hosts, npm run test:e2e.
5. Document any changed permissions, privacy behavior or supported platforms.
6. Never label mocked or skipped tests PASS for release readiness.

Copyright (c) 2026 ArmoTuSitio. Developed and designed by Alejandro Daniel Di Stefano. MIT licensed.
