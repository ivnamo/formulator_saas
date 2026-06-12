# Meta 100 - Excel import model helpers

## Meta

Separar los tipos y helpers del importador Excel del archivo central de modelo del workspace.

## Cambios

- Se crea `excel-import-model.ts`.
- Se mueven `ExcelImportPreviewRow`, `ExcelImportPreview`, `ExcelImportSheets`, `withResolvedImportRow` y `aliasFromImportRow`.
- `workspace-model.ts` reexporta el contrato para mantener estables los imports existentes.

## Revision

- Alcance sin cambio funcional.
- Se conserva el calculo de filas resueltas/pendientes y la resolucion manual de filas.
- El modelo global del workspace queda menos mezclado con logica especifica de importacion Excel.
