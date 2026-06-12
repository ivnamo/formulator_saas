# META-048 - Refactor de configuracion y Jira

## Decision

La cuadragesima octava meta implementable de FormulIA Cloud es separar la pantalla de configuracion, cuenta, invitaciones, parametros e integracion Jira del `Home`.

## Contexto

Tras extraer builder, importacion, comparacion e IA, `Home` seguia conteniendo el bloque de configuracion con mucho JSX: workspace, cuenta, invitaciones, parametros, formulario Jira, resumen de conexion y metadata de mapping. Este bloque es UI presentacional; las llamadas API y mutaciones siguen en la pagina.

## Alcance de esta slice

- Crear `apps/web/app/settings-panel.tsx`.
- Mover al panel:
  - creacion/edicion visual de workspace,
  - acceso de cuenta,
  - invitaciones de tenant,
  - formulario de parametro,
  - formulario Jira,
  - resumen de conexion Jira,
  - metadata de proyectos, tipos, campos y mapping.
- Mantener en `page.tsx`:
  - llamadas API,
  - validaciones,
  - estado fuente,
  - acciones con efectos externos.

## Fuera de alcance

- Cambiar endpoints de tenant/Jira.
- Cambiar validaciones de negocio.
- Cambiar estilos o layout funcional.

## Criterios de done

1. `page.tsx` no contiene el JSX de configuracion/Jira.
2. Typecheck y build web pasan.
3. Browser local carga `Configuracion` sin errores de consola.
4. Worktree queda limpio tras commit y push.

## Siguiente accion recomendada

Extraer la pantalla de materias primas o compatibilidad, segun el siguiente bloque con mas JSX dentro de `Home`.
