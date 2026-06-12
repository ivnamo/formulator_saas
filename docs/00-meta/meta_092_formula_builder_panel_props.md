# Meta 092 - Formula builder panel props

## Meta

Reducir la responsabilidad de `WorkspaceHome` extrayendo la construccion de props del panel Formula Builder.

## Cambios

- Se crea `buildFormulaBuilderPanelProps`.
- El helper arma las props de `basics`, `materials`, `composition` y `calculation` desde el estado y callbacks ya existentes.
- `WorkspaceHome` conserva la orquestacion de hooks, pero deja de contener el objeto anidado completo del Formula Builder.

## Revision

- Alcance sin cambio funcional.
- El contrato sigue tipado contra `WorkspaceHomePanels["formulaBuilder"]`.
- Este corte facilita extraer despues mas props de paneles por dominio sin tocar la logica de calculo ni la UI del builder.
