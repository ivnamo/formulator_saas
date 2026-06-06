# META-006 - Excel row manual resolution

## Decision

La sexta meta implementable de FormulIA Cloud es permitir resolver manualmente filas pendientes del preview Excel seleccionando una materia prima existente del tenant.

Esta meta completa el flujo basico de importacion sin depender todavia de fuzzy matching ni de ejemplos reales. El usuario puede corregir una fila `needs_review` y guardar la formula cuando todas las filas validas esten resueltas.

## Alcance incluido

- Rama `feature/excel-row-resolution`.
- UI para seleccionar materia prima en filas `needs_review`.
- Recalculo en cliente de filas resueltas y pendientes del preview.
- Guardado de formula importada con filas resueltas manualmente.
- Estado visual claro para filas resueltas manualmente.
- Smoke local con Excel que contiene una materia no matcheada automaticamente.
- Quality/refactor gate antes de cerrar rama.

## Fuera de alcance

- Fuzzy matching automatico.
- Crear materia prima desde una fila pendiente.
- Crear alias desde una fila pendiente.
- Seleccion de hoja Excel.
- Guardar imports como entidad historica.
- Resolver porcentajes invalidos.
- IA, embeddings o RAG.

## Criterios de done

1. Una fila `needs_review` muestra selector de materia prima.
2. Al seleccionar materia, la fila queda resuelta.
3. El contador de pendientes baja.
4. La formula importada puede guardarse cuando no quedan filas pendientes.
5. El guardado usa `raw_material_id` resuelto manualmente.
6. La formula guardada puede calcularse con el backend existente.
7. Tests/checks pasan.
8. Quality/refactor gate queda aplicado.
9. Worktree limpio y rama subida.

## Testing minimo

- `npm run check`.
- `python -m pytest`.
- Smoke local:
  1. crear workspace,
  2. crear materias primas,
  3. subir Excel con una fila no resuelta,
  4. seleccionar materia manualmente,
  5. guardar formula,
  6. calcular.
- `rg` de referencias prohibidas o naming heredado.
- `git diff --check`.

## Riesgos

- No ocultar filas con porcentaje invalido como si fueran resolubles.
- No mutar el preview de forma confusa: el estado manual debe ser visible.
- Mantener la validacion backend como ultima barrera.

## Siguiente accion

Actualizar el preview de importacion en UI para permitir resolver filas `needs_review` contra materias primas existentes.
