# META-014 - Deterministic optimizer tool

## Decision

La decimocuarta meta implementable de FormulIA Cloud es implementar el primer `OptimizerTool` determinista capaz de generar una formula candidata cuando las restricciones tengan cobertura suficiente.

El solver es conservador: usa una rejilla determinista, valida con `formulia_core.calculate_formula` y devuelve propuestas en borrador. No sustituye revision humana ni compatibilidad quimica.

## Alcance incluido

- Rama `codex/deterministic-optimizer-tool`.
- Solver determinista de rejilla para candidatos ya filtrados por tenant.
- Validacion con `formulia_core.calculate_formula`.
- Soporte inicial para:
  - objetivo `minimize_price`,
  - restricciones de parametro `>=`, `>`, `<=`, `<`, `=`,
  - restriccion economica `price_total`.
- Output `formula_candidates` dentro de `optimization_plan`.
- Estado `solved`, `infeasible` o `blocked`.
- UI con propuesta candidata en borrador: materiales, porcentajes, coste y parametros calculados.
- Tests de solucion factible, bloqueo por cobertura y aislamiento ya cubierto por tools previas.
- Quality/refactor gate antes de cerrar rama.

## Fuera de alcance

- SciPy/HiGHS.
- Solver continuo exacto.
- Multiples alternativas diversas.
- Compatibilidad quimica.
- Guardar formulas automaticamente.
- Ajustes manuales de optimizer desde UI.

## Criterios de done

1. El optimizer no genera formula si `candidate_research` esta bloqueado o sin cobertura.
2. El optimizer genera al menos una formula candidata cuando hay candidatos con precio y parametros suficientes.
3. La formula candidata suma 100%.
4. La formula candidata cumple restricciones tecnicas y economicas soportadas.
5. La formula se valida con `formulia_core.calculate_formula`.
6. El output marca `solver = grid_v1`.
7. La UI muestra la propuesta como draft y no la guarda automaticamente.
8. Tests/checks pasan.
9. Quality/refactor gate queda aplicado.
10. La rama se sube sin mezclar cambios Jira pendientes.

## Testing minimo

- `python -m pytest apps/api/tests/test_ai_supervisor.py`.
- `python -m pytest`.
- `npm run check`.
- `npm audit --audit-level=moderate`.
- `git diff --check`.
- `rg` de referencias prohibidas o naming heredado.

## Riesgos

- No presentar la propuesta como formula final.
- Evitar una rejilla demasiado grande que ralentice la API.
- No duplicar el calculo de precio/parametros: usar `formulia_core`.
- No resolver restricciones no soportadas silenciosamente.

## Siguiente accion

Convertir la propuesta candidata en accion UI controlada: revisar, aplicar al editor manual y recalcular antes de guardar.
