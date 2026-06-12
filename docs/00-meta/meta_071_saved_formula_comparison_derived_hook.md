# Meta 071 - Saved formula comparison derived hook

## Objetivo

Separar de `page.tsx` las derivadas de comparativa de formulas guardadas.

## Cambios

- Nuevo `useSavedFormulaComparisonDerivedState` para opciones de materias, constraints normalizados, evaluaciones, resumen de cumplimiento y filtro de issues.
- `page.tsx` deja de importar normalizadores y builders de constraints para esta vista.
- El estado editable de comparativa sigue en `useSavedFormulaComparisonState`.

## Verificacion prevista

- `npm run typecheck --workspace apps/web`
- `npm run check --workspace apps/web`
- Smoke test de la vista Biblioteca sin errores nuevos de consola.
