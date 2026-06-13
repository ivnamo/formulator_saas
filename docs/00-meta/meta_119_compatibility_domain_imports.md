# Meta 119 - Compatibility domain imports

## Meta

Reducir el acoplamiento del dominio de compatibilidad contra `workspace-model.ts`.

## Cambios

- `compatibility-actions.ts` importa reglas desde `compatibility-model.ts`, calculos desde `formula-model.ts` y estado desde `workspace-state-model.ts`.
- `compatibility-panel.tsx` usa `CompatibilityRuleRead` y `RawMaterial` desde sus modelos de dominio.
- `compatibility-state.ts` deja de depender del barrel global.

## Revision

- Sin cambio funcional esperado.
- El flujo de reglas de compatibilidad queda mas aislado para evolucionar validaciones y UX.
- `workspace-model.ts` conserva compatibilidad para dominios restantes.
