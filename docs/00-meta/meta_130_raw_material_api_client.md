# Meta 130 - Raw material API client

## Meta

Separar llamadas HTTP puras del hook de acciones de materias primas.

## Cambios

- Se crea `raw-material-api.ts` con helpers para detalle, creacion, precio, valor de parametro y alias.
- `raw-material-actions.ts` conserva seleccion, comparacion, parsing de inputs y actualizaciones de estado.
- Los payloads siguen usando `raw-material-model.ts`.

## Revision

- Sin cambio funcional esperado.
- La logica React queda menos acoplada a rutas HTTP concretas.
- La creacion de materia prima mantiene el mismo orden: material, precio opcional, parametro opcional y actualizacion local.
