# Indizivo Privacy Policy

**Applies to:** Indizivo 0.2.2 for Visual Studio Code.

- **Local-first:** no account, analytics, telemetry, advertising, mandatory AI provider or cloud backend.
- Indizivo reads bounded local project manifests, runtime version output, declared ports and variable **names** from `.env.example` and `.env`. Variable **values** are not stored in findings.
- Diagnostic history and configured loopback endpoints are saved in VS Code's workspace-scoped storage. Users can delete local history through the Control Center.
- Optional HTTP GET checks run **only after the user reviews and explicitly approves** specific loopback endpoints. URLs containing credentials, query parameters or fragments are rejected.
- Indizivo does not execute project scripts or upload source code to an AI provider.
- Markdown and JSON reports are written only to a destination selected by the user. Deleting history does not remove external reports previously exported.
- Checks run with the operating-system permissions of the VS Code extension host. This extension is not a sandbox and does not guarantee full detection of environment problems.

For a privacy request, contact [ArmoTuSitio support](https://armotusitio.com.ar/soporte/). Do not send live keys, `.env` values or confidential project logs.
