# META-044 - Hook de catalogo de materias del Formula Builder

## Decision

La cuadragesima cuarta meta implementable de FormulIA Cloud es separar el server state del catalogo de materias primas del `Home`.

## Contexto

`Home` ya habia cedido componentes, helpers derivados y estado UI local, pero todavia contenia el efecto que construia filtros, llamaba a `/api/v1/raw-materials/catalog`, gestionaba loading/ids/total/familias y refrescaba el catalogo tras cambios de materias o alias.

## Alcance de esta slice

- Crear `apps/web/app/formula-builder-catalog.ts`.
- Mover al hook `useRawMaterialCatalog`:
  - estado de ids, total, familias y loading,
  - construccion de query params,
  - llamada al endpoint de catalogo,
  - normalizacion de items,
  - refresh imperativo del catalogo.
- Mantener en `Home` la propiedad del workspace mediante callback `onMaterialsLoaded`.
- Mantener en `Home` la gestion de errores de UI mediante callback `onError`.

## Fuera de alcance

- Adoptar SWR/TanStack Query.
- Cambiar filtros visibles o contratos API.
- Cambiar persistencia de materias.

## Criterios de done

1. `page.tsx` no contiene el fetch directo de `/api/v1/raw-materials/catalog`.
2. Las mutaciones que afectan al catalogo usan `refreshCatalog`.
3. Typecheck y build web pasan.
4. Browser local carga tenant, catalogo y precios sin errores de consola.

## Siguiente accion recomendada

Separar hooks de dominios restantes en `Home`: importacion Excel, Jira/reviews o comparacion de formulas guardadas.
