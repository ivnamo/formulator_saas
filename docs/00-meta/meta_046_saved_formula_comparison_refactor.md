# META-046 - Refactor de comparacion de formulas guardadas

## Decision

La cuadragesima sexta meta implementable de FormulIA Cloud es separar el estado local, formateo y vista de comparacion de formulas guardadas del `Home`.

## Contexto

La pantalla `Formula library` seguia viviendo completa dentro de `page.tsx`: seleccion base/candidata, filtros de constraints, historial de calculo, lista de formulas guardadas y resultado comparativo. Eso hacia mas caro revisar cambios pequenos y mezclaba renderizado con orquestacion de API.

## Alcance de esta slice

- Crear `apps/web/app/saved-formula-comparison-state.ts`.
- Crear `apps/web/app/saved-formula-comparison-panel.tsx`.
- Crear `apps/web/app/formula-formatters.ts`.
- Mantener en `page.tsx` la llamada API para calcular formulas persistidas y la recarga de biblioteca.
- Mover al panel:
  - selectores base/candidata,
  - filtros de constraints,
  - lista de formulas,
  - historial de calculo,
  - resumen comparativo,
  - detalle de constraints, parametros y materias.

## Fuera de alcance

- Cambiar endpoints de formulas.
- Cambiar el modelo de comparacion.
- Cambiar estilos o layout funcional de la biblioteca.

## Criterios de done

1. `page.tsx` no contiene el JSX de `Formula library`.
2. Los formateadores compartidos viven fuera de `Home`.
3. Typecheck y build web pasan.
4. Browser local carga la vista `Formula library` sin errores de consola.
5. Worktree queda limpio tras commit y push.

## Siguiente accion recomendada

Extraer Jira/reviews o el bloque de configuracion, que son los siguientes dominios grandes que siguen dentro de `Home`.
