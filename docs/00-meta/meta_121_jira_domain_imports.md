# Meta 121 - Jira domain imports

## Meta

Reducir el acoplamiento de los flujos Jira contra `workspace-model.ts`.

## Cambios

- `jira-connection-actions.ts` importa tipos Jira desde `jira-connection-model.ts`, `Status` desde `workspace-base-model.ts` y `WorkspaceState` desde `workspace-state-model.ts`.
- `jira-review-actions.ts` importa resultados y revisiones desde `formula-model.ts`, la conexion Jira desde `jira-connection-model.ts` y el estado desde `workspace-state-model.ts`.
- Los paneles y el callback OAuth de Jira consumen tipos directamente desde `jira-connection-model.ts`.

## Revision

- Sin cambio funcional esperado.
- La capa Jira queda alineada con los modelos de dominio ya extraidos.
- `workspace-model.ts` sigue como compatibilidad para los consumidores pendientes.
