# Meta 116 - Formula library domain imports

## Meta

Reducir el acoplamiento de la libreria y comparador de formulas contra `workspace-model.ts`.

## Cambios

- Acciones, estado y paneles de formulas guardadas importan tipos desde `formula-model.ts`.
- Comparadores de formulas importan `FormulaLine` desde `workspace-base-model.ts`.
- Paneles de resultados usan `CalculationResult` desde el modelo de formulas.
- Utilidades como `formatDateTime`, `normalizeCode` y `parseOptionalNumber` se importan desde `workspace-utils.ts`.

## Revision

- Sin cambio funcional esperado.
- El dominio de formulas queda mas explicito y preparado para seguir adelgazando el barrel global.
- `workspace-model.ts` mantiene compatibilidad para dominios no migrados.
