# Security and privacy

This is a threat-model baseline, not a completed audit.

Treat project files, paths, scripts, endpoints, process information and webview messages as untrusted. Runtime commands are allowlisted, use shell=false and have timeouts. Config reads are bounded and symlink files rejected. The .env comparison only retains variable names, never values.

Local HTTP requests are opt-in and restricted to loopback HTTP; localhost DNS is pinned to 127.0.0.1 to prevent resolver manipulation, with no URL credentials or automatic external redirects. No auto-kill, package installation, repository script execution or external telemetry. No AI or cloud dependence. The webview has a nonce Content Security Policy; dynamic finding text uses textContent.

The extension is NOT an OS sandbox. Processes execute under normal VS Code user permissions. Cancellation, secret leakage, malicious configurations, path escape, and platform-specific behavior must pass adversarial tests before publication.
