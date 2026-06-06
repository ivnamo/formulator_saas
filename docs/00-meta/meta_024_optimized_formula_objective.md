# META-024 - Optimized formula objective

## Decision

La vigesimocuarta meta implementable de FormulIA Cloud es conservar y mostrar el objetivo de una formula optimizada guardada.

El modelo de datos ya tiene `Formula.objective`. Este corte usa ese campo para distinguir formulas optimizadas por precio minimo de formulas manuales, sin crear tablas nuevas ni persistir jobs de optimizacion.

## Alcance incluido

- Rama `codex/optimized-formula-objective`.
- Guardar `objective=minimize_price` al persistir una formula optimizada.
- Mantener `objective` nulo para formulas manuales.
- Mostrar el objetivo en la biblioteca de formulas.
- Test API de objetivo persistido.
- Smoke local de optimizar, guardar y ver objetivo en biblioteca.
- Quality/refactor gate antes de cerrar rama.

## Fuera de alcance

- Persistir todo el payload de restricciones.
- Persistir jobs de optimizacion.
- Versionado especial de formulas optimizadas.
- Auditoria avanzada de optimizaciones.

## Criterios de done

1. Una formula optimizada guardada conserva `objective=minimize_price`.
2. Una formula manual puede seguir sin objetivo.
3. La biblioteca muestra el objetivo cuando existe.
4. Tests/checks pasan.
5. Quality/refactor gate queda aplicado.
6. Worktree limpio y rama subida.

## Testing minimo

- `python -m pytest`.
- `npm run check`.
- Smoke local:
  1. crear workspace,
  2. crear parametro y materias,
  3. optimizar,
  4. guardar resultado,
  5. verificar objetivo visible en biblioteca.
- `npm audit --audit-level=moderate`.
- `rg` de referencias prohibidas o naming heredado.
- `git diff --check`.

## Riesgos

- No sobrecargar `objective` con JSON de restricciones.
- No marcar formulas manuales como optimizadas.
- No romper apertura/calculo de formulas existentes.

## Siguiente accion

Anadir soporte frontend para enviar `objective` al guardar formulas optimizadas, reforzar test API y mostrar el objetivo en biblioteca.
