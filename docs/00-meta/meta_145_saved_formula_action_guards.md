# Meta 145 - Saved formula action guards

## Meta

Separar las reglas puras de guardado y comparacion de formulas guardadas para que `useSavedFormulaActions` se centre en efectos, API y actualizacion de estado.

## Cambios

- Se crea `saved-formula-action-guards.ts`.
- Se extrae la validacion de guardado manual a `getFormulaSaveBlocker`.
- Se extrae la resolucion de formulas comparables a `resolveSavedFormulaComparisonPair`.
- `useSavedFormulaActions` conserva los efectos laterales: mensajes, apertura de secciones, llamadas API y refresco de libreria.

## Revision

- Sin cambio funcional esperado.
- Las reglas quedan aisladas y reutilizables para futuras pruebas unitarias.
- El bloqueo por formula desbalanceada mantiene la apertura de formula y calculo en el hook, porque es comportamiento de UI.
