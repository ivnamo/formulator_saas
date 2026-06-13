# Meta 139 - Raw material catalog API client

## Meta

Separar la llamada HTTP del catalogo de materias primas del hook del Formula Builder.

## Cambios

- `raw-material-api.ts` expone `fetchRawMaterialCatalog`.
- La construccion de `URLSearchParams` y filtros queda junto al cliente API.
- `formula-builder-catalog.ts` conserva estado local, loading, cancelacion y merge de materiales.

## Revision

- Sin cambio funcional esperado.
- El hook del catalogo queda centrado en ciclo de vida React.
- El cliente de materias primas centraliza detalle, creacion, precios, aliases y catalogo.
