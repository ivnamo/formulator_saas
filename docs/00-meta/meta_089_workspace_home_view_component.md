# Meta 089 - Workspace home view component

## Meta

Separar el render del shell autenticado de la orquestacion de estado y acciones de `WorkspaceHome`.

## Cambios

- Se crea `WorkspaceHomeView` para componer `AppShell` y `WorkspacePanels`.
- `WorkspaceHome` deja de importar directamente `AppShell` y `WorkspacePanels`.
- `WorkspacePanelsProps` se exporta para reutilizar el contrato de paneles sin duplicar tipos.

## Revision

- Alcance sin cambio funcional.
- La vista nueva es presentacional y recibe `panels` ya construidos.
- El siguiente corte natural es extraer la construccion de props de paneles o dividir `WorkspaceHome` por dominios de control.
