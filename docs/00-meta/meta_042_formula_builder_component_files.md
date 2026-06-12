# META-042 - Archivos dedicados para componentes del Formula Builder

## Decision

La cuadragesima segunda meta implementable de FormulIA Cloud es dividir el antiguo `formula-builder-components.tsx` en componentes por archivo.

## Contexto

El refactor anterior separo la UI del `Home`, pero concentro muchos componentes en un unico archivo. Eso reducia el ruido de `page.tsx`, aunque seguia dificultando revisar, probar y modificar piezas concretas del builder.

## Alcance de esta slice

- Crear `apps/web/app/formula-builder-ui/`.
- Mover a archivos dedicados:
  - `builder-step.tsx`,
  - `parameter-preset-picker.tsx`,
  - `formula-progress-summary.tsx`,
  - `formula-line-table.tsx`,
  - `material-catalog-controls.tsx`,
  - `material-catalog-workspace.tsx`,
  - `formula-calculation-panel.tsx`,
  - `draft-review-panel.tsx`,
  - `jira-review-panel.tsx`.
- Actualizar `page.tsx` para usar imports directos.
- Eliminar el archivo monolitico `formula-builder-components.tsx`.

## Fuera de alcance

- Cambiar comportamiento visual o textos.
- Cambiar estado, API o persistencia.
- Introducir un barrel de reexportacion.

## Criterios de done

1. No quedan imports a `formula-builder-components`.
2. Typecheck y build web pasan.
3. Browser local carga el builder con tenant, catalogo y calculo vivo.
4. Worktree queda limpio tras commit y push.

## Siguiente accion recomendada

Extraer un hook/reducer para estado local del builder, empezando por secciones abiertas, filtros, seleccion de materia y comparador.
