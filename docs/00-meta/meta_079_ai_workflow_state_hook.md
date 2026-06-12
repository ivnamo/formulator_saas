# Meta 079 - AI workflow state hook

## Objetivo

Agrupar estado local de requisitos, supervisor IA y revision de borradores.

## Cambios

- Nuevo `useAiWorkflowState` para texto de requisito, parseo, plan, draft review y runs IA.
- `page.tsx` deja de importar tipos de IA solo para inicializar estado.
- Se conserva el texto inicial y todos los setters usados por acciones y paneles.

## Verificacion prevista

- `npm run typecheck --workspace apps/web`
- `npm run check --workspace apps/web`
- Smoke test de navegacion hacia Asistente IA sin errores nuevos.
