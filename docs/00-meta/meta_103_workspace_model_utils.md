# Meta 103 - Workspace model utils

## Meta

Separar utilidades puras del contrato central de modelo del workspace.

## Cambios

- Se crea `workspace-utils.ts`.
- Se mueven `parseOptionalNumber`, `normalizeCode`, `slugify`, `makeLocalId` y `formatDateTime`.
- `workspace-model.ts` reexporta esas funciones para mantener estables los imports existentes.

## Revision

- Alcance sin cambio funcional.
- `workspace-model.ts` queda mas centrado en tipos y defaults de estado.
- Las utilidades quedan disponibles para futuros modulos sin arrastrar todo el modelo.
