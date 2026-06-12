# Meta 085 - Workspace shell state hook

## Meta

Extraer el estado global de shell de `apps/web/app/page.tsx` para que el componente raiz no gestione directamente la navegacion activa ni el estado de acciones.

## Cambios

- Se crea `useWorkspaceShellState`.
- El hook agrupa `activeView`, `setActiveView` y `useWorkspaceActionStatus`.
- `page.tsx` deja de importar `useState`, `WorkspaceView` y `useWorkspaceActionStatus`.

## Revision

- Alcance sin cambio funcional.
- Mantiene el estado inicial en `formula`.
- El hook queda acotado a UI shell y no toca dominio, calculo, tenant isolation ni persistencia.
