# Meta 125 - Material catalog filter panel

## Meta

Reducir la complejidad de los controles del catalogo de materias primas.

## Cambios

- Se crea `material-catalog-filter-panel.tsx` para aislar filtros avanzados, rangos por parametro y chips rapidos.
- `material-catalog-controls.tsx` queda centrado en busqueda y metadatos de resultados.
- El lookup de parametros activos usa un `Map` memoizado en lugar de buscar dentro de cada condicion.

## Revision

- Sin cambio funcional esperado.
- Se mantienen textos, clases CSS y handlers existentes.
- La zona de filtros del Formula Builder queda preparada para seguir iterando sin crecer el contenedor principal.
