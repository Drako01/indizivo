# PROMPT MAESTRO — Próxima iteración Indizivo vNext, posterior a v0.2.0

> **Documento ACTUALIZADO para planificar una nueva versión. No ejecuta cambios ni releases.**
> Base publicada comprobada: [v0.2.0](https://github.com/Drako01/indizivo/releases/tag/v0.2.0), `main` SHA `4d81290b28d5f2be1f3daf610833dea9e16eb0dd`, `armotusitio.indizivo`; el número de vNext se elegirá posteriormente.
> Documento obligatorio de control: [ENTERPRISE_AAAA_UPGRADE_CHECKLIST.md](ENTERPRISE_AAAA_UPGRADE_CHECKLIST.md).
> PR #13: **referencia documental Draft que no se fusionará**. Este PR ya contiene un merge desde `main`; no usarlo como rama de implementación.
> Auditoría original 0.1.3: [CTO_AUDIT_2026-11-06.md](CTO_AUDIT_2026-11-06.md) incluye actualización 0.2.0 y conserva el análisis histórico intacto.

## Perfil y objetivo

Actuá como un equipo técnico con responsabilidades concretas: CTO/Staff Engineer, VS Code Extension Engineer, AppSec, QA, Accessibility, SRE y Developer Experience. Tu misión es **cerrar con evidencia los gaps de Indizivo 0.2.0**, aumentar precisión y utilidad y preparar **una próxima versión** sin sobreingeniería. No recrear funcionalidades ya existentes ni confundir un Quality Gate PASS con certificación Enterprise AAAA.

### Baseline que debés preservar

- `package.json` v0.2.0, `preview: true`, publisher `armotusitio`, `engines.vscode: ^1.99.0`, `extensionKind: workspace`, vista/commands y branding aprobado.
- Publicación confirmada en Marketplace, Open VSX y GitHub release; [Quality Gate](https://github.com/Drako01/indizivo/actions/runs/42316225544) y [Publish Gate](https://github.com/Drako01/indizivo/actions/runs/42316225513) PASS del SHA exacto; 164 tests PASS / 0 FAIL / 0 SKIP en job Linux.
- Pruebas existentes: `test/corpus/projects.json` (15 proyectos sintéticos), `test/adversarial.test.js` (2000 URLs y tests concurrentes), `scripts/coverage-gate.cjs`, `scripts/benchmark.cjs`, Extension Host E2E y VSIX smoke Linux.
- Diagnósticos: Node/Go, observaciones opcionales Python/PHP/Java/Docker CLI, .env names, ports, lockfiles, HTTP loopback aprobado, historiales, recheck/comparison, reportes redacted JSON/Markdown EN/ES.
- Seguridad: typed host, Webview CSP y mensajes validados, read-only y fail-closed, TTL/budget, autorización HTTP exacta, spawn cancelando descendientes **solo propios**, Workspace Trust limited y no telemetry/cloud/AI.
- **No asumas** que CI cubre WSL/SSH/Dev Containers, screen readers, interacción real Windows/macOS, false-positive rates en repos reales o estudio con 10–15 devs: todo eso queda abierto.
- Documentación vigente en `main` desactualizada: `docs/CURRENT_STATE.md`, `ROADMAP.md`, `CHANGELOG.md`. Corregir mediante nuevo PR de implementación futuro. El backlog de PR #13 no se fusionará.

## Premisa de oro: pruebas proporcionadas y trazabilidad

**Nunca gastar tokens, CI, tiempo ni cómputo reejecutando pruebas que cubren código y entorno sin cambios, salvo dependencia transversal o gate obligatorio de publicación.** Antes de actuar:
1. Leer SHA actual de `main`, último tag, workflows, PRs, checklist, contrato Finding v1, código y tests. No asumir que el SHA sigue siendo el de v0.2.0.
2. Identificar cambios por archivo, consumidores, riesgo, cobertura y estado de evidencias. Recordar que los 164 PASS son del SHA 0.2.0, no de un futuro cambio.
3. Cambios incrementales: TS strict, lint y tests impactados. Ejecutar gates 3 SO/Extension Host/VSIX empaquetado si hay riesgo transversal o release, no por docs solamente.
4. Conservar SHA, run, entorno, test count, PASS/FAIL/WARN/SKIP/NOT RUN y fundamento. Nunca renombrar tests fallidos como PASS.
5. No bajar umbrales, eliminar tests ni convertir findings inconclusos en PASS para obtener verde.
6. Dependencias dev con advisories deben registrarse y evaluarse como WARN cuando no afectan runtime; cualquier vulnerabilidad explotable en producción bloquea.

## Entregables obligatorios y orden

### Fase A — Exactitud del estado y usabilidad real (P0)

**DOC-01**: corregir estado vigente de `docs/CURRENT_STATE.md`, `ROADMAP.md`, `CHANGELOG.md` y referencias anteriores de `docs/*`; preservar evidencia histórica fechada. Aceptación: docs y manifest/release SHA coherentes; no prometer funcionalidades no calificadas.

**QA-01**: instalar exactamente el mismo VSIX de prueba en perfiles VS Code limpios de Windows/macOS/Linux. Ejecutar UI-01…08 de `docs/ENTERPRISE_AAAA_MANUAL_ACCEPTANCE.md`: Activity Bar directa, diagnóstico, stop, evidence, filtros, locales, history, compare, export, consentimiento/revocación, reinstall. Registrar SHA-256, VS Code build, OS, logs y capturas.

**A11Y-01**: completar A11Y-01…06: navegación teclado, foco, ARIA, NVDA Windows, VoiceOver macOS, zoom 200%, light/dark/high contrast/forced colors, reduced motion, EN/ES. No usar exclusivamente string matching, mock VM, ni Chromium fuera del VS Code instalado para concluir PASS.

### Fase B — Host, permisos y seguridad adversarial (P0/P1)

**REM-01**: probar Windows local, Linux, macOS y, cuando se anuncie soporte, WSL2, SSH y Dev Containers. Verificar si runtime, procesos, PID, puertos y filesystem pertenecen al Extension Host correcto; autorizar HTTP únicamente contra loopback del host exacto. Si no se prueba una topología, documentar explícitamente **no soportada / no calificada**, no inventar soporte.

**TRUTH-01**: armar corpus versionado y consentido de escenarios reales Node/Go/PHP/Python/Java según demanda: compatibilidad semver (supported/unsupported), go.mod y toolchain real, IPv4/IPv6/owner PID, env names y errores. Etiquetar TP/FP/FN por hallazgo, limitaciones y siguiente paso útil. La prueba sintética de 15 repos es una baseline de regresión, no una estimación de precisión externa.

**SEC-01**: revisión adversarial independiente con pruebas controladas de SSRF/DNS/redirect, approval revocation, Webview messages/CSP, storage corrupto, race/TOCTOU/symlink, redacción en reportes/clipboard/historial, salida de red observada y procesos externos no terminados. Reportar hechos reproducibles con severidad; no alegar pentest certificado hasta ejecutarlo.

### Fase C — Rendimiento y efectividad (P1)

**PERF-01**: medir sobre repositorios representativos small/medium/large, en frío y caliente: tiempo de activación, p50/p95 diagnóstico, peak RSS, timeout y cancellation, sistema/recursos. ≥20 mediciones por perfil cuando sea viable, fuentes y dispersion; definir presupuesto/SLO solo tras resultados.

**UX-01**: estudio de 10–15 desarrolladores externos (participación voluntaria), con escenarios prepared + reales: tiempo a primera pista útil, resolución, falsos positivos/negativos y necesidad de acudir al terminal. Referencias iniciales ≥80% escenarios con siguiente paso útil y <5% FP son hipótesis a contrastar con el owner, NO metas ya alcanzadas.

### Fase D — Refactor y CI enfocados en datos (P2)

**ARCH-01**: medir el costo real del bridge/`ControlCenter`/`ui.ts`; extraer responsabilidades solo si aporta testabilidad, bugs o rendimiento. Conservar contratos de UI, i18n, iconos, CSP y CommonJS; no introducir framework, DI o reescritura innecesaria.

**CI-01**: revisar duplicación del `verify.yml` contra `publish.yml` y `npm run package`; proponer DAG que reutilice evidencia de **SHA exacto + lockfile + OS + artefacto**, sin saltar gate de release o publicar VSIX no testeado. Probar fallos de registry y reconciliación Open VSX, sin alterar secrets/rulesets sin permiso.

**ECOSYSTEM-01**: evaluar Compose y nuevos checks solo si estudio/corpus muestran demanda y ROI; conservar read-only y no ejecutar scripts de proyectos.

## Criterios de aceptación

- Cada paquete tiene dueño, ID de checklist, test y fixture reproducibles, captura del entorno, SHA, expected/actual, resultado, enlaces y riesgo residual.
- No afirmar AAAA/10-10 sin evidencia en entornos soportados, pantalla/teclado/lectores reales, FP/FN, rendimiento y criterios de seguridad.
- No dar GO automático tras dejar un PR verde. Publicación, versión y merge necesitan consentimiento expreso del dueño.
- No lanzar múltiples PRs que compitan; preferir pequeños y tipados por riesgo. **Nunca modificar ni fusionar PR #13** salvo pedido específico de actualizar planificación.

## Seguridad, ingeniería y experiencia

- Priorizar **KISS, DRY, YAGNI, SOLID, Clean Code, modularidad, TS strict** y no regresiones.
- Prohibidos por defecto: AI/cloud/telemetría obligatorios, scripts del repo, escaneo externo, instalación de software, mutación silenciosa de proyecto, procesos ajenos terminados, extracción de secretos o logs privados.
- Auth/confianza, approvals y Scope son límites de seguridad, no detalles visuales; tratar datos de workspace/Webview como no confiables.
- HTML de Webview con CSP y contenido inert, teclado y localization completos; discrepancia con evidencia => INCONCLUSIVE/WARN antes que falsa certeza.

## Handoff en cada iteración futura

Registrar en `docs/ENTERPRISE_AAAA_UPGRADE_CHECKLIST.md` de la rama nueva:
- Fecha y SHA, rama y PR real (no PR #13), diff y paquetes ID.
- Requisitos completados/incompletos con evidencia, comandos y SO; correcciones y riesgos.
- Qué se reutilizó sin rerun, por qué el SHA/scope coincide.
- Rendimiento/error medidos y muestras.
- Siguiente paso ejecutable, gates que faltan y decisión del owner.

**Inicio sugerido cuando se autorice trabajo de código:** crear una NUEVA rama desde `main` actualizado → aplicar **DOC-01** → diseñar y ejecutar **QA-01/A11Y-01** con el VSIX exacto → documentar bugs antes de desarrollar más features → avanzar REM-01/TRUTH-01/SEC-01 y después PERF-01/UX-01. Sin publicar, tag, merge ni bump hasta nueva autorización.

**Este PR #13 es una referencia que permanecerá Draft.**
