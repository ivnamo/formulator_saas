# Meta 093 - Saved comparison result component

## Meta

Separar el resultado visual de comparacion de formulas guardadas del panel principal de biblioteca.

## Cambios

- Se crea `SavedFormulaComparisonResult`.
- El componente nuevo contiene cabecera, estadisticas, resumen de compliance, constraints, parametros y materiales.
- `SavedFormulaComparisonPanel` queda centrado en selectores, constraints editables, listado e historial.

## Revision

- Alcance sin cambio funcional.
- Los formateadores permanecen compartidos en `formula-formatters`.
- El panel de biblioteca queda mas pequeno y preparado para extraer despues listado e historial como piezas independientes.
