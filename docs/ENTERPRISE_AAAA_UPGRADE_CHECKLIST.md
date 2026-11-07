# INDIZIVO — Backlog Enterprise AAAA posterior a v0.2.0

> **Documento activo de planificación. Actualizado: 2026-11-06 (ART).**
> **Última versión publicada verificada:** `v0.2.0`; `main` @ `4d81290b28d5f2be1f3daf610833dea9e16eb0dd`; [GitHub Release](https://github.com/Drako01/indizivo/releases/tag/v0.2.0).
> **PR #13:** exclusivamente investigación y planificación futura. Esta rama integra `main`; **NO se debe fusionar a main ni utilizar como rama de implementación**.
> **Versión posterior:** **vNext**, sin número, fecha de salida ni compromiso de funcionalidades definidos. Debe decidirlo el owner.
> **Estado:** la 0.2.0 está publicada y pasó sus gates automatizados; **NO existe certificación Enterprise AAAA/10-10**.
> **Registro anterior:** [archivo histórico 0.1.3→0.2.0](ENTERPRISE_AAAA_0_2_0_EVIDENCE_ARCHIVE.md), no reutilizar instrucciones de release de ese archivo como estado actual.

## 1. Qué se comprobó de v0.2.0 (NO volver a implementar)

| Evidencia | Resultado | Alcance / límite |
|---|---|---|
| [PR #14](https://github.com/Drako01/indizivo/pull/14) | **Merged** el 2026-11-06 ART | Origen de la implementación; el PR #13 sigue Draft |
| [Quality Gate en main](https://github.com/Drako01/indizivo/actions/runs/42316225544) | PASS Windows, Linux, macOS y Extension Host Linux | Tests automatizados, **no** UI real en los tres SO |
| [Publish Registries](https://github.com/Drako01/indizivo/actions/runs/42316225513) | PASS calidad de release, VSIX instalado Linux, Marketplace, Open VSX, GitHub release | Publicación y checksums; no pentest ni aceptación de usuarios |
| Tests del release | 164 PASS, 0 FAIL, 0 SKIP (job Linux inspeccionado) | No extrapolar cantidad a una ejecución manual |
| [Release v0.2.0](https://github.com/Drako01/indizivo/releases/tag/v0.2.0) | VSIX 0.2.0, **42 archivos, ~70.08 KB**, SHA-256 `8cdafec982d019d6d5c41b562bcb4a2289918eb180d1bfec380f199f7816cec7` | Verificó el artefacto del pipeline; distinto del VSIX prerelease previo |
| [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=armotusitio.indizivo) / [Open VSX](https://open-vsx.org/extension/armotusitio/indizivo) | Los jobs confirmaron v0.2.0 visible | Reconciliación en incidentes aún debe probarse |
| [Matriz manual de aceptación](ENTERPRISE_AAAA_MANUAL_ACCEPTANCE.md) | **35 casos abiertos, 0 cerrados**, según archivo de main | No asignar PASS por extrapolación de CI o Chromium simulado |

La versión publicada sigue declarada como **preview** (`package.json.preview: true`). Se conserva `publisher: armotusitio`, `extensionKind: workspace`, la identidad de vista/comandos y el branding aprobado.

**Ya entregado (no duplicar):** TypeScript strict y contratos versionados, Core Node/Go y observaciones opcionales Python/PHP/Java/Docker CLI, semver soportado y fail-closed, go.mod/toolchain sin descarga automática, orígenes declared/heuristic de puertos, IPv4/IPv6 loopback, historia validada, endpoints HTTP locales bajo aprobación, CSP/validación Webview, redacción, Finding metadata v1, stable service IDs, archivos con fstat/inode bigint y symlinks bloqueados, cancelación de procesos descendientes propios, reportes JSON/Markdown EN/ES, selección acotada de monorepo, benchmark sintético, corpus de 15 proyectos ficticios, 2000 URLs fuzzed y cobertura mínima por módulo. **Ninguno de estos controles equivale a aval de topologías remotas o estudio real.**

## 2. Tabla de estado heredado por ID

Leyenda: **ENTREGADO/CI** = código funcional y pruebas automáticas; **PARCIAL** = implementado en alcance limitado; **MANUAL** = comportamiento programado pero requiere validación humana; **ABIERTO** = requisito futuro sin evidencia suficiente; **DIFERIDO** = expresamente fuera del alcance actual.

| IDs originales | Estado post-0.2.0 | Qué sí hay / qué queda |
|---|---|---|
| B-01…B-07 | ENTREGADO/CI, baseline actualizada | Release v0.2.0 y OIDC publicados en ambos registros, gates Windows/macOS/Linux/Extension Host Linux |
| B-08 | PARCIAL | Cobertura por módulo + benchmark sintético p50/p95/RSS; falta baseline de repositorios reales y objetivo de activación |
| B-09 | MANUAL | Faltan instalaciones UI reales Windows/macOS y pruebas accesibles |
| D-01 | PARCIAL | Subset semver (~,^,OR,comparadores,wildcards); prerelease/hyphen no soportados ⇒ INCONCLUSIVE. No afirmar compatibilidad 100% npm |
| D-02 | PARCIAL | `go` mínimo vs `toolchain` sugerido, casos malformados, GOTOOLCHAIN=local; falta matriz compiladores Go reales y variaciones |
| D-03 | PARCIAL | Tests loopback IPv4/IPv6; faltan topologías reales por host/namespace |
| D-04, D-06, D-07 | ENTREGADO/CI | Declared vs heuristic, IDs estables, estado missing vs unreadable/blocked |
| D-05 | ENTREGADO/CI + MANUAL | Finding v1/Session v2, scope, evidencia, método y limitaciones; revisar claridad de severidad con usuarios |
| D-08 | ABIERTO (drift nuevo) | README/PRIVACY reflejan v0.2.0, pero `docs/CURRENT_STATE.md`, `ROADMAP.md`, `CHANGELOG.md` y parte de `docs/*` siguen hablando de 0.1.3/PR14 Draft. Corregir en PR específico futuro |
| D-09 | PARCIAL | 15 casos sintéticos con etiquetas; no hay dataset de falsos positivos/negativos reales auditado |
| D-10 | ENTREGADO/CI | Release Quality Gate PASS SHA exacto; mantener aceptación manual como eje separado |
| S-01 | ABIERTO | Remote WSL/SSH/Dev Containers sin matriz firmada |
| S-02 | ENTREGADO/CI + MANUAL | Budget, bounded spawn, cancel real de descendiente en 3 SO; falta verificación en remote y procesos ajenos |
| S-03 | ENTREGADO/CI + MANUAL | Snapshot acotado owner OS, caso con socket real; permisos/PID reales por host pendientes |
| S-04 | PARCIAL | File descriptor, identidad bigint en NTFS, test de reescritura/symlink; falta adversarial independiente en sistemas reales |
| S-05 | ENTREGADO/CI + MANUAL | Historial versionado, fallos workspaceState simulados; storage remoto, cuotas/corrupción real pendientes |
| S-06 | PARCIAL | Allowlist + consentimiento + fuzz sintético de 2000 URL; fuzz externo y control de requests efectivamente emitidas pendiente |
| S-07 | PARCIAL | Redacción sintética de tokens/headers/cookies/etc.; faltan pruebas no intrusivas en destinos externos y credenciales desconocidas |
| S-08 | MANUAL | `untrustedWorkspaces`/`virtualWorkspaces` limited; cambios reales de trust, multi-root/remote pendientes |
| S-09 | ENTREGADO/CI + MANUAL | UNKNOWN/INCONCLUSIVE/SKIP sin falsear PASS; probar bajo permisos/ausencias reales |
| S-10 | PARCIAL | Threat model y test adversarial en repo; falta revisión independiente y seguimiento de dependencias |
| P-01 | ENTREGADO/CI + MANUAL | Activity Bar abre Control Center; validar primer uso real sin terminal |
| P-02 | ENTREGADO/CI + MANUAL | Multi-root/monorepo superficial y persistencia por scope; probar aislamiento real |
| P-03/P-04 | PARCIAL | Versiones opcionales Python/PHP/Java/Docker CLI + lockfile/env/ports/HTTP; no Compose orchestration ni dependencias externas automáticas |
| P-05/P-06/P-07 | ENTREGADO/CI + MANUAL | Provenance, filtros, history/recheck sin causalidad inventada; confirmar utilidad de mensajes por usuario |
| P-08 | ENTREGADO/CI + MANUAL | Renderer puro de JSON/MD EN/ES, redacción y workspace.fs; URI remota real pendiente |
| P-09 | PARCIAL | Host/Webview/reportes EN/ES; auditoría final de cada texto, errors y readers en SO reales |
| P-10 | PARCIAL | ARIA/teclado/forced-colors y prueba Chromium simulada; faltan NVDA/VoiceOver y Webview instalado |
| P-11 | DIFERIDO — por diseño | Sugerencias copy-only seguras, ninguna mutación de proyecto; NO implementar autofix sin petición y preview/rollback |
| P-12/P-13 | ABIERTO | Estudio con 10–15 devs; tasa real de error, tarea resuelta, tiempo a finding útil, ≥80% pasos útiles y <5% FP son objetivos por validar |
| A-01/A-02 | PARCIAL | `ProjectStateStore`/`reports.ts`/`process-control.ts` extraídos; `extension.ts` y `ui.ts` conservan bridge/render complejos |
| A-03/A-07 | ENTREGADO/CI + MANUAL | Tipado, runtime validation, estados y fallback seguro; fallos en SO remotos reales pendientes |
| A-04 | PARCIAL | Unit/integration/security/VS Code Extension Host Linux/VSIX Linux; falta interacción real UI en 3 SO |
| A-05 | ENTREGADO/CI | `scripts/coverage-gate.cjs` pisos por módulo en Linux; cobertura por diff queda como mejora opcional |
| A-06/A-08 | ABIERTO | Rendimiento representativo y matrices UI instaladas/remotas aún sin registrar |
| R-01/R-03/R-04 | ENTREGADO/CI | PR, package once, artifact SHA256, OIDC y acciones pinneadas; CI release PASS |
| R-02 | ABIERTO | Duplicación entre `verify.yml` y `publish.yml` y `npm run package` repitiendo verify; optimizar con provenance exacta |
| R-05 | PARCIAL | Ambos registros v0.2.0 publicados y verificados; simulación de registry offline / conciliación pendiente |
| R-06 | ABIERTO | Drift de docs de estado post-publicación; no cambiar logs históricos sin etiquetar |
| R-07 | PARCIAL | Instalación/smoke VSIX Linux; falta flujo click-through real y reinstalación en 3 SO |
| R-08 | ABIERTO | Matriz firmada Windows/macOS/Linux remotos y accesibilidad |
| R-09 | DISTINGUIR | Owner autorizó release v0.2.0; **NO** existe GO técnico registrado para AAAA |
| R-10 | ENTREGADO/CI | Assets/branding preservados, reglas de publicación no alteradas |

## 3. Backlog ejecutable de vNext — orden de prioridad

| Paquete | Prioridad | Entregable medible | Criterio de aceptación y evidencia |
|---|---|---|---|
| **DOC-01** Estado de release coherente | P0 / bajo costo | Corregir `docs/CURRENT_STATE.md`, `ROADMAP.md`, `CHANGELOG.md` y enlaces obsoletos de `docs/*` en rama de implementación futura | Búsqueda automática de claims vigentes obsoletos; docs alineados a SHA release, Marketplace y Open VSX; historia fechada conservada |
| **QA-01** UI instalada en 3 SO | P0 | Flujos completos del mismo VSIX en perfiles limpios Windows, macOS, Linux | UI-01…08 del manual, capturas/versión/hash/log por SO; sin defectos bloqueantes |
| **A11Y-01** WCAG aplicable | P0 | Keyboard-only, NVDA Windows, VoiceOver macOS, zoom 200%, claro/oscuro/forced-colors, reduced-motion, EN/ES | A11Y-01…06; incidencias reproducibles, severidad y revalidación; no solo inspección de strings |
| **REM-01** Calificación de topologías | P0 si se promete soporte remoto / P1 en otro caso | WSL2, Remote SSH, Dev Containers, trust + namespace de archivo/proceso/red | OS-04…08, pruebas de host correcto y de cancelación; etiquetar explícitamente no soportado lo no validado |
| **TRUTH-01** Exactitud de diagnóstico | P1 | Dataset de proyectos reales consentidos con errores sembrados y verdad conocida | Tabla por finding: TP/FP/FN, precisión, tasa FP y límites; Go/semver/IPv6/owner port real; sin usar información secreta |
| **SEC-01** Cierre de riesgos | P1 | Matriz adversarial independiente de HTTP consent, SSRF, symlink/TOCTOU, host, redacción e historia | Evidencia de egress monitorizado, no mutación, NO leaks centinela, findings y severidades; issues para cada fallo |
| **PERF-01** Baselines reales | P1 | Small/medium/large proyectos representativos, cold activation, diagnóstico p50/p95, RSS peak, cancelación y hardware limitado | ≥20 observaciones por perfil y SO cuando sea viable, desviaciones/entorno, SLO acordado por owner; no afirmar mejora si no hay baseline |
| **UX-01** Validación externa | P1 | 10–15 developers, escenarios representativos, feedback + consent | Tiempo a primera pista accionable, éxito, error FP/FN, ≥80% paso útil y <5% FP como hipótesis, no PASS previo |
| **ARCH-01** Refactor dirigido | P2 | Separar bridge/controlador UI y estado de render sin reescritura, basándose en defectos/perf | Tests de caracterización, tests impactados, identidad/branding/CSP intactos, sin dependencias gratuitas |
| **CI-01** Eliminar validación redundante | P2 | Optimizar verify + publish + package sin perder release gates | Reusar solo evidencia SHA exacto + lockfile/OS; un único VSIX inmutable, checksum en ambos registros; test de fallo pre-publicación y Open VSX offline |
| **POLISH-01** Calibración UX/i18n | P2 | Corregir textos poco accionables, accesibilidad y mensajes encontrados en pruebas | Cambios sustentados en observaciones/bugs, EN/ES pareados, medición antes/después |
| **ECOSYSTEM-01** Nuevos adapters | DIFERIDO por demanda | Evaluar Compose, managers/lockfiles extra y ecosistemas | Solo iniciar tras resultados UX; KISS/YAGNI, sin ejecución de scripts del workspace ni escaneos automáticos |

**Secuencia recomendada:** DOC-01 → QA-01/A11Y-01 → REM-01 (o declarar no soportado) → TRUTH-01/SEC-01 → PERF-01/UX-01 → ARCH-01/CI-01. Evitar que nuevas funciones oculten deudas de precisión o seguridad. Puede ejecutarse en varias ramas/PRs; **este PR #13 no se fusionará**.

## 4. Plan de aceptación y pruebas de vNext

1. Elegir un SHA base de `main` en la fecha de arranque (no suponer que sigue siendo `4d81290`), comparar con `v0.2.0` y leer el backlog anterior. Crear rama nueva de código; no reutilizar la rama histórica de PR #13.
2. **No repetir** 164 tests, VSIX y matrices si el cambio afecta solo docs y no hay gate que lo exija. Para cada cambio código → tests impactados + TS strict/security; suite de 3 SO y VSIX instalado para release o cambio transversal.
3. Materializar evidencias de los 35 casos de [aceptación manual](ENTERPRISE_AAAA_MANUAL_ACCEPTANCE.md); no marcar PASS con mock VM, capturas de README ni headless Linux smoke.
4. Las pruebas de usuario deben respetar privacidad y consentimiento; no telemetría, upload de repos privados, capturas de secretos ni monitoreo de red no consentido.
5. Registrar por ID: commit exacto, SO, host, versión de VS Code, SHA-256 VSIX, pasos, expected/actual, logs o screenshots, persona que validó y decisión PASS/FAIL/WARN/SKIP.
6. Terceros: dev-dependency vulnerabilities evaluadas y documentadas como WARN si no afectan producción; vulnerabilidad explotable del runtime bloquea.
7. Cierre: cero P0 conocidos abiertos sin mitigación, matriz soportada firmada, SLO/precision fundados, aceptación producto y decisión explícita del owner. **No declarar AAAA/10-10 por el mero hecho de publicar.**

## 5. Handoff de este PR documental

- **Trabajo hecho:** merge `main` @ `4d81290b28d5f2be1f3daf610833dea9e16eb0dd` en `docs/enterprise-aaaa-audit-roadmap-20261106`; el PR #13 sigue Draft, no mergeado.
- **Objeto de este PR:** conservar auditoría de `v0.1.3`, nueva matriz post-`v0.2.0` y prompt para la siguiente iteración. **Solo planificación; no modificar el runtime/release existente**.
- **Fuente de verdad vigente:** este documento; para criterios interactivos usar [ENTERPRISE_AAAA_MANUAL_ACCEPTANCE.md](ENTERPRISE_AAAA_MANUAL_ACCEPTANCE.md) en la base main; para evidencia detallada anterior usar el [archivo histórico](ENTERPRISE_AAAA_0_2_0_EVIDENCE_ARCHIVE.md).
- **Estado final:** v0.2.0 liberada y validada por CI; backlog P0/P1 de certificación/eficacia real abierto; no hay número ni fecha fijada para vNext.
- **Siguiente paso concreto:** crear una rama nueva desde el `main` más reciente y ejecutar DOC-01 y QA-01, sin intentar publicar a través de PR #13.

## 6. Ledger 0.2.1 (rama `feat/indizivo-v0.2.1-enterprise-hardening`)

| ID | Resultado 0.2.1 | Evidencia / límite |
|---|---|---|
| DOC-01 | VERIFIED | CURRENT_STATE, ROADMAP, CHANGELOG, HANDOFF, README, PRIVACY, SECURITY alineados a 0.2.0 publicada / 0.2.1 |
| D-01 | PARTIAL (ampliado) | Rangos con guion `A - B` evaluados con corpus congelado; prerelease/build siguen INCONCLUSIVE |
| D-03 | VERIFIED (loopback local) | Prueba de socket real en `::1` y puerto cerrado en ambas familias; topologías remotas reales siguen sin calificar |
| REM-01 | PARTIAL | `host` de la sesión incluye `remoteName`; comparaciones entre hosts distintos ya descartadas. WSL/SSH/Dev Containers: **BLOCKED** (sin infraestructura en esta sesión), no declarado como soportado |
| CI-01 / R-02 | PARTIAL | El job `package` de publish ya no repite `verify` (cubierto por `needs` sobre el mismo SHA); el VSIX real se construye, inspecciona e instala igualmente. `verify.yml` (PR) y `publish.yml` (main) corren sobre SHA distintos y se conservan |
| QA-01, A11Y-01, TRUTH-01, PERF-01, UX-01, P-12/13 | BLOCKED | Requieren UI instalada en 3 SO, NVDA/VoiceOver, repos reales consentidos o estudio con usuarios |
| SEC-01, S-04, S-06, S-07, S-08 | DEFERRED | Sin defecto nuevo confirmado; controles de 0.2.0 intactos (tests adversariales siguen en el gate). Revisión independiente pendiente |
| ARCH-01 | DEFERRED | Sin beneficio concreto que justifique un refactor en 0.2.1 |
| Aceptación manual | 35 pendientes / 0 firmados | Sin cambios |
