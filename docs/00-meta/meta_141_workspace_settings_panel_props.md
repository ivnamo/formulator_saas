# Meta 141 - Workspace settings panel props

## Meta

Reducir la responsabilidad de `WorkspaceHome` extrayendo el ensamblaje de props del panel de settings.

## Cambios

- Se crea `workspace-settings-panel-props.ts`.
- `WorkspaceHome` delega la construccion de `panels.settings` en `buildWorkspaceSettingsPanelProps`.
- El helper tipa entradas y salida contra `WorkspaceHomePanels["settings"]`.

## Revision

- Sin cambio funcional esperado.
- `WorkspaceHome` queda mas centrado en orquestacion de hooks.
- Este patron se puede repetir panel por panel sin una macro-extraccion arriesgada.
