# META-028 - Jira review request skeleton

## Decision

La vigesima octava meta implementable de FormulIA Cloud es crear la primera solicitud interna de revision Jira desde una formula guardada.

Esta meta enlaza la formula con la integracion Jira configurada y guarda un snapshot tecnico minimo. No crea issues reales en Atlassian todavia.

## Alcance incluido

- Rama `codex/jira-review-request-skeleton`.
- Tabla `formula_review_requests` con `tenant_id`.
- Endpoint para listar revisiones de una formula.
- Endpoint para crear una solicitud de revision Jira desde una formula.
- Validacion de formula y conexion Jira activa dentro del tenant.
- Snapshot JSON minimo con formula, lineas, coste, moneda y configuracion Jira usada.
- Estado inicial `ready_for_jira`.
- UI minima en la ficha de formula para preparar la revision Jira y ver solicitudes creadas.
- Tests de creacion, aislamiento tenant y precondiciones.

## Fuera de alcance

- Crear issue real en Jira.
- Adjuntar Excel.
- Generar artifact persistido.
- Cifrado real de credenciales.
- Sincronizacion de estados Jira.
- Webhooks Jira.
- Reenvio de nuevas versiones.

## Criterios de done

1. Una formula guardada puede crear una solicitud de revision Jira si hay conexion activa.
2. La solicitud queda asociada a tenant, formula, version y conexion Jira.
3. Otro tenant no puede ver ni crear revisiones sobre formulas ajenas.
4. La API devuelve error claro si no hay conexion Jira activa.
5. La UI muestra el estado Jira preparado en la ficha de formula.
6. Tests/checks pasan.
7. Quality/refactor gate queda aplicado.
8. La rama se sube con commit atomico.

## Testing minimo

- `python -m pytest apps/api/tests/test_jira_integration.py`.
- `python -m pytest`.
- `npm run check`.
- `npm audit --audit-level=moderate`.
- `git diff --check`.
- Smoke browser creando workspace, formula, conexion Jira y solicitud de revision.
- `rg` de referencias prohibidas o naming heredado.

## Riesgos

- No sugerir que el ticket ya existe en Jira.
- No duplicar snapshots para la misma formula/version sin aviso futuro.
- Mantener snapshot determinista y tenant-scoped.
- Evitar mezclar esta meta con Excel, storage o cliente Atlassian.

## Siguiente accion

Implementar servicio Jira real con cliente Atlassian y paso de creacion de issue, o generar primero el Excel de snapshot si preferimos cerrar artifact antes de enviar.
