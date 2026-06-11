# META-038 - Formula Builder como mesa de formulacion

## Decision

La trigesima octava meta implementable de FormulIA Cloud es recuperar el flujo operativo real del legacy `ivnamo/formulator`: una pantalla central para formular, calcular, guardar y preparar revision, sin obligar al usuario a saltar entre Materias primas, Formula y Resultados.

## Contexto

La UI SaaS habia crecido como un panel administrativo dividido por entidades:

- Formula actual.
- Materias primas.
- Importar Excel.
- Resultados.
- Configuracion.

El flujo real del formulador es distinto. En `ivnamo/formulator`, el trabajo diario ocurre en una misma mesa:

1. Buscar materias primas.
2. Anadirlas a la formula.
3. Editar porcentajes.
4. Cambiar orden de adicion.
5. Elegir parametros o familias visibles.
6. Ver total, coste y composicion.
7. Guardar y exportar.

## Alcance de esta slice

- Renombrar la pantalla principal a `Formula Builder`.
- Anadir buscador rapido de materias primas dentro de la pantalla de formula.
- Enriquecer el modelo frontend de materia prima con codigo ERP, familia y estado activo/obsoleto.
- Sustituir la lista simple de lineas por tabla operativa con:
  - orden,
  - codigo,
  - materia prima,
  - porcentaje editable,
  - precio,
  - coste parcial,
  - parametro activo,
  - warnings de linea,
  - subir/bajar,
  - duplicar,
  - eliminar.
- Mostrar preview local de total, precio y parametro activo.
- Mostrar resultados oficiales backend en la misma pantalla cuando existan.
- Mover `Resultados` fuera de la navegacion principal.
- Quitar `ProyectoID` como requisito para guardar/calcular; Jira queda como accion final.
- Permitir que importacion Excel guarde borrador sin Jira configurado.

## Fuera de alcance

- Drag and drop real en la tabla.
- Extraer todos los componentes fuera de `page.tsx`.
- API enriquecida para listar todos los precios/parametros vigentes por materia prima.
- CRUD completo de materias primas con drawer.
- Wizard completo de importacion Excel.
- Export Excel generico fuera del flujo Jira.
- Rehacer IA, optimizador o comparador.

## Criterios de done

1. La pantalla principal permite buscar y anadir materias primas sin ir al CRUD.
2. La formula se edita en una tabla central, no en una lista simple.
3. El usuario ve total %, precio estimado, parametro activo y warnings en la misma pantalla.
4. El calculo oficial sigue viniendo del backend.
5. Jira no bloquea guardar/calcular.
6. La app web pasa typecheck y build.
7. La app local carga sin errores de consola hasta login.

## Validacion ejecutada

- `npm run check --workspace apps/web`
- Browser local en `http://127.0.0.1:3000`, redireccion a login sin errores de consola.

## Riesgos y deuda aceptada

- `apps/web/app/page.tsx` queda aun mas grande. La siguiente meta debe extraer componentes del Formula Builder antes de seguir ampliando funcionalidad.
- El preview local solo usa los datos disponibles actualmente en frontend. Para recuperar todas las familias legacy de forma real, hace falta exponer parametros/precios vigentes por materia prima desde API.
- La tabla usa botones subir/bajar en lugar de drag and drop. Es suficiente para validar el flujo, pero no cierra la ergonomia final.

## Siguiente accion recomendada

Extraer componentes y helpers del Formula Builder:

- `FormulaMaterialSearch`
- `FormulaLineTable`
- `FormulaCalculationPanel`
- `FormulaActionsBar`

Despues, ampliar API/frontend para cargar parametros tecnicos multiples por materia prima y mapear familias legacy a parametros configurables del tenant.
