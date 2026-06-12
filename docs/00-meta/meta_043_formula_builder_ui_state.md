# META-043 - Estado UI dedicado del Formula Builder

## Decision

La cuadragesima tercera meta implementable de FormulIA Cloud es mover el estado local de UI del Formula Builder a un hook con reducer.

## Contexto

Despues de separar componentes y helpers derivados, `Home` seguia declarando muchos `useState` y handlers de transicion para filtros, presets, secciones y seleccion de materias. Esa logica no pertenece a API ni persistencia y puede vivir en un hook dedicado.

## Alcance de esta slice

- Crear `apps/web/app/formula-builder-ui-state.ts`.
- Concentrar en reducer:
  - busqueda de materias,
  - preset y parametros personalizados,
  - filtros de catalogo,
  - limite de resultados,
  - materia inspeccionada,
  - comparador y expansion de materias,
  - secciones abiertas del builder.
- Mantener en `page.tsx` los efectos de API, guardado, calculo, Jira y mutaciones de workspace.

## Fuera de alcance

- Migrar server state del catalogo a SWR/TanStack Query.
- Cambiar layout o textos.
- Cambiar contratos de backend.

## Criterios de done

1. `page.tsx` no declara `useState` para estado local del builder.
2. Los handlers de filtros/presets viven en el hook.
3. Typecheck y build web pasan.
4. Browser local carga tenant, catalogo y calculo vivo sin errores de consola.

## Siguiente accion recomendada

Extraer un hook de datos del catalogo o introducir SWR/TanStack Query para separar server state de la pagina.
