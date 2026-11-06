# Indizivo — Finding/Evidence v1 (PR #14, unreleased)

This is an **internal versioned diagnostic contract**, not a certification or claim that the impact of every finding is known.

## Structure

- `DiagnosticSession.schemaVersion = 2` identifies the persisted session contract. JSON exports remain backward-compatible at top level and add `reportFormatVersion = 1` and `reportGeneratedAt`.
- Each new check contains `metadata.schemaVersion = 1`, `checkId` (detector identity), `targetId` (stable observed target) and `severity` (independently evaluated impact).
- `severity = unassessed` is intentional for WARN, BLOCKED and INCONCLUSIVE unless a specific finding has evidence to justify an impact classification. It must never be inferred automatically from status.
- Existing `status`, `provenance.origin/method/host/target/confidence/limitations`, `evidence[].fact/observedAt/id`, and non-mutating `suggestion` remain the sources of diagnostic truth.
- An endpoint's `targetId` is derived from a digest of the approved canonical URL, without exposing credential-bearing URL data.

## Non-destructive migration

Stored sessions lacking metadata remain navigable without fabricated fields. Runtime restore preserves valid v1 metadata and silently discards unknown or malformed metadata. Invalid future *session* schemas are rejected while safe historic summaries may remain available.

Version upgrades require new tests for serialization, historical migration, security/privacy, stable identity, comparison, and EN/ES reports. No network/cloud/AI/telemetry or project mutation is introduced by this schema.

## Acceptance evidence

Source: `src/typed/contracts.ts`, `diagnostics.ts`, `storage.ts`. Regressions: `test/diagnostics.test.js`, `test/storage.test.js`, `test/security.test.js`. Exact SHA, platform matrix and any remaining risks must be recorded in [ENTERPRISE_AAAA_UPGRADE_CHECKLIST.md](ENTERPRISE_AAAA_UPGRADE_CHECKLIST.md).
