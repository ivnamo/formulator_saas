# Meta 070 - Formula builder derived hook

## Objetivo

Reducir `page.tsx` moviendo el view-model derivado del Formula Builder a `formula-builder-derived.ts`.

## Cambios

- Nuevo `useFormulaBuilderDerivedState` para calcular materias por id, line details, catalogo de parametros, parametros visibles, preview local, filas de calculo, comparativa de borrador, total porcentual, balance y warnings.
- `page.tsx` deja de importar funciones puras de derivacion una a una y consume un unico hook de view-model.
- Las funciones puras siguen exportadas para mantener testabilidad y reutilizacion.

## Verificacion prevista

- `npm run typecheck --workspace apps/web`
- `npm run check --workspace apps/web`
- Smoke test del Formula Builder: carga de catalogo, cambio de parametros y calculo vivo visible sin errores nuevos.
