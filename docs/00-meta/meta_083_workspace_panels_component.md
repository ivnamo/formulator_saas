# Meta 083 - Workspace panels component

## Objetivo

Separar la composicion visual de paneles de `page.tsx`.

## Cambios

- Nuevo `WorkspacePanels` para renderizar settings, materias primas, compatibilidad, biblioteca, importacion, IA, builder y resultados.
- `page.tsx` mantiene la orquestacion de estado/acciones pero delega el `active` de cada panel.
- Los contratos se infieren con `ComponentProps` de los componentes reales para evitar duplicar tipos.

## Verificacion prevista

- `npm run typecheck --workspace apps/web`
- `npm run check --workspace apps/web`
- Smoke test de navegacion por paneles principales sin errores nuevos.
