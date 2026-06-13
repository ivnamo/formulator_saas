# Meta 147 - Workspace capability model

## Meta

Separar las reglas puras de capacidades del workspace del envoltorio React para poder razonar y probar permisos sin depender de hooks.

## Cambios

- Se crea `workspace-capability-model.ts`.
- Se extraen `buildWorkspaceCapabilities` y `getActiveJiraConnection`.
- `useWorkspaceCapabilities` queda como envoltorio compatible del modelo puro.

## Revision

- Sin cambio funcional esperado.
- Las reglas de habilitacion de acciones quedan en un modulo de dominio.
- El hook publico mantiene el contrato actual usado por `WorkspaceHome`.
