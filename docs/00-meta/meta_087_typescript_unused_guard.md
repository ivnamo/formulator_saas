# Meta 087 - TypeScript unused guard

## Meta

Endurecer el quality gate del frontend para que imports, variables, parametros y callbacks muertos no vuelvan a acumularse en `apps/web`.

## Cambios

- Se activan `noUnusedLocals` y `noUnusedParameters` en `apps/web/tsconfig.json`.
- Se eliminan imports y valores derivados no usados en `page.tsx`.
- Se elimina el callback `prepareJiraReview`, que ya no tenia entrada desde la UI actual.

## Revision

- Alcance sin cambio funcional visible.
- El flujo actual de Jira sigue usando `sendCurrentFormulaToJira`, que crea el review si no existe y lo envia.
- La disciplina queda automatizada en `npm run typecheck --workspace apps/web`.
