# Meta 075 - Workspace core state hook

## Objetivo

Agrupar estado base de tenant/workspace que seguia suelto en `page.tsx`.

## Cambios

- Nuevo `useWorkspaceCoreState` para `workspace`, nombre de workspace, formulario de parametro, invitaciones y formulario de invitacion.
- `InvitationForm` y `ParameterForm` pasan a tipos compartidos usados por Settings y sus actions.
- `page.tsx` deja de inicializar directamente este estado y reduce imports de modelo.

## Verificacion prevista

- `npm run typecheck --workspace apps/web`
- `npm run check --workspace apps/web`
- Smoke test de carga principal sin errores nuevos.
