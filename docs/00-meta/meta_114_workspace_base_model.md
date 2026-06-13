# Meta 114 - Workspace base model

## Meta

Separar los tipos base del workspace del barrel global para reducir acoplamiento entre dominios.

## Cambios

- `workspace-base-model.ts` contiene `Tenant`, `Parameter`, `FormulaLine`, lecturas base y `Status`.
- `workspace-state-model.ts` contiene `WorkspaceState` y `emptyWorkspace`.
- `workspace-model.ts` queda como barrel de compatibilidad con reexports.
- `raw-material-model.ts`, `formula-read-model.ts`, `workspace-core-state.ts` y `workspace-settings-model.ts` importan desde los modelos especificos.

## Revision

- Sin cambio funcional esperado.
- Se rompe la dependencia circular suave entre raw materials y el barrel global.
- La app puede migrar consumidores restantes desde `workspace-model.ts` de forma incremental.
