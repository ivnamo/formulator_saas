# META-011 - OpenAI requirement parser

## Decision

La undecima meta implementable de FormulIA Cloud es conectar un parser de requisitos asistido por IA sin saltarse el flujo determinista de la plataforma.

El parser convierte texto libre del usuario en JSON estructurado y queda registrado en `ai_runs`. La generacion de formulas, optimizacion y validacion quedan fuera de esta meta.

## Alcance incluido

- Rama `codex/openai-requirement-parser`.
- Script local `scripts/set-openai-api-key.ps1` para pedir `OPENAI_API_KEY` por consola.
- Carga controlada de `.env.local` para `OPENAI_API_KEY`, `REQUIREMENT_PARSER_PROVIDER` y `REQUIREMENT_PARSER_MODEL`.
- Provider `deterministic` por defecto.
- Provider `llm`/`openai` mediante OpenAI Responses API.
- Modelo por defecto `gpt-5-nano`, configurable por entorno.
- Structured Outputs con JSON Schema estricto para el resultado del RequirementParserAgent.
- Tabla `ai_runs` y `ai_tool_calls`.
- Endpoint `POST /api/v1/ai/requirements/parse`.
- Endpoint `GET /api/v1/ai/runs`.
- Panel UI `AI parser` para probar parsing y revisar runs.
- Tests mockeados sin llamada real a OpenAI.
- Quality/refactor gate antes de cerrar rama.

## Fuera de alcance

- Chatbot generalista.
- Generar formulas con LLM.
- Optimizacion matematica.
- RAG documental.
- Streaming.
- Gestion de claves en produccion.
- Selector de modelo por tenant.
- Cost accounting definitivo.

## Criterios de done

1. El script guarda la key sin imprimirla.
2. `.env.local` sigue ignorado por Git.
3. El modo determinista funciona sin key.
4. El modo `llm` falla de forma clara si falta `OPENAI_API_KEY`.
5. El modo `llm` llama a OpenAI con Structured Outputs.
6. Cada parse crea un `ai_run` tenant-scoped.
7. La UI permite enviar texto y ver el resultado parseado.
8. La UI muestra historial basico de runs IA.
9. Tests/checks pasan sin conexion real a OpenAI.
10. Quality/refactor gate queda aplicado.
11. Worktree limpio salvo cambios ajenos previos.

## Testing minimo

- `python -m pytest apps/api/tests/test_ai_requirement_parser.py`.
- `python -m pytest`.
- `npm run check`.
- `npm audit --audit-level=moderate`.
- `git diff --check`.
- `rg` de referencias prohibidas o naming heredado.

## Riesgos

- No exponer claves en logs, tests ni respuestas.
- No hacer llamadas reales en tests.
- No guardar cabeceras sensibles en `ai_runs`.
- No convertir el parser en una fuente de verdad: su salida alimenta tools deterministas posteriores.
- No mezclar el commit con los cambios Jira ya presentes en worktree.

## Siguiente accion

Usar el parser como entrada del futuro flujo de generacion de alternativas, siempre pasando por calculo y validacion deterministas.
