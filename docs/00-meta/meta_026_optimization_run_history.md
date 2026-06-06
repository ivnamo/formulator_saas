# META-026 - Optimization run history

## Decision

La vigesimosexta meta implementable de FormulIA Cloud es persistir un historial minimo de ejecuciones del optimizador.

Hasta ahora `POST /api/v1/optimizations/run` calculaba y devolvia una propuesta, pero no dejaba trazabilidad. Este corte guarda cada ejecucion de forma tenant-aware para poder auditar input, output, estado, usuario y formula guardada relacionada cuando exista.

## Alcance incluido

- Rama `codex/optimization-run-history`.
- Tabla `optimization_runs`.
- Persistencia de ejecuciones con estado `success`, `invalid` o `infeasible`.
- Guardar `objective`, request normalizado y response normalizado.
- Incluir `id` y `created_at` en la respuesta de `POST /api/v1/optimizations/run`.
- Endpoint `GET /api/v1/optimizations/runs`.
- Enlace opcional de una formula guardada con el run que la origino.
- Tests API de persistencia, tenant isolation y enlace con formula.
- Actualizacion de documentacion.
- Quality/refactor gate antes de cerrar rama.

## Fuera de alcance

- UI de historial.
- Comparacion visual entre runs.
- Re-ejecucion de un run historico.
- Versionado de restricciones.
- Auditoria avanzada o tabla generica de eventos.
- Integracion IA sobre el historial.

## Criterios de done

1. Cada ejecucion de optimizador queda persistida para el tenant activo.
2. Las ejecuciones invalidas e infeasible tambien quedan registradas.
3. El listado de runs no expone datos de otros tenants.
4. Al guardar una formula optimizada se puede enlazar con su run de origen.
5. La respuesta del optimizador conserva compatibilidad y anade identificadores del run.
6. Tests/checks pasan.
7. Quality/refactor gate queda aplicado.
8. Worktree limpio y rama subida.

## Testing minimo

- `python -m pytest`.
- `npm run check` si se toca frontend o schemas compartidos.
- Tests API de:
  1. run exitoso persistido,
  2. run invalido persistido,
  3. listado aislado por tenant,
  4. formula optimizada enlazada al run.
- `npm audit --audit-level=moderate`.
- `rg` de referencias prohibidas o naming heredado.
- `git diff --check`.

## Riesgos

- No persistir informacion de otro tenant por error.
- No mezclar historial de optimizacion con historial de calculo de formulas.
- No obligar a que toda formula tenga run asociado.
- No convertir `objective` en un contenedor de restricciones.
- Evitar una capa generica de auditoria antes de que haga falta.

## Siguiente accion

Anadir modelo, schemas, persistencia en `run_optimization`, listado de runs y soporte opcional para enlazar una formula guardada.
