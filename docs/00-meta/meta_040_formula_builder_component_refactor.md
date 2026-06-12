# META-040 - Primer corte de componentes del Formula Builder

## Decision

La cuadragesima meta implementable de FormulIA Cloud es empezar a extraer el Formula Builder de `apps/web/app/page.tsx` sin cambiar comportamiento funcional.

## Contexto

El Formula Builder ya recupera el flujo operativo de legacy, pero quedo concentrado en una pagina muy grande. Antes de anadir mas capacidades, conviene separar piezas presentacionales y helpers de dominio UI para reducir riesgo, mejorar legibilidad y facilitar pruebas posteriores.

## Alcance de esta slice

- Crear `apps/web/app/formula-builder-model.ts` con:
  - familias de parametros legacy,
  - presets de visualizacion,
  - tipos del builder,
  - helpers de formato, ordenacion y seleccion de parametros.
- Crear `apps/web/app/formula-builder-components.tsx` con:
  - `BuilderStep`,
  - `ParameterPresetPicker`,
  - `FormulaProgressSummary`,
  - `FormulaLineTable`.
  - `MaterialCatalogControls`.
  - `MaterialCatalogWorkspace`.
  - `FormulaCalculationPanel`.
- Mantener en `page.tsx` la orquestacion de estado, API, guardado, calculo y Jira.
- Registrar la regla solodev en README y ADR.

## Fuera de alcance

- Rehacer el estado del builder con reducers.
- Separar Jira review o draft review.
- Cambiar CSS, layout o textos visibles.
- Cambiar contratos API.

## Criterios de done

1. `page.tsx` deja de contener presets/familias/helpers del builder.
2. La tabla de lineas de formula vive en componente presentacional.
3. Los controles de busqueda/filtros del catalogo viven en componente presentacional.
4. La lista/inspector/comparador de materias vive en componente presentacional.
5. El panel de calculo vivo y guardado vive en componente presentacional.
6. La UI mantiene los mismos handlers y comportamiento.
7. Typecheck web pasa.
8. La rama queda con commit atomico, push y worktree limpio.

## Validacion esperada

- `npm run typecheck --workspace apps/web`
- `npm run check --workspace apps/web`
- Browser local en `http://127.0.0.1:3000/` para comprobar carga, consola y flujo basico del builder.

## Siguiente accion recomendada

Extraer en una siguiente rama:

- `DraftReviewPanel`,
- `JiraReviewPanel`.

Despues de ese segundo corte, valorar un reducer para estado local del builder y mover helpers de calculo preview fuera de `Home`.
