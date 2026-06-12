# Meta 090 - Workspace panel props constant

## Meta

Separar la construccion de props de paneles del JSX final de `WorkspaceHome`.

## Cambios

- Se exporta el tipo `WorkspaceHomePanels`.
- `WorkspaceHome` construye `panels` como constante tipada con `satisfies`.
- El render final de `WorkspaceHomeView` queda reducido a props de shell mas `panels={panels}`.

## Revision

- Alcance sin cambio funcional.
- El contrato de paneles queda validado por TypeScript con `noUnused*` activo.
- Este corte prepara una extraccion posterior por dominios (`settings`, `formulaBuilder`, `library`) sin mezclarla en esta rama.
