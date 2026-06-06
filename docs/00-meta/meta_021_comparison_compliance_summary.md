# META-021 - Comparison compliance summary

## Decision

La vigesima primera meta implementable de FormulIA Cloud es anadir un resumen de cumplimiento al comparador de formulas guardadas.

Esta meta no cambia las reglas ni anade nuevas restricciones. Resume las evaluaciones existentes para que el usuario vea rapidamente que formula cumple mas objetivos configurados.

## Alcance incluido

- Rama `codex/comparison-compliance-summary`.
- Resumen visible cuando hay restricciones evaluadas.
- Conteo de restricciones `passed`, `failed` y `missing` para formula base.
- Conteo de restricciones `passed`, `failed` y `missing` para formula candidata.
- Indicacion de si lidera la formula base, la candidata o si hay empate.
- El resumen se calcula desde las evaluaciones existentes, no recalcula reglas por separado.
- Tests/checks y smoke browser desktop/mobile.

## Fuera de alcance

- Ranking persistente de formulas.
- Scoring ponderado configurable.
- Recomendacion automatica de aprobacion.
- Nuevos tipos de restricciones.
- Integracion con optimizer.
- Cambios en backend o modelo de datos.

## Criterios de done

1. El comparador muestra un resumen solo cuando existen restricciones evaluadas.
2. El usuario ve de un vistazo cuantos objetivos cumple base y candidata.
3. Estados `missing` no cuentan como cumplimiento.
4. La formula lider se decide por mas `passed`; en empate, por menos `failed` y despues menos `missing`.
5. Sin restricciones configuradas, el comparador sigue funcionando sin resumen.
6. Tests/checks pasan.
7. Quality/refactor gate queda aplicado.
8. La rama se sube sin mezclar cambios Jira pendientes.

## Testing minimo

- `npm run check`.
- `python -m pytest`.
- `npm audit --audit-level=moderate`.
- `git diff --check`.
- Smoke browser comparando dos formulas con restricciones donde una formula lidere.
- Smoke browser mobile para confirmar que el resumen no rompe el layout.
- `rg` de referencias prohibidas o naming heredado.

## Riesgos

- No presentar el resumen como aprobacion tecnica final.
- No ocultar el detalle de restricciones: el resumen complementa, no sustituye.
- No introducir scoring prematuro hasta tener pesos reales de negocio.

## Siguiente accion

Anadir explicaciones de inviabilidad para restricciones fallidas, empezando por mensajes simples y deterministas.
