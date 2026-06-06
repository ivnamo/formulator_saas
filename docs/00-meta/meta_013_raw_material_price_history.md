# META-013 - Raw material price history

## Decision

La decimotercera meta implementable de FormulIA Cloud es hacer usable el historial de precios de materias primas.

El modelo ya permite varios precios por materia; esta meta convierte esa base en comportamiento visible y probado: listar historial, anadir nuevos precios y asegurar que calculo/export usan el precio vigente mas reciente.

## Alcance incluido

- Rama `feature/raw-material-price-history`.
- Endpoint tenant-aware para listar precios de una materia prima.
- Mantener `POST /raw-materials/{id}/prices` como alta de nuevo precio historico.
- Calculo determinista usando el precio mas reciente por `valid_from` y fecha de creacion.
- UI minima para anadir precios posteriores a una materia existente.
- UI minima para ver el precio actual y el historial reciente por materia.
- Tests API de tenant isolation y seleccion de precio vigente.
- Smoke local que crea materia, anade un segundo precio y verifica calculo con el precio actualizado.
- Quality/refactor gate antes de cerrar rama.

## Fuera de alcance

- Edicion o borrado de precios historicos.
- Rangos `valid_to` automaticos.
- Selector de fecha de calculo.
- Importacion masiva de precios.
- Conector ERP/CSV.
- Auditoria avanzada de cambios.
- Reglas de aprobacion de precios.

## Criterios de done

1. El backend expone `GET /api/v1/raw-materials/{id}/prices`.
2. El endpoint rechaza materias de otro tenant.
3. Los precios se devuelven ordenados del mas reciente al mas antiguo.
4. Crear un nuevo precio no borra el anterior.
5. El calculo usa el precio vigente mas reciente.
6. La UI permite anadir un nuevo precio a una materia existente.
7. La UI muestra precio actual e historial reciente.
8. Tests/checks pasan.
9. Quality/refactor gate queda aplicado.
10. Worktree limpio y rama subida.

## Testing minimo

- `python -m pytest`.
- `npm run check`.
- Smoke local:
  1. crear workspace,
  2. crear parametro y materia con precio inicial,
  3. anadir precio nuevo a la materia,
  4. calcular formula al 100%,
  5. verificar que el precio calculado usa el precio nuevo.
- `npm audit --audit-level=moderate`.
- `rg` de referencias prohibidas o naming heredado.
- `git diff --check`.

## Riesgos

- No mezclar precios de tenants distintos.
- No sobreescribir accidentalmente el historial al crear precio nuevo.
- No introducir un modo de calculo por fecha antes de tener UX y contrato claros.
- Mantener el calculo como fuente determinista unica; la UI solo refleja el estado.

## Siguiente accion

Anadir lectura de precios al backend, conectar un bloque compacto de historial/precio en la UI de materias primas y cubrir el flujo con tests y smoke.
