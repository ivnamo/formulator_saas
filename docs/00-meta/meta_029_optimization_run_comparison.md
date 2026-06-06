# META-029 - Optimization run comparison

## Decision

La vigesimonovena meta implementable de FormulIA Cloud es comparar dos runs historicos de optimizacion desde la biblioteca.

El historial ya permite inspeccionar un run individual. Este corte permite elegir un baseline y un candidate para ver diferencias de estado, objetivo, precio, numero de lineas, candidatos, bounds, mensajes e issues. La comparacion usa solo snapshots historicos de `optimization_runs` y no recalcula ni muta formulas.

## Alcance incluido

- Rama `codex/optimization-run-comparison`.
- Controles para seleccionar baseline y candidate entre runs historicos.
- Resumen comparativo de estado, objetivo, precio y lineas.
- Delta de precio cuando ambos runs tienen calculo.
- Diferencias de candidatos.
- Diferencias de bounds por materia y parametro.
- Mensajes e issues de cada run visibles en contexto comparativo.
- Estado vacio cuando falta una seleccion.
- Browser smoke del flujo principal.
- Quality/refactor gate antes de cerrar rama.

## Fuera de alcance

- Comparacion de formulas guardadas.
- Recalculo de runs historicos.
- Filtros o busqueda avanzada.
- Persistir comparaciones.
- Exportacion del comparativo.
- Integracion IA sobre explicaciones.

## Criterios de done

1. El usuario puede seleccionar dos runs historicos.
2. La comparacion usa `request_json` y `result_json`, no recalcula.
3. El delta de precio se muestra solo cuando ambos runs tienen calculo.
4. Las diferencias de candidatos y bounds son legibles.
5. Runs `success`, `invalid` e `infeasible` se pueden comparar sin romper la UI.
6. Tests/checks pasan.
7. Browser smoke verifica render e interaccion.
8. Quality/refactor gate queda aplicado.
9. Worktree limpio y rama subida.

## Testing minimo

- `python -m pytest`.
- `npm run check`.
- Browser smoke:
  1. crear workspace,
  2. crear parametro y materias,
  3. ejecutar dos optimizaciones con bounds distintos,
  4. seleccionar baseline y candidate,
  5. verificar delta, candidatos y bounds,
  6. comprobar viewport movil sin overflow.
- `npm audit --audit-level=moderate`.
- `rg` de referencias prohibidas o naming heredado.
- `git diff --check`.

## Riesgos

- No convertir la biblioteca en una pantalla demasiado densa.
- No duplicar reglas del solver en frontend.
- Mantener comparacion basada en snapshots historicos.
- Evitar una abstraccion prematura de tablas comparativas antes de tener mas casos.

## Siguiente accion

Anadir estado de baseline/candidate, helpers de comparacion y un panel compacto debajo del detalle de run.
