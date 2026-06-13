# Meta 143 - Workspace compatibility panel props

## Meta

Extraer el ensamblaje de props del panel de compatibilidad fuera de `WorkspaceHome`.

## Cambios

- Se crea `workspace-compatibility-panel-props.ts`.
- `WorkspaceHome` delega `panels.compatibility` en `buildWorkspaceCompatibilityPanelProps`.
- El helper queda tipado contra `WorkspaceHomePanels["compatibility"]`.

## Revision

- Sin cambio funcional esperado.
- `WorkspaceHome` pierde otro bloque de props inline.
- Se mantiene el patron incremental de extraccion panel por panel.
