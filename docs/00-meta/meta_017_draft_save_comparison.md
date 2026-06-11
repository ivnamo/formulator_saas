# META-017 - Draft save comparison

## Decision

La decimoseptima meta implementable de FormulIA Cloud es comparar la propuesta IA aplicada con la version revisada antes de permitir su guardado.

Esta meta sigue siendo local de UI. La confirmacion humana recalcula el borrador actual contra el backend y muestra diferencias basicas frente a la propuesta original del optimizer.

## Alcance incluido

- Rama `codex/draft-save-comparison`.
- Snapshot local de la propuesta original aplicada.
- Recalculo ad hoc al confirmar la revision, sin guardar formula.
- Comparacion de:
  - precio propuesto frente a precio revisado,
  - porcentaje total propuesto frente a revisado,
  - numero de lineas propuestas frente a revisadas,
  - cambios por materia prima en porcentaje.
- `Save & calculate` solo se habilita despues de una confirmacion con recalculo previo.
- Tests/checks y smoke browser desktop/mobile.

## Fuera de alcance

- Persistir comparaciones.
- Versionado de drafts.
- Comparador avanzado de formulas.
- Validacion de compatibilidad.
- Aprobaciones por rol.
- Workflow de laboratorio o Jira.

## Criterios de done

1. Aplicar un draft conserva snapshot local de la propuesta.
2. Confirmar revision recalcula el borrador actual con `POST /api/v1/formulas/calculate`.
3. La UI muestra precio, total, lineas y cambios por materia prima.
4. El recalculo de confirmacion no guarda formula.
5. Editar despues de confirmar limpia la comparacion confirmada y vuelve a bloquear guardado.
6. Guardar sigue siendo una accion explicita posterior.
7. Tests/checks pasan.
8. Quality/refactor gate queda aplicado.
9. La rama se sube sin mezclar cambios Jira pendientes.

## Testing minimo

- `npm run check`.
- `python -m pytest`.
- `npm audit --audit-level=moderate`.
- `git diff --check`.
- Smoke browser: aplicar draft, confirmar, editar, reconfirmar y guardar.
- `rg` de referencias prohibidas o naming heredado.

## Riesgos

- No confundir la comparacion local con versionado historico.
- No recalcular con logica frontend: el backend sigue siendo fuente de verdad.
- No bloquear formulas manuales fuera del flujo de drafts IA.

## Siguiente accion

Anadir un comparador de formulas guardadas para evaluar alternativas ya persistidas sin depender del panel IA.
