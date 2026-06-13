# Meta 144 - Workspace secondary panel props

## Meta

Seguir reduciendo `WorkspaceHome` extrayendo el ensamblaje de props de biblioteca, importacion Excel y asistente IA.

## Cambios

- Se crea `workspace-library-panel-props.ts`.
- Se crea `workspace-excel-import-panel-props.ts`.
- Se crea `workspace-ai-assistant-panel-props.ts`.
- `WorkspaceHome` delega `panels.library`, `panels.excelImport` y `panels.aiAssistant` en builders tipados.

## Revision

- Sin cambio funcional esperado.
- Los helpers usan `WorkspaceHomePanels[...]` como contrato, evitando duplicar tipos manuales.
- `WorkspaceHome` queda mas cerca de ser solo orquestacion de hooks y composicion final.
