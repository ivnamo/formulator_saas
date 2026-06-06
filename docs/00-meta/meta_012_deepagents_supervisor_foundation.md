# META-012 - DeepAgents supervisor foundation

## Decision

La duodecima meta implementable de FormulIA Cloud es preparar la capa de orquestacion multiagente segun la especificacion DeepAgents/LangChain.

Esta meta no genera formulas. Crea el `FormulationSupervisorAgent`, un endpoint de planificacion, auditoria de tool calls y un adaptador opcional a DeepAgents.

## Alcance incluido

- Rama `codex/deepagents-supervisor-foundation`.
- Paquete backend `formulia_api.agents`.
- Adaptador perezoso a `deepagents.create_deep_agent`.
- Extra opcional `agents` con `deepagents` y `langchain-openai`.
- Provider `AGENT_ORCHESTRATOR_PROVIDER=deterministic` por defecto.
- Provider `AGENT_ORCHESTRATOR_PROVIDER=deepagents` para usar el harness si el extra esta instalado.
- Endpoint `POST /api/v1/ai/supervisor/plan`.
- Endpoint detalle `GET /api/v1/ai/runs/{run_id}` con `ai_tool_calls`.
- Registro de `RequirementParserAgent` como tool call auditada.
- Panel UI con boton `Plan` y lista de pasos del supervisor.
- Tests mockeados sin llamada real a DeepAgents/OpenAI.
- Quality/refactor gate antes de cerrar rama.

## Fuera de alcance

- Formula generation.
- Optimizacion matematica real.
- RAG documental.
- Subagents en paralelo.
- Human-in-the-loop interactivo.
- LangSmith/trace remoto.
- Instalacion obligatoria de DeepAgents en el entorno base.

## Criterios de done

1. El supervisor planifica sin key en modo determinista.
2. El supervisor registra `ai_run` de tipo `formulation_supervisor`.
3. El parser queda registrado como `ai_tool_call`.
4. El detalle de run respeta tenant isolation.
5. El adaptador DeepAgents se puede invocar con mock sin dependencia real.
6. Si DeepAgents no esta instalado, el error es claro.
7. La UI puede llamar a `Plan` y mostrar pasos.
8. Tests/checks pasan.
9. Quality/refactor gate queda aplicado.
10. La rama se sube sin mezclar los cambios Jira pendientes.

## Testing minimo

- `python -m pytest apps/api/tests/test_ai_supervisor.py`.
- `python -m pytest`.
- `npm run check`.
- `npm audit --audit-level=moderate`.
- `git diff --check`.
- `rg` de referencias prohibidas o naming heredado.

## Riesgos

- No instalar dependencias pesadas en la base hasta que el flujo las necesite.
- No permitir que el supervisor invente porcentajes o formulas.
- No hacer llamadas reales a proveedores en tests.
- No mezclar tool calls de un tenant con otro.
- No duplicar logica del parser: debe reutilizar el tool existente.

## Siguiente accion

Convertir `RawMaterialResearchAgent` y `OptimizationAgent` en tools deterministas reales para que el supervisor pueda pasar de plan a candidatos controlados.
