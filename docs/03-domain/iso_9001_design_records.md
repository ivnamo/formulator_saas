# Modulo ISO 9001 para diseno y validacion de producto

Estado: borrador vivo de alto nivel  
Fecha: 2026-06-13  
Fuentes revisadas:

- `F10-01 Viabilidad y planificacion de disenos.xlsx`
- `F10-02_Todas_solicitudes_20260309_1031.xlsx`
- `F10-03_Todas_solicitudes_20260309_1031.xlsx`
- `P10-I+D rev. 6.docx`
- Modelo actual de FormulIA Cloud, especialmente formulas, calculos, revision Jira, snapshots y artefactos.

## Estado de entorno verificado

Verificado el 2026-06-13:

- Tenant local activo: `atlantica-agricola` (`33d0fb27-8d6c-4e5e-b24f-7de89dc4b2ae`) en `formulia.db`.
- Tenant remoto activo: `atlantica-agricola` (`4aca9629-0e4a-42e1-9502-4cf8c54a1803`) en schema `formulia`.
- Conexion Jira local activa para Atlantica.
- Conexion Jira remota activa para Atlantica.
- Jira apunta a `https://atlanticaagricola.atlassian.net`, proyecto Jira destino `ID` (`I+D+i - Desarrollo`).
- El issue type no es una propiedad fija de la conexion. Debe elegirse por formula/ensayo: `Prototipo`, `PoC`, `Calidad` o `Muestra`. La conexion conserva `Prototipo` solo como fallback tecnico porque el conector actual exige un issue type valido para testear la conexion.
- Estado de credencial: `configured`. La credencial queda almacenada como secreto de conexion; no debe documentarse en texto plano.
- Estado local de credencial Jira: `configured`.
- Mapeo de campos Jira cargado: `ProyectoID -> customfield_10658`, `Tipo producto -> customfield_10856`, `Resultado I+D -> customfield_11024`.
- Mapeo de estados Jira cargado para el workflow real de `ID`: `PENDIENTE`, `PRE-CALIDAD`, `LABORATORIO`, `CALIDAD`, `PENDIENTE DECISION`, `FINALIZADO`, mas alias legacy.
- Se deja tambien membresia de desarrollo local para poder probar el tenant con `X-User-Id` durante desarrollo, ademas de la invitacion/membresia real gestionada via Supabase.
- Modulo ISO activado para tenant `atlantica-agricola` en local y remoto mediante `iso_tenant_settings.enabled = true`.
- Configuracion ISO tenant-scoped cargada para Atlantica: proyecto Jira `ID`, issue types `Prototipo`, `PoC`, `Calidad`, `Muestra`, matriz F10-03 base y mapping de `Resultado I+D`.
- Verificacion API remota realizada via transaction pooler Supabase `6543`: `GET /api/v1/iso/settings` devuelve `enabled=true`, `GET /api/v1/iso/design-projects` responde 200 y `GET /api/v1/integrations/jira` responde 200 con una unica conexion activa.
- La URL Postgres de `.env.local` sigue usando el pooler Supabase de sesion `5432`; si vuelve a aparecer `max clients reached`, usar temporalmente el transaction pooler `6543` para operaciones administrativas.
- Supabase REST no sirve como alternativa ahora: el schema de datos usado por la app es `formulia`, pero PostgREST solo expone `public`/`graphql_public` en este proyecto.
- Script idempotente para aplicar esta configuracion: `scripts/configure_iso_tenant.py`.
- UI inicial integrada en workspace: vista `ISO 9001`, carga silenciosa de settings/proyectos, activacion por admin, resumen de configuracion tenant y alta/listado F10-01.

## Jira real revisado

Proyecto Jira revisado: `ID` - `I+D+i - Desarrollo`.

Issue types disponibles:

- `Prototipo` (`10659`): desarrollo de producto.
- `PoC` (`10884`): prueba de concepto sin solicitud.
- `Calidad` (`10885`).
- `Muestra` (`12140`).

Campos obligatorios para crear issue:

| Issue type | Obligatorios de Jira | Obligatorios funcionales para FormulIA/ISO |
| --- | --- | --- |
| `Prototipo` | `project`, `reporter`, `summary`, `ProyectoID`, `Tipo producto` | formula con `jira_issue_type=Prototipo`, `jira_project_id` informado, `jira_product_type` informado |
| `Calidad` | `project`, `reporter`, `summary`, `ProyectoID`, `Tipo producto` | formula con `jira_issue_type=Calidad`, `jira_project_id` informado, `jira_product_type` informado |
| `PoC` | `project`, `reporter`, `summary`, `issuetype` | formula con `jira_issue_type=PoC`; si se vincula a expediente ISO debe informar tambien codigo/proyecto interno aunque Jira no lo exija |
| `Muestra` | `project`, `reporter`, `summary`, `issuetype` | formula con `jira_issue_type=Muestra`; no debe usarse para cierre ISO salvo regla explicita posterior |

Campos settable confirmados en Jira:

- `description` y `labels` estan disponibles para los cuatro issue types.
- `ProyectoID` es `customfield_10658`, tipo texto.
- `Tipo producto` es `customfield_10856`, select con valores `Nuevo`, `Mod A`, `Mod B`, `Mod C`.
- `Resultado I+D` es `customfield_11024`, select con valores `Liberado`, `OK No Liberado`, `NOK tecnico`, `Iterado`, `Abandonado`, `Cancelado administrativo`.

Estados del workflow de `ID`:

- `PENDIENTE`
- `PRE-CALIDAD`
- `LABORATORIO`
- `CALIDAD`
- `PENDIENTE DECISION`
- `FINALIZADO`

Regla importante: el estado Jira indica fase de trabajo; `Resultado I+D` indica veredicto tecnico del ensayo. Para ISO 9001 no se debe inferir `LIBERADO`, `NOK` u `OK NO LIBERADO` solo a partir de `FINALIZADO`.

Normalizacion ISO propuesta para `Resultado I+D`:

| Jira `Resultado I+D` | Resultado tecnico ISO | Efecto ISO |
| --- | --- | --- |
| `Liberado` | `LIBERADO` | cierra ensayo F10-02 con exito y habilita F10-03 |
| `OK No Liberado` | `OK_NO_LIBERADO` | cierra ensayo F10-02 sin liberar producto |
| `NOK tecnico` | `NOK` | cierra ensayo F10-02 como rechazado tecnicamente |
| `Iterado` | `ITERADO` | requiere nuevo ensayo/formula vinculada |
| `Abandonado` | `ABANDONADO` | cierra o suspende expediente segun decision F10-01 |
| `Cancelado administrativo` | `CANCELADO` | cierre administrativo, no validacion tecnica |

Implicaciones para el modelo:

- `jira_issue_type` debe ser obligatorio y explicito por formula antes de enviar a Jira. No debe heredarse silenciosamente de la conexion.
- El actual `jira_project_id` de `Formula` representa el campo Jira `ProyectoID`, es decir, el codigo funcional del proyecto/solicitud; no debe confundirse con el proyecto Jira `ID`.
- Si en el futuro se permiten varios proyectos Jira, se debe anadir un campo separado `jira_project_key` validado contra Jira, sin reutilizar `jira_project_id`.
- `jira_product_type` debe mapearse como opcion Jira (`{"value": "Nuevo"}`), no como texto libre, cuando se envia a `customfield_10856`.
- La sincronizacion Jira debe leer tanto `status` como `customfield_11024`. El primero alimenta estado operativo; el segundo alimenta resultado tecnico ISO.

Guardrail implementado en el conector:

- `field_mapping_json` es global por conexion, pero Jira define campos settable por issue type.
- Al enviar a Jira, el backend consulta `createmeta` del issue type elegido por la formula.
- Si se envia `PoC` o `Muestra`, Jira no ofrece `ProyectoID` ni `Tipo producto` en la metadata de creacion; el backend filtra esos custom fields y no los envia.
- Si se envia `Prototipo` o `Calidad`, Jira si exige `ProyectoID` y `Tipo producto`; el backend bloquea el envio si faltan o si `Tipo producto` no esta dentro de los valores permitidos.
- El payload Jira se construye con mapping global, pero se filtra y valida contra metadata real antes de llamar a `create_issue`.
- La sincronizacion de Jira lee `customfield_11024` cuando esta mapeado como `technical_result`, guarda el valor literal y su normalizacion en el snapshot del review, y lo registra en auditoria.

## Principio multi-tenant

El modulo ISO no debe estar activo por defecto para todos los tenants. Cada tenant puede tener formatos, campos Jira, resultados tecnicos, matriz F10-03 y reglas de cierre diferentes.

Implementacion inicial:

- Tabla `iso_tenant_settings`.
- Campo `enabled` para activar/desactivar el modulo por tenant.
- Campo `config_json` para versionar configuracion por tenant.
- Endpoints ISO bloqueados con `403` si el modulo no esta activo.
- Solo `owner`/`admin` puede actualizar settings ISO.

Configuracion por tenant cubierta en el MVP:

- formatos visibles (`F10-01`, `F10-02`, `F10-03`),
- proyecto Jira de referencia,
- issue types disponibles,
- si `PoC` puede existir sin expediente,
- si `Muestra` puede usarse para validacion,
- mapping de `Resultado I+D` a resultado tecnico ISO,
- lista cerrada de resultados tecnicos permitidos,
- matriz F10-03 por area/aspecto.

## Estado implementado actual

Slice implementado:

- Backend ISO tenant-scoped: `iso_tenant_settings`, `iso_design_projects`, `iso_design_trials`, `iso_product_validations`, `iso_record_artifacts`.
- Endpoints ISO: settings, CRUD inicial de proyectos F10-01, listado/alta de ensayos F10-02, alta desde Jira review, validacion final F10-03, exports F10 y dossier ZIP.
- Guard de activacion: los endpoints operativos devuelven `403` si el tenant no tiene ISO activo.
- Configuracion activa y verificada en local para tenant `atlantica-agricola`; remoto previamente configurado, con re-verificacion actual bloqueada por limite de conexiones del pool Supabase.
- Jira bridge base: sync de `Resultado I+D` desde Jira, normalizacion tecnica en snapshot y validacion por issue type real.
- Frontend inicial: panel `ISO 9001` dentro del shell, resumen de tenant, formulario de alta F10-01 y tabla que separa F10-01/F10-02/F10-03.
- Bridge Jira/ISO implementado: `POST /api/v1/formulas/{formula_id}/reviews/jira` acepta `design_project_id` opcional, guarda bloque `iso` en el snapshot y crea/actualiza un ensayo F10-02 asociado.
- Sync Jira/ISO implementado: cuando se sincroniza una review vinculada, el ensayo F10-02 se actualiza con `jira_issue_key`, estado Jira literal, `Resultado I+D` literal y resultado tecnico normalizado.
- UI de formula implementada: selector `Expediente ISO` junto a `Send to Jira`; si se selecciona expediente, la review se prepara como ensayo F10-02 del proyecto.
- UI ISO ampliada: seccion F10-02 por expediente con ensayos, formula/version, resultado tecnico, issue Jira y estado/resultado literal de Jira.
- F10-03 implementado como borrador/publicacion: solo se crea desde un ensayo F10-02 `LIBERADO`, inicializa matriz por tenant y publica solo cuando todos los checks requeridos estan `OK`.
- UI ISO ampliada: seccion F10-03 por expediente con creacion desde ensayos `LIBERADO`, matriz editable por area/aspecto y publicacion que deja el proyecto como `validated`.
- Exports implementados: F10-01 anual, F10-02 por expediente, F10-03 por expediente, descarga tenant-scoped y dossier ZIP con `metadata.json` y checksums.
- UI ISO ampliada: botones de export F10-01, F10-02, F10-03 y dossier desde el modulo activo.
- Importacion legacy implementada: preview/apply para F10-01, F10-02 y F10-03 con filas `ready`, `ambiguous` y resultado aplicado.
- Parser validado contra los Excel reales:
  - F10-01: 74 filas, 55 listas y 19 ambiguas por falta de solicitud/ID o producto.
  - F10-02: 125 ensayos listos.
  - F10-03: 46 hojas, 29 listas y 17 ambiguas por falta de `Formula OK`.
- UI ISO ampliada: seccion `Importacion historica` con selector de formato, fichero, hoja, preview y apply.
- Script administrativo implementado: `scripts/configure_iso_tenant.py` activa ISO/Jira por tenant de forma idempotente.

Pendiente para convertirlo en flujo auditor completo:

- Mostrar detalle F10-02 enriquecido por proyecto con snapshots de composicion completos.
- Completar ficha F10-03 con especificacion final editable y evidencias/firmas si el auditor lo exige.
- Mejorar formato visual de exports si el auditor exige parecido casi identico a los Excel legacy.

## Objetivo

Construir un modulo ISO 9001 que permita demostrar el cumplimiento del procedimiento P-10 desde la propia app, sin depender necesariamente de Excel, pero manteniendo una correspondencia clara con los tres formatos auditables:

- F10-01: registro de viabilidad y planificacion de disenos.
- F10-02: registro de diseno de producto, ensayos, formulas probadas, resultados tecnicos y verificacion.
- F10-03: validacion final del producto cuando existe una formula/prototipo liberado.

La app debe ser el origen de verdad operativo y auditable. Excel debe quedar como formato de salida, importacion historica o evidencia legacy, no como modelo interno.

## Lectura funcional de los formatos

### F10-01 - Viabilidad y planificacion

F10-01 es el registro alto nivel por solicitud/proyecto. En los anos 2022-2024 aparece como registro anual con cabeceras:

- `No Solicitud`
- `SOLICITANTE`
- `NOMBRE`
- `NOM_COMERCIAL`
- `NECESIDAD`
- `VOLUMEN COMPETENCIA`
- `PRECIO COMPETENCIA`
- `VOLUMEN PROPUESTO`
- `ENVASE`
- `PAIS DESTINO`
- `ACEPTADO`
- `FINALIZADO`
- `MOTIVO DENEGADO`
- `FECHA DE APROBACION SOL.`
- `TIEMPO ESTIMADO`
- `FECHA FINALIZACION ESTIMADA`
- `FECHA DE FINALIZACION REAL`
- `HORAS EMPLEADAS I+D`
- `HORAS EMPLEADAS EN CALIDAD`
- `PROBLEMAS`
- `COMENTARIOS`

En 2025 aparece una evolucion con `ID`, `TIPO DE PRODUCTO` y tiempo estimado en dias laborables. Esto sugiere que el modelo debe separar:

- identificacion funcional del proyecto,
- datos comerciales/de solicitud,
- decision de aceptacion,
- planificacion,
- cierre,
- metricas de esfuerzo,
- comentarios/problemas.

### F10-02 - Diseno de producto

F10-02 es una ficha por solicitud. Cada hoja tiene este patron:

- Cabecera:
  - `No Solicitud`
  - `Responsable`
  - `Producto`
- Seccion `1. DATOS DE PARTIDA DEL DISENO`
  - Texto libre con necesidad, datos de entrada o especificacion objetivo.
- Seccion `2. ENSAYOS / FORMULACION`
  - Repite bloques `Ensayo N`.
  - Cada ensayo tiene cabecera `ID`, `Nombre`, `Fecha`, `Resultado`.
  - Despues incluye tabla de composicion `Materia prima`, `% peso`.
  - Al final incluye `Motivo / comentario`.
- Seccion `3. VERIFICACION (DISENO)` cuando hay resultado que permite cerrar:
  - `Producto final`
  - `Formula OK`
  - `Riquezas`
  - comentario de verificacion o resultado final.

En los ficheros revisados, los resultados de ensayo observados son principalmente:

- `NOK`
- `OK NO LIBERADO`
- `LIBERADO`

Estos valores deben tratarse como resultado tecnico del ensayo/formula, no solo como estado visual de Jira.

### F10-03 - Validacion de producto

F10-03 es una ficha por solicitud orientada a cierre final. Su estructura observada es:

- Cabecera:
  - `No Solicitud`
  - `Responsable`
  - `Producto`
  - `Formula OK`
- Seccion `1. ESPECIFICACION FINAL`
  - `Descripcion`
  - `Aspecto`
  - `Color`
  - `Caracteristicas quimicas`
  - Tabla `Parametro`, `Valor`
- Seccion `2. VALIDACION`
  - `Fecha validacion`
  - Tabla `Area`, `Aspecto a validar`, `OK/NOK`, `Comentarios`

La matriz de validacion observada para productos no microbiologicos incluye:

- I+D+i - Formula / Funcionalidad
- Tecnico - Validacion agronomica
- Registros - Cumplimiento legislativo
- Produccion - Viabilidad productiva
- Calidad - Cumplimiento legislativo
- Calidad - Composicion declarada
- Calidad - Estabilidad quimica
- Marketing y/o Direccion - Precio Tarifa
- Marketing y/o Direccion - Lanzamiento

El procedimiento P-10 tambien contempla variantes para microorganismos, con responsabilidades y evidencias adicionales.

## Lectura del procedimiento P-10

Del procedimiento se desprenden estas obligaciones operativas:

- Toda solicitud nueva o modificacion debe venir de una solicitud aprobada y tener identificador trazable.
- F10-01 registra la viabilidad, planificacion, aprobacion o denegacion y cierre.
- F10-02 registra las revisiones del diseno, formulas de prueba, resultados, verificacion y formula definitiva.
- Si el diseno no prospera, debe quedar indicado en F10-01.
- Cuando hay producto finalizado, se verifica que cumple datos de entrada y que es apto fisica/quimicamente para comercializacion.
- F10-03 registra la validacion final por areas cuando corresponde.
- Al finalizar, debe recopilarse un dossier con la documentacion generada.
- Los registros F10-01, F10-02 y F10-03 tienen conservacion minima de 3 anos segun la tabla de registros del procedimiento.

## Principios de diseno

1. El modulo ISO no debe duplicar Jira ni duplicar formulas.
2. Jira sigue siendo sistema de trabajo del laboratorio/calidad.
3. FormulIA debe ser el origen de verdad de la formula, calculos, snapshots y expediente ISO.
4. F10-01, F10-02 y F10-03 deben ser vistas auditables sobre datos canonicos.
5. Cualquier dato usado para auditoria debe ser tenant-scoped, trazable y no sobrescrito silenciosamente.
6. Las formulas enviadas a revision deben congelarse como snapshots inmutables.
7. Los estados de Jira deben normalizarse a eventos ISO, manteniendo tambien el estado literal recibido.
8. El auditor debe poder ver la informacion en la app por formato, ano, solicitud y estado, y opcionalmente exportarla.
9. La implementacion debe ser aditiva para no romper el flujo actual de formulas/Jira.

## Modelo conceptual propuesto

### `design_projects`

Entidad raiz del expediente ISO. Representa la solicitud/proyecto de diseno que hoy aparece como una fila en F10-01 y como una hoja en F10-02/F10-03.

Campos orientativos:

- `id`
- `tenant_id`
- `iso_request_number`, por ejemplo `2/2025`
- `legacy_id`, si procede del F10-01 2025
- `year`
- `requester`
- `responsible_user_id`
- `product_name`
- `commercial_name`
- `product_type`
- `need_summary`
- `competitor_volume`
- `competitor_price`
- `proposed_volume`
- `packaging`
- `destination_country`
- `accepted_status`: `pending`, `accepted`, `rejected`
- `rejection_reason`
- `approved_at`
- `estimated_duration_days`
- `estimated_finish_at`
- `actual_finish_at`
- `rd_hours`
- `quality_hours`
- `problems`
- `comments`
- `lifecycle_status`: `intake`, `planned`, `in_design`, `verified`, `validated`, `rejected`, `cancelled`, `closed`
- `created_at`, `updated_at`, `created_by`

### `design_project_sources`

Relaciona el expediente con origenes externos o internos:

- solicitud manual,
- importacion F10 legacy,
- issue Jira,
- formula de FormulIA,
- documento OneDrive,
- SAP cuando exista alta de articulo.

Campos orientativos:

- `source_type`: `manual`, `legacy_f10_01`, `jira`, `formulia_formula`, `onedrive`, `sap`
- `source_id`
- `source_url`
- `payload_json`

### `design_trials`

Representa cada ensayo/formula probada dentro de F10-02. Puede nacer desde una formula de FormulIA, un `formula_review_request`, una issue de Jira o una importacion legacy.

Campos orientativos:

- `id`
- `tenant_id`
- `design_project_id`
- `formula_id`
- `formula_version`
- `review_request_id`
- `jira_issue_key`
- `jira_issue_url`
- `trial_code`, por ejemplo `ID-176`
- `trial_name`
- `trial_number`
- `trial_at`
- `technical_result`: `NOK`, `OK_NO_LIBERADO`, `LIBERADO`, `ITERADO`, `ABANDONADO`, `CANCELADO`, `pending_result`, `pending_mapping`
- `raw_result_label`, por ejemplo el valor literal de Jira `Resultado I+D`
- `raw_status_label`, por ejemplo el estado literal del workflow Jira
- `result_source`: `jira`, `manual`, `legacy_import`
- `reason_comment`
- `snapshot_json`
- `snapshot_checksum`
- `created_at`, `updated_at`

### `design_trial_items`

Composicion congelada del ensayo cuando no baste con reutilizar `snapshot_json`.

Campos orientativos:

- `trial_id`
- `raw_material_id`
- `raw_material_name`
- `raw_material_code`
- `percentage`
- `unit`
- `order_index`

En la primera fase se puede evitar esta tabla si el snapshot de formula ya contiene lineas suficientes y se indexan los campos necesarios para busqueda.

### `design_verifications`

Representa la seccion de verificacion de F10-02.

Campos orientativos:

- `design_project_id`
- `final_product_name`
- `ok_trial_id`
- `ok_formula_label`
- `richness_json`
- `verified_at`
- `verified_by`
- `verification_result`
- `comments`

### `product_validation_records`

Representa F10-03. Se crea cuando un proyecto tiene una formula `LIBERADO` o cuando se decide preparar validacion final.

Campos orientativos:

- `id`
- `tenant_id`
- `design_project_id`
- `released_trial_id`
- `validation_status`: `draft`, `in_review`, `validated`, `blocked`, `cancelled`
- `validated_at`
- `responsible_user_id`
- `final_description`
- `aspect`
- `color`
- `specification_json`
- `created_at`, `updated_at`

### `product_validation_checks`

Una fila por area/aspecto de la matriz F10-03.

Campos orientativos:

- `validation_record_id`
- `area`
- `aspect`
- `verdict`: `OK`, `NOK`, `not_applicable`, `pending`
- `comments`
- `responsible_user_id`
- `signed_at`
- `evidence_artifact_id`

La firma puede empezar como aprobacion interna con usuario, fecha y rol. Si el auditor exige firma manuscrita o certificado, se documentara como fase posterior.

### `design_dossiers`

Agrupa evidencias del expediente.

Campos orientativos:

- `design_project_id`
- `status`: `draft`, `complete`, `archived`
- `storage_location`
- `created_at`

### `design_dossier_items`

Elemento documental o evidencia vinculada al dossier:

- formulas de prototipos,
- pruebas de estabilidad,
- analisis de composicion,
- ensayos agronomicos,
- informe de validacion,
- ficha tecnica,
- ficha de datos de seguridad,
- etiqueta,
- especificacion de producto,
- evidencias SAP,
- exports F10.

Campos orientativos:

- `dossier_id`
- `item_type`
- `required_policy`: `required`, `optional`, `department_criteria`
- `area_owner`
- `artifact_id`
- `external_url`
- `status`
- `comments`

### `iso_audit_events`

Registro de cambios relevantes ISO. Puede reutilizar o ampliar `integration_events`, pero conviene distinguir eventos de auditoria de eventos de integracion.

Eventos tipicos:

- creacion de proyecto ISO,
- aceptacion/denegacion,
- cambio de planificacion,
- ensayo agregado,
- resultado Jira sincronizado,
- formula liberada,
- F10-03 creado,
- validacion de area,
- dossier cerrado,
- export generado.

## Relacion con el modelo existente

Ya existen piezas que conviene reutilizar:

- `formulas`
- `formula_items`
- `formula_calculation_results`
- `jira_connections`
- `formula_review_requests`
- `formula_review_artifacts`
- `integration_events`

La ampliacion debe ser aditiva:

- No cambiar el contrato actual de envio a Jira.
- No cambiar el significado actual de `FormulaReviewRequest`.
- Anadir una capa ISO que observe o vincule revisiones Jira a `design_trials`.
- Extender snapshots con `snapshot_type` nuevo cuando haga falta, por ejemplo `iso_design_trial_v1`.
- Generar nuevos artefactos con `artifact_type` especifico:
  - `iso_f10_01_xlsx`
  - `iso_f10_02_xlsx`
  - `iso_f10_03_xlsx`
  - `iso_design_dossier_zip`
  - `iso_audit_report_pdf`

## Workflow recomendado

### Punto de entrada ideal

Crear un modulo principal llamado `Disenos ISO` o `Expedientes ISO`.

Primera pantalla:

- lista de solicitudes/proyectos por ano,
- filtros por estado, responsable, tipo de producto, pais, resultado tecnico,
- columnas equivalentes a F10-01,
- acceso directo a tres vistas: `F10-01`, `F10-02`, `F10-03`.

Desde una formula existente, la ficha de formula debe permitir:

- asociar la formula a un expediente ISO existente,
- crear un expediente ISO desde la formula si no existe,
- enviar version a Jira como ensayo del expediente.

Desde Jira sync, si llega una issue/formula no asociada, la app debe dejarla en una bandeja de vinculacion pendiente.

### Flujo alto nivel

1. Crear o importar solicitud.
   - Entrada manual, importacion F10-01 legacy o futuro F10-04.
   - Se genera/valida `iso_request_number`.
   - Se completa la vista F10-01.

2. Evaluar viabilidad y planificar.
   - Responsable, necesidad, pais, volumen, envase, estimacion y fecha prevista.
   - Decision `Aceptado` o `Denegado`.
   - Si se deniega, se exige motivo y el expediente puede cerrarse sin F10-02/F10-03.

3. Desarrollar formulas y ensayos.
   - El formulador crea formulas/versiones en FormulIA.
   - Cada version enviada a Jira crea o actualiza un `design_trial`.
   - El snapshot conserva composicion, calculos, parametros, warnings y comentario.

4. Sincronizar resultado tecnico desde Jira.
   - La app lee estado, fecha, nombre de issue y comentarios relevantes.
   - El resultado tecnico se normaliza a `NOK`, `OK_NO_LIBERADO` o `LIBERADO`.
   - F10-02 muestra todos los ensayos ordenados por fecha/numero.

5. Verificar diseno.
   - Si hay `OK_NO_LIBERADO`, puede registrarse como formula OK no liberada.
   - Si hay `LIBERADO`, se propone como formula definitiva.
   - Se completa la seccion de verificacion de F10-02.

6. Validar producto.
   - Para `LIBERADO`, la app abre o crea F10-03.
   - La especificacion final se precarga desde calculos de formula y datos del producto.
   - Cada area valida su aspecto con `OK`, `NOK` o comentario.

7. Cerrar expediente y dossier.
   - Se recopilan evidencias.
   - Se actualiza F10-01 con finalizacion real, horas, problemas y comentarios.
   - Se genera vista auditor y, si hace falta, exports.

## Mapeo automatico de datos

### Datos que puede aportar FormulIA

- Formula, version y lineas de composicion.
- Materias primas, codigos, porcentajes.
- Precio/coste y moneda.
- Parametros calculados y riquezas.
- Warnings de validacion y compatibilidad.
- Usuario responsable y timestamps de creacion/calculo/envio.
- Snapshots y checksums.

### Datos que puede aportar Jira

- ID de ensayo, por ejemplo `ID-176`.
- Nombre del ticket/formula ensayada.
- Fecha del ticket o de transicion.
- Estado literal de laboratorio/calidad.
- Resultado tecnico normalizado.
- Comentarios o motivo de rechazo.
- URL de evidencia.

### Datos que probablemente seguiran siendo manuales al principio

- Necesidad comercial completa.
- Volumen y precio de competencia.
- Volumen propuesto.
- Envase.
- Pais destino si no viene de solicitud/Jira.
- Motivo formal de denegacion.
- Problemas y comentarios finales.
- Aspecto/color si no se modelan como parametros de formula.
- Firmas/aprobaciones por area.
- Documentacion externa del dossier.

## Reglas de estado

### Resultado de ensayo F10-02

Regla inicial:

- Jira `Resultado I+D = Liberado` -> `LIBERADO`.
- Jira `Resultado I+D = OK No Liberado` -> `OK_NO_LIBERADO`.
- Jira `Resultado I+D = NOK tecnico` -> `NOK`.
- Jira `Resultado I+D = Iterado` -> `ITERADO`.
- Jira `Resultado I+D = Abandonado` -> `ABANDONADO`.
- Jira `Resultado I+D = Cancelado administrativo` -> `CANCELADO`.
- Jira `status = FINALIZADO` sin `Resultado I+D` -> conservar estado operativo pero marcar `technical_result = pending_result`.
- Valores no mapeados -> conservar literal en `raw_result_label` y marcar `technical_result = pending_mapping`.

La normalizacion debe ser configurable por tenant, pero el origen principal del veredicto tecnico ISO debe ser `customfield_11024` (`Resultado I+D`), no el estado del workflow.

### Creacion de F10-03

Regla inicial:

- F10-03 se puede preparar en borrador cuando hay formula OK.
- F10-03 solo se considera valido/publicable cuando el ensayo origen esta `LIBERADO` y todas las validaciones requeridas estan `OK` o justificadas como no aplicables.

### Cierre F10-01

Regla inicial:

- Si proyecto denegado: requiere `rejection_reason`.
- Si proyecto cancelado/interrumpido: requiere comentario de interrupcion.
- Si proyecto validado: requiere F10-02 con formula definitiva y F10-03 validado.

## Vistas de producto

### Vista F10-01

Tabla anual de solicitudes/proyectos con columnas equivalentes al formato. Debe permitir abrir cada expediente y ver trazabilidad.

Acciones:

- crear solicitud,
- importar legacy,
- editar campos manuales,
- marcar aceptado/denegado,
- cerrar proyecto,
- exportar F10-01 por ano.

### Vista F10-02

Ficha del proyecto con:

- datos de partida,
- ensayos/formulas probadas,
- composicion de cada ensayo,
- resultado tecnico,
- motivo/comentario,
- verificacion de formula definitiva.

Acciones:

- vincular formula,
- enviar ensayo a Jira,
- sincronizar Jira,
- marcar resultado manual con permiso especial,
- generar export F10-02 del expediente.

### Vista F10-03

Ficha de validacion final con:

- formula OK,
- especificacion final,
- parametros/riquezas,
- matriz de validacion por areas,
- evidencias y comentarios.

Acciones:

- crear desde formula liberada,
- precargar especificacion,
- solicitar/aplicar validaciones por area,
- generar export F10-03,
- cerrar validacion.

### Vista auditor

Vista de solo lectura, orientada a evidencias:

- selector de ano,
- selector de formato F10-01/F10-02/F10-03,
- filtros por solicitud, producto, responsable, estado,
- indicador de completitud,
- historial de cambios,
- enlaces a Jira, formulas, artefactos y dossier.

## Importacion legacy

Conviene crear importadores especificos para poblar datos historicos desde los tres ficheros.

### F10-01

Importa filas anuales a `design_projects`.

Claves candidatas:

- `year`
- `No Solicitud`
- `ID` si existe
- `NOMBRE`

Debe registrar `source_file`, `source_sheet`, `source_row` para trazabilidad.

### F10-02

Importa cada hoja como proyecto o como enriquecimiento de proyecto ya existente.

Claves candidatas:

- nombre de hoja,
- `No Solicitud`,
- `Producto`,
- IDs de ensayo.

Debe crear `design_trials` y snapshots de composicion.

### F10-03

Importa cada hoja como `product_validation_record`.

Debe vincular con proyecto por `No Solicitud` y con ensayo liberado por `Formula OK` si existe.

## Plan de implementacion por fases

### Fase 0 - Alineacion funcional

- Confirmar que F10-04 queda fuera del primer alcance o definir como entrada futura.
- Confirmar estados reales de Jira y equivalencias ISO.
- Confirmar si `OK NO LIBERADO` debe permitir F10-03 borrador o no.
- Confirmar requisitos de firma/aprobacion por area.
- Confirmar si el auditor aceptara vista app como registro principal.

### Fase 1 - Modelo y API base

- Anadir tablas ISO de forma aditiva.
- Crear endpoints `/api/v1/iso/design-projects`.
- Crear endpoints de ensayos, verificaciones y validaciones.
- Reutilizar tenant context, roles y patrones de TestClient existentes.
- Exponer read models preparados para las tres vistas.

### Fase 2 - Vinculacion con formulas y Jira

- Permitir asociar formula a expediente ISO.
- Hacer explicita la metadata Jira por formula: issue type, `ProyectoID` y `Tipo producto`.
- Cargar metadata Jira por issue type antes de enviar y validar campos obligatorios (`ProyectoID` y `Tipo producto` para `Prototipo` y `Calidad`).
- Eliminar dependencias funcionales del fallback `default_issue_type`; debe ser solo compatibilidad del conector.
- Al crear `FormulaReviewRequest`, permitir pasar `design_project_id`.
- Crear o actualizar `design_trial` desde el snapshot Jira.
- Al sincronizar Jira, leer `status` para fase operativa y `Resultado I+D` para resultado tecnico del ensayo.
- Registrar evento ISO en cada cambio relevante.

### Fase 3 - Importadores legacy

- Importar F10-01 historico.
- Importar F10-02 historico con ensayos y composiciones.
- Importar F10-03 historico con especificaciones y validaciones.
- Crear reporte de filas no importadas o campos ambiguos.

### Fase 4 - UI del modulo ISO

- Crear panel/listado de `Disenos ISO`.
- Implementar vista F10-01.
- Implementar ficha F10-02.
- Implementar ficha F10-03.
- Anadir acceso desde Formula Builder/Jira Review Panel.

### Fase 5 - Export y dossier

- Generar export F10-01 por ano.
- Generar export F10-02 por expediente.
- Generar export F10-03 por expediente.
- Generar paquete dossier con evidencias.
- Guardar artefactos con checksum y metadata.

### Fase 6 - Endurecimiento auditoria

- Inmutabilidad de snapshots publicados.
- Historial de cambios visible.
- Control de permisos por rol/area.
- Retencion minima y soft delete.
- Pruebas de no fuga entre tenants.

## Testing y validacion

### Backend

- Unit tests de normalizacion de `Resultado I+D` a resultado tecnico ISO.
- Unit tests para demostrar que `FINALIZADO` sin `Resultado I+D` no equivale a `LIBERADO`.
- Tests de metadata Jira por issue type: `Prototipo` y `Calidad` exigen `ProyectoID` y `Tipo producto`; `PoC` no debe heredar esos obligatorios de forma ciega.
- Unit tests de reglas de cierre F10-01/F10-03.
- Tests de API tenant-scoped para proyectos, ensayos y validaciones.
- Tests con FakeJiraClient reutilizando el patron de `test_jira_integration.py`.
- Tests de idempotencia: no duplicar ensayo al resincronizar la misma issue.
- Tests de artefactos: checksum, tipo, descarga y contenido minimo.
- Tests de importacion legacy con fixtures reducidas derivadas de F10-01/F10-02/F10-03.

### Frontend

- Typecheck del workspace web.
- Tests manuales guiados al principio para validar ergonomia.
- Cuando el flujo este estable, Playwright para:
  - crear expediente ISO,
  - aceptar solicitud,
  - vincular formula,
  - preparar envio Jira,
  - simular sincronizacion a `NOK`,
  - verificar aparicion en F10-02,
  - simular `LIBERADO`,
  - crear F10-03,
  - completar validaciones,
  - abrir vista auditor.

### Validacion de exports

- Abrir los XLSX generados con parser y comprobar hojas/cabeceras.
- Comparar columnas contra los formatos legacy.
- Confirmar que F10-02 contiene todos los ensayos y comentarios.
- Confirmar que F10-03 solo se publica cuando cumplen reglas.
- Validar que el mismo snapshot genera el mismo checksum si no cambia.

### Validacion con auditor

- Preparar un expediente piloto real.
- Mostrar vista app F10-01/F10-02/F10-03.
- Exportar los tres formatos como respaldo.
- Registrar feedback del auditor como decisiones en este documento o en `docs/05-delivery/decisions.md`.

## Riesgos y decisiones abiertas

- Falta revisar F10-04 como entrada formal de solicitud.
- Hay que decidir si las firmas de F10-03 pueden ser aprobaciones internas con usuario/fecha.
- Hay que confirmar si todas las areas aplican a todos los tipos de producto.
- Hay que confirmar variante de microorganismos desde el procedimiento.
- Hay que definir quien puede corregir manualmente resultados traidos de Jira.
- Hay que decidir si Jira comments se importan completos o solo el ultimo comentario/motivo.
- Hay que decidir si el dossier vive dentro de FormulIA, OneDrive o ambos.
- Hay que definir integracion futura con SAP para alta de articulo y documentos post-validacion.

## Criterios de exito del primer MVP

- El usuario puede crear o importar una solicitud F10-01.
- El usuario puede vincular formulas y revisiones Jira al expediente.
- La app muestra F10-02 con ensayos, composiciones, fechas, resultados y comentarios.
- Una formula `LIBERADO` permite crear F10-03.
- F10-03 permite registrar validaciones por area.
- La vista auditor distingue claramente F10-01, F10-02 y F10-03.
- Los exports son opcionales, trazables y reproducibles.
- No se rompe el flujo actual de Formula Builder ni Jira Review.

## Objetivo documental activo

Este documento queda como objetivo documental vivo para bajar el modulo ISO desde concepto hasta implementacion. La regla de trabajo es:

- No implementar codigo hasta que se pida explicitamente.
- Si se detecta una decision bloqueante, documentarla como decision pendiente.
- Si se detecta una configuracion necesaria y no destructiva, dejarla registrada.
- Cada capa debe poder convertirse despues en una rama y una serie de commits pequenos.
- El plan debe proteger el flujo actual de formulas, calculos, importacion Excel y Jira.

Done documental:

- Alcance ISO y equivalencia F10-01/F10-02/F10-03 definidos.
- Modelo de datos propuesto con entidades, campos, restricciones y relaciones.
- Contratos API iniciales definidos.
- Workflow UI definido por pantallas y acciones.
- Integracion Jira definida, incluyendo mapeo de estados.
- Plan de importacion legacy definido.
- Plan de export y dossier definido.
- Testing backend, frontend, import/export y Playwright definido.
- Plan de ramas y commits definido.
- Riesgos, rollback y validacion con auditor definidos.

## Capas de detalle

| Capa | Nombre | Resultado esperado | Estado |
| --- | --- | --- | --- |
| L0 | Contexto ISO | Formatos, P-10 y obligaciones auditables | Hecho |
| L1 | Dominio | Entidades, eventos, estados y reglas | Hecho |
| L2 | Datos | Tablas, indices, invariantes y migracion aditiva | Implementado inicial |
| L3 | API | Endpoints, payloads, permisos y errores | Implementado inicial |
| L4 | Servicios | Reglas ISO, snapshot, Jira bridge, import/export | Implementado inicial |
| L5 | UI | Pantallas, estados, acciones y navegacion | Implementado inicial |
| L6 | Legacy | Importadores F10-01/F10-02/F10-03 y reporte de ambiguos | Planificado |
| L7 | Exports | XLSX por formato, dossier y checksums | Implementado inicial |
| L8 | Testing | Unit, API, fixtures, Playwright y validacion visual | En curso |
| L9 | Delivery | Ramas, commits, rollout y rollback | Planificado |
| L10 | Auditoria | Demo piloto, evidencias y feedback auditor | Planificado |

## Configuracion Jira del tenant piloto

Revision local y remota realizada el 2026-06-13, sin exponer secretos:

- Tenant remoto piloto: `atlantica-agricola`.
- Jira base URL: `https://atlanticaagricola.atlassian.net`.
- Auth: `api_token` con credencial configurada.
- Proyecto Jira destino actual: `ID`.
- Issue type por formula: `Prototipo`, `PoC`, `Calidad` o `Muestra`.
- Issue type fallback tecnico de conexion: `Prototipo`, solo porque el conector actual exige un valor valido para testear.
- Ultimo test registrado: `ready_for_client`.
- Mensaje de test: conectado como Ivan Navarro; proyecto `ID` listo.
- `field_mapping_json`: configurado con obligatorios reales de Jira.
- `status_mapping_json`: alineado con estados reales del workflow `ID`, conservando alias legacy.

Mapeo de campos cargado:

- `jira_project_id -> customfield_10658` (`ProyectoID`).
- `jira_product_type_option -> customfield_10856` (`Tipo producto`).
- `technical_result -> customfield_11024` (`Resultado I+D`, para sincronizacion ISO posterior).

Estados reales del workflow `ID`:

- `PENDIENTE -> sent_to_jira`
- `PRE-CALIDAD -> in_lab_review`
- `LABORATORIO -> in_lab_review`
- `CALIDAD -> in_lab_review`
- `PENDIENTE DECISION -> in_lab_review`
- `FINALIZADO -> closed`

Alias legacy conservados:

- `Pendiente`
- `Pendiente de revision`
- `Pre-calidad`
- `Calidad`
- `En revision laboratorio`
- `Cambios solicitados`
- `OK`
- `OK NO LIBERADO`
- `NOK`
- `LIBERADO`
- `CANCELADO`
- `Aprobada`
- `Rechazada`
- `En pruebas`
- `Validada`
- `Cerrada`

Decision:

- No crear otra conexion Jira.
- No tocar credenciales.
- No tratar el issue type fallback como decision funcional.
- Para implementacion, el bridge ISO debe leer `status_mapping_json` para fase operativa y `customfield_11024` para veredicto tecnico.

Pendiente antes de activar envios ISO reales:

- Mejorar UI para elegir issue type desde metadata real en lugar de datalist estatica.
- Decidir si `PoC` sin solicitud debe crear expediente ISO o quedar fuera de F10-01/F10-03 por defecto.

## L2 - Plan de datos detallado

### Entidades obligatorias MVP

`design_projects`

- Proposito: fila F10-01 y raiz del expediente.
- Clave unica recomendada: `(tenant_id, year, iso_request_number)`.
- Indices:
  - `(tenant_id, year)`
  - `(tenant_id, lifecycle_status)`
  - `(tenant_id, product_name)`
  - `(tenant_id, responsible_user_id)`
- Invariantes:
  - `year` debe derivarse de `iso_request_number` si el formato es `N/YYYY`.
  - `accepted_status = rejected` exige `rejection_reason`.
  - `lifecycle_status = validated` exige F10-03 validado.
  - No borrar fisicamente; usar estado o soft delete posterior.

`design_trials`

- Proposito: ensayo/formula dentro de F10-02.
- Claves unicas recomendadas:
  - `(tenant_id, design_project_id, trial_code)` cuando `trial_code` existe.
  - `(tenant_id, review_request_id)` cuando nace de Jira review.
- Indices:
  - `(tenant_id, design_project_id, trial_at)`
  - `(tenant_id, technical_result)`
  - `(tenant_id, jira_issue_key)`
- Invariantes:
  - Si `review_request_id` existe, el snapshot del trial debe coincidir con `FormulaReviewRequest.snapshot_json` o guardar checksum.
  - `technical_result = LIBERADO` debe ser unico por proyecto salvo decision explicita de reemplazo.

`design_verifications`

- Proposito: seccion 3 de F10-02.
- Clave unica: `(tenant_id, design_project_id)`.
- Invariantes:
  - `ok_trial_id` debe pertenecer al mismo proyecto.
  - Si `verification_result = verified`, debe existir `verified_at`.

`product_validation_records`

- Proposito: cabecera y especificacion de F10-03.
- Clave unica: `(tenant_id, design_project_id)`.
- Invariantes:
  - `released_trial_id` debe apuntar a un trial `LIBERADO` para publicar.
  - `validation_status = validated` exige checks requeridos OK o justificados.

`product_validation_checks`

- Proposito: matriz de areas F10-03.
- Clave unica: `(tenant_id, validation_record_id, area, aspect)`.
- Invariantes:
  - `verdict = NOK` bloquea publicacion salvo override documentado.
  - `signed_at` requiere `responsible_user_id`.

`iso_audit_events`

- Proposito: auditoria funcional ISO.
- Indices:
  - `(tenant_id, entity_type, entity_id)`
  - `(tenant_id, event_type, created_at)`
- Invariantes:
  - Guardar `actor_user_id` cuando exista.
  - Guardar `before_json` y `after_json` solo para campos relevantes, no snapshots completos si duplican evidencia.

### Entidades fase 2+

`design_project_sources`

- Enlaza expediente con formula, Jira, import legacy, OneDrive o SAP.
- Debe permitir multiples origenes por proyecto.

`design_dossiers` y `design_dossier_items`

- Entran cuando ya exista validacion final o export.
- Permiten demostrar recopilacion documental sin obligar a resolver storage definitivo en MVP.

`design_trial_items`

- Se aplaza si `snapshot_json` cubre composicion y export.
- Se anade si la busqueda/reporting de composiciones por materia prima se vuelve necesaria.

### Estrategia de migracion

El repo aun usa `SQLModel.metadata.create_all` y compatibilidad manual en `database.py`.

Plan:

1. Anadir modelos SQLModel nuevos en `apps/api/src/formulia_api/models.py`.
2. Dejar que `init_db` cree tablas nuevas en entornos locales y tests.
3. Para columnas nuevas en tablas existentes, usar `_ensure_compatible_schema`.
4. Evitar cambios destructivos o renombrados en tablas existentes.
5. Si mas adelante se introduce Alembic, convertir esta slice a migracion formal.

## L3 - Contratos API

Todos los endpoints deben:

- requerir `X-Tenant-Id`,
- respetar roles actuales,
- devolver 404 para acceso cross-tenant,
- registrar eventos ISO para cambios auditables,
- no exponer credenciales Jira ni secretos.

### Proyectos ISO

```http
GET /api/v1/iso/design-projects?year=2025&status=in_design
POST /api/v1/iso/design-projects
GET /api/v1/iso/design-projects/{project_id}
PATCH /api/v1/iso/design-projects/{project_id}
POST /api/v1/iso/design-projects/{project_id}/accept
POST /api/v1/iso/design-projects/{project_id}/reject
POST /api/v1/iso/design-projects/{project_id}/close
```

Payload minimo `POST`:

```json
{
  "iso_request_number": "2/2025",
  "requester": "Nombre solicitante",
  "product_name": "FOLICAT ZNMO - MN",
  "product_type": "Nuevo",
  "need_summary": "Texto de datos de entrada",
  "destination_country": "Marruecos",
  "responsible_user_id": null
}
```

Errores clave:

- 409 si ya existe `(year, iso_request_number)`.
- 400 si se rechaza sin motivo.
- 409 si se cierra validado sin F10-03 validado.

### Ensayos F10-02

```http
GET /api/v1/iso/design-projects/{project_id}/trials
POST /api/v1/iso/design-projects/{project_id}/trials
PATCH /api/v1/iso/design-trials/{trial_id}
POST /api/v1/iso/design-trials/{trial_id}/sync-jira
POST /api/v1/iso/design-trials/{trial_id}/mark-result
```

Payload manual minimo:

```json
{
  "trial_code": "ID-176",
  "trial_name": "CALIDAD - FOLICAT Zn Mo Mn ORIGI F5.1",
  "trial_at": "2025-09-12T00:00:00Z",
  "technical_result": "LIBERADO",
  "reason_comment": "Resultado sincronizado o cargado desde legacy",
  "items": [
    {"raw_material_name": "AGUA", "percentage": 46.88}
  ]
}
```

### Bridge con FormulaReviewRequest

```http
POST /api/v1/formulas/{formula_id}/reviews/jira
```

Extender payload existente de forma compatible:

```json
{
  "notes": "Revision de estabilidad",
  "design_project_id": "uuid-opcional",
  "iso_trial_number": 2,
  "iso_reason_comment": "Ensayo desde revision Jira"
}
```

Compatibilidad:

- Si no se manda `design_project_id`, el comportamiento actual no cambia.
- Si se manda, se crea `design_trial` en estado pendiente y se enlaza con `review_request_id`.
- En el snapshot queda `iso.design_project_id` y `iso.trial_intent=f10_02_trial`.
- Al enviar o sincronizar Jira, el mismo trial se actualiza sin duplicarse.

### Verificacion F10-02

```http
GET /api/v1/iso/design-projects/{project_id}/verification
PUT /api/v1/iso/design-projects/{project_id}/verification
POST /api/v1/iso/design-projects/{project_id}/verification/promote-trial/{trial_id}
```

Regla:

- `promote-trial` solo permite `OK_NO_LIBERADO` o `LIBERADO`.

### Validacion F10-03

```http
GET /api/v1/iso/design-projects/{project_id}/validation
POST /api/v1/iso/design-projects/{project_id}/validation
PATCH /api/v1/iso/product-validations/{validation_id}
PUT /api/v1/iso/product-validations/{validation_id}/checks
POST /api/v1/iso/product-validations/{validation_id}/publish
```

Regla:

- `POST /validation` exige que `released_trial_id` pertenezca al expediente y tenga `technical_result = LIBERADO`.
- La matriz inicial sale de `iso_tenant_settings.config_json.f10_03.validation_matrix`.
- `PUT /checks` reemplaza la matriz normalizada con resultados `pending`, `ok`, `nok` o `not_applicable`.
- `publish` exige que el ensayo origen siga `LIBERADO` y que todos los checks requeridos esten `OK`.
- Al publicar, la validacion pasa a `published`, se rellenan `validation_at`/`published_at` y el proyecto F10-01 queda en `lifecycle_status = validated`.

### Importacion legacy

```http
POST /api/v1/iso/imports/f10-01/preview
POST /api/v1/iso/imports/f10-01/apply
POST /api/v1/iso/imports/f10-02/preview
POST /api/v1/iso/imports/f10-02/apply
POST /api/v1/iso/imports/f10-03/preview
POST /api/v1/iso/imports/f10-03/apply
```

Regla implementada:

- `preview` no escribe datos.
- `preview` puede recibir `sheet_name`; si no se informa, procesa todas las hojas.
- `apply` es idempotente por tenant/proyecto/ensayo y devuelve creados, actualizados, omitidos y ambiguos.
- Las filas ambiguas no se aplican automaticamente.
- F10-03 solo publica validacion si la matriz importada queda con checks requeridos `OK`; si no, queda como borrador.

### Exports y dossier

```http
POST /api/v1/iso/exports/f10-01?year=2025
POST /api/v1/iso/design-projects/{project_id}/exports/f10-02
POST /api/v1/iso/design-projects/{project_id}/exports/f10-03
POST /api/v1/iso/design-projects/{project_id}/dossier
GET /api/v1/iso/artifacts/{artifact_id}/download
```

Regla implementada:

- Cada export crea un `iso_record_artifacts` con `artifact_type`, `file_name`, `content_type`, `checksum_sha256`, `size_bytes`, `created_by` y contenido binario.
- `F10-01` exporta los proyectos del tenant, filtrados por ano si se informa `year`.
- `F10-02` exporta cabecera del expediente y ensayos vinculados, incluyendo Jira, estado Jira literal, `Resultado I+D` literal y resultado tecnico normalizado.
- `F10-03` exige que exista validacion F10-03 para el expediente y exporta resumen, matriz de validaciones y especificacion.
- `dossier` genera un ZIP por expediente con F10-01, F10-02, F10-03 si existe, y `metadata.json` con checksums.
- `download` es tenant-scoped; un tenant no puede descargar artefactos de otro.

## L4 - Servicios backend

Crear modulos pequenos:

- `iso_design_records.py`: rutas FastAPI y orquestacion.
- `iso_design_service.py`: reglas de negocio de proyectos, ensayos y validacion.
- `iso_jira_bridge.py`: enlace entre `FormulaReviewRequest` y `design_trials`.
- `iso_state.py`: enums, normalizacion de estados y guards.
- `iso_legacy_import.py`: parseadores F10-01/F10-02/F10-03.
- `iso_excel.py`: builders de XLSX para F10 y dossier.
- `iso_audit.py`: helper para `iso_audit_events`.

Regla de dependencia:

- Jira conoce FormulaReviewRequest.
- ISO puede observar Jira.
- Jira no debe depender de ISO salvo un hook opcional y compatible.

Patron recomendado:

1. Crear funcion `maybe_link_review_to_design_trial(...)`. Implementado como `upsert_iso_design_trial_from_review(...)` + wrapper Jira.
2. Llamarla al final de `create_formula_jira_review_request`. Implementado.
3. Si `design_project_id` no viene, retorna `None`. Implementado.
4. Si viene, crea trial enlazado. Implementado.
5. En `sync`, llamar a `sync_design_trial_from_review(...)` despues de actualizar `review_status`. Implementado como upsert posterior a la lectura de Jira.

## L5 - UI

### Archivos frontend implementados

- `apps/web/app/iso-design-model.ts`
- `apps/web/app/iso-design-api.ts`
- `apps/web/app/iso-design-state.ts`
- `apps/web/app/iso-design-actions.ts`
- `apps/web/app/iso-design-panel.tsx`
- `apps/web/app/workspace-iso-design-panel-props.ts`

### Archivos frontend pendientes

- `apps/web/app/iso-design-f10-01-view.tsx`
- `apps/web/app/iso-design-f10-02-view.tsx`
- `apps/web/app/iso-design-f10-03-view.tsx`
- `apps/web/app/iso-design-auditor-view.tsx`

### Archivos extendidos

- `workspace-home-panels.ts`: nuevo panel principal.
- `workspace-panels.tsx`: render de panel ISO.
- `workspace-home-controller.ts`: wiring de estado/acciones.
- `workspace-settings-actions.ts`: reset del estado ISO al cambiar/crear workspace.
- `app-shell.tsx`: vista y navegacion `ISO 9001`.
- `formula-builder-ui/jira-review-panel.tsx`: selector de expediente ISO antes de enviar a Jira y marcador de review vinculada.
- `formula-builder-ui/formula-composition-step.tsx`: props ISO hacia panel Jira.
- `formula-builder-panel-props.ts`: wiring de proyectos ISO hacia composicion.
- `jira-review-api.ts` y `jira-review-actions.ts`: payload opcional `design_project_id` y refresh ISO tras send/sync.
- `formula-model.ts`: snapshot `iso` en reviews Jira.

### Archivos a extender en la siguiente capa

- `workspace-capability-model.ts`: nueva capability explicita `isoDesignRecords` si se quiere ocultar el panel por feature flag aparte de `enabled`.

### Navegacion recomendada

Primera version:

- El modulo ISO vive como panel dentro de la workspace existente. Implementado como vista `ISO 9001`.
- No crear landing page ni ruta independiente.
- F10-01 es la entrada principal. Implementado formulario/listado inicial.
- F10-02 se muestra como seccion de ensayos por expediente. Implementado listado inicial desde reviews Jira.
- F10-03 se abre desde una fila de proyecto cuando exista validacion final. Pendiente.

Estados UI:

- `empty`: no hay proyectos ISO. Implementado.
- `loading`: carga inicial via status global.
- `ready`: listado F10-01. Implementado.
- `project_open`: ficha con tabs F10-02/F10-03/Auditoria. Pendiente; F10-02 esta visible como seccion inicial.
- `import_preview`: preview legacy antes de aplicar. Implementado como seccion del panel ISO.
- `error`: mensaje recuperable.

Controles:

- Filtros por ano, estado, responsable, producto y resultado.
- Tabs F10-01/F10-02/F10-03/Auditoria dentro del expediente.
- Botones iconicos para exportar, sincronizar Jira, abrir Jira, descargar evidencia.

## L6 - Importacion legacy detallada

Estado implementado inicial:

- Parser `apps/api/src/formulia_api/iso_legacy_import.py`.
- Endpoints preview/apply para F10-01/F10-02/F10-03.
- UI de importacion historica dentro de `ISO 9001`.
- Tests en `apps/api/tests/test_iso_design.py` con workbooks reducidos generados en memoria.
- En F10-01 se permite que un mismo `No Solicitud` aparezca en varias filas si se distingue por `project_code`/ID o producto; esto cubre los duplicados observados en 2025.

### F10-01

Algoritmo:

1. Abrir workbook.
2. Por cada hoja anual, detectar cabecera de fila 1.
3. Normalizar cabeceras por alias:
   - `No Solicitud` -> `iso_request_number`
   - `NOMBRE` -> `product_name`
   - `NOM_COMERCIAL` -> `commercial_name`
   - `TIPO DE PRODUCTO` -> `product_type`
4. Parsear fechas y numeros de forma tolerante.
5. Construir clave `(year, iso_request_number)`.
6. Si existe, preparar update preview.
7. Si falta clave, marcar ambiguous.
8. Al aplicar, crear/actualizar y registrar source row.

### F10-02

Algoritmo:

1. Cada hoja representa un proyecto.
2. Leer cabecera A3/B3, A4/B4, A5/B5.
3. Crear/enlazar `design_project` por `iso_request_number`.
4. Leer datos de partida entre seccion 1 y seccion 2.
5. Detectar bloques `Ensayo N`.
6. Para cada bloque, leer fila `ID, Nombre, Fecha, Resultado`.
7. Leer composicion desde `Materia prima, % peso` hasta `Motivo / comentario`.
8. Crear `design_trial` y snapshot legacy.
9. Si aparece verificacion, crear `design_verification`.

### F10-03

Algoritmo:

1. Cada hoja representa validacion de un proyecto.
2. Leer cabecera de solicitud, responsable, producto y formula OK.
3. Leer descripcion/aspecto/color.
4. Leer parametros desde `Parametro, Valor`.
5. Leer validaciones desde `Area, Aspecto a validar, OK/NOK, Comentarios`.
6. Vincular con `design_project` por solicitud.
7. Vincular con trial liberado por `Formula OK` si se puede.
8. Si no se puede, guardar `released_trial_label` y marcar `needs_linking`.

## L7 - Exports y dossier

Estado implementado inicial: endpoints y UI generan artefactos `iso_record_artifacts` descargables. El objetivo de esta capa es evidencia estructurada y trazable; no intenta todavia replicar pixel a pixel los Excel legacy.

### F10-01 export

- Implementado: `POST /api/v1/iso/exports/f10-01?year=YYYY`.
- Un workbook por ejecucion, filtrado por ano si se informa.
- Columnas equivalentes operativas: solicitud, ano, ProyectoID, solicitante, producto, necesidad, tipo, pais/envase, aceptacion, ciclo, fechas, horas y comentarios.
- Guardar artifact con checksum.
- Pendiente: columnas ocultas internas y ajuste fino contra plantilla legacy si se exige.

### F10-02 export

- Implementado: `POST /api/v1/iso/design-projects/{project_id}/exports/f10-02`.
- Un workbook por expediente con:
  - cabecera,
  - datos de partida,
  - tabla de ensayos,
  - Jira,
  - estado Jira literal,
  - `Resultado I+D` literal,
  - resultado tecnico normalizado.
- No depender de formulas Excel para auditoria; valores ya calculados deben salir congelados.
- Pendiente: bloques de composicion completos desde snapshot por ensayo.

### F10-03 export

- Implementado: `POST /api/v1/iso/design-projects/{project_id}/exports/f10-03`.
- Un workbook por expediente con resumen, parametros desde `specification_json` y matriz de validacion desde checks.
- Pendiente: evidencias/firma interna si se decide que F10-03 debe capturar aprobaciones por area.

### Dossier

- Implementado: `POST /api/v1/iso/design-projects/{project_id}/dossier`.
- Genera ZIP con F10-01/F10-02/F10-03 si existe y `metadata.json` con checksums.
- El ZIP se guarda como artifact descargable tenant-scoped.

Fase posterior:

- Integrar documentos externos reales y storage definitivo.

## L8 - Testing plan

### Backend unit

Implementado:

- `apps/api/tests/test_iso_design.py`
  - settings ISO por tenant,
  - CRUD F10-01,
  - F10-02 desde Jira,
  - resultados tecnicos configurables,
  - F10-03 y publicacion,
  - exports/dossier,
  - importacion legacy F10-01/F10-02/F10-03.

Crear:

- `apps/api/tests/test_iso_state.py`
- `apps/api/tests/test_iso_design_service.py`
- `apps/api/tests/test_iso_excel.py`

Casos:

- Normalizacion de `Resultado I+D`:
  - `NOK tecnico -> NOK`
  - `OK No Liberado -> OK_NO_LIBERADO`
  - `Liberado -> LIBERADO`
  - `Iterado -> ITERADO`
  - resultado no mapeado -> `pending_mapping`
- `FINALIZADO` sin `Resultado I+D` queda `pending_result`, no `LIBERADO`.
- Rechazo F10-01 sin motivo falla.
- Publicar F10-03 sin checks falla.
- Publicar F10-03 con trial no liberado falla.
- Re-sincronizar mismo review no duplica trial.

### Backend API

Crear:

- `apps/api/tests/test_iso_design_records.py`
- `apps/api/tests/test_iso_jira_bridge.py`
- `apps/api/tests/test_iso_exports.py`

Casos:

- CRUD proyecto ISO tenant-scoped.
- Cross-tenant devuelve 404.
- Formulator puede crear ensayo; viewer no puede mutar.
- Enviar review Jira con `design_project_id` crea trial.
- Sync Jira actualiza trial result.
- Export crea artifact descargable.

### Legacy fixtures

No usar los ficheros reales completos en tests automatizados. Crear fixtures reducidas:

- `apps/api/tests/fixtures/iso/f10_01_sample.xlsx`
- `apps/api/tests/fixtures/iso/f10_02_sample.xlsx`
- `apps/api/tests/fixtures/iso/f10_03_sample.xlsx`

Cada fixture debe tener:

- 1 proyecto denegado,
- 1 proyecto en diseno con NOK,
- 1 proyecto con OK NO LIBERADO,
- 1 proyecto LIBERADO con F10-03.

### Frontend checks

Ejecutado en esta iteracion:

```bash
npm run typecheck --workspace apps/web
```

Comandos:

```bash
npm run check:web-api-boundaries
npm --workspace apps/web run typecheck
npm --workspace apps/web run build
```

Casos manuales antes de Playwright:

- abrir panel ISO,
- crear proyecto,
- editar F10-01,
- vincular formula,
- ver F10-02,
- crear F10-03,
- exportar.

### Playwright

Crear cuando UI este estable:

- `apps/web/tests/iso-design-records.spec.ts` si se introduce carpeta de tests web.

Historias:

1. `iso_project_intake`
   - Crear expediente ISO.
   - Ver fila en F10-01.
   - Marcar aceptado.

2. `iso_jira_trial_sync`
   - Asociar formula.
   - Preparar review Jira con fake backend o fixture.
   - Simular resultado `NOK`.
   - Ver ensayo en F10-02.

3. `iso_released_validation`
   - Simular `LIBERADO`.
   - Crear F10-03.
   - Completar checks.
   - Publicar validacion.

4. `iso_auditor_view`
   - Abrir vista auditor.
   - Filtrar por ano.
   - Confirmar F10-01/F10-02/F10-03 visibles.

## L9 - Plan de ramas y commits

No crear ramas ni commits ahora. Este es el plan futuro.

### Estrategia

- Mantener ramas pequenas con prefijo `codex/`.
- Cada rama debe tener tests propios antes de PR.
- Evitar mezclar backend, UI y export en una sola rama grande.
- Hacer merge secuencial para que cada capa apoye la siguiente.

### Ramas propuestas

| Orden | Rama | Objetivo | Base | Merge gate |
| --- | --- | --- | --- | --- |
| 1 | `codex/iso-9001-data-model` | Modelos, schemas y reglas de estado | `main` | pytest backend core |
| 2 | `codex/iso-9001-api` | Endpoints CRUD y read models F10 | rama 1 mergeada | pytest API |
| 3 | `codex/iso-9001-jira-bridge` | Vincular Jira reviews con trials ISO | rama 2 mergeada | pytest Jira bridge |
| 4 | `codex/iso-9001-legacy-import` | Preview/apply F10 legacy | rama 3 mergeada | pytest import fixtures |
| 5 | `codex/iso-9001-exports` | XLSX F10 y artifact download | rama 4 mergeada | pytest exports |
| 6 | `codex/iso-9001-ui-foundation` | Panel ISO y F10-01/F10-02/F10-03 read UI | rama 5 mergeada | npm check |
| 7 | `codex/iso-9001-ui-actions` | Mutaciones UI, Jira link y validation checks | rama 6 mergeada | npm check + smoke |
| 8 | `codex/iso-9001-e2e-hardening` | Playwright, auditor view, polish y docs | rama 7 mergeada | full checks |

### Commits propuestos por rama

#### `codex/iso-9001-data-model`

1. `docs: refine ISO 9001 implementation objective`
   - Solo si se decide commitear este documento.
2. `api: add ISO design record models`
   - `models.py`
   - nuevas tablas.
3. `api: add ISO design schemas and status rules`
   - `schemas.py`
   - `iso_state.py`
4. `test: cover ISO status normalization and guards`
   - `test_iso_state.py`
   - `test_iso_design_service.py`

#### `codex/iso-9001-api`

1. `api: add ISO design project service`
   - `iso_design_service.py`
2. `api: expose ISO design project routes`
   - `iso_design_records.py`
   - registro en `main.py`
3. `api: add F10 read models`
   - serializers para F10-01/F10-02/F10-03.
4. `test: cover ISO design record API`
   - tenant scope,
   - permissions,
   - validation errors.

#### `codex/iso-9001-jira-bridge`

1. `api: accept optional ISO project on Jira review creation`
   - payload compatible.
2. `api: create design trial from Jira review snapshot`
   - hook no-op si no hay `design_project_id`.
3. `api: sync design trial result from Jira status`
   - status literal y technical result.
4. `test: cover ISO Jira bridge idempotency`
   - fake Jira,
   - no duplicate trials,
   - mapping missing.

#### `codex/iso-9001-legacy-import`

1. `api: add ISO legacy import parser helpers`
   - F10-01/F10-02/F10-03 parse.
2. `api: add ISO import preview endpoints`
   - no writes.
3. `api: add ISO import apply endpoints`
   - created/updated/ambiguous report.
4. `test: cover ISO legacy import fixtures`
   - small xlsx fixtures.

#### `codex/iso-9001-exports`

1. `api: add ISO Excel builders`
   - F10-01, F10-02, F10-03.
2. `api: persist ISO export artifacts`
   - artifact type, checksum, download.
3. `api: add ISO dossier package`
   - minimal ZIP.
4. `test: cover ISO exports and dossier`
   - workbook headers,
   - artifact download,
   - checksum.

#### `codex/iso-9001-ui-foundation`

1. `web: add ISO design model and API client`
2. `web: add ISO state and actions`
3. `web: add ISO panel shell`
4. `web: render F10 views from read models`
5. `test: typecheck ISO UI foundation`

#### `codex/iso-9001-ui-actions`

1. `web: add ISO project create and edit actions`
2. `web: add trial and verification actions`
3. `web: add F10-03 validation checks UI`
4. `web: connect Jira review panel to ISO projects`
5. `test: typecheck ISO UI actions`

#### `codex/iso-9001-e2e-hardening`

1. `test: add ISO Playwright smoke flow`
2. `web: polish ISO auditor view`
3. `docs: add ISO auditor validation script`
4. `test: run full project checks`

## L10 - Rollout, rollback y validacion

### Configuracion tenant Atlantica

Script idempotente:

```bash
python scripts/configure_iso_tenant.py
```

Para forzar una base concreta:

```bash
python scripts/configure_iso_tenant.py --database-url sqlite:///./formulia.db
```

Para Supabase cuando el pooler de sesion `5432` este saturado:

```bash
python scripts/configure_iso_tenant.py --use-transaction-pooler
```

Hace:

- asegura tenant `atlantica-agricola` activo,
- asegura membresia local owner de desarrollo si hace falta,
- activa `iso_tenant_settings.enabled`,
- carga configuracion ISO Atlantica,
- asegura una conexion Jira activa a proyecto `ID`,
- mantiene/usa `FORMULIA_JIRA_API_TOKEN` si esta disponible,
- no imprime secretos.

Nota 2026-06-13: el script se ejecuto correctamente contra `formulia.db` y contra Postgres/Supabase usando el transaction pooler `6543`. PostgREST no sirve como alternativa hasta exponer el schema `formulia`.

### Rollout local

1. Ejecutar migracion aditiva en SQLite local.
2. Importar una muestra pequena de F10-01/F10-02/F10-03.
3. Vincular una formula existente a expediente ISO.
4. Enviar/sincronizar una review Jira controlada.
5. Generar F10-02 y F10-03 export.
6. Validar vista auditor.

### Rollout piloto real

1. Crear tenant o usar tenant Atlantica configurado.
2. Confirmar Jira metadata y issue type final.
3. Importar historico 2025 en preview.
4. Resolver ambiguos.
5. Aplicar import.
6. Seleccionar 2 expedientes:
   - uno sin liberar,
   - uno liberado con F10-03.
7. Hacer demo con auditor interno.

### Rollback

- Backend:
  - tablas nuevas son aditivas; rollback funcional = ocultar capability y no usar endpoints.
  - no borrar tablas en rollback local salvo decision explicita.
- Frontend:
  - capability flag puede ocultar panel ISO.
- Jira:
  - mapping de estados es aditivo; si da problemas, restaurar JSON anterior desde backup o quitar claves anadidas.
- Imports:
  - cada apply debe guardar `import_id`; rollback logico = marcar registros importados como archived/cancelled.

## Definition of done por slice

### Data model

- Tablas creadas en SQLite test.
- No rompe tests existentes.
- Estados ISO normalizados.
- Tenant scope en todos los modelos.

### API

- CRUD probado.
- Errores 400/403/404/409 definidos.
- Eventos ISO registrados.
- No hay leakage cross-tenant.

### Jira bridge

- Flujo existente sin `design_project_id` sigue igual.
- Flujo con `design_project_id` crea trial.
- Sync actualiza trial sin duplicar.
- Mapping incompleto queda visible como pendiente.

### Legacy import

- Preview claro.
- Apply idempotente.
- Ambiguos no se aplican automaticamente.
- Sources guardan fichero, hoja y fila.

### UI

- F10-01/F10-02/F10-03 se distinguen visualmente.
- Usuario puede navegar sin perder contexto de expediente.
- No hay overlap ni texto cortado en viewport desktop habitual.
- Acciones destructivas requieren confirmacion.

### Exports

- Cabeceras equivalentes a legacy.
- XLSX abre correctamente.
- Checksums persistidos.
- Dossier descargable.

### Auditor

- Vista readonly.
- Evidencias enlazadas.
- Historial de cambios visible.
- Export opcional disponible.

## Script de demo auditor

Preparar un caso piloto:

1. Abrir `Disenos ISO`.
2. Filtrar ano `2025`.
3. Mostrar F10-01 como tabla de viabilidad.
4. Abrir expediente `2/2025 FOLICAT ZNMO - MN` o equivalente.
5. Mostrar datos de partida.
6. Mostrar ensayos F10-02:
   - formulas NOK,
   - formulas OK NO LIBERADO,
   - formula LIBERADO.
7. Abrir enlace Jira de un ensayo.
8. Volver a la app y mostrar snapshot/composicion.
9. Abrir F10-03.
10. Mostrar especificacion final y matriz de validacion.
11. Mostrar auditoria de cambios y artefactos.
12. Descargar exports solo si el auditor lo pide.

## Preguntas que quedan antes de escribir codigo

- Confirmar issue type Jira definitivo para el flujo ISO.
- Confirmar si F10-04 entra como import/entrada en el MVP o queda fuera.
- Confirmar si `OK NO LIBERADO` puede abrir F10-03 en borrador.
- Confirmar si la firma de area sera usuario/fecha/rol o se necesita firma formal.
- Confirmar si microorganismos se modela como plantilla separada desde MVP.
- Confirmar si OneDrive sera storage canonico del dossier o solo referencia externa.
- Confirmar si el auditor quiere exports con formato casi identico al Excel legacy o le basta vista app + export estructurado.
