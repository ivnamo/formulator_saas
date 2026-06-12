# Meta 094 - AI agent plan panel

## Meta

Separar el bloque visual de plan del supervisor IA del panel principal de asistente.

## Cambios

- Se crea `AiAgentPlanPanel`.
- El componente nuevo contiene pasos, resumen de busqueda, infeasibilidades, candidatos de materias y candidatos de formula.
- `AiAssistantPanel` queda centrado en entrada de requisitos, resultado parseado y listado de ejecuciones IA.

## Revision

- Alcance sin cambio funcional.
- Los helpers de formateo de candidatos viven junto al componente que los usa.
- El panel de IA queda preparado para extraer despues el resultado parseado o el listado de runs.
