# Meta 073 - App shell component

## Objetivo

Reducir `page.tsx` separando el layout persistente de la aplicacion autenticada.

## Cambios

- Nuevo `AppShell` con sidebar, navegacion primaria, herramientas avanzadas, topbar, menu de cuenta y status line.
- `WorkspaceView`, titulos y descripciones de vistas pasan al shell.
- `page.tsx` conserva el login/loading y la orquestacion de paneles, pero deja de renderizar el layout global inline.

## Verificacion prevista

- `npm run typecheck --workspace apps/web`
- `npm run check --workspace apps/web`
- Smoke test de carga principal y navegacion basica sin errores nuevos.
