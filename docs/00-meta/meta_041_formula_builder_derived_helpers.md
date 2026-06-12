# META-041 - Helpers derivados del Formula Builder

## Decision

La cuadragesima primera meta implementable de FormulIA Cloud es sacar calculos derivados del Formula Builder fuera de `apps/web/app/page.tsx`.

## Contexto

Tras separar componentes presentacionales, `Home` seguia conteniendo algoritmos de preparacion de datos: mapa de materias primas, lineas enriquecidas, catalogo de parametros, preview local, seleccion de materiales y filas de calculo. Ese codigo no depende de React ni de APIs, asi que debe vivir en helpers puros.

## Alcance de esta slice

- Crear `apps/web/app/formula-builder-derived.ts`.
- Mover a helpers puros:
  - `buildRawMaterialsById`,
  - `buildFormulaLineDetails`,
  - `buildParameterCatalog`,
  - `selectVisibleParameterCodes`,
  - `buildLocalFormulaPreview`,
  - `buildMaterialSearchResults`,
  - seleccion de materia inspeccionada y materiales comparados,
  - filas de calculo visibles,
  - total y balance de formula.
- Mantener `page.tsx` como orquestador con `useMemo`, estado, efectos, API y handlers.

## Fuera de alcance

- Rehacer el estado del builder con reducer.
- Cambiar textos, layout o comportamiento visible.
- Cambiar contratos de API o persistencia.

## Criterios de done

1. `page.tsx` deja de contener algoritmos largos de preview/catalogo.
2. Los helpers no importan React ni componentes.
3. Los componentes reutilizan tipos derivados compartidos.
4. Typecheck y build web pasan.
5. Browser local carga el Formula Builder con datos reales y sin errores de consola.

## Siguiente accion recomendada

Extraer el estado local del builder a un reducer o hook dedicado, manteniendo los efectos de API separados de las transiciones de UI.
