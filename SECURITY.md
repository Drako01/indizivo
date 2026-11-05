# Security Policy — Indizivo

Indizivo 0.1.0 is a preview for local developer-environment diagnostics, not an OS sandbox. Security-sensitive behavior depends on VS Code Workspace Trust and the permissions of the extension host.

## Threat model

Workspace files, declared local endpoints and Webview messages are treated as untrusted input. Indizivo limits file reads, avoids executing project scripts, and never silently modifies files or kills processes. HTTP GET checks may target only approved loopback URLs, require explicit user consent, do not follow redirects and inspect response headers only.

The installed extension does not depend on external cloud APIs, analytics or an AI provider. See `PRIVACY.md`, which ships with the extension.

## Reporting a vulnerability

Use the public [ArmoTuSitio support form](https://armotusitio.com.ar/soporte/) and identify the product as **Indizivo** and the affected version. Request a private channel for sensitive reproduction details. **Do not include exploits, API keys, private paths or confidential code in public tickets.** Security reports should not be placed in public comments.

## Supported versions

The first supported preview is `0.1.0` once published. During release-candidate testing, no publicly supported build is implied.

## Dependencies

The last Windows pre-release test reported no production dependency vulnerabilities and three moderate development-tool advisories. The development audit must be repeated for the final release commit; the public preview is not presented as security-certified.
