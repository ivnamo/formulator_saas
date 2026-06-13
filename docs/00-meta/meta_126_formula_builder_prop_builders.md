# Meta 126 - Formula builder prop builders

## Meta

Reducir la complejidad del ensamblaje de props del Formula Builder.

## Cambios

- `formula-builder-panel-props.ts` separa el constructor monolitico en builders para basics, materials, composition y calculation.
- `buildFormulaBuilderPanelProps` queda como composicion de secciones.
- Se mantiene el mismo contrato de salida para `FormulaBuilderWorkspace`.

## Revision

- Sin cambio funcional esperado.
- El ensamblaje de props queda mas facil de auditar por paso del builder.
- La separacion mantiene imports directos y no introduce estado nuevo.
