# Meta 111 - Jira model helpers

## Meta

Mover parsing y builders de Jira al modelo de dominio para adelgazar las acciones.

## Cambios

- `jira-connection-model.ts` incorpora `parseJiraJsonObject`, `jiraConnectionFormFromRead` y `buildJiraConnectionPayload`.
- `jira-connection-actions.ts` deja de definir helpers puros inline.
- El mapeo de field mapping sigue validando objetos JSON con valores string.

## Revision

- Alcance sin cambio funcional.
- Se conserva el payload de conexion, incluido `api_token` solo cuando procede.
- El hook de Jira queda centrado en orquestar peticiones y estado.
