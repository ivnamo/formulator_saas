# META-013 - Deterministic agent tools

## Decision

La decimotercera meta implementable de FormulIA Cloud es convertir `RawMaterialResearchAgent` y `OptimizationAgent` en tools deterministas reales, auditadas y tenant-scoped.

Esta meta no genera formulas finales. El supervisor puede pasar de un texto libre a candidatos controlados y a un plan de optimizacion, pero no calcula porcentajes ni guarda formulas propuestas.

## Alcance incluido

- Rama `codex/deterministic-agent-tools`.
- `RawMaterialResearchAgent` como tool determinista:
  - lee materias primas del tenant activo,
  - incorpora precio vigente,
  - incorpora valores tecnicos por parametro,
  - excluye obsoletas/inactivas por defecto,
  - respeta materias excluidas,
  - puntua candidatos de forma explicable.
- `OptimizationAgent` como tool determinista:
  - convierte requisitos en objetivo y restricciones,
  - usa solo los candidatos devueltos por la research tool,
  - marca si el problema esta listo o bloqueado,
  - no calcula porcentajes.
- Auditoria en `ai_tool_calls` para ambas tools.
- Respuesta del supervisor con `candidate_research` y `optimization_plan`.
- UI con resumen de candidatos y estado de optimizacion.
- Tests sin llamadas reales a OpenAI ni DeepAgents.
- Quality/refactor gate antes de cerrar rama.

## Fuera de alcance

- Solver matematico real.
- Generacion o guardado de alternativas de formula.
- Compatibilidad quimica.
- RAG documental.
- Scoring basado en historico de uso.
- Disponibilidad ERP real.

## Criterios de done

1. El supervisor determinista llama y audita `RawMaterialResearchAgent`.
2. El supervisor determinista llama y audita `OptimizationAgent`.
3. Los candidatos se limitan al tenant activo.
4. Las materias obsoletas o inactivas no se proponen por defecto.
5. Las materias excluidas en el requisito no aparecen como candidatas.
6. El plan de optimizacion declara objetivo, restricciones y estado sin inventar porcentajes.
7. Si faltan candidatos o cobertura tecnica, el plan queda bloqueado con razones.
8. La UI muestra candidatos y estado de optimizacion.
9. Tests/checks pasan.
10. La rama se sube sin mezclar cambios Jira pendientes.

## Testing minimo

- `python -m pytest apps/api/tests/test_ai_supervisor.py`.
- `python -m pytest`.
- `npm run check`.
- `npm audit --audit-level=moderate`.
- `git diff --check`.
- `rg` de referencias prohibidas o naming heredado.

## Riesgos

- No confundir candidato de materia prima con formula viable.
- No resolver optimizacion en esta meta.
- No filtrar ni mezclar datos de otro tenant.
- Mantener la logica de scoring simple y explicable.
- No duplicar calculo de formula: el calculo real sigue en `formulia_core`.

## Siguiente accion

Implementar el primer `OptimizerTool` determinista con solver conservador para generar una formula candidata solo cuando las restricciones tengan cobertura suficiente.
