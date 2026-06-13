# Meta 131 - Jira connection API client

## Meta

Separar llamadas HTTP puras del hook de acciones de conexion Jira.

## Cambios

- Se crea `jira-connection-api.ts` con helpers para listar, guardar, probar, cargar metadata y obtener URL OAuth.
- `jira-connection-actions.ts` conserva validaciones, mensajes, mapping JSON y actualizaciones de estado.
- El guardado sigue usando `buildJiraConnectionPayload` desde `jira-connection-model.ts`.

## Revision

- Sin cambio funcional esperado.
- La carga de metadata Jira mantiene las tres peticiones en paralelo.
- El hook queda menos acoplado a rutas HTTP concretas.
