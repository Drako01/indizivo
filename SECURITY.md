# Security Policy — Indizivo

Indizivo is currently a pre-1.0 preview project. Security-sensitive behavior must be verified before a production release.

## Threat model
See [Security and Privacy](docs/SECURITY.md).

The extension treats workspace files, configuration, service URLs and webview messages as untrusted. It uses read-only local diagnostics by default and requires explicit approval for optional loopback HTTP service probes. It never runs project scripts automatically or terminates user processes.

## Reporting a vulnerability
During private development, contact the repository owner through GitHub's private security advisory workflow. Do not publish security-sensitive reproduction details in public issues.

## Supported versions
No public supported release exists yet. Once published, the supported version policy will be maintained here.
