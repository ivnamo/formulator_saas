# Meta 098 - Comparison constraint helpers

## Meta

Separar la evaluacion de constraints y compliance de la comparacion base/candidata de formulas guardadas.

## Cambios

- Se crea `workspace-comparison-constraints.ts`.
- Se mueven tipos y helpers de constraints, explicaciones, evaluaciones y resumen de compliance.
- `workspace-comparison.ts` conserva comparaciones de borrador/formulas y reexporta la API de constraints para no cambiar imports existentes.

## Revision

- Alcance sin cambio funcional.
- Se mantiene la logica de maximos, minimos, valores faltantes y liderazgo de compliance.
- Este corte hace mas facil revisar reglas de comparacion sin mezclar formulas, lineas y constraints en un unico modulo.
