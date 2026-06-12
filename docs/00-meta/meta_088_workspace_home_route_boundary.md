# Meta 088 - Workspace home route boundary

## Meta

Separar el entrypoint de ruta de Next (`page.tsx`) del componente cliente que orquesta el workspace.

## Cambios

- Se mueve la implementacion cliente de `page.tsx` a `workspace-home.tsx`.
- `page.tsx` queda como wrapper pequeno de ruta que renderiza `WorkspaceHome`.

## Revision

- Alcance sin cambio funcional.
- Mantiene `WorkspaceHome` como componente cliente con `"use client"`.
- Reduce el acoplamiento del entrypoint de Next y facilita futuras rutas o layouts sin tocar la orquestacion del workspace.
