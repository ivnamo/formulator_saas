# Meta 129 - Workspace settings API client

## Meta

Separar llamadas HTTP puras del hook de acciones de workspace/settings.

## Cambios

- Se crea `workspace-settings-api.ts` con helpers para tenants, parametros e invitaciones.
- `workspace-settings-actions.ts` conserva autenticacion, validaciones, resets y actualizaciones de estado.
- Los payloads siguen usando `workspace-settings-model.ts`.

## Revision

- Sin cambio funcional esperado.
- La carga inicial de tenant mantiene `Promise.all` para parametros e invitaciones.
- El hook queda menos acoplado a rutas HTTP concretas.
