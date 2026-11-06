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

**Ultimo commit de codigo verificado ANTES de esta actualizacion documental:** `0c97ed06a458666254109dfd14c877adfadbccf5`, [Quality Gate 42307778143](https://github.com/Drako01/indizivo/actions/runs/42307778143): Windows, Linux, macOS y VS Code Extension Host Linux, todos PASS. La nueva revision de este checklist es un cambio solo documental; no declarar que su SHA fue probado hasta confirmar un run propio o aplicar la regla de reutilizacion de evidencia con el diff documentado.

**Candidato VSIX empaquetado instalado:** `5a416aaed3d4f4017da012340a61dab51f4356f6`, [run 42300511256](https://github.com/Drako01/indizivo/actions/runs/42300511256), PASS en un Extension Host aislado Linux, checksum e inspeccion del inventario. Este PASS es del SHA indicado, **no** de todos los cambios posteriores.

| ID | Estado basado en evidencia | Nota / criterio pendiente |
|---|---|---|
| D-01 | IMPLEMENTED_VERIFIED_SUBSET | Semver ~, ^, comparadores parciales, OR, wildcard (incl. ^0.0.x y 1.2.*), fail-closed, 35 casos contrastados con npm semver 7.6.3 en test/versions-reference.test.js; prerreleases/hyphen se mantienen INCONCLUSIVE y la equivalencia total con npm queda fuera de alcance |
| D-02 | IMPLEMENTED_PARTIAL | `go` y `toolchain` diferenciados; falta matriz de versiones Go real |
| D-03 | IMPLEMENTED_PARTIAL | HTTP loopback IPv4/IPv6, pruebas en CI; falta topologia completa de SO/host remoto |
| D-04 | VERIFIED | Puerto declarado vs heuristica Next/Vite, tests y textos |
| D-05 | IMPLEMENTED_PARTIAL | `schemaVersion:2`, provenance y scope; falta esquema de reporte y severidad formal completos |
| D-06 | VERIFIED | IDs por URL canonica, pruebas de reorder y comparacion posterior a service recheck |
| D-07 | VERIFIED | Archivo ausente vs ilegible/bloqueado; no falsear ausencia de claves en .env |
| D-08 | VERIFIED | README/ROADMAP/PRIVACY 0.1.3, CURRENT_STATE y notas historicas etiquetadas |
| D-09 | IMPLEMENTED_PARTIAL | Corpus npm semver 7.6.3 con expectativas congeladas y tests adversariales; faltan fixtures externos de falsos positivos y negativos reales, con etiquetas y tasa medida |
| S-01/S-04/S-08 | IMPLEMENTED_PARTIAL | Seleccion de subproyecto con realpath y trust existente; falta WSL/SSH/containers/TOCTOU adversarial |
| S-02 | IMPLEMENTED_PARTIAL | Deadline monotónico por diagnóstico/servicios, resultados parciales; falta cancelacion process-tree real |
| S-03 | IMPLEMENTED_UNIT_VERIFIED | Batch de owner OS, coincidencia exacta macOS; faltan pruebas con procesos reales en cada SO |
| S-05 | IMPLEMENTED_PARTIAL | Historial acotado, migracion explicita de schema legacy v1, rechazo de schemas futuros desconocidos y sanitizacion. Lectura/escritura workspaceState fallida: fallback seguro, mensaje EN/ES, sin falsear el diagnostico, con regresiones verificadas. Falta matriz real de fallos de disco y storage remoto |
| S-06 | IMPLEMENTED_PARTIAL | Allowlist y consentimiento localhost; service targets rechazados generan BLOCKED sin solicitud HTTP ni eco de URL; regression test PASS. Pendiente corpus avanzado SSRF/DNS/redirect |
| S-07 | IMPLEMENTED_UNIT_VERIFIED | Redaccion sintetica en export/copy y no leer valores de .env; no garantiza detectar todos los formatos de secretos |
| P-02 | IMPLEMENTED_PARTIAL | Descubrimiento superficial limitado de monorepo/multi-root y seleccion explicita; falta UX real remoto |
| P-03/P-04 | IMPLEMENTED_UNIT_VERIFIED | Versiones permitidas de Python/PHP/Java/Docker CLI; Node/Go y lockfile/packageManager read-only; sin afirmaciones de compatibilidad de dependencias |
| P-05/P-06/P-07 | IMPLEMENTED_PARTIAL | Evidencia con confianza y limitaciones, diff post-recheck y filtros UI; faltan pruebas de usuario y navegacion real completa |
| P-08 | IMPLEMENTED_UNIT_VERIFIED | JSON versionado y `vscode.workspace.fs` para URI remota, redaccion; falta corpus export amplio |
| A-01/A-03 | IMPLEMENTED_PARTIAL | Modulos storage, tool-probes, budget, monorepo, redaction; validacion estricta de campos Webview y schema historico; ControlCenter aun concentra responsabilidades |
| A-04/A-07 | IMPLEMENTED_PARTIAL | Tests unitarios, Webview en VM, Extension Host Linux, estado PARTIAL, storage I/O fallido sin diagnostico falso; falta matriz UI/VSIX multi-SO |
| R-01/R-03/R-07 | IMPLEMENTED_PARTIAL | PR14 Draft; Quality Gate 3-SO PASS. VSIX de 6977fb6 instalable Linux y SHA256 verificados (run 42307501547), pero era anterior a storage I/O; nuevo VSIX HEAD pendiente. No equivale a UI real ni release |
| R-08/R-09/R-10 | OPEN/CONTROLLED | Matriz manual, GO/NO-GO y restricciones owner documentadas; no merge/tag/release ni cambios de branding |

### Handoff verificable (ultimo bloque)

- **Ultimo codigo verificado:** `0c97ed06a458666254109dfd14c877adfadbccf5` — [Quality Gate PASS, 4/4](https://github.com/Drako01/indizivo/actions/runs/42307778143).
- **VSIX aislado verificado:** `5a416aaed3d4f4017da012340a61dab51f4356f6` — [Packaged VSIX PASS](https://github.com/Drako01/indizivo/actions/runs/42300511256), **commit anterior**.
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

- Esta revisión documental cambia el marker `docs/ENTERPRISE_AAAA_RELEASE_CANDIDATE.md` para ejecutar un nuevo VSIX Candidate Gate sobre el SHA del commit documental, ahora con el código storage. **PENDING** hasta registrar la ejecución exacta y el checksum.
- No se reinstalaron dependencias ni se repitió un test manualmente para los cambios solo documentales: el workflow de candidato contiene los gates de empaquetado requeridos por contrato.
- Sigue bloqueado el GO AAAA/10-10 por UI real con lectores de pantalla y 200% zoom, matriz remota WSL/SSH/Dev Containers, test de cancelación de process-tree real en cada OS y estudio externo 10–15 devs.
- Próximo operador: comprobar [acciones de PR #14](https://github.com/Drako01/indizivo/actions), guardar SHA del candidato HEAD, inspeccionar findings manuales y actualizar decisiones de aceptación sin fusionar, versionar o publicar.

## Registro de avance (actualizar EN CADA SESION)

| Campo | Valor |
|---|---|
| Fecha / operador | 2026-11-06 / implementacion continua |
| Rama de implementacion | feat/indizivo-enterprise-aaaa (PR #14 Draft) |
| Ultimo commit inspeccionado | 0c97ed06a458666254109dfd14c877adfadbccf5 (ultimo codigo antes de esta actualizacion documental) |
| Ultimo commit con calidad verificada | 0c97ed06a458666254109dfd14c877adfadbccf5 (run 42307778143, Windows/Linux/macOS + Linux E2E 4/4 PASS) |
| Fase en curso | Fases 1–5 parcialmente desarrolladas en PR #14; hardening, matriz manual y certificacion pendientes |
| Ultimo ID completado | D-08 (ademas D-04, D-06, D-07) |
| IDs IN_PROGRESS | D-01, D-02, D-03, D-05, S-01/02/03/04/05/06/07/08, P-02/03/04/05/06/07/08, A-01/03/04/07, R-01/03/07 |
| Bloqueos | UI real y accesibilidad, entornos remotos, pruebas con usuarios, seguridad adversarial y VSIX del HEAD final pendientes |
| Proxima accion exacta | Verificar Enterprise VSIX Candidate Gate del nuevo HEAD (código storage incluido); registrar SHA-256 del VSIX y evitar liberar hasta gates UI/remote/UX. |
| Gates integrales pendientes | VSIX del HEAD final, browser UI real, a11y, WSL/SSH/containers, p95/RSS, false-positive corpus y QA externo |
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
