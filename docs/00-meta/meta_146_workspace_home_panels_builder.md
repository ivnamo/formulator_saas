# Meta 146 - Workspace home panels builder

## Meta

Separar el ensamblaje agregado de paneles de `WorkspaceHome` para que la pantalla principal no dependa directamente de cada builder de panel individual.

## Cambios

- Se crea `workspace-home-panels.ts`.
- El nuevo builder agrega settings, materias primas, compatibilidad, libreria, importacion Excel, asistente IA, formula builder y resultados.
- `WorkspaceHome` pasa argumentos por seccion y delega la composicion final en `buildWorkspaceHomePanels`.

## Revision

- Sin cambio funcional esperado.
- Los contratos del builder se derivan con `Parameters<typeof ...>[0]`, evitando duplicar tipos manuales.
- `WorkspaceHome` queda menos acoplado a los builders concretos de panel.
