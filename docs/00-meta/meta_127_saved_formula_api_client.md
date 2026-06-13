# Meta 127 - Saved formula API client

## Meta

Separar llamadas HTTP puras del hook de acciones de formulas guardadas.

## Cambios

- Se crea `saved-formula-api.ts` con helpers para listar, calcular, persistir, cargar historial y cargar revisiones/artefactos.
- `saved-formula-actions.ts` conserva validaciones, mensajes y actualizaciones de estado.
- El flujo de guardado sigue usando `buildManualFormulaSavePayload` y los mismos endpoints.

## Revision

- Sin cambio funcional esperado.
- La logica React queda menos mezclada con detalles de rutas HTTP.
- El cliente tipa explicitamente el mapa de artefactos por review.
