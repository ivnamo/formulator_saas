# META-022 - Comparison failure explanations

## Decision

La vigesima segunda meta implementable de FormulIA Cloud es explicar de forma determinista por que una formula no cumple una restriccion del comparador.

Esta meta no anade IA, scoring ni nuevas reglas. Solo convierte los estados `failed` y `missing` existentes en mensajes accionables y simples.

## Alcance incluido

- Rama `codex/comparison-failure-explanations`.
- Explicacion visible en cada restriccion fallida o sin dato.
- Mensaje para limites maximos: cuanto debe reducirse el valor.
- Mensaje para limites minimos: cuanto debe aumentarse el valor.
- Mensaje para datos ausentes: indicar que falta el valor calculado.
- La explicacion se calcula desde la evaluacion existente, no recalcula formulas.
- Tests/checks y smoke browser desktop/mobile.

## Fuera de alcance

- Explicaciones IA.
- Diagnostico quimico o causal avanzado.
- Sugerencias de reformulacion.
- Persistir explicaciones.
- Integracion con optimizer.
- Nuevas restricciones o pesos.

## Criterios de done

1. Las restricciones `failed` muestran una explicacion cuantitativa.
2. Las restricciones `missing` muestran una explicacion de dato ausente.
3. Las restricciones `passed` no anaden ruido visual.
4. El resumen de META-021 sigue funcionando.
5. Sin restricciones configuradas, el comparador sigue funcionando como antes.
6. Tests/checks pasan.
7. Quality/refactor gate queda aplicado.
8. La rama se sube sin mezclar cambios Jira pendientes.

## Testing minimo

- `npm run check`.
- `python -m pytest`.
- `npm audit --audit-level=moderate`.
- `git diff --check`.
- Smoke browser con una restriccion minima fallida y una maxima fallida.
- Smoke browser mobile para confirmar que las explicaciones no rompen el layout.
- `rg` de referencias prohibidas o naming heredado.

## Riesgos

- No presentar el mensaje como recomendacion final de laboratorio.
- No ocultar el estado `failed` o `missing`.
- No duplicar calculos fuera del evaluador de constraints.

## Siguiente accion

Permitir filtrar o resaltar solo restricciones fallidas dentro del comparador cuando el numero de reglas crezca.
