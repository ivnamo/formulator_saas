# Meta 095 - Jira panel sections

## Meta

Separar las secciones internas del panel de integracion Jira para que el contenedor solo componga la configuracion y la metadata.

## Cambios

- Se crea `JiraConnectionSettings` para formulario, acciones y resumen de conexion.
- Se crea `JiraMetadataPanel` para proyectos, tipos de issue, campos y mapeo.
- `JiraIntegrationPanel` queda como contenedor de la seccion `integrations`.

## Revision

- Alcance sin cambio funcional.
- `JIRA_MAPPING_KEYS` vive junto al selector de metadata que lo usa.
- Este corte facilita ajustar UX de credenciales y mapeo Jira sin volver a inflar `SettingsPanel`.
