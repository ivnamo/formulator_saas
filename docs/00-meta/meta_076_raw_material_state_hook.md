# Meta 076 - Raw material state hook

## Objetivo

Agrupar estado local de materias primas que seguia suelto en `page.tsx`.

## Cambios

- Nuevo `useRawMaterialWorkspaceState` para formulario de materia prima, ids con detalle cargado y alias pendientes.
- `page.tsx` deja de inicializar directamente ese estado y conserva los mismos setters para acciones, importacion y paneles.
- No cambia ningun contrato API ni comportamiento de calculo.

## Verificacion prevista

- `npm run typecheck --workspace apps/web`
- `npm run check --workspace apps/web`
- Smoke test de materias primas y Formula Builder sin errores nuevos.
