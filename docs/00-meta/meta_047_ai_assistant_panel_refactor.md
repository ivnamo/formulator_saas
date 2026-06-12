# META-047 - Refactor del panel de asistente IA

## Decision

La cuadragesima septima meta implementable de FormulIA Cloud es separar el panel visual del asistente IA del `Home`.

## Contexto

`Home` seguia conteniendo todo el render del parser de requisitos, plan supervisor, candidatos, formulas sugeridas y listado de ejecuciones IA. Las llamadas API y la aplicacion de drafts siguen siendo responsabilidades de la pagina, pero el render puede vivir en un componente presentacional.

## Alcance de esta slice

- Crear `apps/web/app/ai-assistant-panel.tsx`.
- Mover al panel:
  - textarea de requisito,
  - acciones `Parse`, `Plan` y `Runs`,
  - resumen de requisitos parseados,
  - plan supervisor,
  - candidatos de materia prima,
  - borradores de formula,
  - historial de ejecuciones IA,
  - formateadores locales del panel.
- Mantener en `page.tsx` las llamadas API y mutaciones sobre workspace/formula.

## Fuera de alcance

- Cambiar endpoints IA.
- Cambiar comportamiento de parse/plan/runs.
- Cambiar estilos o layout del panel IA.

## Criterios de done

1. `page.tsx` no contiene el JSX de la seccion `ai`.
2. Typecheck y build web pasan.
3. Browser local carga la vista `Asistente IA` sin errores de consola.
4. Worktree queda limpio tras commit y push.

## Siguiente accion recomendada

Extraer configuracion/Jira, que es el bloque de UI mas grande que sigue dentro de `Home`.
