# Meta 104 - Jira connection model

## Meta

Separar el contrato de Jira del modelo global del workspace.

## Cambios

- Se crea `jira-connection-model.ts`.
- Se mueven tipos de conexion, metadata OAuth/Jira y `emptyJiraConnectionForm`.
- `workspace-model.ts` reexporta el contrato para mantener estables los imports actuales.

## Revision

- Alcance sin cambio funcional.
- Los hooks y paneles de Jira quedan preparados para importar directamente del modelo de Jira en futuros cortes.
- `workspace-model.ts` reduce mezcla entre dominio central de formulas y detalles de integracion.
