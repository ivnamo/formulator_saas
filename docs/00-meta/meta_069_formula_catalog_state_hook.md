# Meta 069 - Formula catalog state hook

## Objetivo

Sacar de `page.tsx` el cableado entre filtros del Formula Builder y el catalogo de materias primas.

## Cambios

- Nuevo `useFormulaBuilderCatalogState`, que envuelve `useRawMaterialCatalog`.
- El hook mergea materias cargadas en el workspace, propaga errores y resetea la paginacion del catalogo al cambiar filtros o vista de parametros.
- `useFormulaBuilderUiState` estabiliza sus action creators para que los hooks derivados puedan depender de setters sin provocar bucles de render.
- `page.tsx` deja de importar `mergeRawMaterials`, `RawMaterial` y `useEffect`.

## Verificacion prevista

- `npm run typecheck --workspace apps/web`
- `npm run check --workspace apps/web`
- Smoke test del catalogo: carga inicial, cambio de vista de parametros y boton de ver mas sin errores nuevos.
