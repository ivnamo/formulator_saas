# Meta 134 - Optimizer zero parameter candidates

## Meta

Alinear el solver determinista con la regla `parametro ausente = 0`.

## Cambios

- Los candidatos del solver solo necesitan precio actual; ya no se excluyen por no tener todos los parametros requeridos.
- La cobertura bloqueante para minimos tecnicos positivos sigue exigiendo al menos un candidato con aporte positivo.
- Se anade test para una restriccion maxima donde una materia sin valor explicito del parametro resuelve con `0.0`.

## Revision

- Las materias carrier sin aporte tecnico pueden participar en formulas optimizadas.
- Un maximo tecnico puede satisfacerse con cero operativo.
- Un minimo tecnico positivo sin ningun aporte positivo sigue bloqueado con explicacion accionable.
