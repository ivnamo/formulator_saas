# META-020 - Comparison material constraints

## Decision

La vigesima meta implementable de FormulIA Cloud es permitir restricciones por materia prima dentro del comparador de formulas guardadas.

Esta meta extiende el evaluador local de restricciones de META-019. No crea un motor completo ni persiste reglas.

## Alcance incluido

- Rama `codex/comparison-material-constraints`.
- Selector de materia prima en el comparador.
- Campo editable de porcentaje minimo de uso.
- Campo editable de porcentaje maximo de uso.
- Evaluacion de formula base y candidata contra:
  - `material_percentage >= minimo`,
  - `material_percentage <= maximo`.
- Una materia ausente cuenta como 0% para limites de uso.
- Resultado visible junto al resto de restricciones del comparador.
- Tests/checks y smoke browser desktop/mobile.

## Fuera de alcance

- Multiples restricciones de materiales a la vez.
- Persistir restricciones.
- Operadores configurables.
- Restricciones de disponibilidad.
- Compatibilidad quimica.
- Integracion con optimizer.

## Criterios de done

1. El usuario puede escoger una materia prima y limites minimo/maximo.
2. La comparacion muestra si base y candidata cumplen cada limite configurado.
3. Una materia ausente se evalua como 0%, no como dato inventado.
4. La evaluacion usa formulas guardadas recalculadas por backend.
5. Sin restriccion de material configurada, el comparador sigue funcionando como META-019.
6. Tests/checks pasan.
7. Quality/refactor gate queda aplicado.
8. La rama se sube sin mezclar cambios Jira pendientes.

## Testing minimo

- `npm run check`.
- `python -m pytest`.
- `npm audit --audit-level=moderate`.
- `git diff --check`.
- Smoke browser comparando dos formulas con limite minimo y maximo de materia.
- `rg` de referencias prohibidas o naming heredado.

## Riesgos

- No confundir limite de uso con compatibilidad quimica.
- No sobredisenar multiples reglas antes de tener mas casos reales.
- No evaluar con datos frontend inventados: los porcentajes vienen de formulas guardadas.

## Siguiente accion

Anadir un modo de cumplimiento resumido por formula para que el usuario vea rapidamente cual alternativa cumple mas restricciones.
