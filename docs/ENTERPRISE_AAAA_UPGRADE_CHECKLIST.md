# INDIZIVO — Enterprise AAAA upgrade control checklist

> Fecha de apertura: 2026-11-06 (ART). Baseline auditada: `main` @ `9bad7cca3c08dda4018dc3f6c98e22dffe80def1`, paquete `0.1.3`.
> Estado: **AUDITADO / IMPLEMENTACION NO INICIADA**. Este documento es un plan de trabajo, no una certificacion.
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
- [ ] D-04 Dejar de inferir "puerto del proyecto" sin origen confiable; next:3000/vite:5173 deben estar marcados como sugerencias heuristicas, no como configuracion observada. Aceptacion: etiqueta observed/inferred + fuente.
- [ ] D-05 Crear modelo canonico de Finding/Evidence: id estable, checkId, targetId, scope de host, metodo, timestamp, estado, severidad, confianza, origen, limitaciones y next step verificable. Aceptacion: schema versionado y migracion no destructiva.
- [ ] D-06 Identidad estable de endpoints para diff: no usar indice de array `service-0` como identidad persistente. Aceptacion: reordenar/eliminar servicio no atribuye estados de otro.
- [ ] D-07 Lecturas inconclusas: permisos, archivos grandes, symlink o errores deben distinguir ausencia real de dato no inspeccionable. Aceptacion: fixtures fail-closed, no falso PASS.
- [ ] D-08 Reconstruir docs desactualizados: README anuncia 0.1.0, ROADMAP y docs de handoff/rulesets mencionan estados antiguos. Conservar historia fechada; agregar una unica fuente de estado CURRENT_STATE. Aceptacion: todos los claims vigentes coinciden con main y release.
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

## Registro de avance (actualizar EN CADA SESION)

| Campo | Valor |
|---|---|
| Fecha / operador | 2026-11-06 / auditoria inicial |
| Rama de implementacion | NO CREADA |
| Ultimo commit inspeccionado | 9bad7cca3c08dda4018dc3f6c98e22dffe80def1 |
| Ultimo commit con calidad verificada | 9bad7cca3c08dda4018dc3f6c98e22dffe80def1 (GitHub Actions; ver B-03 a B-05) |
| Fase en curso | Sin implementar: Fase 1 / D-01 |
| Ultimo ID completado | B-07 (solo baseline) |
| IDs IN_PROGRESS | ninguno |
| Bloqueos | ninguno documentado |
| Proxima accion exacta | Abrir PR de upgrade desde main; implementar D-01 con corpus comparativo; test de regresion focalizado |
| Gates integrales pendientes | toda implementacion nueva, E2E UI real, certificacion multi SO |
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
