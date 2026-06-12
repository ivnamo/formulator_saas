# Meta 106 - Formula domain model

## Meta

Separar los contratos persistidos de formula, calculo y revision del modelo global del workspace.

## Cambios

- Se crea `formula-model.ts`.
- Se mueven `FormulaRead`, `CalculationResult`, `FormulaCalculationHistory`, `FormulaReviewRequest` y `FormulaReviewArtifact`.
- `workspace-model.ts` mantiene reexports para no romper imports existentes.

## Revision

- Alcance sin cambio funcional.
- `FormulaLine` se mantiene en `workspace-model.ts` porque representa la linea editable local del workspace.
- El dominio de formulas queda listo para imports directos en futuros cortes.
