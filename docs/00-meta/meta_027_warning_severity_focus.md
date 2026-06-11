# META-027 - Warning severity focus

## Decision

La vigesima septima meta implementable de FormulIA Cloud es hacer visible la severidad de los warnings de calculo.

Esta meta mejora la lectura de los resultados tras META-026. No cambia el backend ni convierte `blocker` en bloqueo real de guardado.

## Alcance incluido

- Rama `codex/compatibility-warning-focus`.
- Normalizacion frontend de severidad `blocker`, `warning` e `info`.
- Foco visual por severidad en la lista de warnings de calculo.
- Compatibilidad con warnings antiguos sin campo `severity`.
- Documentacion UX actualizada.
- Tests/checks y smoke browser desktop/mobile.

## Fuera de alcance

- Bloquear guardado por `blocker`.
- Override autorizado.
- Cambios backend.
- Nuevos endpoints.
- Filtros persistidos de warnings.
- Workflows de laboratorio o Jira.

## Criterios de done

1. Un warning `blocker` se distingue visualmente de `warning` e `info`.
2. Los warnings sin `severity` siguen mostrandose como `warning`.
3. La lista de warnings mantiene mensaje y accion recomendada.
4. El layout funciona en desktop y mobile.
5. Tests/checks pasan.
6. Quality/refactor gate queda aplicado.
7. La rama se sube sin mezclar cambios Jira pendientes.

## Testing minimo

- `npm run check`.
- `python -m pytest`.
- `npm audit --audit-level=moderate`.
- `git diff --check`.
- Smoke browser con una regla `blocker` de compatibilidad y calculo de formula.
- Smoke browser mobile para confirmar que el foco visual no rompe layout.
- `rg` de referencias prohibidas o naming heredado.

## Riesgos

- No hacer pensar al usuario que `blocker` bloquea guardado todavia.
- No ocultar warnings legacy.
- Mantener el cambio como presentacion, no como nueva logica de dominio.

## Siguiente accion

Definir el primer flujo de override autorizado antes de convertir `blocker` en bloqueo funcional.
