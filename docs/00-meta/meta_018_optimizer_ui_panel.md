# META-018 - Optimizer UI panel

## Decision

La decimoctava meta implementable de FormulIA Cloud es exponer el optimizador lineal minimo en la UI de workspace.

Este corte permite ejecutar el solver desde la pantalla actual, revisar la formula candidata y cargarla en el editor sin persistirla. La UI debe ser pequena y operativa, no un configurador avanzado.

## Alcance incluido

- Rama `codex/optimizer-ui-panel`.
- Tipos frontend para la respuesta de optimizacion.
- Panel compacto en el editor de formula.
- Uso de todas las materias cargadas como candidatos iniciales.
- Control opcional de minimo para el parametro activo.
- Ejecucion de `POST /api/v1/optimizations/run`.
- Carga de la formula candidata en el editor cuando el resultado es `success`.
- Visualizacion de estado, precio, lineas, issues o mensajes.
- Smoke local del flujo principal.
- Quality/refactor gate antes de cerrar rama.

## Fuera de alcance

- Selector avanzado de candidatos.
- Bounds por materia desde la UI.
- Maximos por parametro.
- Persistir automaticamente la formula optimizada.
- Varias alternativas.
- Explicaciones avanzadas de infeasible.

## Criterios de done

1. La UI permite ejecutar el optimizador desde un workspace con materias.
2. El payload usa el tenant activo y las materias del workspace.
3. El minimo del parametro activo se envia si es valido.
4. Un resultado `success` carga lineas optimizadas en el editor.
5. La UI muestra precio/estado del resultado.
6. Estados `invalid` o `infeasible` muestran mensajes sin romper el editor.
7. Tests/checks pasan.
8. Quality/refactor gate queda aplicado.
9. Worktree limpio y rama subida.

## Testing minimo

- `python -m pytest`.
- `npm run check`.
- Smoke local:
  1. crear workspace,
  2. crear parametro y dos materias con precios/valores,
  3. ejecutar optimizador con minimo de parametro,
  4. verificar lineas 40/60 y precio visible,
  5. confirmar que no se guarda automaticamente una formula.
- `npm audit --audit-level=moderate`.
- `rg` de referencias prohibidas o naming heredado.
- `git diff --check`.

## Riesgos

- No convertir la UI inicial en un configurador enorme.
- No persistir resultados sin revision explicita del usuario.
- No ocultar problemas de datos como si fueran resultados validos.
- Mantener el panel consistente con el editor existente.

## Siguiente accion

Anadir tipos frontend, estado del panel y un control compacto para ejecutar el optimizador y cargar el resultado en el editor.
