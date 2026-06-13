# Meta 142 - Workspace raw materials panel props

## Meta

Reducir `WorkspaceHome` extrayendo el ensamblaje de props del panel de materias primas.

## Cambios

- Se crea `workspace-raw-materials-panel-props.ts`.
- `WorkspaceHome` delega `panels.rawMaterials` en `buildWorkspaceRawMaterialsPanelProps`.
- El helper usa `WorkspaceHomePanels["rawMaterials"]` como contrato de salida.

## Revision

- Sin cambio funcional esperado.
- El panel de materias primas queda preparado para futuras extracciones de acciones o estado sin tocar el render principal.
- Se mantiene el patron incremental panel por panel.
