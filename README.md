<p align="center">
  <img src="media/readme-logo.png" width="128" alt="Indizivo — diagnostic signal logo">
</p>

<h1 align="center">Indizivo</h1>

<p align="center">
  <strong>Developer Environment Diagnostics for Visual Studio Code</strong>
  <br>
  <em>Find the cause. Fix with confidence.</em>
</p>

<p align="center">
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-35C2B1"></a>
  <img alt="Status: Preview" src="https://img.shields.io/badge/status-preview-F6BA65">
  <img alt="VS Code 1.99 or newer" src="https://img.shields.io/badge/VS_Code-%E2%89%A51.99-18232F">
</p>

---

## Understand your development environment

A project that refuses to start does not always have a code problem. An incompatible runtime, an unavailable local service, a missing environment variable or a port already in use may be enough to interrupt your work.

**Indizivo brings these signals together in one Visual Studio Code control center.** Run diagnostics, inspect the supporting evidence and decide what to investigate next — without switching between unrelated utilities.

Indizivo prioritizes **observed facts over guesses**. When it cannot establish a cause, it says so. It does not silently change your files or terminate processes.

## Features

| Capability | What Indizivo does |
| --- | --- |
| **Project diagnostics** | Detects Node.js and Go projects and checks their locally available runtimes. |
| **Runtime compatibility** | Evaluates common Node.js requirements and Go module minimums, reporting unsupported version expressions as inconclusive. |
| **Port investigation** | Checks declared local TCP ports and attempts read-only process identification where operating-system tools permit. |
| **Environment configuration** | Compares variable **names only** between .env.example and .env without retaining secret values. |
| **Local service health** | Tests user-configured localhost HTTP endpoints **only after explicit approval**. |
| **Evidence-backed findings** | Shows observations, timestamps, limitations and suggested next steps. |
| **Recheck and compare** | Compares check results across completed sessions without claiming that changed observations prove a fix. |
| **Reports and history** | Exports Markdown or JSON, copies evidence and manages locally stored session history. |

### One interface, full control

The **Indizivo Control Center** lives in the VS Code Activity Bar. Its four sections cover the supported workflow:

- **Diagnostics:** choose a project, run or cancel checks, inspect findings and copy evidence.
- **Services:** add or remove localhost HTTP targets, review the exact plan and approve probes.
- **History & Reports:** compare completed checks, export reports or delete local history.
- **Settings:** configure diagnostic timeouts through the UI.

No terminal is required for normal usage after installation.

## Getting started

> **Version 0.1.0 is a preview.** Public Marketplace distribution has not yet been announced.

**Requirements:** desktop Visual Studio Code 1.99 or newer, a trusted local workspace and the relevant tools installed for each supported diagnostic. No account, AI key, container or hosted service is required.

1. Open your project folder in Visual Studio Code.
2. Open **Indizivo** from the Activity Bar.
3. Select **Diagnose project**.
4. Inspect the observations, their evidence and suggested next steps.
5. Optionally configure a localhost endpoint in **Services**, review the plan and approve the request.
6. Rerun diagnostics or export a report after investigating an issue.

Multi-root workspaces allow you to choose the project to inspect. Remote development environments have not yet been fully qualified.

### Install a development build

Clone the repository and package the extension:

    npm install
    npm run verify
    npm run package

In VS Code, select **Extensions → … → Install from VSIX…**, then choose the generated Indizivo VSIX file. A clean installation and final release QA are still in progress.

## Privacy and security

- **Local-first:** no account, mandatory AI provider, cloud backend or telemetry.
- **Read-only by default:** checks do not edit source code, install packages or terminate processes.
- **Explicit consent:** localhost HTTP requests require approval of their exact targets.
- **Secrets stay private:** environment variable names can be checked, but .env values are not retained in findings.
- **Bounded operations:** supported reads and probes enforce limits, timeouts and cancellation.
- **Transparent outcomes:** a listening port does not prove a conflict, and a passing check is not a complete project-health guarantee.

Indizivo is not an operating-system sandbox. Runtime and process checks execute with the permissions of the VS Code extension host.

Read the [Privacy Policy](PRIVACY.md) and [Security Policy](SECURITY.md) for details.

## Current scope

The first preview focuses on **local Node.js and Go development environments**. The interface currently uses English. Automatic remediation, remote network scanning, Docker-specific diagnostics and comprehensive WSL, SSH or container support are not part of this release.

Future capabilities are described in the [Roadmap](ROADMAP.md).

## Development

    npm install
    npm run check
    npm test
    npm run test:e2e
    npm run package

The E2E suite launches an official VS Code Extension Host. It requires a graphical desktop environment. For reproducible issues, please include the extension version, operating system, relevant status and steps to reproduce.

## Feedback and support

Found an incorrect diagnosis, an incomplete check or a missing development environment? [Open a GitHub issue](https://github.com/Drako01/indizivo/issues).

**Never upload secrets, private environment values or confidential project logs.**

[Support](SUPPORT.md) · [Contributing](CONTRIBUTING.md) · [Changelog](CHANGELOG.md)

---

<p align="center">
  <strong>Designed and developed by Alejandro Daniel Di Stefano</strong>
  <br>
  © 2026 <a href="https://armotusitio.com.ar">ArmoTuSitio</a>. Copyright holder.
  <br>
  Released under the <a href="LICENSE">MIT License</a>.
</p>
