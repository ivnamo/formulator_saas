# Meta 132 - Jira review API client

## Meta

Separar llamadas HTTP puras del hook de acciones de revision Jira.

## Cambios

- Se crea `jira-review-api.ts` con helpers para crear review, enviar a Jira, generar Excel, descargar artefacto, reintentar adjunto y sincronizar estado.
- `jira-review-actions.ts` conserva validaciones, mensajes, actualizaciones de estado y side effects del navegador para la descarga.
- El mensaje de resultado Jira sigue centralizado en `jiraSendMessage`.

## Revision

- Sin cambio funcional esperado.
- El hook queda menos acoplado a rutas HTTP concretas.
- La descarga conserva la creacion del enlace temporal en el hook porque es comportamiento de UI/browser.
