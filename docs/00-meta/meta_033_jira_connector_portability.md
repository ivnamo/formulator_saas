# META-033 - Jira connector portability

## Objetivo

Convertir la integracion Jira en un conector portable por tenant, sin datos reales de ningun cliente hardcodeados en codigo, tests o documentacion.

## Decision

El backend solo debe conocer el contrato generico de FormulIA y Jira Cloud REST v3. Los detalles de cada empresa se configuran en la conexion Jira:

- site URL,
- metodo de autenticacion,
- project key,
- issue type por defecto,
- assignee por defecto,
- field mapping,
- OAuth Client ID/Secret en entorno seguro.

## Alcance incluido

- Eliminar defaults reales de OAuth Client ID y Cloud ID.
- Hacer obligatorio configurar `FORMULIA_JIRA_OAUTH_CLIENT_ID` para iniciar OAuth.
- Eliminar reporter fijo y custom fields fijos del payload Jira.
- Mapear `jira_project_id`, `jira_issue_type`, `jira_product_type` y `jira_product_type_option` via `field_mapping`.
- Validar `ProyectoID` y `Tipo producto` solo cuando el mapping del tenant los requiere.
- Permitir issue type y product type como texto libre en backend/frontend, con sugerencias actuales en UI.
- Exponer `field_mapping` como JSON en el formulario de integracion Jira.
- Documentar el checklist de onboarding en `docs/03-domain/jira_connector_onboarding.md`.

## Fuera de alcance

- Cifrado real de secretos OAuth por tenant.
- Descubrimiento dinamico completo de campos Jira en UI.
- Transformaciones avanzadas configurables por campo.
- Webhooks y sincronizacion bidireccional.

## Criterios de done

1. `rg` no encuentra nombres, URLs, account IDs, Client IDs ni Cloud IDs reales del cliente en codigo/docs.
2. Tests de Jira prueban mappings configurables, no constantes de un tenant.
3. `npm run check` y tests backend pasan.
4. `git diff --check` pasa.
5. Quality/refactor gate aplicado antes del commit.

## Siguiente accion recomendada

Anadir lectura de metadatos Jira para ayudar al admin a construir `field_mapping` desde la UI, sin escribir IDs manualmente.
