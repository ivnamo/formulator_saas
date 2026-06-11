# META-032 - Jira one-click review E2E

## Objetivo

Permitir que una formula completa de FormulIA se envie a Jira con un unico boton, creando un issue correcto en el proyecto configurado, adjuntando el Excel tecnico y guardando el vinculo resultante.

## Alcance

- Mantener la configuracion Jira como tarea de Admin/Owner:
  - URL Jira.
  - Metodo de autenticacion.
  - Email de autenticacion.
  - API token u OAuth.
  - Proyecto Jira destino.
  - Assignee por defecto.
- Guardar credenciales de API token en la conexion Jira y no devolverlas al frontend.
- Mantener `ProyectoID`, tipo de actividad Jira y tipo producto como datos de la formula.
- Validar la conexion Jira con llamada real de solo lectura antes de enviar:
  - usuario autenticado (`/myself`),
  - proyecto configurado,
  - tipo de issue disponible.
- Preparar snapshot, generar Excel y crear issue desde `Send to Jira`.
- Adjuntar Excel al issue.
- Guardar `jira_issue_key`, `jira_issue_url`, `jira_status`, `sent_at` y `last_sync_at`.

## Fuera de alcance

- Sincronizacion de estado posterior desde Jira.
- Webhooks Jira.
- Reenvio de nuevas versiones tras cambios solicitados.
- Enlaces `clones` / `relates to`.
- Cifrado real de credenciales en reposo.

## Criterios de aceptacion

- Un Admin puede guardar una conexion Jira y pulsar `Test` para validar una conexion real.
- El test falla con mensaje claro si el token, proyecto o tipo de issue no son validos.
- Una formula no puede enviarse sin `ProyectoID` cuando el mapping Jira del tenant lo exige.
- Los campos especificos del cliente se envian solo si estan declarados en `field_mapping`.
- Los tipos de actividad y producto de Jira son configurables y no deben restringirse en codigo a un unico proyecto.
- El formulador pulsa un unico boton `Send to Jira` desde la ficha de formula.
- El issue creado queda enlazado en FormulIA y el Excel queda adjunto.

## Estado

Parcialmente implementado:

- Configuracion Jira admin separada de datos de formula.
- API token persistido en `jira_connections.credential_json`.
- `ProyectoID`, actividad Jira y tipo producto movidos a la formula.
- `Test` de conexion hace llamada real de solo lectura a Jira.
- `Send to Jira` prepara review, genera Excel y envia issue en un unico flujo UI.
- Validaciones previas para campos Jira de formula.
- Auditoria basica de test/envio/reintento en `integration_events`.
- Reintento especifico del adjunto Excel cuando el envio queda en `partial_failure`.
- Prueba controlada real completada contra un Jira de validacion configurado:
  - issue creado: `ID-673`,
  - tipo: `PoC`,
  - adjunto Excel confirmado por API Jira,
  - enlace persistido en `formula_review_requests`.
- Tests backend y typecheck frontend actualizados.

Pendiente:

- Cifrado de credenciales.
