# Meta 102 - Formula builder derived model

## Meta

Separar helpers puros derivados del formula builder del hook React que los orquesta.

## Cambios

- Se crea `formula-builder-derived-model.ts`.
- Se mueven tipos y helpers de catalogo, seleccion y busqueda de materias primas.
- `formula-builder-derived.ts` conserva el hook y reexporta los tipos publicos actuales.

## Revision

- Alcance sin cambio funcional.
- Los componentes UI pueden seguir importando `FormulaLineDetail` y `ParameterCatalogItem` desde el modulo existente.
- El hook queda centrado en `useMemo` y composicion de estado derivado.
