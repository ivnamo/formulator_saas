# META-032 - AI run history UI

## Decision

La trigesimosegunda meta implementable de FormulIA Cloud es hacer visible en la app el historial de runs IA.

META-031 dejo persistencia y endpoints de lectura para `ai_runs` y `ai_tool_calls`. Este corte anade una vista compacta en el workspace para inspeccionar que peticiones de IA-ready se han ejecutado, con estado, proveedor, modelo, timestamps, payloads y tool calls. No conecta todavia un LLM real.

## Alcance incluido

- Rama `codex/ai-run-history-ui`.
- Cliente frontend para `GET /api/v1/ai/runs`.
- Cliente frontend para `GET /api/v1/ai/runs/{run_id}`.
- Modelo TypeScript para runs y tool calls.
- Vista o pestana compacta de historial IA en el workspace.
- Estado vacio cuando no hay runs.
- Seleccion de run y detalle legible de input, output, errores y tool calls.
- Recarga manual del historial sin reiniciar el workspace.
- Browser smoke del flujo parser -> historial IA -> detalle.
- Quality/refactor gate antes de cerrar rama.

## Fuera de alcance

- Llamadas a OpenAI u otro proveedor LLM.
- Provisionar `OPENAI_API_KEY`.
- Streaming, reintentos o jobs asincronos.
- Graficas de coste/tokens.
- Filtros avanzados, paginacion o exportacion de logs.
- Edicion o borrado de runs.

## Criterios de done

1. El usuario puede ver los runs IA del tenant activo desde la app.
2. El parser determinista aparece en el historial tras ejecutar `POST /requirements/parse`.
3. El detalle muestra input/output y al menos una tool call.
4. El estado vacio es claro y no rompe la pantalla inicial.
5. La UI no mezcla tenants ni crea datos propios fuera de los endpoints existentes.
6. Tests/checks pasan.
7. Browser smoke verifica la vista en desktop y movil.
8. Quality/refactor gate queda aplicado.
9. Worktree limpio y rama subida.

## Testing minimo

- `python -m pytest`.
- `npm run check`.
- Browser smoke:
  1. crear workspace demo,
  2. ejecutar el parser de requisitos,
  3. abrir historial IA,
  4. seleccionar el run generado,
  5. verificar detalle y tool call visibles,
  6. comprobar viewport movil sin overflow.
- `npm audit --audit-level=moderate`.
- `rg` de referencias prohibidas o naming heredado.
- `git diff --check`.

## Riesgos

- No mostrar secretos si en el futuro llegan payloads sensibles.
- No presentar el parser determinista como IA generativa.
- Evitar una vista pesada: payloads largos deben ser inspeccionables sin romper layout.
- Mantener el cliente compatible con futuros providers, tokens y coste real.

## Siguiente accion

Crear tipos y cliente frontend para los endpoints de logging IA, anadir la vista de historial al workspace y validar el flujo con Browser.
