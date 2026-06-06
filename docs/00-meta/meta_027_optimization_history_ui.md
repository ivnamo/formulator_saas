# META-027 - Optimization history UI

## Decision

La vigesimoseptima meta implementable de FormulIA Cloud es mostrar en la app el historial de ejecuciones del optimizador.

La meta anterior persiste `optimization_runs`. Este corte hace visible ese historial en el workspace para que el usuario pueda auditar ejecuciones recientes, distinguir estados y recuperar una solucion exitosa como borrador editable sin guardar automaticamente una formula nueva.

## Alcance incluido

- Rama `codex/optimization-history-ui`.
- Cargar `GET /api/v1/optimizations/runs` para el tenant activo.
- Mostrar lista compacta de runs con fecha, estado, precio, lineas y enlace a formula guardada si existe.
- Refrescar el historial despues de ejecutar optimizaciones y guardar formulas optimizadas.
- Permitir cargar un run `success` en el editor como borrador.
- Estado vacio y estado no recuperable para runs `invalid` o `infeasible`.
- Actualizacion de documentacion frontend.
- Browser smoke del flujo principal.
- Quality/refactor gate antes de cerrar rama.

## Fuera de alcance

- Comparacion visual entre runs.
- Re-ejecucion de un run historico.
- Filtros avanzados.
- Vista detalle modal.
- Edicion del snapshot historico.
- Integracion IA sobre historial.

## Criterios de done

1. La biblioteca muestra historial de optimizaciones para el tenant activo.
2. Ejecutar una optimizacion actualiza el historial visible.
3. Guardar una formula optimizada actualiza el enlace del run a la formula.
4. Un run exitoso puede cargarse al editor como borrador.
5. Los runs `invalid` e `infeasible` son visibles y no cargables.
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
  4. ver run en historial,
  5. guardar formula optimizada,
  6. verificar enlace a formula,
  7. cargar run al editor.
- `npm audit --audit-level=moderate`.
- `rg` de referencias prohibidas o naming heredado.
- `git diff --check`.

## Riesgos

- No duplicar el historial de calculo con historial de optimizacion.
- No guardar automaticamente formulas al cargar un run historico.
- No hacer cargables runs sin solucion.
- Mantener una UI compacta y escaneable.
- Evitar un modal de detalle hasta que haya mas campos que justificar.

## Siguiente accion

Anadir tipos frontend, estado de historial, carga/refresco de runs y una seccion compacta en la biblioteca.
