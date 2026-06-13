# Meta 136 - AI workflow API client

## Meta

Separar las llamadas HTTP del flujo de asistente IA del hook de acciones UI.

## Cambios

- Se crea `ai-workflow-api.ts` con helpers para listar runs, parsear requisitos y crear el plan del supervisor.
- `ai-assistant-actions.ts` conserva validaciones de workspace/texto, actualizacion de estado, mensajes y reutilizacion de acciones sugeridas.
- Los payloads y rutas se mantienen sin cambio funcional.

## Revision

- El hook queda alineado con el patron de clientes API dedicados.
- El flujo local de `reuseInfeasibilityAction` permanece en el hook porque es comportamiento de UI.
- La separacion reduce acoplamiento antes de tocar nuevas capacidades IA.
