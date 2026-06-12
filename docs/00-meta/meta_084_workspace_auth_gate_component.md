# Meta 084 - Workspace auth gate component

## Meta

Reducir la responsabilidad de `apps/web/app/page.tsx` extrayendo la pantalla de validacion de sesion a un componente de presentacion.

## Cambios

- Se crea `WorkspaceAuthGate` para encapsular la pantalla de carga de autenticacion.
- `page.tsx` deja de importar iconos de presentacion y solo decide cuando mostrar la puerta de autenticacion.

## Revision

- Alcance sin cambio funcional.
- Mantiene los estilos existentes (`loginShell`, `loginPanel`, `brand`, `statusLine`, `spin`).
- Refactor compatible con la disciplina solodev registrada en ADR-013: rama corta, cambio atomico y verificaciones proporcionales.
