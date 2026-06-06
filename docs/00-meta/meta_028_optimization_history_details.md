# META-028 - Optimization history details

## Decision

La vigesimoctava meta implementable de FormulIA Cloud es mostrar un detalle compacto del run de optimizacion seleccionado.

La biblioteca ya muestra el historial de `optimization_runs`. Este corte permite inspeccionar el snapshot del run sin salir del workspace: objetivo, candidatos, bounds, mensajes, issues y resultado calculado cuando exista. La meta mejora trazabilidad y soporte tecnico antes de construir filtros, comparadores o IA sobre el historial.

## Alcance incluido

- Rama `codex/optimization-history-details`.
- Accion `Details` en cada run del historial.
- Panel compacto de detalle para el run seleccionado.
- Mostrar objetivo, estado, fecha, candidatos y counts principales.
- Mostrar bounds por materia y parametro desde `request_json`.
- Mostrar mensajes e issues desde `result_json`.
- Mostrar precio y lineas cuando el run tiene solucion.
- Estado vacio cuando no hay run seleccionado.
- Browser smoke del flujo principal.
- Quality/refactor gate antes de cerrar rama.

## Fuera de alcance

- Modal dedicado.
- Filtros o busqueda de runs.
- Comparacion entre runs.
- Re-ejecucion de un run.
- Edicion del request historico.
- Integracion IA sobre explicaciones.

## Criterios de done

1. Cada run del historial tiene una accion de detalle.
2. El detalle usa el snapshot historico, no recalcula.
3. Bounds de materias y parametros se muestran de forma legible.
4. Mensajes e issues son visibles cuando existen.
5. El detalle funciona para runs `success`, `invalid` e `infeasible`.
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
  3. ejecutar optimizador,
  4. abrir `Details`,
  5. verificar candidatos, bounds y resultado,
  6. comprobar viewport movil sin overflow.
- `npm audit --audit-level=moderate`.
- `rg` de referencias prohibidas o naming heredado.
- `git diff --check`.

## Riesgos

- No duplicar el modelo de datos en frontend.
- No ocultar problemas `invalid` o `infeasible`.
- No recalcular ni mutar snapshots historicos.
- Mantener la biblioteca escaneable.
- Evitar un modal antes de que la informacion lo justifique.

## Siguiente accion

Anadir estado de run seleccionado, helpers de resumen y un panel compacto de detalle en la biblioteca.
