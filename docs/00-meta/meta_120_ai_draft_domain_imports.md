# Meta 120 - AI draft domain imports

## Meta

Reducir el acoplamiento de AI assistant y draft review contra `workspace-model.ts`.

## Cambios

- `ai-assistant-actions.ts` importa `WorkspaceState` desde `workspace-state-model.ts`.
- `ai-assistant-panel.tsx` importa `formatDateTime` desde `workspace-utils.ts`.
- `draft-review-actions.ts` importa resultados/historial desde `formula-model.ts`, lineas desde `workspace-base-model.ts`, estado desde `workspace-state-model.ts` y `makeLocalId` desde `workspace-utils.ts`.

## Revision

- Sin cambio funcional esperado.
- El flujo AI/draft review queda alineado con los modelos de dominio ya extraidos.
- `workspace-model.ts` sigue como compatibilidad para los pocos consumidores restantes.
