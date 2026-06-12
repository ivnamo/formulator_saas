# Meta 105 - AI workflow model

## Meta

Separar los contratos de IA y agent plan del modelo global del workspace.

## Cambios

- Se crea `ai-workflow-model.ts`.
- Se mueven tipos de requirements, runs de IA, candidatos y planes del agente.
- `workspace-model.ts` reexporta esos tipos para mantener estables los imports actuales.

## Revision

- Alcance sin cambio funcional.
- Los paneles y acciones de IA quedan preparados para importar desde su modelo de dominio.
- `workspace-model.ts` queda mas enfocado en el estado central de tenant/formula.
