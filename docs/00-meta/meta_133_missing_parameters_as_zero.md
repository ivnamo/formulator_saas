# Meta 133 - Missing parameters as zero

## Meta

Cerrar en el core la regla de dominio: un parametro tecnico ausente equivale a `0`.

## Cambios

- `calculate_formula` inicializa los parametros requeridos con valor `0.0`.
- Ya no se genera warning `missing_parameter` cuando una materia prima no tiene fila explicita para un parametro requerido.
- Si alguna materia prima aporta ese parametro, la unidad se conserva al acumular el valor ponderado.
- El optimizador mantiene la explicacion `missing_parameter_coverage` cuando un minimo tecnico positivo no tiene ningun candidato con aporte positivo.
- Los tests del core fijan el caso ausente puro y el caso mixto con unidad.

## Revision

- Esto alinea el core con la UX y con el backfill de ceros explicitos.
- El warning de precio ausente y el warning de materia prima inexistente se mantienen.
- El enum `missing_parameter` queda por compatibilidad historica, pero el calculo oficial ya no lo emite para parametros requeridos ausentes.
- Para maximos tecnicos, un cero operativo sigue pudiendo satisfacer la restriccion.
