<p align="center"><img src="media/indizivo-icon.svg" width="112" alt="Indizivo logo: a letter I with three diagnostic arcs and a point of evidence"></p>
<h1 align="center">Indizivo</h1>
<p align="center"><strong>Developer Environment Diagnostics</strong><br><em>Find the cause. Fix with confidence.</em></p>
<p align="center"><a href="LICENSE">MIT License</a> · <a href="PLAN.md">Enterprise AAA Plan</a> · <a href="docs/BRAND_IDENTITY.md">Identity</a></p>

## Overview

Indizivo investigates why a local development project does not start or why local services are unreachable. It combines observable evidence rather than producing speculative answers. The goal is to identify possible causes, explain their limitations, and suggest non-destructive next steps.

**Status: v0.1.0 local MVP, not yet release-certified.** This is code for an extension, but a clean VS Code installation, packaged VSIX validation and cross-platform E2E testing are not yet complete. Do not present it as Enterprise AAA or Marketplace Ready until all release gates pass.

## Control everything from the UI

Open the Indizivo icon in the VS Code Activity Bar. The control center exposes:
- **Diagnostics:** choose a project, diagnose, cancel, recheck, inspect evidence and suggestions.
- **Services:** add or remove localhost HTTP endpoints, review the exact probe targets and explicitly approve calls.
- **History & Reports:** recent local sessions, Markdown/JSON export and history deletion.
- **Settings:** configure timeout and service targets without editing configuration files.

The extension reads bounded project manifests, detects Node.js and Go runtimes, examines declared ports, and compares environment variable key **names** between .env.example and .env without retaining secret values. It does not terminate processes, install packages, execute repository scripts, scan remote servers or automatically modify project files.

## Quick start

1. Open a local project with VS Code 1.99+ and trust the workspace.
2. Install a locally built VSIX. Public Marketplace distribution has not been completed.
3. Open Indizivo from the Activity Bar. Choose the project for multi-root workspaces.
4. Select **Diagnose project**, and inspect the results.
5. For service diagnostics, add a loopback HTTP URL on the Services tab, review the exact plan and approve.
6. Export a local report or rerun checks after manually investigating a reported problem.

Developer commands: npm test; npm run check; npm run verify. Install development dependencies before running npm run package. The package and a real Extension Host E2E test must be verified before release.

## Security, differentiation and limitations

Indizivo is not GumRun, CodeVitals, Dev Env Diff, a port killer or another process dashboard. It collects minimal observations and correlates them; a listening port does not itself prove a conflict, and a passing check never proves full project health. The initial port probe cannot identify the owning PID. The UI currently operates in English; localization and cross-platform qualification are tracked in PLAN.md.

All diagnostics are local-first with no telemetry or AI. Explicit loopback HTTP probes require approval. See docs/SECURITY.md and PLAN.md for the complete threat model, test targets and release controls.

## Ownership and licensing

**Designed and developed by Alejandro Daniel Di Stefano.**

**Copyright © 2026 ArmoTuSitio — https://armotusitio.com.ar.** ArmoTuSitio is the copyright holder. The source code is distributed under the **MIT License**, subject to the permissions and notice obligations defined in LICENSE. Copyright ownership and an MIT license are compatible; the license grants reuse rights under its conditions.

Indizivo branding is provisional until trademark clearance. The project remains private until explicitly approved for public distribution.

The product takes engineering and UX standards from Probato PR (https://github.com/Drako01/probato-pr) but is a separate extension with no runtime dependency on it.
