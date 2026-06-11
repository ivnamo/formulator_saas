# META-035 - Jira status sync

## Objetivo

Sincronizar una revision enviada a Jira con el estado real del issue, usando el `status_mapping` configurable del conector para traducir estados Jira a estados internos de FormulIA.

## Alcance incluido

- Cliente Jira REST v3 para:
  - `GET /rest/api/3/issue/{issueKey}?fields=status,summary`
  - `GET /rest/api/3/issue/{issueKey}/transitions`
- Endpoint `POST /api/v1/formula-reviews/{review_id}/sync`.
- Validacion de que la revision ya tiene `jira_issue_key`.
- Actualizacion de:
  - `jira_status`
  - `review_status`
  - `last_sync_at`
- Uso de `status_mapping` por tenant, con fallback conservador al estado interno actual si el estado Jira no esta mapeado.
- Registro de auditoria `jira_status_sync`, incluyendo transiciones disponibles cuando Jira las devuelva.
- Accion de UI en la fila de revision para sincronizar el estado Jira.
- Tests backend de cliente REST, endpoint de sync y bloqueo antes de enviar el issue.

## Fuera de alcance

- Cambiar el estado de Jira desde FormulIA.
- Webhooks de Jira.
- Sincronizacion automatica programada.
- Reenvio de nuevas versiones cuando Jira pide cambios.
- Descubrimiento visual de transiciones en la UI.

## Criterios de done

1. Solo roles autorizados pueden sincronizar una revision.
2. La sincronizacion exige que el issue ya exista en Jira.
3. El estado Jira se guarda exactamente como llega desde Jira.
4. El estado interno se calcula desde `status_mapping` configurable.
5. Si el estado Jira no esta mapeado, no se inventa un estado nuevo.
6. Se registra auditoria de exito y error.
7. Tests focalizados de Jira pasan.
8. `npm run check`, `pytest`, `npm audit` y `git diff --check` pasan.
9. Quality/refactor gate aplicado.

## Siguiente accion recomendada

Validar el mapping real de estados con un issue de prueba y decidir si el siguiente corte debe ser webhooks Jira o reenvio/versionado ante `changes_requested`.
