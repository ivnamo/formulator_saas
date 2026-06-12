# Meta 097 - Formula builder preview helpers

## Meta

Separar los calculos puros de preview local del Formula Builder del hook de estado derivado.

## Cambios

- Se crea `formula-builder-preview.ts`.
- Se mueven `buildLocalFormulaPreview`, `buildCalculationParameterRows`, balance porcentual y comparador de filas de parametro.
- `formula-builder-derived.ts` conserva el hook y las derivadas de catalogo/materiales, reexportando los tipos existentes para evitar churn en componentes.

## Revision

- Alcance sin cambio funcional.
- Los warnings, precio local, parametros visibles y filtro de positivos se mantienen iguales.
- Este corte deja los calculos deterministas del builder mas faciles de revisar y testear.
