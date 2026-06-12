# Meta 068 - Workspace auth session hook

## Objetivo

Separar la gestion de sesion Supabase y cabeceras autenticadas de `apps/web/app/page.tsx`.

## Cambios

- Nuevo `useWorkspaceAuthSession` para obtener sesion, estado de validacion y headers HTTP.
- Nuevo `useAuthenticatedWorkspaceLoad` para cargar el tenant inicial cuando hay token y aun no existe workspace activo.
- `page.tsx` deja de importar `Session` y el cliente Supabase directamente.

## Verificacion prevista

- `npm run typecheck --workspace apps/web`
- `npm run check --workspace apps/web`
- Smoke test autenticado del Formula Builder sin warnings ni errores nuevos.
