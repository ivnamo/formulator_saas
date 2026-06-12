# Meta 081 - Formula builder workspace component

## Objetivo

Sacar de `page.tsx` el JSX principal del Formula Builder.

## Cambios

- Nuevo `FormulaBuilderWorkspace` que compone los cuatro pasos del builder.
- Los step props pasan a tipos exportados para reutilizar contratos sin `any`.
- `page.tsx` conserva la orquestacion de estado/acciones, pero ya no renderiza directamente el bloque completo del builder.

## Verificacion prevista

- `npm run typecheck --workspace apps/web`
- `npm run check --workspace apps/web`
- Smoke test de carga del Formula Builder sin errores nuevos.
