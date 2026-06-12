# Meta 074 - Workspace action status hook

## Objetivo

Sacar de `page.tsx` el controlador local de estado de acciones.

## Cambios

- Nuevo `useWorkspaceActionStatus` para `status`, `message`, `setError` y `runAction`.
- `page.tsx` deja de importar `useCallback` y el tipo `Status`.
- Se conserva el comportamiento de mensajes, estado `working`, estado `idle` y captura de errores.

## Verificacion prevista

- `npm run typecheck --workspace apps/web`
- `npm run check --workspace apps/web`
- Smoke test de carga principal sin errores nuevos.
