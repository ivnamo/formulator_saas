# Meta 101 - Formula read workspace mapper

## Meta

Centralizar la conversion de una formula persistida al estado editable del workspace.

## Cambios

- Se crea `formula-read-model.ts`.
- Se extraen `toEditableFormulaMetadata` y `toEditableFormulaState`.
- `saved-formula-actions.ts` y `excel-import-actions.ts` dejan de duplicar defaults y mapeo de lineas.

## Revision

- Alcance sin cambio funcional.
- Los defaults de Jira salen de `emptyWorkspace` para mantener una sola fuente de verdad.
- La apertura de formulas y el guardado de importaciones siguen regenerando ids locales para cada linea editable.
