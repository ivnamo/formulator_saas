# META-024 - Optimizer infeasibility explanations

## Decision

La vigesima cuarta meta implementable de FormulIA Cloud es explicar de forma determinista por que el optimizer no puede producir una alternativa.

Esta meta no cambia el solver ni relaja restricciones. Anade una capa de explicacion accionable sobre los estados `blocked` e `infeasible` existentes.

## Alcance incluido

- Rama `codex/optimizer-infeasibility-explanations`.
- Campo `infeasibility_explanations` dentro de `optimization_plan`.
- Explicaciones deterministas para:
  - ausencia de candidatos,
  - falta de cobertura de parametro,
  - falta de precios para restricciones economicas,
  - ausencia de restricciones numericas,
  - rejilla sin solucion.
- Cada explicacion incluye codigo, severidad, mensaje y siguiente accion sugerida.
- UI del supervisor muestra estas explicaciones cuando no hay formula candidata.
- Tests/checks y smoke browser desktop/mobile.

## Fuera de alcance

- Cambiar el algoritmo `grid_v1`.
- Reintentos automaticos con restricciones relajadas.
- Sugerencias IA.
- Persistir decisiones de relajacion.
- Nuevos endpoints.
- Scoring ponderado.

## Criterios de done

1. Los planes `blocked` incluyen explicaciones accionables.
2. Los planes `infeasible` incluyen explicacion de rejilla sin solucion.
3. Los planes `solved` no muestran explicaciones de inviabilidad.
4. `blocking_reasons` se mantiene por compatibilidad.
5. La UI muestra las explicaciones cuando no hay alternativa generada.
6. Tests/checks pasan.
7. Quality/refactor gate queda aplicado.
8. La rama se sube sin mezclar cambios Jira pendientes.

## Testing minimo

- `npm run check`.
- `python -m pytest`.
- `npm audit --audit-level=moderate`.
- `git diff --check`.
- Smoke browser con un caso `infeasible` o `blocked` en el supervisor.
- Smoke browser mobile para confirmar que las explicaciones no rompen layout.
- `rg` de referencias prohibidas o naming heredado.

## Riesgos

- No presentar las explicaciones como recomendacion final de formulacion.
- No duplicar estados: `blocking_reasons` sigue siendo la razon tecnica compacta.
- No abrir relajacion automatica de restricciones antes de validarla con usuario.

## Siguiente accion

Anadir una accion manual para copiar o reutilizar una explicacion de inviabilidad como ajuste de requisitos del usuario.
