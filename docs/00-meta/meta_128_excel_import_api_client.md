# Meta 128 - Excel import API client

## Meta

Separar llamadas HTTP puras del hook de acciones de importacion Excel.

## Cambios

- Se crea `excel-import-api.ts` con helpers para sheets, preview, save, creacion de materia prima y alias.
- `excel-import-actions.ts` conserva validaciones, mensajes y actualizaciones de estado.
- Los payloads de guardado siguen usando `buildImportedFormulaSavePayload`.

## Revision

- Sin cambio funcional esperado.
- El flujo de importacion queda menos acoplado a rutas HTTP concretas.
- El hook mantiene el orden de acciones y side effects existente.
