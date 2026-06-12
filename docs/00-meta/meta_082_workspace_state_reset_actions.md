# Meta 082 - Workspace state reset actions

## Objetivo

Reducir acoplamiento entre `page.tsx` y las acciones de settings al crear o cargar workspace.

## Cambios

- Los hooks de estado de materias primas, formula, compatibilidad, Jira e IA exponen resets de dominio.
- `useFormulaBuilderUiState` expone un reset de seleccion de materias del builder.
- `useWorkspaceSettingsActions` usa resets de dominio en vez de listas largas de setters individuales.
- Se mantiene `setResult` solo para invalidar el calculo al crear parametros.

## Verificacion prevista

- `npm run typecheck --workspace apps/web`
- `npm run check --workspace apps/web`
- Smoke test de carga principal y navegacion basica sin errores nuevos.
