# Meta 072 - Workspace capabilities hook

## Objetivo

Reducir `page.tsx` moviendo las reglas de habilitacion de acciones a un hook dedicado.

## Cambios

- Nuevo `useWorkspaceCapabilities` para calcular busy state, permisos de tenant, bloqueos de borrador, guardado/calculo, importacion, IA, compatibilidad y Jira.
- `page.tsx` deja de importar `isTenantAdminRole` directamente y consume flags nombrados.
- Se conserva la logica existente de botones y paneles sin cambiar UX ni endpoints.

## Verificacion prevista

- `npm run typecheck --workspace apps/web`
- `npm run check --workspace apps/web`
- Smoke test de carga principal sin errores nuevos de consola.
