# INDIZIVO — Enterprise AAAA upgrade control checklist

> Fecha de apertura: 2026-11-06 (ART). Baseline auditada: `main` @ `9bad7cca3c08dda4018dc3f6c98e22dffe80def1`, paquete `0.1.3`.
> Estado: **IMPLEMENTACION ACTIVA EN PR #14 (DRAFT)**; ver ledger mas abajo. Objetivo de version futura: **0.2.0**, sin bump ni publicacion autorizada. Este documento no es una certificacion.
> Prioridad: correccion diagnostica > seguridad > confiabilidad > utilidad > cobertura > estetica.
> CTO gate: no declarar "AAAA", "production ready" ni "essential" sin evidencias de pruebas reales y criterios de salida aprobados.

## Normas operativas inquebrantables

- Un item se marca [x] SOLO con codigo fusionado en la rama objetivo, evidencia reproducible y criterios de aceptacion cumplidos. Si esta escrito pero no verificado, sigue [ ].
- Estados por item: TODO, IN_PROGRESS, IMPLEMENTED_UNVERIFIED, VERIFIED, BLOCKED, DEFERRED (con justificacion).
- Registrar SHA, comando, plataforma, resultado, ruta de log o run de Actions y riesgos abiertos.
- NO reejecutar baterias completas si el commit y el entorno no cambiaron: ejecutar primero pruebas impactadas; reusar resultados solo si SHA, lockfile, SO y superficie de prueba coinciden. Las pruebas integrales se corren en gates de integracion/release o si cambia una dependencia transversal. Nunca reusar evidencia de SHA diferente.
- No modificar logo aprobado (Activity Bar/Marketplace), contratos publicos ni comportamiento existente sin motivo probado y aprobacion. Cambios aditivos y backward-compatible.
- No habilitar nuevas publicaciones, no cambiar version, no crear tags ni fusionar a `main` sin aprobacion del owner.
- No introducir IA obligatoria, telemetria, cloud, cuenta, escaneo de red, ejecucion de scripts del proyecto, procesos terminados automaticamente ni mutaciones silenciosas.
- Aplicar KISS, DRY, YAGNI, SOLID, Clean Code, TypeScript strict y pruebas de regresion basadas en riesgo.

## 0. Baseline comprobada (NO repetir sin cambios relevantes)

- [x] B-01 El manifest en main declara version `0.1.3` y publisher `armotusitio`. Evidencia: `package.json` @ 9bad7cc.
- [x] B-02 Codigo fuente principal tipado en `src/typed/`, `tsconfig` con strict, adapters CommonJS para compatibilidad. Evidencia: arbol del commit.
- [x] B-03 Quality Gate en Windows, macOS, Linux exitoso en SHA auditado. Evidencia: https://github.com/Drako01/indizivo/actions/runs/42130183859.
- [x] B-04 E2E oficial de VS Code Extension Host en Linux exitoso. Evidencia: mismo run de Quality Gate.
- [x] B-05 Pipeline release 0.1.3: calidad multiplataforma, VSIX instalado en Linux, publicacion Marketplace/Open VSX y GitHub release exitosos segun jobs. Evidencia: https://github.com/Drako01/indizivo/actions/runs/42130183807.
- [x] B-06 GitHub release `v0.1.3` publicado con VSIX y SHA256. Evidencia: https://github.com/Drako01/indizivo/releases/tag/v0.1.3.
- [x] B-07 Rulesets "Protect main" y "Protect release tags" activos en API de GitHub, 2026-11-06.
- [ ] B-08 Obtener baseline actual de cobertura, latencia p50/p95 y RSS desde la corrida de SHA actual; registrar artefactos antes de fijar nuevos umbrales. El log historico no reemplaza una medicion nueva si cambio el codigo.
- [ ] B-09 Confirmar manualmente la UI instalada en Windows/macOS, teclado, NVDA/VoiceOver, zoom 200%, contrastes claro/oscuro y enlaces.

## Fase 1 — P0: veracidad del diagnostico y deuda critica

- [ ] D-01 Sustituir/aislar parser de versiones Node por semantica npm compatible y testeada; casos `~1`, `~1.2`, `^0.0.x`, wildcard, OR, prerelease, engines y .nvmrc. Si no se puede interpretar, INCONCLUSIVE, nunca falsa incompatibilidad. Aceptacion: corpus de rangos comparado con referencia confiable y fixtures; sin regresiones.
- [ ] D-02 Verificar version Go con `go` y `toolchain` en go.mod, sin confundir minimo con toolchain requerida. Aceptacion: casos validos, edge cases y evidencia exacta de origen.
- [ ] D-03 Corregir contratos de red IPv4/IPv6: `localhost`, `127.0.0.1`, `[::1]`, bound addresses, host y namespace. El probe actual fuerza lookup a 127.0.0.1 aun cuando el usuario declaro IPv6. Aceptacion: tests contra servidores reales IPv4 y IPv6 en SO compatibles, con SKIP justificado cuando IPv6 no exista.
- [x] D-04 Dejar de inferir "puerto del proyecto" sin origen confiable; next:3000/vite:5173 deben estar marcados como sugerencias heuristicas, no como configuracion observada. Aceptacion: etiqueta observed/inferred + fuente.
- [ ] D-05 Crear modelo canonico de Finding/Evidence: id estable, checkId, targetId, scope de host, metodo, timestamp, estado, severidad, confianza, origen, limitaciones y next step verificable. Aceptacion: schema versionado y migracion no destructiva.
- [x] D-06 Identidad estable de endpoints para diff: no usar indice de array `service-0` como identidad persistente. Aceptacion: reordenar/eliminar servicio no atribuye estados de otro.
- [x] D-07 Lecturas inconclusas: permisos, archivos grandes, symlink o errores deben distinguir ausencia real de dato no inspeccionable. Aceptacion: fixtures fail-closed, no falso PASS.
- [x] D-08 Reconstruir docs desactualizados: README anuncia 0.1.0, ROADMAP y docs de handoff/rulesets mencionan estados antiguos. Conservar historia fechada; agregar una unica fuente de estado CURRENT_STATE. Aceptacion: todos los claims vigentes coinciden con main y release.
- [ ] D-09 Registrar un conjunto de falsos positivos/falsos negativos con fixtures reproducibles; cada fix agrega regresion especifica.
- [ ] D-10 Ejecutar gate de fase 1: tests impactados + TypeScript + seguridad + integracion del flujo modificado. Evidencia vinculada al SHA.

## Fase 2 — P0/P1: resiliencia, aislamiento, privacidad

- [ ] S-01 Definir adaptadores de host para Windows, Linux, macOS y WSL/SSH/Dev Containers; identificar donde corren procesos, archivos y red. Nunca mezclar maquina del usuario con Extension Host remoto.
- [ ] S-02 Control total de budget por diagnostico (timeout global + por probe), cancelacion sin procesos huerfanos y limites de memoria/salida. Aceptacion: cancel + process-tree real por SO.
- [ ] S-03 Evitar ejecutar `netstat/ss/lsof` repetidamente por puerto: obtener snapshot acotado si corresponde, cache por run, cruzar por puerto/IP. Probar paridad funcional.
- [ ] S-04 Fortalecer path/TOCTOU y archivos grandes; no seguir symlinks fuera del workspace. Priorizar APIs `vscode.workspace.fs` donde corresponda en topologias remotas.
- [ ] S-05 Persistencia segura: validar esquema de historia restaurada, limites de cantidad/tamano, migracion de versiones y fallos de `workspaceState`. Aceptacion: datos antiguos/corruptos no bloquean activacion.
- [ ] S-06 Consentimiento de HTTP: confirmar targets canonicos, proteccion frente a SSRF, redirects, credenciales, DNS rebinding y solicitud no consentida; probar endpoints maliciosos.
- [ ] S-07 Redaccion consistente en historial, clipboard, logs y export JSON/MD con corpus de secretos sinteticos. Aceptacion: ninguna cadena centinela se filtra.
- [ ] S-08 Matriz de Workspace Trust: command palette, webview, cambios de trust, multi-root y ubicaciones remotas. Declarar explicitamente capacidades en manifest.
- [ ] S-09 Clasificar errores de permisos y herramientas faltantes como INCONCLUSIVE/SKIP con indicaciones verificables, no resultados positivos.
- [ ] S-10 Gate de fase 2: amenazas documentadas, pruebas adversariales reproducibles, auditoria de dependencias prod/dev con avisos de terceros evaluados como WARN salvo explotabilidad relevante.

## Fase 3 — P1: producto diferencial y experiencia esencial

- [ ] P-01 Diseñar zero-config onboarding: abrir Activity Bar y ver el Control Center sin pasos redundantes; primera diagnosis dirigida en workspace confiable.
- [ ] P-02 Discovery explicito de root/monorepo/multi-root con seleccion y memoria aislada; diagnosticos por paquete/subproyecto sin escanear indiscriminadamente.
- [ ] P-03 Motor de deteccion por plugins/adaptadores: Node+Go primero; evaluar Python, Java, PHP y Docker/Compose segun evidencia de demanda, priorizando 2 ecosistemas adicionales antes de mas.
- [ ] P-04 Diagnosticos utilitarios de alto ROI: version/gestor de paquetes, lockfile, .env de nombres, puertos IPv4/IPv6, endpoints aprobados, Docker/Compose disponible y dependencia local opt-in (Postgres/Redis etc.). No ejecutar scripts del repo.
- [ ] P-05 Cada finding debe mostrar: QUE observe, POR QUE importa, COMO comprobar, PROPUESTA segura y QUE sigue sin saberse. Sin inventar root cause ni marcar RESOLVED sin recheck comparable.
- [ ] P-06 Diferencia baseline/recheck con fuentes y host comparables: new, persistent, changed, not-observed y confirmed-fixed solo bajo evidencia suficiente.
- [ ] P-07 Control Center nativo: progresos reales, filtros por impacto/certeza, resumen claro, acciones copiar, historia, comparacion, export, estado vacio y error. Menos ruido, no dashboard decorativo.
- [ ] P-08 Reportes JSON versionados y Markdown legibles con alcance, limitaciones y sin secretos; export via URI apta para remoto.
- [ ] P-09 Internacionalizacion EN/ES completa (host, errores, reportes, hints, labels), sin mezcla de idiomas ni textos hardcodeados visibles.
- [ ] P-10 Accesibilidad WCAG aplicable: teclado, focus, semantica ARIA, 200% zoom, alto contraste, lector pantalla y reduced motion. Probar UI real, no solo tests de cadenas.
- [ ] P-11 Acciones de remediacion: inicialmente sugerencias/copy-only; cualquier cambio futuro tiene preview de impacto, consentimiento explicito, rollback y test adversarial.
- [ ] P-12 Validar con al menos 10-15 desarrolladores externos en problemas preparados y reales: tiempo hasta primera pista util, tasa de falsos positivos, completitud, repeticion de uso.
- [ ] P-13 Definir metricas de exito sin telemetria invasiva: captura opt-in local/manual o estudios de usabilidad; meta inicial: >=80% escenarios soportados con siguiente paso util, <5% falsos positivos en corpus etiquetado. Umbrales sujetos a baseline y aceptacion del owner.

## Fase 4 — P1/P2: arquitectura y calidad industrial

- [ ] A-01 Separar `ControlCenter` en servicios de sesión, workspace, consent, storage, bridge, reportes y comandos SIN reescritura total.
- [ ] A-02 Separar renderizacion UI de estado/traducciones y transport bridge, preservando iconos aprobados y UX actual.
- [ ] A-03 Contratos discriminados tipados, validacion runtime para mensajes, datos persistidos, plugin checks y JSON de export.
- [ ] A-04 Testing pyramid: unit, integration, contract, security, E2E Extension Host y E2E VSIX instalado con clicks reales; cross-platform adapters.
- [ ] A-05 Cobertura por codigo critico (no porcentaje global vacio); fijar budgets medidos, barrera contra regressions nuevas e informe por diff.
- [ ] A-06 Performance: startup/activation, p50/p95 diagnosis, peak RSS en small/medium/large fixtures y recursos limitados. Fijar SLO basados en medicion, no valores inventados.
- [ ] A-07 Gestion de errores con estados CANCELLED/PARTIAL/FAILED y recuperacion del usuario, sin ocultar inconclusos.
- [ ] A-08 UX validada en Windows/macOS/Linux con VSIX real y sesiones local/remote compatibles por matriz.

## Fase 5 — Release industrial sin pruebas duplicadas

- [ ] R-01 Integrar en PR por fases; pruebas impactadas en cada commit, suite completa solo cuando cambia superficie comun o antes de promover un candidato a release.
- [ ] R-02 Revisar redundancia entre `verify.yml` y `publish.yml`. Reusar evidencia de checks de PR solo si el SHA candidato exacto coincide; para merge SHA nuevo, ejecutar solo gates no cubiertos y los obligatorios. Documentar equivalencia SHA y cadena de confianza.
- [ ] R-03 Build once, immutable VSIX artifact y checksum SHA256; misma carga publicada en Marketplace/Open VSX. Sin reconstrucciones diferentes tras aprobacion.
- [ ] R-04 Hardening de Actions: permisos minimos, SHA pinning, concurrency, environments, OIDC; revalidar workflow activo sin modificar secretos.
- [ ] R-05 Distinguir exito del job de disponibilidad efectiva de ambas registries. Si Open VSX esta inactivo, estado publicado = PARTIAL/WARN, reconciliacion con limite y evidencia.
- [ ] R-06 Verificar README/CHANGELOG/PRIVACY/SECURITY/ROADMAP/SUPPORT y capturas contra version exacta. Sin referencias a 0.1.0 para experiencia actual.
- [ ] R-07 VSIX real instalado en perfil limpio: consent, locale, diagnostic, history, compare, export, disposal, reinstall/uninstall.
- [ ] R-08 Matriz de plataformas y red remota firmada: solo se declara soporte donde haya evidencia real.
- [ ] R-09 Cierre de riesgos y decisión GO/NO-GO explicita del owner ANTES de tag/publicacion.
- [ ] R-10 No modificar reglas de branch, iconos ni politica de versionado sin autorizacion.


## Implementacion en PR #14 — control por evidencia, actualizado 2026-11-06

**Rama:** `feat/indizivo-enterprise-aaaa`. **PR:** https://github.com/Drako01/indizivo/pull/14 (DRAFT; unico PR para todas las fases, sin merge). El PR #13 permanece Draft, sin fusionar ni cerrar.

**Ultimo commit de codigo verificado ANTES de esta actualizacion documental:** `225d7079b311d878455a90c2b35ff739ecc85a5f`, [Quality Gate 42311892097](https://github.com/Drako01/indizivo/actions/runs/42311892097): Windows, Linux, macOS y VS Code Extension Host Linux, todos PASS. La nueva revision de este checklist es un cambio solo documental; no declarar que su SHA fue probado hasta confirmar un run propio o aplicar la regla de reutilizacion de evidencia con el diff documentado.

**Candidato VSIX empaquetado instalado más reciente:** `6a738a3b8b26c633cae14ed4dc66df9fa23f2dd9` — [Enterprise VSIX Candidate Gate 42312161308](https://github.com/Drako01/indizivo/actions/runs/42312161308), **PASS**; instalación y smoke en Extension Host aislado Linux, 41 archivos, 67,99 KB, SHA-256 `023a9c475505826bfb6d9a6fdfb7d7a5b697f578535766a35ef6930815344a73`, [artefacto 13549101833](https://github.com/Drako01/indizivo/actions/runs/42312161308/artifacts/13549101833). Contiene `indizivo.synthetic-benchmarks.jsonl` con perfiles small/medium/large (12 corridas cada uno); medidas sintéticas, no proyectos reales ni SLO. El Quality Gate del mismo SHA pasó [4/4 en intento #2](https://github.com/Drako01/indizivo/actions/runs/42312166879) tras un fallo inicial de red al descargar VS Code.

| ID | Estado basado en evidencia | Nota / criterio pendiente |
|---|---|---|
| D-01 | IMPLEMENTED_VERIFIED_SUBSET | Semver ~, ^, comparadores parciales, OR, wildcard (incl. ^0.0.x y 1.2.*), fail-closed, 35 casos contrastados con npm semver 7.6.3 en test/versions-reference.test.js; prerreleases/hyphen se mantienen INCONCLUSIVE y la equivalencia total con npm queda fuera de alcance |
| D-02 | IMPLEMENTED_UNIT_VERIFIED / REAL_MATRIX_PENDING | Parser go.mod fail-closed, implicit go1.16, directivas duplicadas/malformadas, go minimo vs sugerencia toolchain, test adversarial. Go version forzado GOTOOLCHAIN=local para no descargar compiladores. Falta matriz real de versiones Go, prerelease y toolchains personalizados |
| D-03 | IMPLEMENTED_PARTIAL | HTTP loopback IPv4/IPv6, pruebas en CI; falta topologia completa de SO/host remoto |
| D-04 | VERIFIED | Puerto declarado vs heuristica Next/Vite, tests y textos |
| D-05 | IMPLEMENTED_VERIFIED_SUBSET / HOST_MATRIX_PENDING | Session schema v2; Finding metadata v1 (`checkId`, `targetId`, severidad conservadora `unassessed`), timestamps/evidence/provenance, restauración legacy no destructiva y reporte JSON v1. Testeado por CI 3 SO. Falta validación de host/namespace remoto y revisión UX de severidad |
| D-06 | VERIFIED | IDs por URL canonica, pruebas de reorder y comparacion posterior a service recheck |
| D-07 | VERIFIED | Archivo ausente vs ilegible/bloqueado; no falsear ausencia de claves en .env |
| D-08 | VERIFIED | README/ROADMAP/PRIVACY 0.1.3, CURRENT_STATE y notas historicas etiquetadas |
| D-09 | IMPLEMENTED_PARTIAL | Corpus npm semver 7.6.3 con expectativas congeladas y tests adversariales; faltan fixtures externos de falsos positivos y negativos reales, con etiquetas y tasa medida |
| S-01 | IMPLEMENTED_PARTIAL | Seleccion de proyecto/subproyecto con realpath y alcance del Extension Host; pruebas WSL/SSH/Dev Containers pendientes |
| S-04 | IMPLEMENTED_UNIT_VERIFIED / TOCTOU_PENDING | Bounded file reads, symlink block y verificacion de identidad inode/dev del descriptor y mtime/size final en 3 SO. Falta ataque real concurrente y archivos remotos/virtuales |
| S-08 | IMPLEMENTED_UNIT_VERIFIED / MANUAL_PENDING | Manifest declara `untrustedWorkspaces` y `virtualWorkspaces` como `limited` con textos EN/ES, runtime bloquea diagnosticos activos sin confianza. Falta matriz real de cambios trust y remotos |
| S-02 | IMPLEMENTED_VERIFIED_SYNTHETIC / REMOTE_PENDING | Deadline monotónico, salida acotada, runtime y owners por spawn/allowlist; cancelación del proceso e hijo real testada en Linux/macOS/Windows. FIX del fallo original execFile/descendiente, 7e9360b PASS. Falta matriz real WSL/SSH/Containers y procesos terceros adversariales (nunca matar procesos del proyecto) |
| S-03 | IMPLEMENTED_UNIT_VERIFIED | Batch de owner OS, coincidencia exacta macOS; faltan pruebas con procesos reales en cada SO |
| S-05 | IMPLEMENTED_PARTIAL | Historial acotado, migracion explicita de schema legacy v1, rechazo de schemas futuros desconocidos y sanitizacion. Lectura/escritura workspaceState fallida: fallback seguro, mensaje EN/ES, sin falsear el diagnostico, con regresiones verificadas. Falta matriz real de fallos de disco y storage remoto |
| S-06 | IMPLEMENTED_UNIT_VERIFIED / ADVERSARIAL_PENDING | Allowlist localhost/IPv4/IPv6, target invalidado => BLOCKED y sin request/URL sensible; corpus 15 URLs maliciosas y redirects PASS. Falta fuzz DNS/redirect y prueba monitorizada en hosts reales |
| S-07 | IMPLEMENTED_UNIT_VERIFIED / EXTERNAL_PENDING | Redaccion sin leer valores .env, pruebas sintéticas Basic/Bearer, cookies, userinfo URL, GitHub/AWS tokens, JWT y private key, export/copy. No garantiza formatos de secretos desconocidos |
| P-02 | IMPLEMENTED_PARTIAL | Descubrimiento superficial limitado de monorepo/multi-root y seleccion explicita; falta UX real remoto |
| P-03/P-04 | IMPLEMENTED_UNIT_VERIFIED | Versiones permitidas de Python/PHP/Java/Docker CLI; Node/Go y lockfile/packageManager read-only; sin afirmaciones de compatibilidad de dependencias |
| P-05/P-06/P-07 | IMPLEMENTED_PARTIAL | Evidencia con confianza y limitaciones, diff post-recheck y filtros UI; faltan pruebas de usuario y navegacion real completa |
| P-08 | IMPLEMENTED_VERIFIED_CI / REAL_URI_PENDING | Renderer puro `reports.ts`, JSON `reportFormatVersion:1`, Markdown EN/ES, método/confianza/alcance/limitaciones, redacción y `workspace.fs`; contratos/regresión 3 SO. Falta URI remota real y formatos de secreto desconocidos |
| A-01/A-03 | IMPLEMENTED_PARTIAL | Extracción gradual de `reports.ts`, `process-control.ts`, storage, tool-probes, budget, monorepo y redaction; metadata Finding v1 y validación runtime de historial/Webview. ControlCenter y UI aún concentran responsabilidades, refactor gradual pendiente |
| A-04/A-07 | IMPLEMENTED_PARTIAL | Tests unit/contract/adversarial, proceso descendiente real y cancelación en los 3 SO, Webview VM, E2E Extension Host Linux y estados parciales; faltan clicks reales y a11y/VSIX multi-SO |
| R-01/R-03/R-07 | IMPLEMENTED_VERIFIED_CI / REAL_UX_PENDING | PR14 Draft; QA del SHA candidato 6a738a3 4/4 PASS tras rerun focalizado; VSIX inmutable Linux smoke PASS (42312161308), checksum SHA256 y artifact con benchmark sintético. No certifica clicks reales, a11y ni remote; no release |
| R-08/R-09/R-10 | OPEN/CONTROLLED | Matriz manual, GO/NO-GO y restricciones owner documentadas; no merge/tag/release ni cambios de branding |

### Handoff verificable (ultimo bloque)

- **Ultimo codigo verificado:** `225d7079b311d878455a90c2b35ff739ecc85a5f` — [Quality Gate PASS, 4/4](https://github.com/Drako01/indizivo/actions/runs/42311892097).
- **VSIX aislado verificado:** `00276c964fd40329468716ecdccd2fd9c37ac1b8` — [Packaged VSIX PASS](https://github.com/Drako01/indizivo/actions/runs/42307975194), SHA-256 `ae9370f9a418c1b8b3487f5bbc8e47958d828572bcd0023824fbe93bda2990f5`, [artefacto](https://github.com/Drako01/indizivo/actions/runs/42307975194/artifacts/13546719713).
- **Ultimos cambios posteriores al checklist anterior:** monorepo/seleccion segura; sanitizacion de redaccion/copy/export; flujo CI de VSIX no publicador; restauracion segura de comparaciones; cambio de estado de servicios solo tras recheck aprobado; lockfiles/package manager; tests Webview; modelo de amenazas y matriz manual de aceptacion.
- **Bugs de CI detectados y corregidos:** fixture de go.mod, allowlist de requisitos de versiones, test de enlace README empaquetado, inventario VSIX de modulos, contratos persistidos `lockfiles/packageManager`. Los runs fallidos historicos no se reetiquetan PASS; el run mas reciente del SHA de codigo es PASS.
- **Pendientes bloqueantes AAAA:** test UI real con teclado y accesibilidad Windows/macOS/Linux; WSL/SSH/containers; host cancellation; estudios 10–15 developers; corpus de false positives; rendimiento p50/p95 y RSS; threat tests extensivos. Detalle: [ENTERPRISE_AAAA_MANUAL_ACCEPTANCE.md](ENTERPRISE_AAAA_MANUAL_ACCEPTANCE.md) y [ENTERPRISE_AAAA_SECURITY_THREAT_MODEL.md](ENTERPRISE_AAAA_SECURITY_THREAT_MODEL.md).
- **Proxima accion:** verificar si el cambio solo documental obliga a nuevo run, luego priorizar cobertura de contratos, threat fixtures, rendimiento y UX real. Para un nuevo candidato VSIX usar SHA exacto del ultimo codigo, sin publicar.
- **Restricciones:** PR #13 y PR #14 siguen Draft; NO merge, NO close, NO release, NO tag, NO cambio de logos.


### Iteracion 2026-11-06 — precision Node, contratos y rechazo HTTP (PR #14)

| SHA de codigo | IDs / cambios focalizados | Comando automatizado y evidencia | Estado |
|---|---|---|---|
| [8db977f](https://github.com/Drako01/indizivo/commit/8db977f777210ac2576c0c48ca6c7b31e5b18739) | D-01/S-09/P-09: constraint desconocida de .nvmrc no desaparece; INCONCLUSIVE sin filtrar texto, i18n EN/ES | `npm run verify` 3 SO + `npm run test:e2e` Linux, [run 42306464537](https://github.com/Drako01/indizivo/actions/runs/42306464537) | PASS 4/4 |
| [882d6a0](https://github.com/Drako01/indizivo/commit/882d6a07b5f9469a0c75d3aeaa736842ea40eea8) | S-05/A-03: schema v1 explicitamente migrado, futuros rechazados, mensajes Webview de forma exacta | Mismos gates afectados, [run 42306713171](https://github.com/Drako01/indizivo/actions/runs/42306713171) | PASS 4/4 |
| [e144618](https://github.com/Drako01/indizivo/commit/e1446183d5169e3004ac21cd52f913ecca5d55e7) | D-01/D-09: corpus de 35 casos npm semver 7.6.3; ^0.0.x, ~1.x, wildcards *. Unsupported fail-closed | Mismos gates afectados, [run 42306970103](https://github.com/Drako01/indizivo/actions/runs/42306970103) | PASS 4/4 |
| [eaab0f5](https://github.com/Drako01/indizivo/commit/eaab0f503d9a5562c71040eb8ad82f5f6a45f50f) | S-06/S-09: target HTTP invalidado => BLOCKED, ninguna solicitud y ninguna URL sensible en evidencia | Mismos gates afectados, [run 42307228576](https://github.com/Drako01/indizivo/actions/runs/42307228576) | PASS 4/4 |

- **Codigo y pruebas nuevas:** solo los archivos de versiones, diagnostic, storage, mensajes, i18n y sus tests; los tres sistemas operativos se verificaron porque cambian contratos comunes. No se repitio manualmente npm ci/VSIX fuera de los gates.
- **Evidencia de referencia externa:** comparacion del corpus con `semver@7.6.3` distribuido con npm en un entorno local Node 22, el 2026-11-06. El corpus queda congelado en `test/versions-reference.test.js`; no es prueba de semver total ni requiere descargar una dependencia nueva en CI.
- **Sin cambio:** `package.json` permanece `0.1.3`; logos, publisher, permisos, reglas, main, PR #13, tags y registries intactos.
- **Riesgos no cerrados:** P0/P1 que requieran pruebas reales y externa observacion permanecen abiertos. El candidato VSIX de HEAD y el UX/a11y/remote gate no quedan validados por esta actualizacion documental.
- **Handoff exacto:** continuar desde `feat/indizivo-enterprise-aaaa`, inspeccionar la ejecucion `Indizivo / Enterprise VSIX Candidate Gate` para el SHA del siguiente commit, registrar hash del VSIX sin publicar, y despues ejecutar la matriz de [aceptacion manual](ENTERPRISE_AAAA_MANUAL_ACCEPTANCE.md). No reejecutar pruebas de SHA ya verificados cuando el diff sea solo documental.


### Iteracion 2026-11-06 — resiliencia de workspaceState y nuevo candidato

| SHA de codigo | Control / outcome | Evidencia |
|---|---|---|
| [f6cfeab](https://github.com/Drako01/indizivo/commit/f6cfeab5808e137b5d09b78ad8b966a04c79873b) | S-05/A-07: guardas de read/write para almacenamiento no disponible, conservando evidencia en memoria. | Run 42307750774 CANCELLED por commit sucesivo: **NO PASS**. |
| [0c97ed0](https://github.com/Drako01/indizivo/commit/0c97ed06a458666254109dfd14c877adfadbccf5) | S-05/P-09: mensaje de lectura fallida se localiza luego de resolver idioma; tests de storage read/write con fallas sintéticas, sin falsos FAILED ni fugas del error. | [Quality Gate 42307778143](https://github.com/Drako01/indizivo/actions/runs/42307778143): 4/4 PASS (Linux, Windows, macOS, Extension Host Linux). |
| [6977fb6](https://github.com/Drako01/indizivo/commit/6977fb6fa274ba97c552f897f84c46865bdf45d7) | Candidato de código anterior a storage: VSIX instalado Linux, inspección, smoke y checksum. | [Enterprise VSIX Candidate Gate 42307501547](https://github.com/Drako01/indizivo/actions/runs/42307501547) PASS; `indizivo-0.1.3.vsix` SHA-256 `bcbf7f1f33e987002358832afccb5f1043baff609d4f9acd8e1fadd5749559c3`; [artifact 13547350577](https://github.com/Drako01/indizivo/actions/runs/42307501547/artifacts/13547350577). **No valida cambios storage posteriores.** |

- El marker del commit `00276c9` disparó y completó el [Enterprise VSIX Candidate Gate 42307975194](https://github.com/Drako01/indizivo/actions/runs/42307975194): **PASS**, smoke de VSIX instalado y checksum SHA-256 documentado. Esta actualización posterior del checklist es solo documental y no modifica el payload VSIX.
- No se reinstalaron dependencias ni se repitió un test manualmente para los cambios solo documentales: el workflow de candidato contiene los gates de empaquetado requeridos por contrato.
- Sigue bloqueado el GO AAAA/10-10 por UI real con lectores de pantalla y 200% zoom, matriz remota WSL/SSH/Dev Containers, test de cancelación de process-tree real en cada OS y estudio externo 10–15 devs.
- Próximo operador: comprobar [acciones de PR #14](https://github.com/Drako01/indizivo/actions), guardar SHA del candidato HEAD, inspeccionar findings manuales y actualizar decisiones de aceptación sin fusionar, versionar o publicar.

### Handoff final de la iteración — 2026-11-06 (solo actualización documental)

- **Código validado sin cambio de runtime posterior:** `0c97ed06a458666254109dfd14c877adfadbccf5` — [Quality Gate 42307778143](https://github.com/Drako01/indizivo/actions/runs/42307778143), cuatro checks PASS (Ubuntu, Windows, macOS y VS Code Extension Host Linux).
- **Commit del candidato verificado:** `00276c964fd40329468716ecdccd2fd9c37ac1b8` — [Quality Gate 42307979719](https://github.com/Drako01/indizivo/actions/runs/42307979719) cuatro checks PASS, más [VSIX Candidate Gate 42307975194](https://github.com/Drako01/indizivo/actions/runs/42307975194) PASS: cinco checks agregados.
- **Artefacto exacto:** `indizivo-0.1.3.vsix`, SHA-256 `ae9370f9a418c1b8b3487f5bbc8e47958d828572bcd0023824fbe93bda2990f5`, [descarga desde Actions](https://github.com/Drako01/indizivo/actions/runs/42307975194/artifacts/13546719713). Verificación de instalación automática Linux, no clicks reales de usuario.
- **Estados preservados:** S-05/A-07 siguen `IMPLEMENTED_PARTIAL` pese a pruebas de fallas sintéticas; R-07 sigue `IMPLEMENTED_PARTIAL`; las pruebas manuales UI/a11y, remote, cancellation y 10–15 usuarios siguen `TODO/BLOCKED`. Ningún `[ ]` se convierte en `[x]` por CI indirecto.
- **Eficiencia y alcance:** este commit cambia exclusivamente este checklist, contenido excluido del VSIX según `.vscodeignore`. No requiere nuevo build ni repetir matrices sobre el mismo código; si GitHub ejecuta Quality Gate por política de PR, registrar el resultado del SHA propio sin atribuirlo al runtime.
- **Siguiente paso operativo:** continuar P0/P1 pendientes (security corpus/cancel real, veracidad Go, modelo completo Finding/Evidence), luego QA de UI, SO y remote con el VSIX de hash fijo; documentar en este mismo ledger cada evidencia exacta y mantener el release de `0.2.0` en `NO-GO` hasta aprobación del owner. Sin merge, tags, release ni cambio de logos.


### Iteración 2026-11-06 — Go, TOCTOU, privacidad, reportes y Workspace Trust

| Commit de código | Cambios efectivos / IDs | Evidencia CI (SHA exacto) | Resultado |
|---|---|---|---|
| [e980efc](https://github.com/Drako01/indizivo/commit/e980efccaf2cfaea2432ca278ff5bae06ebb1e1c) | D-02 parser go.mod inicial | [42308749499](https://github.com/Drako01/indizivo/actions/runs/42308749499), errores TypeScript TS2345/TS2532/TS2322 | **FAIL histórico; corregido después** |
| [2e56463](https://github.com/Drako01/indizivo/commit/2e56463e5c47db309f44fe40ce02c1a96ffa7cba) | D-02: parseo exacto go.mod, Go minimum vs toolchain suggestion, caso implícito, duplicados/invalid y EN/ES | [42308867352](https://github.com/Drako01/indizivo/actions/runs/42308867352) | PASS 4/4 |
| [5969b8e](https://github.com/Drako01/indizivo/commit/5969b8e53dad8cf3dcf7b8e3320e0d85b89284a3) | S-04: descriptor inode/dev identity, size/mtime y fail closed | [42309190289](https://github.com/Drako01/indizivo/actions/runs/42309190289) | PASS 4/4 |
| [300b3b2](https://github.com/Drako01/indizivo/commit/300b3b250b53c8acbeaeb9f19388fe8e0216ece6) | S-06/S-07: SSRF rejection corpus y redacción sintética ampliada | [42309414688](https://github.com/Drako01/indizivo/actions/runs/42309414688) | PASS 4/4 |
| [8b7c4a4](https://github.com/Drako01/indizivo/commit/8b7c4a4d477581dd33688a4f1f00e27976482edc) | D-05/P-08: JSON reportFormatVersion 1 aditivo; Markdown con procedencia/limitaciones | [42309581937](https://github.com/Drako01/indizivo/actions/runs/42309581937) | PASS 4/4 |
| [8de1fb0](https://github.com/Drako01/indizivo/commit/8de1fb0006f46c37c234ccde6f95c602ef3a7ca4) | S-08: capacidades limitadas para untrusted y virtual, localización nativa | [42309758459](https://github.com/Drako01/indizivo/actions/runs/42309758459) | PASS 4/4 |
| [e40ceee](https://github.com/Drako01/indizivo/commit/e40ceee3961b64589b1ff68a6663c8083adfcf67) | D-02/S-02: `GOTOOLCHAIN=local` únicamente en subprocess de Go, no descarga ni modifica environment original | [42309898474](https://github.com/Drako01/indizivo/actions/runs/42309898474) | PASS 4/4 |

**Rango de impacto:** cambios en TypeScript strict, metadata del manifest, tests unit/integration/security y generadores de reportes; CI verificada en Windows/macOS/Linux y Extension Host Linux por SHA. No se ha ejecutado UI con teclado real ni escáner de red externo. Los 4/4 no equivalen a una validación Enterprise AAAA.

**Evidencia reutilizada sin repetir:** [VSIX candidate 00276c9](https://github.com/Drako01/indizivo/actions/runs/42307975194) sigue válido SOLO para su SHA (hash `ae9370f9a418c1b8b3487f5bbc8e47958d828572bcd0023824fbe93bda2990f5`), no para los siete cambios posteriores. No se forzó otra construcción VSIX hasta cerrar un nuevo candidato.

**P0/P1 todavía abiertos:** modelo canonico completo D-05, cancelación process-tree real S-02, aislamiento remoto S-01, pruebas reales TOCTOU S-04, performance p50/p95/RSS de proyectos reales B-08/A-06, QA visual y accesibilidad B-09/P-10/A-08, estudio externo P-12/P-13, gate final del owner R-09.

**Handoff:** la próxima IA debe partir del HEAD actual de PR #14, verificar el diff respecto a e40ceee, implementar el siguiente ID sin rehacer lo que ya pasó, actualizar este mismo ledger y generar un nuevo VSIX candidato (sin publicar) al finalizar la siguiente integración relevante.

### Iteración 2026-11-06 — Finding v1, cancelación real y renderer/baselines

| SHA de código | IDs y alcance | Evidencia exacta | Resultado |
|---|---|---|---|
| [e3cc246](https://github.com/Drako01/indizivo/commit/e3cc24605c8ea55eb22826c9d41159d6f0dca712) | D-05/A-03: metadata Finding v1: checkId/targetId/severity y restauración histórica segura | [Quality Gate 42310486981](https://github.com/Drako01/indizivo/actions/runs/42310486981) | **PASS 4/4** |
| [b3d7679](https://github.com/Drako01/indizivo/commit/b3d76791cf3c11a1d3f587bbd8fede84ac337435) | P-09/P-05: limitaciones de provenance localizadas EN/ES, persistibles y sin mutar hechos canónicos | [Quality Gate 42310716249](https://github.com/Drako01/indizivo/actions/runs/42310716249) | **PASS 4/4** |
| [ddfc104](https://github.com/Drako01/indizivo/commit/ddfc1045bd6a0af99434da227791c72b91751e01) | S-02: ejecutor inicial bounded e integración tool probes/owner snapshots | [Quality Gate 42311043750](https://github.com/Drako01/indizivo/actions/runs/42311043750) | **PASS 4/4** en tests disponibles; NO prueba del descendiente real |
| [fc5b80c](https://github.com/Drako01/indizivo/commit/fc5b80c8e2073b87d3461a5f87ec38f6e3b610b5) | S-02 test con proceso descendiente real, detectó error de cancelación; execFile no propagaba detached | [Quality Gate 42311198057](https://github.com/Drako01/indizivo/actions/runs/42311198057) | **FAIL histórico real**, reproducido y corregido |
| [7e9360b](https://github.com/Drako01/indizivo/commit/7e9360bc94d6d0d4f163d3895ca1125c0e555797) | S-02: spawn con grupo POSIX, taskkill /T PID propio en Win, límite de salida y pruebas de nieto real | [Quality Gate 42311358286](https://github.com/Drako01/indizivo/actions/runs/42311358286) | **PASS 4/4**, incluida prueba de proceso descendiente real en 3 SO |
| [dcae02e](https://github.com/Drako01/indizivo/commit/dcae02e80a5802899523eb0ad24c05d328a5ce38) | A-01/P-08: extraído `reports.ts`, export versión 1 con test de compatibilidad/localización/redacción | [Quality Gate 42311637048](https://github.com/Drako01/indizivo/actions/runs/42311637048) | **PASS 4/4** |
| [225d707](https://github.com/Drako01/indizivo/commit/225d7079b311d878455a90c2b35ff739ecc85a5f) | B-08/A-06: fixtures sintéticos pequeños, medianos y grandes, p50/p95/RSS, solo en gate VSIX candidato | [Quality Gate 42311892097](https://github.com/Drako01/indizivo/actions/runs/42311892097) | **PASS 4/4** estático/unit; mediciones **PENDING** hasta correr candidate gate |

**Validez y límites:** la matriz 3 SO confirma cancelación de procesos y descendientes sintéticos propios; no es un pentest, no acredita SSH/WSL/Containers, ni procesos ajenos a Indizivo. Los benchmarks etiquetados `synthetic-local-benchmark` no son SLO ni sustituyen mediciones sobre repositorios de usuarios. La evaluación del producto con 10–15 developers sigue pendiente.

**Evidencia reutilizada:** no se repitió manualmente la matriz cuando el código y entorno no cambiaron; los runs automáticos de cada SHA y su contrato están enlazados. El VSIX verificado de `00276c9` es **histórico y NO acredita el nuevo runtime**. La modificación del marker de candidato en esta iteración dispara un run separado de empaquetado/hashes/performance; sin publicar.

**Handoff siguiente:** revisar `Indizivo / Enterprise VSIX Candidate Gate` del commit de esta documentación; guardar run/artefacto/hash/perfiles JSONL. Después investigar a11y real, Windows/macOS UI, remote WSL/SSH/containers, seguridad adversarial y benchmark real, dejando cada criterio NO-GO hasta evidencia completa. PR #14 y #13 continúan Draft.


### Verificación de candidato final de esta iteración — SHA exacto `6a738a3`

- **Código de implementación evaluado:** `225d7079b311d878455a90c2b35ff739ecc85a5f` — [Quality Gate 42311892097](https://github.com/Drako01/indizivo/actions/runs/42311892097), **PASS 4/4** Linux, Windows, macOS, VS Code Extension Host Linux.
- **Commit documental marcador que incluye exactamente ese código:** `6a738a3b8b26c633cae14ed4dc66df9fa23f2dd9` — [Quality Gate 42312166879](https://github.com/Drako01/indizivo/actions/runs/42312166879), **PASS 4/4 (segundo intento)**. El intento inicial tuvo un fallo externo `ETIMEDOUT` / `ENETUNREACH` descargando VS Code en Linux; solo se reejecutó el job fallido. No reinterpretar el fallo previo como PASS.
- **VSIX de 0.1.3 interno, destino futuro 0.2.0:** [Candidate Gate 42312161308](https://github.com/Drako01/indizivo/actions/runs/42312161308) **PASS** (no publica), `indizivo-0.1.3.vsix`, 41 archivos, 67,99 KB, SHA-256 `023a9c475505826bfb6d9a6fdfb7d7a5b697f578535766a35ef6930815344a73`, [artefacto GitHub Actions 13549101833](https://github.com/Drako01/indizivo/actions/runs/42312161308/artifacts/13549101833).
- **Métricas:** el artefacto incluye `indizivo.synthetic-benchmarks.jsonl` con perfiles small/medium/large y 12 diagnósticos por perfil, p50/p95 y peak RSS. No se copiaron métricas numéricas sin leer el archivo, no se declararon umbrales/SLO. B-08 y A-06 permanecen **PARCIAL / real-project baseline pendiente**.
- **No repetir:** este checkpoint modifica únicamente documentación fuera del VSIX según `.vscodeignore`; QA automatizada del candidato 6a738a3 se reutiliza exclusivamente cuando el diff no altera runtime/manifest/lockfile ni superficie empaquetada. No disparar otro VSIX Gate por modificar solo el checklist.
- **Release:** `main` sigue en 0.1.3; ninguna publicación de 0.2.0, no tag, no merge, no cambios de logos, secrets o branch rules. PR #13 y #14 continúan Draft. **NO-GO** para declaración AAAA/10-10 hasta QA y aprobación explícita.

### Iteracion 2026-11-06 (sesion 3) — bug Windows NTFS, cobertura, corpus, docs

| SHA de codigo | IDs / cambio | Evidencia |
|---|---|---|
| 27a07e5 | S-04/D-07: **bug real en Windows**: los file IDs de NTFS superan 2^53 y `Number.isSafeInteger` bloqueaba archivos legitimos (14 tests fallaban en Windows local; el CI no lo detecto porque sus inodes son menores). Ahora `lstat/fstat` usan `bigint` y la identidad se compara exacta. Test de regresion con ID > 2^53. | Local Windows 11, Node 24.22.1: `node --test test/*.test.js` 152 pass / 0 fail (antes 138/14). |
| 93d9d58 | A-05: `scripts/coverage-gate.cjs` con pisos de cobertura de lineas por modulo critico, medidos (no global); paso en `verify.yml` solo en Linux. | Local: `Coverage gate: PASS`; 2 tests del parser/evaluador. CI: [Quality Gate 42313470854](https://github.com/Drako01/indizivo/actions/runs/42313470854) sobre `bbbd1a6`, 4/4 PASS (Linux, Windows, macOS, Extension Host); log Linux: `Coverage gate: PASS`. |
| (refactor) | A-01: `beginRun/endRun` elimina el ciclo running/abort duplicado; `renderEvidenceCopy` movido a `reports.ts` (puro, compartido con la redaccion de exports). | Local: 155 pass / 0 fail, `tsc` strict OK. |
| bbbd1a6 | D-09/P-13: `test/corpus.test.js` + `test/corpus/projects.json`, 15 proyectos etiquetados con presupuesto de error <=5% (puertos declarados vs heuristicos, Go minimo vs toolchain, .env sin fuga de valores, lockfiles, runtimes opcionales). SECURITY.md y SUPPORT.md alineados con 0.1.3 (R-06). | Local: 156 pass / 0 fail. Corpus sintetico: **no** reemplaza falsos positivos medidos en proyectos reales. |

- **Estados:** D-09 pasa a IMPLEMENTED_VERIFIED_LOCAL (corpus sintetico); A-05 IMPLEMENTED_VERIFIED_CI (pisos confirmados en Linux por el run 42313470854); A-01 sigue PARCIAL (ControlCenter conserva storage/bridge/UI). R-05 ya existia: Open VSX inactivo emite `warning` + resumen + `sync-open-vsx` diario; falta evidencia de un run real.
- **npm audit:** `--omit=dev` 0 vulnerabilidades; `npm audit` completo 3 moderadas (dev tooling, `minimatch`) clasificadas WARN, sin explotabilidad en el VSIX (sin dependencias runtime).
- **Sin cambio:** version `0.1.3`, logos, publisher, workflows de publicacion, reglas, tags. Merge/publicacion/bump a 0.2.0 siguen pendientes del GO del owner.
- **Siguiente accion:** el Quality Gate de `bbbd1a6` ya esta en PASS; sigue la matriz manual (a11y, WSL/SSH/Containers, 10-15 devs), que no es automatizable.

- **Version 0.2.0 (autorizada por el owner en sesion, 2026-11-06):** `package.json`/lockfile en `0.2.0`, README reescrito con las nuevas funciones, PRIVACY/SECURITY/ROADMAP/CHANGELOG alineados, `verify-packaged.yml` y `packaging.test.js` esperan `0.2.0`. Local: `npm run verify` 156 pass / 0 fail. **Sin publicar, tag ni merge**; las capturas del README siguen siendo las aprobadas (no regeneradas).

### Iteracion 2026-11-06 (sesion 3, parte 2) — v0.2.0: ControlCenter, adversarial, navegador real

| Cambio | IDs | Evidencia (local, Windows 11, Node 24.22.1) |
|---|---|---|
| `project-state.ts`: `ProjectStateStore` extrae persistencia (clave hasheada, clamp de timeout, tope de servicios, validacion de locale, lectura/escritura fallida sin lanzar) fuera de `ControlCenter`; 4 tests. | A-01/S-05 | `npm run verify` 163 pass / 0 fail; `Coverage gate: PASS`. `ControlCenter` baja a 400 lineas; bridge de mensajes y comandos siguen en `extension.ts`. `ui.ts` NO se dividio (el inventario VSIX y los tests de CSS dependen de su forma): A-02 sigue PARCIAL. |
| `test/adversarial.test.js`: fuzz con semilla de 2000 URLs (hosts alternativos, userinfo, esquemas, IPv4 decimal/hex, IPv6 mapeado, homoglifos) que solo acepta loopback sin credenciales/query/hash; escrituras concurrentes sin lecturas rotas; symlink hacia fuera del workspace bloqueado. | S-04/S-06 | Mismos 163 tests. El symlink se pudo crear en este Windows (no SKIP). No es un pentest externo ni prueba DNS real. |
| Pasada en **Chromium real** (Playwright) con el HTML real de `html()` y un host VS Code simulado: roles/tabs ARIA, flechas/End mueven foco y panel juntos, nombres accesibles correctos en el arbol de accesibilidad, sin desborde horizontal a 640 px (~zoom 200 %) y 320 px, `prefers-reduced-motion` => transicion 0s, `forced-colors: active` => contorno de foco solido 3 px. | P-10 | Manual con harness en scratchpad (no versionado). **No** es NVDA/VoiceOver ni el Webview de VS Code instalado: P-10/B-09 siguen PARCIALES. |

- **P-11:** se mantiene copy-only por diseno (el contrato lo permite como etapa inicial); no hay mutaciones, por lo que no se agrega preview/rollback.
- **No automatizable y aun abierto:** NVDA/VoiceOver, UI instalada en Windows/macOS, WSL/SSH/Dev Containers (S-01, A-08, R-08), estudio con 10-15 developers (P-12/P-13), benchmark en proyectos reales (B-08/A-06), GO del owner (R-09).

## Registro de avance (actualizar EN CADA SESION)

| Campo | Valor |
|---|---|
| Fecha / operador | 2026-11-06 / implementacion continua |
| Rama de implementacion | feat/indizivo-enterprise-aaaa (PR #14 Draft) |
| Ultimo commit inspeccionado | 225d7079b311d878455a90c2b35ff739ecc85a5f (último código antes de esta actualización documental) |
| Ultimo commit con calidad verificada | 225d7079b311d878455a90c2b35ff739ecc85a5f (run 42311892097, Windows/Linux/macOS + Linux E2E 4/4 PASS) |
| Fase en curso | Fases 1–5 parcialmente desarrolladas en PR #14; hardening, matriz manual y certificacion pendientes |
| Ultimo ID completado | D-08 (ademas D-04, D-06, D-07) |
| IDs IN_PROGRESS | D-01, D-02, D-03, D-05, S-01/02/03/04/05/06/07/08, P-02/03/04/05/06/07/08, A-01/03/04/07, R-01/03/07 |
| Bloqueos | UI real/a11y, WSL/SSH/Dev Containers, cancelación en hosts remotos, 10–15 usuarios, pentest/TOCTOU adversarial externo y benchmark en proyectos reales. Candidato VSIX 6a738a3 está verificado por CI |
| Proxima accion exacta | Candidate 6a738a3 verificado con SHA256 y benchmark sintético; ejecutar y registrar matriz UI real, NVDA/VoiceOver/zoom 200%, WSL/SSH/Containers y 10–15 usuarios. Decisión GO/NO-GO del owner antes de 0.2.0 |
| Gates integrales pendientes | VSIX nuevo solo si cambia runtime tras 6a738a3; UI real/lector pantalla, WSL/SSH/containers, p95/RSS en proyectos reales, falsos positivos externos y QA con 10–15 usuarios |
| Release decision | NO-GO para Enterprise AAAA |

### Plantilla de handoff por sesion

Fecha y SHA: ...

Cambios efectivos (archivos, decisiones, IDs): ...

Pruebas NUEVAS ejecutadas (comando, SO, resultado, evidencia): ...

Pruebas REUTILIZADAS (SHA, run, justificacion precisa): ...

Bugs/risks abiertos, severidad y reproduccion: ...

Pendientes inmediatos, por ID y orden: ...

Proxima instruccion para otra IA (una accion concreta): ...

### Criterios generales de cierre

- [ ] Ningun P0/P1 abierto sin decision explicita y mitigacion documentada.
- [ ] Evidencia medible de exactitud (falsos positivos/negativos), velocidad y seguridad.
- [ ] Probes nunca inventan versiones, procesos, permisos ni causalidad.
- [ ] Matriz E2E y accesibilidad firmada para SO que se anuncian.
- [ ] El usuario puede entender y actuar sobre los hallazgos sin estudiar codigo fuente.
- [ ] README y reportes no contradicen el build ni la privacidad real.
- [ ] Owner aprueba GO final. Hasta entonces: Upgrade en desarrollo, no AAAA certificado.

## Evidencia de referencia

- Base codigo: https://github.com/Drako01/indizivo/tree/9bad7cca3c08dda4018dc3f6c98e22dffe80def1
- Diagnosticos: https://github.com/Drako01/indizivo/blob/9bad7cca3c08dda4018dc3f6c98e22dffe80def1/src/typed/diagnostics.ts
- Versiones: https://github.com/Drako01/indizivo/blob/9bad7cca3c08dda4018dc3f6c98e22dffe80def1/src/typed/versions.ts
- Comparacion: https://github.com/Drako01/indizivo/blob/9bad7cca3c08dda4018dc3f6c98e22dffe80def1/src/typed/comparison.ts
- CI: https://github.com/Drako01/indizivo/actions/runs/42130183859
- Release: https://github.com/Drako01/indizivo/actions/runs/42130183807
- Guia oficial Workspace Trust: https://code.visualstudio.com/api/extension-guides/workspace-trust
- Guia oficial Webview: https://code.visualstudio.com/api/extension-guides/webview
- Guia oficial Remote Extensions: https://code.visualstudio.com/api/advanced-topics/remote-extensions
