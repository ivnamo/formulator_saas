# Meta 137 - Formula calculation API client

## Meta

Separar el calculo ad hoc de formulas del hook de revision de drafts.

## Cambios

- Se crea `formula-calculation-api.ts` con `calculateAdHocFormula`.
- `draft-review-actions.ts` conserva validaciones, aplicacion de drafts, cambios de estado y mensajes.
- El payload de `/api/v1/formulas/calculate` se mantiene sin cambio funcional.

## Revision

- El calculo ad hoc queda disponible para otros flujos sin duplicar rutas HTTP.
- El hook de draft review queda menos acoplado al contrato API.
- La transformacion de `FormulaLine` a payload se centraliza junto a la llamada HTTP.
