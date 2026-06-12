# META-045 - Refactor de importacion Excel

## Decision

La cuadragesima quinta meta implementable de FormulIA Cloud es separar estado y vista de importacion Excel del `Home`.

## Contexto

`Home` seguia conteniendo el estado del archivo importado, hojas disponibles, preview, resolucion manual de filas y todo el JSX de la pantalla de importacion. La API y las mutaciones de workspace siguen siendo responsabilidades de la pagina, pero la UI y transiciones locales pueden aislarse.

## Alcance de esta slice

- Crear `apps/web/app/excel-import-state.ts`.
- Crear `apps/web/app/excel-import-panel.tsx`.
- Mover al hook:
  - archivo seleccionado,
  - nombre de archivo,
  - hojas disponibles,
  - hoja seleccionada,
  - preview,
  - reset,
  - resolucion local de filas.
- Mover la vista de importacion Excel a un componente presentacional.
- Mantener en `page.tsx` las llamadas API y mutaciones de formula/workspace.

## Fuera de alcance

- Cambiar endpoints de importacion.
- Cambiar textos o layout.
- Cambiar la logica de guardado de formula importada.

## Criterios de done

1. `page.tsx` no contiene el JSX de la seccion `import`.
2. Typecheck y build web pasan.
3. Browser local carga la app sin errores de consola.
4. Worktree queda limpio tras commit y push.

## Siguiente accion recomendada

Extraer comparacion de formulas guardadas o Jira/reviews, que son los siguientes dominios grandes que siguen dentro de `Home`.
