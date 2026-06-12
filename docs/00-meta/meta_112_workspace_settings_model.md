# Meta 112 - Workspace settings model

## Meta

Separar defaults, tipos y payloads de configuracion del hook de acciones del workspace.

## Cambios

- Se crea `workspace-settings-model.ts`.
- Se mueven `InvitationForm`, `ParameterForm`, defaults de formulario y builders de payload.
- `mergeParameters` sale de `workspace-settings-actions.ts` para quedar como helper puro.

## Revision

- Alcance sin cambio funcional.
- El alta de workspace conserva slug con timestamp.
- Invitaciones y parametros conservan normalizacion y validacion previas.
