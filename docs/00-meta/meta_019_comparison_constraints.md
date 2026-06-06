# META-019 - Comparison constraints

## Decision

La decimonovena meta implementable de FormulIA Cloud es anadir restricciones editables al comparador de formulas guardadas.

Esta meta no crea un motor completo de restricciones. Evalua objetivos simples contra resultados calculados por backend para que el usuario pueda ver si cada formula cumple un objetivo tecnico/economico basico.

## Alcance incluido

- Rama `codex/comparison-constraints`.
- Campo editable de precio maximo.
- Campo editable de parametro tecnico.
- Campo editable de minimo de parametro.
- Evaluacion de formula base y candidata contra:
  - `price_total <= precio maximo`,
  - `parameter >= minimo`.
- Estados `passed`, `failed` o `missing`.
- Resultado visible dentro del comparador de formulas guardadas.
- Tests/checks y smoke browser desktop/mobile.

## Fuera de alcance

- Persistir restricciones.
- Multiples restricciones dinamicas.
- Operadores configurables.
- Restricciones por materia prima.
- Compatibilidad quimica.
- Ranking automatico.
- Integracion con optimizer.

## Criterios de done

1. El usuario puede introducir precio maximo y minimo de parametro.
2. La comparacion muestra si base y candidata cumplen cada restriccion configurada.
3. La evaluacion usa los resultados recalculados por backend.
4. Sin restricciones configuradas, el comparador sigue funcionando como META-018.
5. Estados missing no se tratan como passed.
6. Tests/checks pasan.
7. Quality/refactor gate queda aplicado.
8. La rama se sube sin mezclar cambios Jira pendientes.

## Testing minimo

- `npm run check`.
- `python -m pytest`.
- `npm audit --audit-level=moderate`.
- `git diff --check`.
- Smoke browser comparando dos formulas con restricciones que pasen y fallen.
- `rg` de referencias prohibidas o naming heredado.

## Riesgos

- No convertir esta evaluacion local en certificacion formal.
- No evaluar en frontend con datos inventados: se usan calculos backend.
- No sobredisenar un builder de restricciones antes de tener mas casos reales.

## Siguiente accion

Permitir restricciones por materia prima dentro del comparador para revisar limites de uso de componentes.
