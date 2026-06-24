# Checklist beta - validacion general de FormulIA Cloud

Estado del documento: listo para usar en sesiones beta.

Objetivo: guiar a un betatester por los flujos principales del sistema, dejar espacio para marcar resultado, capturar evidencia y permitir que despues se conviertan los hallazgos en propuestas de mejora priorizadas.

## Como usar este checklist

1. Crear una copia por sesion beta o duplicar la tabla de "Registro de resultados".
2. Ejecutar los escenarios en orden cuando sea una validacion completa.
3. Para validaciones parciales, marcar `N/A` en los bloques no ejecutados.
4. Adjuntar evidencia cuando el resultado sea `Fail`, `Blocked` o haya duda funcional.
5. Al final, completar "Propuestas de mejora detectadas" con ideas concretas.

## Leyenda

- `Pass`: funciona como se espera.
- `Fail`: el flujo se puede ejecutar pero el resultado es incorrecto.
- `Blocked`: no se puede continuar por error, permiso, dato faltante o pantalla rota.
- `N/A`: no aplica en esta sesion.

## Datos de la sesion

| Campo | Valor |
| --- | --- |
| Tester |  |
| Fecha |  |
| Entorno | Local / Staging / Produccion |
| Navegador | Chrome / Edge / Firefox / Otro |
| Resolucion / dispositivo |  |
| Tenant / workspace usado |  |
| Usuario / rol |  |
| Dataset usado | Demo / Real / Mixto |
| Version / branch |  |
| Observaciones iniciales |  |

## Registro rapido de resultados

| Area | Estado | Incidencias abiertas | Bloqueante | Comentarios |
| --- | --- | --- | --- | --- |
| Acceso y workspace |  |  |  |  |
| Settings y parametros |  |  |  |  |
| Materias primas |  |  |  |  |
| Precios y riquezas |  |  |  |  |
| Formula Builder |  |  |  |  |
| Calculo y warnings |  |  |  |  |
| Guardado y biblioteca |  |  |  |  |
| Comparacion de formulas |  |  |  |  |
| Importacion Excel generica |  |  |  |  |
| Plantilla Excel I+D Atlantica |  |  |  |  |
| Compatibilidades |  |  |  |  |
| Jira / revision laboratorio |  |  |  |  |
| ISO design records |  |  |  |  |
| IA / asistente |  |  |  |  |
| Responsive / UX |  |  |  |  |
| Seguridad basica |  |  |  |  |

## 1. Acceso, sesion y workspace

| ID | Caso | Pasos | Resultado esperado | Estado | Evidencia | Mejora propuesta |
| --- | --- | --- | --- | --- | --- | --- |
| ACC-01 | Login correcto | Entrar con usuario valido. | El usuario accede a la app y ve su workspace o selector. |  |  |  |
| ACC-02 | Sesion inexistente | Abrir la app sin sesion activa. | Redirige a login sin mostrar datos privados. |  |  |  |
| ACC-03 | Logout | Cerrar sesion desde la UI. | La sesion se cierra y no se puede volver con back a datos privados. |  |  |  |
| ACC-04 | Crear workspace | Crear un workspace/tenant nuevo. | Se crea y queda seleccionado. |  |  |  |
| ACC-05 | Cambiar workspace | Cambiar entre workspaces disponibles. | Cambian datos visibles y no se mezclan materias/formulas. |  |  |  |
| ACC-06 | Mensajes de estado | Ejecutar una accion cualquiera. | Se ve feedback claro de carga, exito o error. |  |  |  |

## 2. Settings y parametros tecnicos

| ID | Caso | Pasos | Resultado esperado | Estado | Evidencia | Mejora propuesta |
| --- | --- | --- | --- | --- | --- | --- |
| SET-01 | Crear parametro | Crear parametro con codigo, nombre, unidad y decimales. | Aparece activo en catalogo y builder. |  |  |  |
| SET-02 | Codigo duplicado | Intentar crear un parametro con codigo ya existente. | El sistema bloquea o avisa claramente. |  |  |  |
| SET-03 | Editar parametro | Cambiar nombre/unidad/decimales. | La UI refleja el cambio sin romper formulas existentes. |  |  |  |
| SET-04 | Desactivar parametro | Marcar parametro como inactivo. | Deja de usarse en nuevas vistas/exportaciones activas. |  |  |  |
| SET-05 | Persistencia | Recargar la pagina. | Los parametros se mantienen. |  |  |  |

## 3. Materias primas

| ID | Caso | Pasos | Resultado esperado | Estado | Evidencia | Mejora propuesta |
| --- | --- | --- | --- | --- | --- | --- |
| MAT-01 | Crear materia prima minima | Crear materia con nombre y codigo. | Queda disponible en catalogo. |  |  |  |
| MAT-02 | Validar codigo/nombre | Intentar codigo duplicado o nombre vacio. | El sistema evita datos invalidos. |  |  |  |
| MAT-03 | Buscar materia | Usar buscador por nombre y codigo. | Encuentra resultados esperados. |  |  |  |
| MAT-04 | Aliases | Crear alias para una materia. | El alias se usa en importacion Excel. |  |  |  |
| MAT-05 | Filtros por familia | Filtrar por familia si hay datos. | La lista se reduce correctamente. |  |  |  |
| MAT-06 | Detalle expandido | Abrir detalle de materia. | Se ven precio, parametros, aliases y datos relevantes. |  |  |  |
| MAT-07 | Obsoleto/inactivo | Marcar materia como no activa/obsoleta si aplica. | No aparece como candidata normal de nuevas formulas. |  |  |  |

## 4. Precios y riquezas

| ID | Caso | Pasos | Resultado esperado | Estado | Evidencia | Mejora propuesta |
| --- | --- | --- | --- | --- | --- | --- |
| PR-01 | Anadir precio | Anadir precio EUR/kg a una materia. | El precio queda como actual. |  |  |  |
| PR-02 | Historial de precio | Anadir segundo precio con fecha posterior. | El calculo usa el mas reciente valido. |  |  |  |
| PR-03 | Materia sin precio | Usar materia sin precio en formula. | Calculo genera warning claro. |  |  |  |
| PR-04 | Anadir riqueza | Guardar valor de parametro para una materia. | El builder lo muestra y calcula. |  |  |  |
| PR-05 | Riqueza faltante | Usar materia sin riqueza para parametro visible. | El valor se trata como 0 o se avisa segun regla. |  |  |  |
| PR-06 | Actualizacion | Cambiar precio o riqueza y recalcular formula. | El resultado actualizado cambia de forma coherente. |  |  |  |

## 5. Formula Builder

| ID | Caso | Pasos | Resultado esperado | Estado | Evidencia | Mejora propuesta |
| --- | --- | --- | --- | --- | --- | --- |
| FB-01 | Crear formula nueva | En Datos basicos seleccionar `Formula nueva independiente`, completar nombre, descripcion y metadatos. | La formula queda como nueva y lista para composicion. |  |  |  |
| FB-02 | Buscar y agregar materia | Buscar materia en catalogo y agregarla a la formula. | Se crea una linea con porcentaje editable. |  |  |  |
| FB-03 | Editar porcentaje | Cambiar porcentaje de una linea. | Total de formula se actualiza al instante. |  |  |  |
| FB-04 | Reordenar lineas | Mover lineas arriba/abajo. | Orden visual y orden guardado coinciden. |  |  |  |
| FB-05 | Duplicar linea | Duplicar una materia. | La linea nueva aparece sin romper el total. |  |  |  |
| FB-06 | Eliminar linea | Eliminar una linea. | Total, precio y parametros se recalculan. |  |  |  |
| FB-07 | Formula no balanceada | Dejar total distinto de 100%. | Guardado queda bloqueado o avisa claramente. |  |  |  |
| FB-08 | Formula balanceada | Ajustar total a 100%. | Guardado queda disponible. |  |  |  |
| FB-09 | Vista de parametros | Cambiar presets o parametros visibles. | La tabla cambia sin perder datos. |  |  |  |
| FB-10 | Solo positivos | Activar filtro de parametros > 0. | Solo se ven parametros con valor positivo. |  |  |  |
| FB-11 | Modificar o versionar cargada | Abrir una formula desde Biblioteca y volver a Datos basicos. Elegir `Modificar formula cargada` y despues `Nueva version ligada`. | La UI muestra origen con version, cambia la banda superior y Revision explica si se actualizara o se creara version nueva. |  |  |  |

## 6. Calculo, warnings y resultados

| ID | Caso | Pasos | Resultado esperado | Estado | Evidencia | Mejora propuesta |
| --- | --- | --- | --- | --- | --- | --- |
| CAL-01 | Calculo local/preview | Crear formula con varias materias. | Precio, total y parametros se muestran rapidamente. |  |  |  |
| CAL-02 | Calculo backend | Ejecutar calculo oficial si aplica. | Resultado backend coincide con preview dentro de tolerancia. |  |  |  |
| CAL-03 | Precio ponderado | Validar manualmente un precio simple. | Precio calculado correcto. |  |  |  |
| CAL-04 | Parametro ponderado | Validar manualmente una riqueza simple. | Valor calculado correcto. |  |  |  |
| CAL-05 | Warnings severidad | Forzar materia sin precio/parametro. | Warning visible, claro y accionable. |  |  |  |
| CAL-06 | Resultados vacios | Formula sin lineas. | No crashea; muestra estado vacio claro. |  |  |  |

## 7. Guardado, biblioteca e historial

| ID | Caso | Pasos | Resultado esperado | Estado | Evidencia | Mejora propuesta |
| --- | --- | --- | --- | --- | --- | --- |
| LIB-01 | Guardar formula | Guardar formula balanceada. | Se crea formula en biblioteca. |  |  |  |
| LIB-02 | Abrir formula guardada | Abrir desde biblioteca. | Builder se rellena con lineas correctas. |  |  |  |
| LIB-03 | Versionado | Modificar formula guardada y guardar. | Version/estado se gestionan sin perder historial. |  |  |  |
| LIB-04 | Historial de calculo | Calcular/guardar y revisar historial. | Se listan calculos con fecha, precio y warnings. |  |  |  |
| LIB-05 | Refresco biblioteca | Usar refresh. | Lista actualizada sin duplicados. |  |  |  |
| LIB-06 | Estados vacios | Biblioteca sin formulas. | Mensaje claro y sin errores. |  |  |  |

## 8. Comparacion de formulas

| ID | Caso | Pasos | Resultado esperado | Estado | Evidencia | Mejora propuesta |
| --- | --- | --- | --- | --- | --- | --- |
| CMP-01 | Seleccionar base/candidata | Elegir dos formulas guardadas. | Boton comparar queda disponible. |  |  |  |
| CMP-02 | Comparar | Ejecutar comparacion. | Diferencias de precio, lineas y parametros se muestran. |  |  |  |
| CMP-03 | Restriccion precio maximo | Definir precio maximo. | Cumplimientos/incumplimientos se clasifican bien. |  |  |  |
| CMP-04 | Restriccion parametro minimo | Definir parametro y minimo. | Evaluacion coherente. |  |  |  |
| CMP-05 | Restriccion materia | Definir limites por materia. | La comparacion marca si cumple. |  |  |  |
| CMP-06 | Filtro solo incidencias | Activar filtro. | Solo se ven restricciones con problema. |  |  |  |

## 9. Importacion Excel generica

| ID | Caso | Pasos | Resultado esperado | Estado | Evidencia | Mejora propuesta |
| --- | --- | --- | --- | --- | --- | --- |
| XLG-01 | Subir .xlsx simple | Subir archivo con columnas materia y %. | Preview detecta hoja, columnas y filas. |  |  |  |
| XLG-02 | Seleccionar hoja | Subir libro con varias hojas. | Permite seleccionar hoja correcta. |  |  |  |
| XLG-03 | Matching por codigo | Importar fila con codigo existente. | Fila queda resuelta automaticamente. |  |  |  |
| XLG-04 | Matching por nombre | Importar fila con nombre exacto. | Fila queda resuelta automaticamente. |  |  |  |
| XLG-05 | Matching por alias | Importar fila con alias. | Fila queda resuelta por alias. |  |  |  |
| XLG-06 | Sugerencia fuzzy | Importar nombre parecido. | Sugiere materia con score razonable. |  |  |  |
| XLG-07 | Resolver manualmente | Seleccionar materia para fila pendiente. | Fila queda resuelta y se puede guardar. |  |  |  |
| XLG-08 | Crear materia desde fila | Crear materia desde una fila pendiente. | Materia se crea y fila queda resuelta. |  |  |  |
| XLG-09 | Guardar alias desde fila | Resolver manual y guardar alias. | Alias queda disponible para futuras importaciones. |  |  |  |
| XLG-10 | Guardar formula importada | Resolver todo y guardar. | Formula aparece en builder y biblioteca. |  |  |  |
| XLG-11 | Porcentajes invalidos | Importar porcentaje vacio, texto o negativo. | Fila queda marcada como invalida. |  |  |  |

## 10. Plantilla Excel I+D Atlantica

Usar como archivo real de referencia: `ID.280 MICROCAT BON + AA F1 - rev.xlsx`.

| ID | Caso | Pasos | Resultado esperado | Estado | Evidencia | Mejora propuesta |
| --- | --- | --- | --- | --- | --- | --- |
| XLA-01 | Detectar plantilla | Subir el Excel I+D Atlantica. | Preview muestra parser `atlantica_id_lab` o etiqueta "Plantilla I+D". |  |  |  |
| XLA-02 | Leer hojas | Confirmar hojas `Calculadora`, `Hoja Lab`, `Composicion`. | El sistema usa `Calculadora` como fuente principal. |  |  |  |
| XLA-03 | Nombre formula | Revisar nombre detectado. | Coincide con titulo de `Hoja Lab`. |  |  |  |
| XLA-04 | Lineas y porcentajes | Revisar filas importadas. | Lineas y % coinciden con `Calculadora`; total 100%. |  |  |  |
| XLA-05 | Precios importados | Revisar precios en preview. | Precios visibles coinciden con columna `Precio`. |  |  |  |
| XLA-06 | Riquezas importadas | Revisar contador de parametros por fila. | Se detectan todos los parametros de `Calculadora`. |  |  |  |
| XLA-07 | Datos Hoja Lab | Revisar nombre lab y observaciones. | Se capturan material lab y observacion si existen. |  |  |  |
| XLA-08 | Guardar como formula | Resolver materias si hace falta y guardar. | Formula queda abierta en builder. |  |  |  |
| XLA-09 | Exportar desde Builder | Desde formula actual, pulsar `Exportar Excel I+D`. | Descarga `.xlsx` con hojas esperadas. |  |  |  |
| XLA-10 | Exportar desde Biblioteca | Guardar formula y exportar desde biblioteca. | Descarga `.xlsx` de formula guardada. |  |  |  |
| XLA-11 | Formulas internas Excel | Abrir Excel exportado. | Totales y composicion contienen formulas, no solo valores planos. |  |  |  |
| XLA-12 | Autoactualizacion Excel | Cambiar precio/riqueza, exportar de nuevo. | Excel nuevo refleja cambios y recalcula al abrir. |  |  |  |
| XLA-13 | Logo y formato | Abrir `Hoja Lab`. | Logo, orden de adicion, ensayos 0,5 kg/2 kg y bloque experimental se ven correctos. |  |  |  |
| XLA-14 | Round-trip | Exportar una formula e importar ese mismo Excel. | El parser reconstruye lineas y parametros sin perdida relevante. |  |  |  |

## 11. Compatibilidades

| ID | Caso | Pasos | Resultado esperado | Estado | Evidencia | Mejora propuesta |
| --- | --- | --- | --- | --- | --- | --- |
| COM-01 | Crear regla par materiales | Crear incompatibilidad entre dos materias. | Regla queda activa. |  |  |  |
| COM-02 | Calculo con incompatibilidad | Usar ambas materias en formula. | Warning aparece con severidad y mensaje. |  |  |  |
| COM-03 | Desactivar regla | Desactivar regla. | Warning desaparece en siguiente calculo. |  |  |  |
| COM-04 | Evidencia/accion | Revisar texto recomendado. | La accion recomendada es visible y comprensible. |  |  |  |

## 12. Jira y revision laboratorio

| ID | Caso | Pasos | Resultado esperado | Estado | Evidencia | Mejora propuesta |
| --- | --- | --- | --- | --- | --- | --- |
| JIR-01 | Crear conexion Jira | Configurar base URL, proyecto y tipo. | Conexion se guarda y testea. |  |  |  |
| JIR-02 | OAuth/API token | Probar modo disponible. | Estado de conexion claro. |  |  |  |
| JIR-03 | Preparar review | Crear review desde formula. | Snapshot incluye formula, lineas, precios, riquezas y calculo. |  |  |  |
| JIR-04 | Generar Excel review | Crear artefacto Excel de review. | Descarga usa plantilla I+D Atlantica. |  |  |  |
| JIR-05 | Enviar a Jira | Enviar review. | Issue creado con campos esperados y adjunto si aplica. |  |  |  |
| JIR-06 | Reintentar adjunto | Forzar/reintentar adjunto. | Reintento no duplica ni rompe estado. |  |  |  |
| JIR-07 | Sincronizar estado | Cambiar estado en Jira y sincronizar. | Estado local se actualiza. |  |  |  |
| JIR-08 | Error Jira | Usar credenciales invalidas o proyecto inexistente. | Error claro, sin perder review local. |  |  |  |

## 13. ISO design records

| ID | Caso | Pasos | Resultado esperado | Estado | Evidencia | Mejora propuesta |
| --- | --- | --- | --- | --- | --- | --- |
| ISO-01 | Activar modulo ISO | Revisar settings ISO. | Modulo queda disponible. |  |  |  |
| ISO-02 | Crear proyecto diseno | Crear expediente/proyecto. | Aparece en lista y selector. |  |  |  |
| ISO-03 | Vincular formula | Preparar formula para proyecto ISO. | La formula queda asociada. |  |  |  |
| ISO-04 | Ensayo/trial | Crear o sincronizar ensayo. | Numero y estado son coherentes. |  |  |  |
| ISO-05 | Estado aceptado/rechazado | Cambiar estado. | Historial/estado final quedan claros. |  |  |  |

## 14. IA y asistente

| ID | Caso | Pasos | Resultado esperado | Estado | Evidencia | Mejora propuesta |
| --- | --- | --- | --- | --- | --- | --- |
| AI-01 | Parsear requisito | Escribir requisito formulacion. | Devuelve restricciones estructuradas. |  |  |  |
| AI-02 | Plan de formulacion | Pedir plan. | Plan usa tools/datos disponibles y no inventa formula final sin calculo. |  |  |  |
| AI-03 | Aplicar draft | Aplicar propuesta de IA si existe. | Builder se rellena y puede revisarse. |  |  |  |
| AI-04 | Caso infeasible | Pedir requisito imposible. | Explica inviabilidad y ofrece accion razonable. |  |  |  |
| AI-05 | Auditoria | Revisar historial de runs. | Se ve entrada con input/output/estado. |  |  |  |
| AI-06 | Sin API key | Ejecutar flujo IA sin configuracion. | Error guiado, no crashea. |  |  |  |

## 15. UX, responsive y rendimiento

| ID | Caso | Pasos | Resultado esperado | Estado | Evidencia | Mejora propuesta |
| --- | --- | --- | --- | --- | --- | --- |
| UX-01 | Navegacion general | Recorrer todas las vistas principales. | No hay pantalla rota ni textos cortados. |  |  |  |
| UX-02 | Mobile | Probar ancho movil. | Tablas y formularios son usables. |  |  |  |
| UX-03 | Desktop amplio | Probar pantalla grande. | El layout no se estira de forma incomoda. |  |  |  |
| UX-04 | Carga lenta | Repetir acciones con red lenta si posible. | Spinners/disabled states evitan dobles envios. |  |  |  |
| UX-05 | Errores visibles | Forzar error API o dato invalido. | Mensaje ayuda a corregir. |  |  |  |
| UX-06 | Accesibilidad basica | Navegar con teclado en formularios clave. | Focus visible y orden logico. |  |  |  |
| UX-07 | Descargas | Descargar Excel varias veces. | No hay bloqueos, nombres claros, extension correcta. |  |  |  |

## 16. Seguridad y aislamiento basico

| ID | Caso | Pasos | Resultado esperado | Estado | Evidencia | Mejora propuesta |
| --- | --- | --- | --- | --- | --- | --- |
| SEC-01 | Tenant isolation UI | Cambiar tenant. | No se ven datos del tenant anterior. |  |  |  |
| SEC-02 | Tenant isolation API | Intentar acceder a recurso de otro tenant si se puede. | API deniega acceso. |  |  |  |
| SEC-03 | Acciones sin permiso | Usar usuario no admin en settings sensibles. | Accion bloqueada o no visible. |  |  |  |
| SEC-04 | Archivos no Excel | Subir archivo no `.xlsx`. | Importador rechaza con mensaje claro. |  |  |  |
| SEC-05 | Excel corrupto | Subir `.xlsx` corrupto. | Error controlado, sin caida de app. |  |  |  |
| SEC-06 | Datos sensibles | Revisar mensajes de error. | No exponen secretos, tokens ni trazas internas. |  |  |  |

## 17. Regresion rapida por release

| ID | Caso | Estado | Evidencia | Comentarios |
| --- | --- | --- | --- | --- |
| REG-01 | Login + seleccionar workspace |  |  |  |
| REG-02 | Crear materia + precio + riqueza |  |  |  |
| REG-03 | Crear formula 100% y calcular |  |  |  |
| REG-04 | Guardar y abrir desde biblioteca |  |  |  |
| REG-05 | Exportar Excel I+D desde builder |  |  |  |
| REG-06 | Importar Excel I+D real |  |  |  |
| REG-07 | Comparar dos formulas |  |  |  |
| REG-08 | Generar review Jira con Excel |  |  |  |
| REG-09 | Vista mobile smoke |  |  |  |
| REG-10 | Logout |  |  |  |

## Registro de incidencias

| ID incidencia | Caso relacionado | Severidad | Tipo | Descripcion | Pasos para reproducir | Resultado actual | Resultado esperado | Evidencia | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BUG-001 |  | Blocker / High / Medium / Low | Bug / UX / Datos / Rendimiento / Seguridad |  |  |  |  |  | Open |
| BUG-002 |  | Blocker / High / Medium / Low | Bug / UX / Datos / Rendimiento / Seguridad |  |  |  |  |  | Open |
| BUG-003 |  | Blocker / High / Medium / Low | Bug / UX / Datos / Rendimiento / Seguridad |  |  |  |  |  | Open |

## Propuestas de mejora detectadas

| ID mejora | Origen | Problema observado | Propuesta | Impacto usuario | Esfuerzo estimado | Prioridad | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| IMP-001 |  |  |  | Alto / Medio / Bajo | S / M / L | P0 / P1 / P2 / P3 |  |
| IMP-002 |  |  |  | Alto / Medio / Bajo | S / M / L | P0 / P1 / P2 / P3 |  |
| IMP-003 |  |  |  | Alto / Medio / Bajo | S / M / L | P0 / P1 / P2 / P3 |  |

## Criterios de salida beta

| Criterio | Minimo para avanzar | Estado | Comentarios |
| --- | --- | --- | --- |
| Bloqueantes | 0 incidencias Blocker abiertas. |  |  |
| High | 0 High sin plan aceptado. |  |  |
| Flujo formula | Crear, calcular, guardar, abrir y exportar funciona. |  |  |
| Excel I+D | Import/export Atlantica validado con archivo real. |  |  |
| Datos maestros | Materias, precios, riquezas y aliases operativos. |  |  |
| Tenant isolation | Validacion basica completada. |  |  |
| UX | Sin bloqueos graves en desktop y mobile basico. |  |  |
| Propuestas | Mejoras priorizadas en backlog. |  |  |

## Siguiente paso tras completar el checklist

1. Consolidar incidencias duplicadas.
2. Separar bugs de mejoras.
3. Priorizar con matriz impacto/esfuerzo.
4. Convertir P0/P1 en issues o backlog inmediato.
5. Decidir si se necesita otra ronda beta o si pasa a release candidate.
