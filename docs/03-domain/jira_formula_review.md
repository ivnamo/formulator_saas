# Jira formula review

## Objetivo

Permitir que FormulIA Cloud actue como calculadora/formulador tecnico y Jira actue como sistema de ticketing del laboratorio.

El usuario prepara una formula en el SaaS, genera una version cerrada, envia esa version a Jira con un Excel adjunto y el laboratorio continua el flujo en el tablero: revisar, pedir cambios, aprobar, rechazar, probar o validar.

## Principio de diseno

FormulIA Cloud es el origen de verdad tecnico de la formula.

Jira no debe convertirse en la base de datos de formulacion ni en un Excel editable. Jira debe guardar el ticket de trabajo, el estado, los responsables, los comentarios y los metadatos necesarios para seguimiento.

La formula completa viaja como snapshot adjunto, normalmente Excel, y opcionalmente como JSON tecnico para trazabilidad o automatizaciones futuras.

## Alcance funcional

### Incluido

- Configurar una conexion Jira por tenant.
- Mapear proyecto, tipo de issue y campos Jira.
- Enviar una formula/version a Jira.
- Crear un snapshot inmutable de la version enviada.
- Generar y adjuntar un Excel de formulacion.
- Guardar el issue key y la URL del ticket.
- Mostrar el estado Jira dentro de la ficha de formula.
- Sincronizar cambios de estado desde Jira.
- Registrar auditoria de envios, errores y sincronizaciones.

### Fuera de alcance inicial

- Editar formulas desde Jira.
- Usar Jira como repositorio tecnico completo.
- Sincronizacion bidireccional de cada linea de formula.
- Automatizaciones complejas entre multiples tickets.
- Integracion con Confluence.
- App Atlassian Marketplace multi-cliente.

## Usuario objetivo

- Formulador: prepara la formula y la envia a revision.
- Laboratorio: revisa el ticket en Jira y decide si la formula avanza.
- Responsable tecnico: valida estados, comentarios y version aprobada.
- Admin/Owner: configura la conexion Jira y el mapeo de campos.

## Flujo principal

```text
Formula en FormulIA
  -> validar datos minimos
  -> crear snapshot/version enviada
  -> generar Excel
  -> crear issue en Jira
  -> adjuntar Excel
  -> guardar issue key/URL
  -> laboratorio revisa en tablero Jira
  -> FormulIA sincroniza estado
```

## Flujo detallado

1. El usuario abre una formula en FormulIA Cloud.
2. El sistema comprueba si la formula esta completa o si puede enviarse como borrador tecnico.
3. El usuario pulsa `Enviar a Jira`.
4. El SaaS muestra un modal de confirmacion con resumen:
   - formula,
   - version,
   - producto,
   - coste,
   - riqueza/parametros principales,
   - proyecto Jira destino,
   - tipo de ticket,
   - responsable inicial,
   - Excel que se va a adjuntar.
5. El usuario confirma el envio.
6. El backend crea un snapshot inmutable de la version enviada.
7. El backend genera un Excel desde ese snapshot.
8. El backend crea un issue en Jira.
9. El backend adjunta el Excel al issue.
10. El backend guarda el vinculo Jira en FormulIA.
11. La formula muestra un panel de revision con el estado actual.
12. El laboratorio trabaja el ticket en Jira.
13. FormulIA consulta Jira o recibe webhooks para actualizar el estado.

## Datos enviados a Jira

### Campos recomendados del issue

- Summary: `Revision formula - {formula_code} - {product_name}`
- Project key: configurable por tenant.
- Issue type: configurable, por ejemplo `Revision de formula`.
- Description: resumen tecnico y enlace al SaaS.
- Priority: configurable o elegida por usuario.
- Assignee: usuario/equipo de laboratorio.
- Labels: `formula`, familia de producto, tenant/proyecto si aplica.
- Formula code.
- Formula version.
- Product name.
- Product family.
- Customer/project, si aplica.
- Target crop/application, si aplica.
- Estimated cost.
- Target cost, si aplica.
- Main active content/riqueza, si aplica.
- Requested by.
- FormulIA formula URL.

### Description sugerida

La descripcion debe ser legible para laboratorio y estable aunque algunos campos custom fallen.

Contenido recomendado:

- Identificacion de formula y version.
- Objetivo de la revision.
- Resumen de composicion.
- Coste estimado.
- Parametros tecnicos principales.
- Observaciones del formulador.
- Link directo a la formula en FormulIA.
- Nota: el Excel adjunto es la version tecnica completa enviada.

## Excel adjunto

El Excel generado debe representar exactamente el snapshot enviado.

Hojas recomendadas:

- `Resumen`: formula, version, autor, fecha, producto, estado, coste total, notas.
- `Composicion`: materias primas, codigos, porcentajes, unidades, precios, coste ponderado.
- `Parametros`: riqueza/composicion tecnica calculada.
- `Validaciones`: suma total, warnings, incompatibilidades, datos incompletos.
- `Version`: identificadores internos, timestamp, origen y hash opcional del snapshot.

Reglas:

- No regenerar silenciosamente el Excel de una version enviada.
- Si la formula cambia, crear una nueva version y un nuevo Excel.
- Mantener el archivo asociado al envio para auditoria.
- El nombre del archivo debe incluir formula y version, por ejemplo `F-001_v3_revision_jira.xlsx`.

## Ciclo de vida

Estados internos recomendados en FormulIA:

- `draft`: formula editable.
- `ready_for_review`: lista para enviar.
- `sent_to_jira`: enviada a Jira.
- `in_lab_review`: laboratorio revisando.
- `changes_requested`: Jira pide cambios.
- `approved`: aprobada.
- `rejected`: rechazada.
- `in_testing`: en pruebas.
- `validated`: validada.
- `closed`: flujo cerrado.

Estados Jira sugeridos:

- `Pendiente de revision`
- `En revision laboratorio`
- `Cambios solicitados`
- `Aprobada`
- `Rechazada`
- `En pruebas`
- `Validada`
- `Cerrada`

El mapeo entre estados Jira y estados internos debe ser configurable por tenant.

## Versionado

Una version enviada a Jira debe tratarse como inmutable.

Si Jira marca `Cambios solicitados`, el SaaS debe permitir crear una nueva version basada en la anterior. Esa nueva version puede:

- actualizar el mismo issue con un nuevo Excel y comentario automatico, o
- crear un nuevo issue enlazado al anterior.

Decision inicial recomendada para MVP: reutilizar el mismo issue y adjuntar un nuevo Excel con comentario automatico. Es mas comodo para laboratorio y mantiene una conversacion unificada.

## Pantallas SaaS

### Ficha de formula

Elementos nuevos:

- Boton `Enviar a Jira`.
- Estado de revision Jira.
- Issue key, por ejemplo `LAB-238`.
- Link para abrir Jira.
- Ultima sincronizacion.
- Version enviada.
- Excel enviado.
- Accion `Sincronizar estado`.

### Modal de envio

Debe mostrar:

- Resumen de formula.
- Proyecto Jira destino.
- Tipo de issue.
- Campos obligatorios.
- Responsable/cola.
- Warnings antes del envio.
- Confirmacion final.

### Admin de integraciones

Debe permitir configurar:

- Base URL Jira.
- Metodo de autenticacion.
- Proyecto destino.
- Tipo de issue.
- Campos custom.
- Estados y su mapeo.
- Usuario/equipo por defecto.
- Politica de reenvio de versiones.
- Test de conexion.

## Modelo de datos propuesto

Tablas o entidades orientativas:

- `jira_connections`
  - `id`
  - `tenant_id`
  - `base_url`
  - `auth_type`
  - `encrypted_credentials`
  - `default_project_key`
  - `default_issue_type`
  - `is_active`

- `jira_field_mappings`
  - `id`
  - `tenant_id`
  - `connection_id`
  - `formulia_field`
  - `jira_field_id`
  - `transform`
  - `required`

- `formula_review_requests`
  - `id`
  - `tenant_id`
  - `formula_id`
  - `formula_version_id`
  - `snapshot_id`
  - `jira_issue_key`
  - `jira_issue_url`
  - `jira_status`
  - `review_status`
  - `sent_by_user_id`
  - `sent_at`
  - `last_sync_at`

- `formula_review_artifacts`
  - `id`
  - `tenant_id`
  - `review_request_id`
  - `artifact_type`
  - `file_name`
  - `storage_url`
  - `checksum`
  - `created_at`

- `integration_events`
  - `id`
  - `tenant_id`
  - `integration_type`
  - `entity_type`
  - `entity_id`
  - `event_type`
  - `status`
  - `payload_summary`
  - `error_message`
  - `created_at`

## API propuesta

Referencia base: Jira Cloud Platform REST API v3 (`https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/`).

Decision MVP:

- Usar `/rest/api/3` para Jira Cloud.
- Usar Atlassian Document Format en `description`.
- Usar OAuth 2.0 / 3LO como camino principal para Jira Cloud.
- App OAuth registrada en Atlassian Developer Console:
  - App ID: `262a5fcb-b418-46d1-9660-13c513ba3ec9`.
  - Client ID: `IKEbZY7kAaSaBxF6VilwuWJxI4w8Y7A4`.
  - Client Secret: solo local, nunca en chat, docs ni commits.
- Scopes esperados:
  - `read:issue:jira`, `read:issue-meta:jira`, `read:issue-details:jira` y relacionados para leer issues, campos, estados y proyectos.
  - `write:issue:jira`, `write:comment:jira` y `write:attachment:jira` para crear issues, comentarios y adjuntos.
  - `read:user:jira`, `read:comment:jira`, `read:attachment:jira`, `read:label:jira`, `read:priority:jira`.
  - `offline_access` para recibir refresh token y renovar el access token local.
- Callback local recomendado para pruebas: `http://localhost:3000/callback`.
- Llamar con OAuth a `https://api.atlassian.com/ex/jira/{cloudId}/rest/api/3/...`.
- Guardar `FORMULIA_JIRA_OAUTH_CLIENT_ID`, `FORMULIA_JIRA_OAUTH_CLIENT_SECRET`, `FORMULIA_JIRA_OAUTH_REDIRECT_URI`, `FORMULIA_JIRA_SITE_URL` y `FORMULIA_JIRA_CLOUD_ID` localmente.
- Intercambiar `code` en `POST /api/v1/integrations/jira/oauth/callback` y guardar `FORMULIA_JIRA_OAUTH_ACCESS_TOKEN`, `FORMULIA_JIRA_OAUTH_REFRESH_TOKEN` y expiracion en `.env.local`.
- Refrescar automaticamente el access token antes de enviar una revision a Jira si esta caducado.
- Mantener Basic Auth con email + API token; el token debe persistirse en la conexion Jira y `FORMULIA_JIRA_API_TOKEN` queda solo como fallback local/ad-hoc.
- Dejar persistencia cifrada multi-tenant para una fase posterior.

Configuracion Atlantica Agricola para pruebas con API token:

- Site Jira: `https://atlanticaagricola.atlassian.net`.
- Proyecto Jira: `ID` (`I+D+i - Desarrollo`).
- Informador fijo: Iván Navarro (`accountId`: `712020:d8d35c01-546b-498f-aa7f-dbe2c966820c`).
- Tipos de issue disponibles para el flujo:
  - `PoC`: solo requiere resumen, proyecto, tipo e informador.
  - `Prototipo`: requiere tambien `ProyectoID` y `Tipo producto`.
  - `Calidad`: requiere tambien `ProyectoID` y `Tipo producto`.
- `ProyectoID` (`customfield_10658`) no es el project key de Jira. Es un identificador funcional de formula o conjunto de formulas, por ejemplo `FLOWER`, y pertenece a la formula.
- `Tipo producto` (`customfield_10856`) es un selector Jira. Valores vistos en el tenant: `Nuevo`, `Mod A`, `Mod B`, `Mod C`.
- La conexion Jira queda como configuracion de admin: URL, email de autenticacion, API token/OAuth, proyecto Jira (`ID`), assignee por defecto y mapeos tecnicos. El API token de pruebas se guarda en la conexion (`jira_connections.credential_json`) y no se devuelve al frontend.
- El test de conexion debe hacer una llamada real de solo lectura a Jira para validar usuario autenticado, proyecto y tipo de issue disponible antes de enviar formulas.
- La integracion envia estos campos obligatorios al crear issues `Calidad` o `Prototipo`; para `PoC` no envia `ProyectoID` ni `Tipo producto`.

Diferencia operativa:

- API token personal: util para scripts rapidos y pruebas individuales; hereda permisos del usuario y no es el camino de produccion.
- App OAuth 2.0: usa scopes concretos, tokens revocables y es el camino adecuado para integraciones de equipo, bots e integraciones ERP/CRM.

```http
GET /integrations/jira
POST /integrations/jira
PATCH /integrations/jira/{id}
POST /integrations/jira/{id}/test
GET /integrations/jira/{id}/projects
GET /integrations/jira/{id}/issue-types
GET /integrations/jira/{id}/fields
```

```http
POST /formulas/{formula_id}/reviews/jira
GET /formulas/{formula_id}/reviews
GET /formula-reviews/{review_id}
POST /formula-reviews/{review_id}/artifacts/excel
GET /formula-review-artifacts/{artifact_id}/download
POST /formula-reviews/{review_id}/jira/send
POST /formula-reviews/{review_id}/jira/retry-attachment
POST /formula-reviews/{review_id}/sync
POST /formula-reviews/{review_id}/resend-version
```

Webhook opcional:

```http
POST /webhooks/jira
```

## Seguridad

- Cifrar credenciales/API tokens.
- No escribir secretos en logs.
- Respetar `tenant_id` en todas las consultas.
- Solo `Owner` o `Admin` puede configurar Jira.
- Solo roles autorizados pueden enviar formulas.
- Registrar auditoria de envio, reenvio, errores y cambios de estado.
- Validar que una conexion Jira pertenece al tenant activo.

## Errores y reintentos

Casos a manejar:

- Jira no disponible.
- Credenciales caducadas.
- Proyecto o issue type inexistente.
- Campo custom obligatorio sin valor.
- Error al adjuntar Excel tras crear issue.
- Timeout en sincronizacion.
- Duplicado de envio para la misma version.

Politica recomendada:

- Si falla crear issue, no marcar como enviado.
- Si se crea issue pero falla adjunto, guardar estado `partial_failure` y permitir reintento.
- Si existe ticket para esa version, avisar antes de reenviar.
- Todo error debe quedar en `integration_events`.

## Plan de implementacion

### Fase A - Preparacion funcional

- Definir campos minimos de formula para envio.
- Definir plantilla de Excel de snapshot.
- Definir estados internos de revision.
- Definir mapeo inicial Jira para el tenant piloto.

### Fase B - Configuracion Jira

- Crear pantalla admin de conexion Jira.
- Guardar credenciales cifradas.
- Probar conexion.
- Leer proyectos, issue types y fields desde Jira.
- Guardar mapeo de campos.

### Fase C - Snapshot y Excel

- Crear entidad de snapshot/version enviada.
- Generar Excel desde snapshot.
- Guardar artifact con checksum.
- Bloquear edicion directa de versiones enviadas.

### Fase D - Crear ticket

- Implementar servicio Jira.
- Crear issue con summary, description y campos mapeados.
- Adjuntar Excel.
- Guardar `jira_issue_key`, URL y estado inicial.
- Mostrar panel Jira en la ficha de formula.

### Fase E - Sincronizacion

- MVP: sincronizacion manual o al abrir la formula.
- Version posterior: webhook Jira para cambios de issue.
- Actualizar estado interno segun mapeo.
- Registrar comentarios o ultimo evento relevante si aplica.

### Fase F - Reenvio y cambios solicitados

- Permitir crear nueva version desde `changes_requested`.
- Adjuntar nuevo Excel al mismo issue.
- Crear comentario automatico en Jira indicando nueva version.
- Mantener historico de versiones enviadas.

## Criterios de aceptacion

- Un Admin puede configurar una conexion Jira y probarla.
- Un formulador autorizado puede enviar una formula valida a Jira.
- El ticket se crea en el proyecto y tablero esperados.
- El Excel de la version enviada queda adjunto al ticket.
- FormulIA guarda issue key, URL, estado y fecha de envio.
- La ficha de formula muestra el estado Jira.
- Si Jira cambia a `Cambios solicitados`, FormulIA permite crear una nueva version.
- No se puede sobrescribir silenciosamente una version ya enviada.
- Los errores de integracion son visibles y reintentables.

## Metricas de exito

- Tiempo desde formula lista hasta ticket creado.
- Porcentaje de envios correctos.
- Porcentaje de errores por mapeo de campos.
- Numero de formulas aprobadas/rechazadas desde Jira.
- Tiempo medio de revision de laboratorio.
- Numero de ciclos de cambios por formula.

## Preguntas abiertas

- Nombre exacto del proyecto Jira de laboratorio.
- Tipo de issue que se usara para formulas.
- Campos custom existentes en Jira.
- Estados reales del tablero actual.
- Si una nueva version debe actualizar el mismo issue o crear uno nuevo.
- Si laboratorio necesita ver solo Excel o tambien campos custom detallados.
- Si se requiere adjuntar PDF ademas de Excel.
- Si Jira debe devolver comentarios concretos al SaaS o solo estado.
