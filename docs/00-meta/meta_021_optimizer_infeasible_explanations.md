# META-021 - Optimizer infeasible explanations

## Decision

La vigesimoprimera meta implementable de FormulIA Cloud es devolver explicaciones basicas cuando el optimizador no encuentra solucion.

Este corte mejora la confianza del usuario sin intentar resolver el analisis completo de infeasibilidad. El solver debe explicar causas simples y accionables: limites de materias que no permiten sumar 100 y parametros tecnicos fuera del rango alcanzable.

## Alcance incluido

- Rama `codex/optimizer-infeasible-explanations`.
- Mensaje general determinista para problemas infeasible.
- Explicacion cuando los minimos de materias superan 100%.
- Explicacion cuando los maximos de materias no alcanzan 100%.
- Explicacion cuando un minimo de parametro supera el maximo alcanzable.
- Explicacion cuando un maximo de parametro esta por debajo del minimo alcanzable.
- Tests core de explicaciones principales.
- Reutilizar el campo `messages` existente de la API.
- Quality/refactor gate antes de cerrar rama.

## Fuera de alcance

- IIS completo del solver.
- Ranking de restricciones conflictivas.
- Sugerencias de relajacion generadas por IA.
- UI nueva mas alla de mostrar los mensajes ya existentes.
- Varias alternativas de solucion.

## Criterios de done

1. Un problema infeasible devuelve mensajes accionables.
2. El mensaje bruto del solver no es la unica salida.
3. Los casos simples de bounds de materias tienen explicacion especifica.
4. Los casos simples de bounds de parametros tienen explicacion especifica.
5. Tests/checks pasan.
6. Quality/refactor gate queda aplicado.
7. Worktree limpio y rama subida.

## Testing minimo

- `python -m pytest`.
- `npm run check` si se toca frontend.
- Tests core de:
  1. maximos de materias por debajo de 100,
  2. minimos de materias por encima de 100,
  3. parametro minimo inalcanzable,
  4. parametro maximo inalcanzable.
- `npm audit --audit-level=moderate`.
- `rg` de referencias prohibidas o naming heredado.
- `git diff --check`.

## Riesgos

- No prometer explicaciones exhaustivas.
- No ocultar el mensaje tecnico del solver cuando aporte contexto.
- No duplicar la logica completa del solver en heuristicas fragiles.
- Mantener las explicaciones deterministas y testeables.

## Siguiente accion

Anadir helpers de diagnostico en `optimizer.py`, cubrirlos con tests core y dejar la API reutilizando `messages`.
