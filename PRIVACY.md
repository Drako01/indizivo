# Indizivo Privacy Policy

**Status:** Product policy for the unreleased local-first extension; verify behavior in the packaged VSIX before public release.

- No account, analytics, advertising, telemetry or cloud backend.
- Indizivo reads bounded local project manifests, runtime version output, declared ports and variable **names** from .env.example/.env, not their values.
- The extension stores bounded workspace-scoped diagnostic results and loopback endpoint preferences via VS Code workspaceState. Users can clear history through the interface.
- Optional HTTP GET requests to loopback endpoints must be explicitly approved; URLs with embedded credentials or query strings are rejected.
- No code or project files are sent to an AI provider.
- Exported Markdown/JSON diagnostics are written only to user-selected destinations.
- Deleting history removes workspace-scoped saved sessions, but does not delete external reports deliberately exported by the user.
- Operating-system permissions apply; this extension does not sandbox diagnostic processes.

For privacy and security issues, contact the repository owner using the private vulnerability channel.
