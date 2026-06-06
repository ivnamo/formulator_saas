# DeepAgents supervisor

## Proposito

`FormulationSupervisorAgent` es la capa de orquestacion de FormulIA Cloud. Su responsabilidad inicial es convertir una peticion en un plan tecnico, invocar tools deterministas y dejar trazabilidad.

No debe generar formulas finales ni porcentajes sin pasar por tools de calculo, compatibilidad, optimizacion y revision humana.

## Configuracion

Modo local por defecto:

```text
AGENT_ORCHESTRATOR_PROVIDER=deterministic
```

Modo DeepAgents:

```text
AGENT_ORCHESTRATOR_PROVIDER=deepagents
AGENT_ORCHESTRATOR_MODEL=gpt-5-nano
```

Para instalar el harness:

```powershell
.\.venv\Scripts\python -m pip install -e "apps/api[agents]"
```

`deepagents` se carga de forma perezosa. La API arranca sin el extra instalado y devuelve un error claro si se activa el provider sin dependencia.

## Endpoints

- `POST /api/v1/ai/supervisor/plan`
- `GET /api/v1/ai/runs/{run_id}`

## Auditoria

Cada plan crea:

- `ai_runs.run_type = formulation_supervisor`
- `ai_tool_calls.tool_name = RequirementParserAgent`
- `ai_tool_calls.tool_name = RawMaterialResearchAgent`
- `ai_tool_calls.tool_name = OptimizationAgent`

El detalle del run devuelve los tool calls y respeta `tenant_id`.

## META-013

El modo determinista ya ejecuta tools reales para pasar de requisitos a candidatos controlados:

- `RawMaterialResearchAgent` devuelve materias primas activas y no obsoletas del tenant, con precio EUR/kg, valores tecnicos, score y warnings.
- `OptimizationAgent` prepara objetivo, constraints y candidate ids, pero deja `solver = not_started`.

El resultado puede estar `ready` para un solver posterior o `blocked` si faltan candidatos, cobertura tecnica o precios necesarios.

## META-014

`OptimizationAgent` incorpora el primer solver determinista:

- `solver = grid_v1`
- paso de rejilla de 5 puntos porcentuales,
- maximo 4 candidatos usados por rendimiento,
- validacion con `formulia_core.calculate_formula`,
- output `formula_candidates` con estado `draft`.

Estados posibles:

- `solved`: hay una propuesta draft que cumple las restricciones soportadas.
- `infeasible`: hay cobertura, pero la rejilla no encuentra solucion.
- `blocked`: faltan candidatos, parametros, precios o restricciones numericas.

La UI muestra la propuesta, pero no la guarda automaticamente.

## Regla de seguridad funcional

El supervisor propone borradores controlados. Ninguna formula queda guardada ni se considera final sin aplicarla al editor, recalcularla y pasar revision humana.
