# META-015 - Formula comparison

## Decision

La decimoquinta meta implementable de FormulIA Cloud es permitir comparar dos formulas guardadas.

Este corte introduce una capacidad P2 sin entrar aun en optimizacion: comparar coste, porcentaje total y parametros calculados entre dos alternativas usando el mismo core determinista que ya calcula formulas.

## Alcance incluido

- Rama `feature/formula-comparison`.
- Endpoint tenant-aware para comparar dos formulas guardadas.
- Comparacion de precio total, porcentaje total y parametros calculados.
- Deltas por parametro cuando existe en una o ambas formulas.
- UI minima en biblioteca para seleccionar dos formulas y ver diferencias.
- Tests API de tenant isolation y deltas calculados.
- Smoke local que crea dos formulas, compara y verifica diferencias visibles.
- Quality/refactor gate antes de cerrar rama.

## Fuera de alcance

- Comparacion visual linea a linea.
- Diff de ingredientes equivalentes o sustituciones.
- Versionado formal de formulas.
- Optimizador o generacion de alternativas.
- Persistencia historica de comparaciones.
- PDF/Excel de comparacion.

## Criterios de done

1. El backend expone `POST /api/v1/formulas/compare`.
2. El endpoint rechaza formulas de otro tenant.
3. La comparacion usa el calculo determinista existente.
4. La respuesta incluye precio, porcentaje total y parametros de ambas formulas.
5. La respuesta incluye deltas principales.
6. La UI permite seleccionar formula A y B desde la biblioteca.
7. La UI muestra diferencia de precio y parametros.
8. Tests/checks pasan.
9. Quality/refactor gate queda aplicado.
10. Worktree limpio y rama subida.

## Testing minimo

- `python -m pytest`.
- `npm run check`.
- Smoke local:
  1. crear workspace,
  2. crear dos materias y un parametro,
  3. guardar dos formulas con composicion distinta,
  4. comparar ambas,
  5. verificar diferencia de precio y parametro visible.
- `npm audit --audit-level=moderate`.
- `rg` de referencias prohibidas o naming heredado.
- `git diff --check`.

## Riesgos

- No duplicar logica de calculo ni recalcular con reglas propias.
- No mezclar datos de tenants distintos.
- Mantener una UI compacta; el comparador linea a linea puede venir despues.
- Evitar que la comparacion modifique formulas o historial de calculos.

## Siguiente accion

Anadir contrato de comparacion en API, reutilizar `_calculate` para cada formula y conectar un panel compacto de comparacion en la biblioteca.
