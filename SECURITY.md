# Security Policy — Indizivo

Indizivo is a tool for local developer-environment diagnostics, not an OS sandbox. Security-sensitive behavior depends on VS Code Workspace Trust and the permissions of the extension host.

## Threat model

Workspace files, declared local endpoints and Webview messages are treated as untrusted input. Indizivo limits file reads, avoids executing project scripts, and never silently modifies files or kills processes. HTTP GET checks may target only approved loopback URLs, require explicit user consent, do not follow redirects and inspect response headers only.

The installed extension does not depend on external cloud APIs, analytics or an AI provider. See `PRIVACY.md`, which ships with the extension.

## Reporting a vulnerability

Use the public [ArmoTuSitio support form](https://armotusitio.com.ar/soporte/) and identify the product as **Indizivo** and the affected version. Request a private channel for sensitive reproduction details. **Do not include exploits, API keys, private paths or confidential code in public tickets.** Security reports should not be placed in public comments.

## Supported versions

Security fixes target the latest published release (`0.2.2`); the `0.3.0` development branch is not released. Unreleased work in pull requests is not a supported build and is not presented as security-certified.

## Dependencies

The production dependency audit (`npm audit --omit=dev`) is part of the Quality Gate and currently reports no vulnerabilities; the extension ships no runtime dependencies. Moderate advisories in development-only tooling (for example the packaging CLI's `minimatch`) are tracked as warnings and re-evaluated for exploitability before each release. The preview is not presented as security-certified.
