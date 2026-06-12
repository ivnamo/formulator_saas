# Meta 110 - Raw material create helpers

## Meta

Reducir logica inline en la creacion de materias primas moviendo payloads y ajuste local al modelo de dominio.

## Cambios

- `raw-material-model.ts` incorpora builders para crear materia prima, precio y valor de parametro.
- Se extrae `withManualParameterValue` para aplicar el valor manual al material local.
- `raw-material-actions.ts` delega esos detalles y mantiene el flujo de accion.

## Revision

- Alcance sin cambio funcional.
- Se conserva el alta de precio en EUR/kg y el valor manual del parametro activo.
- El conteo de parametros positivos se recalcula en el helper de dominio.
