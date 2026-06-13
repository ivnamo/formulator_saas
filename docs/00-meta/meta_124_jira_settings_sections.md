# Meta 124 - Jira settings sections

## Meta

Reducir la complejidad de `jira-connection-settings.tsx` sin alterar el flujo de configuracion.

## Cambios

- Se crea `jira-connection-settings-sections.tsx` con campos del formulario, acciones y resumen de conexion.
- `jira-connection-settings.tsx` queda como ensamblador de secciones.
- Se mantienen textos, clases CSS, estados `disabled` y handlers existentes.

## Revision

- Sin cambio funcional esperado.
- El formulario Jira queda dividido por responsabilidad y es mas facil de revisar.
- La configuracion de Jira sigue dependiendo de los mismos tipos de `jira-connection-model.ts`.
