# Meta 115 - Formula Builder domain imports

## Meta

Reducir el acoplamiento del Formula Builder contra el barrel global `workspace-model.ts`.

## Cambios

- Los hooks y modelos de Formula Builder importan `WorkspaceState`, `CalculationResult`, `RawMaterial`, `FormulaLine` y utilidades desde sus modulos de dominio.
- Los componentes de `formula-builder-ui` dejan de depender de `workspace-model.ts`.
- `jira-review-panel.tsx` importa `formatDateTime` desde `workspace-utils.ts` y tipos Jira/formula desde sus modelos propios.

## Revision

- Sin cambio funcional esperado.
- Formula Builder queda mas aislado para futuros refactors de workspace, raw materials y formulas.
- El barrel global conserva compatibilidad para otros dominios pendientes de migrar.
