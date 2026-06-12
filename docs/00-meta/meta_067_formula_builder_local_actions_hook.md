# Meta 067 - Formula builder local actions hook

## Objetivo

Reducir la responsabilidad de `apps/web/app/page.tsx` moviendo acciones locales del Formula Builder a un hook dedicado.

## Cambios

- Nuevo `useFormulaBuilderLocalActions` para actualizar los datos basicos de formula, cargar mas materias del catalogo, cambiar la vista de parametros y limpiar la comparativa.
- Los callbacks del builder quedan memorizados con `useCallback`, manteniendo contratos estables para los pasos de UI.
- `page.tsx` conserva la orquestacion y deja de declarar manejadores locales junto al render principal.

## Verificacion prevista

- `npm run typecheck --workspace apps/web`
- `npm run check --workspace apps/web`
- Smoke test en navegador del Formula Builder sin errores nuevos de consola.
