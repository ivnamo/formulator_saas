# META-018 - Saved formula comparison

## Decision

La decimoctava meta implementable de FormulIA Cloud es anadir un comparador basico de formulas guardadas para evaluar alternativas persistidas sin depender del panel IA.

La comparacion usa calculo determinista backend. Al comparar, la UI recalcula ambas formulas guardadas y muestra deltas claros.

## Alcance incluido

- Rama `codex/saved-formula-comparison`.
- Selectores de formula base y formula candidata en la biblioteca.
- Accion `Compare formulas`.
- Recalculo determinista de ambas formulas con `POST /api/v1/formulas/{id}/calculate`.
- Comparacion de:
  - precio,
  - porcentaje total,
  - numero de lineas,
  - parametros calculados,
  - porcentajes por materia prima.
- Resultado visible en la biblioteca sin usar IA.
- Tests/checks y smoke browser desktop/mobile.

## Fuera de alcance

- Comparador avanzado multi-formula.
- Persistir comparaciones.
- Ranking automatico.
- Compatibilidad quimica.
- Exportar comparacion.
- Graficos.

## Criterios de done

1. El usuario puede elegir dos formulas guardadas distintas.
2. La comparacion recalcula ambas formulas con backend antes de mostrar resultado.
3. La UI muestra precio, total, lineas, parametros y cambios por materia prima.
4. El comparador no depende del panel IA ni de drafts activos.
5. La comparacion respeta tenant isolation mediante endpoints existentes.
6. Tests/checks pasan.
7. Quality/refactor gate queda aplicado.
8. La rama se sube sin mezclar cambios Jira pendientes.

## Testing minimo

- `npm run check`.
- `python -m pytest`.
- `npm audit --audit-level=moderate`.
- `git diff --check`.
- Smoke browser creando dos formulas, comparando y verificando deltas.
- `rg` de referencias prohibidas o naming heredado.

## Riesgos

- No presentar la comparacion como recomendacion automatica.
- No recalcular en frontend: el backend sigue siendo fuente de verdad.
- No crear workflow persistido antes de necesitarlo.

## Siguiente accion

Anadir restricciones tecnicas editables para comparar formulas contra objetivos definidos por el usuario.
