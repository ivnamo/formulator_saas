# Meta 077 - Formula workspace state hook

## Objetivo

Agrupar estado local de formula, biblioteca e historial que seguia suelto en `page.tsx`.

## Cambios

- Nuevo `useFormulaWorkspaceState` para resultado calculado, formulas guardadas, historial y reviews.
- `page.tsx` conserva los mismos valores y setters para acciones y paneles existentes.
- Se eliminan imports de tipos de formula que ahora pertenecen al hook.

## Verificacion prevista

- `npm run typecheck --workspace apps/web`
- `npm run check --workspace apps/web`
- Smoke test de navegacion Formula Builder/Biblioteca/Resultados sin errores nuevos.
