# Meta 080 - Jira connection state hook

## Objetivo

Agrupar estado local de integracion Jira que seguia suelto en `page.tsx`.

## Cambios

- Nuevo `useJiraConnectionState` para conexiones, formulario, metadata y clave de mapeo.
- `page.tsx` deja de importar tipos y defaults de Jira solo para inicializar estado.
- Se conserva `emptyJiraConnectionForm` como fuente de defaults.

## Verificacion prevista

- `npm run typecheck --workspace apps/web`
- `npm run check --workspace apps/web`
- Smoke test de Configuracion/Jira sin errores nuevos.
