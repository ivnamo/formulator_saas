# Meta 117 - Excel import domain imports

## Meta

Reducir el acoplamiento del flujo de importacion Excel contra `workspace-model.ts`.

## Cambios

- `excel-import-actions.ts` importa preview/sheets desde `excel-import-model.ts`.
- Tipos de formula se importan desde `formula-model.ts`.
- Materias primas y aliases se importan desde `raw-material-model.ts`.
- `WorkspaceState` se importa desde `workspace-state-model.ts`.
- Panel y estado de importacion usan el modelo propio de Excel import.

## Revision

- Sin cambio funcional esperado.
- El flujo de importacion queda mas aislado para evolucionar parsing, resolucion de filas y guardado.
- `workspace-model.ts` sigue actuando como compatibilidad para dominios pendientes.
