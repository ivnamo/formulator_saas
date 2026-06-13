# Meta 118 - Raw material domain imports

## Meta

Reducir el acoplamiento del dominio de materias primas contra `workspace-model.ts`.

## Cambios

- `raw-material-actions.ts` importa tipos y helpers desde `raw-material-model.ts`, `formula-model.ts`, `workspace-state-model.ts` y `workspace-utils.ts`.
- `raw-material-state.ts` usa `MaterialForm` directamente desde `raw-material-model.ts`.
- `raw-materials-panel.tsx` usa `RawMaterial`, `MaterialForm` y `Parameter` desde modelos de dominio/base.

## Revision

- Sin cambio funcional esperado.
- El flujo de materias primas queda mas aislado para seguir refactorizando catalogo, detalle y creacion.
- `workspace-model.ts` mantiene compatibilidad para dominios pendientes.
