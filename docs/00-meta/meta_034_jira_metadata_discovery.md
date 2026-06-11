# META-034 - Jira metadata discovery

## Objetivo

Permitir que un admin cargue metadata real de Jira desde FormulIA para configurar `field_mapping` sin buscar `customfield_*` manualmente.

## Alcance incluido

- Endpoints admin para leer metadata de una conexion Jira:
  - `GET /api/v1/integrations/jira/{connection_id}/projects`
  - `GET /api/v1/integrations/jira/{connection_id}/issue-types`
  - `GET /api/v1/integrations/jira/{connection_id}/fields`
- Cliente Jira REST v3 para:
  - `GET /rest/api/3/project/search`
  - `GET /rest/api/3/project/{projectKey}`
  - `GET /rest/api/3/issue/createmeta/{projectKey}/issuetypes/{issueTypeId}`
- Normalizacion de proyectos, tipos de issue, campos, obligatoriedad, schema y valores permitidos.
- UI en Integrations para cargar metadata del proyecto/tipo configurado.
- Selector de clave FormulIA y boton por campo Jira para insertar el mapping en el JSON.
- Tests backend de cliente, permisos y respuesta normalizada.

## Fuera de alcance

- Guardado automatico del mapping despues de pulsar el boton de mapeo. El admin revisa y pulsa `Save Jira`.
- Descubrimiento avanzado de transiciones/estados.
- Sugerencias inteligentes de mapping por similitud semantica.
- Validacion real contra un Jira externo en CI.

## Criterios de done

1. Solo admins pueden cargar metadata.
2. La API no devuelve credenciales ni tokens.
3. La UI muestra project key, issue types, field IDs, requerido/opcional, schema y valores permitidos.
4. El admin puede insertar un field ID en `field_mapping` desde la UI.
5. Tests focalizados de Jira pasan.
6. `npm run check`, `pytest`, `npm audit` y `git diff --check` pasan.
7. Quality/refactor gate aplicado.

## Siguiente accion recomendada

Anadir sincronizacion de estados/transiciones Jira para cerrar el ciclo de laboratorio desde `sent_to_jira` hasta aprobacion, rechazo o cambios solicitados.
