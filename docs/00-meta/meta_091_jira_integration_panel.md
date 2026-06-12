# Meta 091 - Jira integration panel

## Meta

Reducir la responsabilidad de `SettingsPanel` extrayendo la configuracion de Jira y el mapeo de metadata a un componente dedicado.

## Cambios

- Se crea `JiraIntegrationPanel`.
- Se mueve `JIRA_MAPPING_KEYS` junto al UI que lo usa.
- `SettingsPanel` queda como composicion de workspace, cuenta, invitaciones, parametros e integraciones.

## Revision

- Alcance sin cambio funcional.
- Los callbacks y flags de permisos se mantienen iguales.
- Este corte deja la configuracion Jira preparada para futuras mejoras sin hacer crecer `settings-panel.tsx`.
