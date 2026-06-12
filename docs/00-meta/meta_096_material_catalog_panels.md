# Meta 096 - Material catalog panels

## Meta

Separar las piezas visuales internas del catalogo de materias del Formula Builder.

## Cambios

- Se crea `MaterialCatalogList` para listado, acciones y detalle expandible de materias.
- Se crea `MaterialInspectorPanel` para la materia seleccionada.
- Se crea `MaterialComparePanel` para la comparacion rapida.
- `MaterialCatalogWorkspace` queda como composicion de lista, inspector y comparador.

## Revision

- Alcance sin cambio funcional.
- Se conservan filtros visibles, vista de parametros, estados de seleccion, expansion y comparacion.
- Este corte deja mas accesible la zona que el usuario revisa al elegir materias primas y parametros.
