# Meta 109 - Formula save payloads

## Meta

Centralizar los payloads de guardado de formulas para reducir logica inline en acciones.

## Cambios

- Se crea `formula-save-model.ts`.
- Se extraen `buildManualFormulaSavePayload` y `buildImportedFormulaSavePayload`.
- `saved-formula-actions.ts` y `excel-import-actions.ts` delegan la forma del JSON de guardado.

## Revision

- Alcance sin cambio funcional.
- El guardado manual conserva nombre por defecto, metadata Jira e indices de linea.
- El guardado desde Excel conserva nombre por tenant y filas resueltas del preview.
