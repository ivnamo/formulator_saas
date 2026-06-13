# Meta 122 - Workspace model barrel removal

## Meta

Cerrar la migracion desde `workspace-model.ts` a modelos de dominio explicitos.

## Cambios

- La carcasa de workspace y settings importa `Status`, tenants e invitaciones desde `workspace-base-model.ts`.
- El estado editable del workspace importa `WorkspaceState` y `emptyWorkspace` desde `workspace-state-model.ts`.
- Los flujos mixtos importan contratos desde sus modelos concretos: `formula-model.ts`, `excel-import-model.ts` y `jira-connection-model.ts`.
- Se elimina `workspace-model.ts` porque ya no tenia consumidores no documentales.

## Revision

- Sin cambio funcional esperado.
- El codigo queda sin barrel global de compatibilidad para evitar nuevos acoplamientos accidentales.
- Las menciones historicas en `docs/00-meta` se mantienen como registro de la migracion incremental.
