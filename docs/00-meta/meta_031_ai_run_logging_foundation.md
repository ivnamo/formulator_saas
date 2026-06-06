# META-031 - AI run logging foundation

## Decision

La trigesimoprimera meta implementable de FormulIA Cloud es crear la base de logging de runs IA.

Antes de conectar un LLM real, el sistema necesita trazabilidad multi-tenant para inputs, outputs, tools, estado, modelo/proveedor y errores. Este corte implementa las tablas `ai_runs` y `ai_tool_calls`, expone endpoints de lectura y registra el parser determinista de requisitos como primer run auditable. No llama a OpenAI ni a otro proveedor externo.

## Alcance incluido

- Rama `codex/ai-run-logging-foundation`.
- Modelos persistentes `ai_runs` y `ai_tool_calls`.
- Schemas API para listar runs y tool calls.
- Endpoint `GET /api/v1/ai/runs`.
- Endpoint `GET /api/v1/ai/runs/{run_id}` con tool calls.
- `POST /api/v1/requirements/parse` registra un `ai_run` y un `ai_tool_call` determinista.
- Tenant isolation para runs y tool calls.
- Tests API de logging y aislamiento.
- Documentacion de API/data model si hace falta ajustar detalles.
- Quality/refactor gate antes de cerrar rama.

## Fuera de alcance

- Llamadas a OpenAI u otro proveedor LLM.
- Provisionar `OPENAI_API_KEY`.
- Pantalla frontend de historial IA.
- Coste/tokens reales.
- Reintentos, streaming o jobs asincronos.
- Multiagente real.

## Criterios de done

1. `ai_runs` y `ai_tool_calls` existen con `tenant_id`.
2. El parser de requisitos deja un run auditable.
3. El run incluye input, output, status, run type, provider/model y timestamps.
4. La tool call incluye tool name, input, output y status.
5. Los endpoints de lectura filtran por tenant activo.
6. Usuario sin membresia no puede leer logs de otro tenant.
7. Tests/checks pasan.
8. Quality/refactor gate queda aplicado.
9. Worktree limpio y rama subida.

## Testing minimo

- `python -m pytest`.
- `npm run check`.
- `npm audit --audit-level=moderate`.
- `rg` de referencias prohibidas o naming heredado.
- `git diff --check`.

## Riesgos

- No guardar secretos ni credenciales en logs.
- No mezclar datos entre tenants.
- No bloquear el parser si el logging falla por datos opcionales.
- No sobredisenar jobs asincronos antes de conectar LLM real.
- Mantener el contrato compatible con futuros `ai_runs` LLM.

## Siguiente accion

Anadir modelos y schemas, registrar el parser en `ai_runs`/`ai_tool_calls` y cubrir tenant isolation con tests.
