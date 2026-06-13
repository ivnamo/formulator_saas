# Meta 148 - Workspace home controller

## Meta

Separar la orquestacion de hooks y acciones de `WorkspaceHome` para que el componente principal quede como frontera de render.

## Cambios

- Se crea `workspace-home-controller.ts` con `useWorkspaceHomeController`.
- `WorkspaceHome` queda reducido a la puerta de autenticacion y el render de `WorkspaceHomeView`.
- `WorkspaceHomeViewProps` se exporta para tipar el contrato entre controller y vista.

## Revision

- Sin cambio funcional esperado.
- La pagina conserva la misma puerta de autenticacion y las mismas props de vista.
- El siguiente refactor puede centrarse en dividir el controller por dominios sin tocar la vista.
