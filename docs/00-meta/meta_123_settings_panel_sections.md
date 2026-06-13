# Meta 123 - Settings panel sections

## Meta

Reducir la complejidad visual de `settings-panel.tsx` sin cambiar comportamiento.

## Cambios

- Se crea `settings-panel-sections.tsx` con secciones presentacionales para workspace, cuenta, invitaciones y parametros.
- `settings-panel.tsx` queda como ensamblador de secciones y de `JiraIntegrationPanel`.
- Se mantienen textos, clases CSS y handlers existentes.

## Revision

- Sin cambio funcional esperado.
- El panel de configuracion queda mas facil de leer y modificar por bloques.
- La extraccion mantiene props estrechas para evitar acoplar cada seccion al estado completo del workspace.
