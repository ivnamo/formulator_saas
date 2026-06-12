# Meta 099 - Raw material model helpers

## Meta

Separar las transformaciones de materias primas del archivo central de modelo del workspace.

## Cambios

- Se crea `raw-material-model.ts`.
- Se mueven `toWorkspaceRawMaterial`, `toWorkspaceRawMaterialCatalogItem`, `mergeRawMaterials` y `withRawMaterialAlias`.
- `workspace-model.ts` reexporta esos helpers para mantener estable la API actual.

## Revision

- Alcance sin cambio funcional.
- Se conserva el backfill de parametros activos con valor `0` al convertir materias completas.
- Este corte reduce la mezcla entre tipos globales del workspace y logica especifica de materias primas.
