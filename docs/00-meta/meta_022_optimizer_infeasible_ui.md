# META-022 - Optimizer infeasible UI

## Decision

La vigesimosegunda meta implementable de FormulIA Cloud es hacer visibles y claros los mensajes de infeasibilidad del optimizador en la UI.

META-021 anadio explicaciones deterministas al core y las expuso por API. Este corte afina la experiencia frontend para que un usuario vea rapidamente que no hay solucion y que restricciones debe revisar.

## Alcance incluido

- Rama `codex/optimizer-infeasible-ui`.
- Etiqueta de estado legible para `success`, `invalid` e `infeasible`.
- Mensajes de infeasibilidad visibles en el panel del optimizador.
- Estilo compacto para estados no exitosos.
- Smoke local con problema infeasible y mensaje especifico.
- Quality/refactor gate antes de cerrar rama.

## Fuera de alcance

- Wizard de relajacion de restricciones.
- Sugerencias IA.
- Analisis completo de restricciones conflictivas.
- Persistencia de intentos fallidos.

## Criterios de done

1. La UI no muestra solo el estado tecnico `infeasible`.
2. La UI muestra mensajes devueltos por la API.
3. Un problema sin solucion no modifica la formula actual.
4. Smoke verifica un mensaje especifico de infeasibilidad.
5. Tests/checks pasan.
6. Quality/refactor gate queda aplicado.
7. Worktree limpio y rama subida.

## Testing minimo

- `python -m pytest`.
- `npm run check`.
- Smoke local:
  1. crear workspace,
  2. crear dos materias,
  3. fijar maximos de materia insuficientes,
  4. ejecutar optimizador,
  5. verificar estado no solution y mensaje especifico visible,
  6. verificar que no se cargan lineas de formula.
- `npm audit --audit-level=moderate`.
- `rg` de referencias prohibidas o naming heredado.
- `git diff --check`.

## Riesgos

- No ocultar los mensajes tecnicos si son la unica pista disponible.
- No modificar formula si el resultado no es `success`.
- Mantener el panel compacto.

## Siguiente accion

Anadir helper de etiqueta de estado, estilo de estado no exitoso y smoke de infeasible visible.
