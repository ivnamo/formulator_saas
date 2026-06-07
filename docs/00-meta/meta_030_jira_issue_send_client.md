# META-030 - Jira issue send client

## Decision

La trigesima meta implementable de FormulIA Cloud es enviar una solicitud de revision preparada a Jira creando un issue y adjuntando el Excel tecnico.

Esta meta introduce el cliente outbound de Jira y el endpoint de envio. Para no guardar secretos en claro, las credenciales OAuth 2.0 (3LO) se leen desde entorno local.

## Alcance incluido

- Rama `codex/jira-send-issue-client`.
- Cliente Jira REST para crear issues y subir adjuntos.
- Soporte OAuth 2.0 (3LO) via `api.atlassian.com/ex/jira/{cloudId}`.
- Fallback local con API token para pruebas ad-hoc.
- Builder de payload Atlassian Document Format para descripcion tecnica.
- Endpoint para enviar una review preparada a Jira.
- Generacion/recuperacion automatica del Excel antes de adjuntar.
- Persistencia de `jira_issue_key`, `jira_issue_url`, `jira_status`, `review_status` y `sent_at`.
- UI minima para enviar a Jira y abrir el issue creado.
- Script local para guardar variables Jira OAuth sin exponer el secret en chat.
- Tests con cliente Jira falso, sin llamadas reales a Atlassian.

## Fuera de alcance

- Guardar tokens Jira cifrados en base de datos.
- Callback OAuth completo dentro del SaaS.
- Refresh token automatico.
- Descubrir proyectos, issue types o campos desde Jira.
- Sincronizacion de estados.
- Webhooks.
- Reenvio de nuevas versiones.
- Retry avanzado de adjuntos fallidos.

## Criterios de done

1. Una review `ready_for_jira` puede crear issue en Jira mediante el adaptador.
2. El payload incluye proyecto, issue type, summary, descripcion ADF y labels.
3. Si existe Excel se adjunta; si no existe, se genera antes del envio.
4. Tras exito, la review queda en `sent_to_jira` con issue key y URL.
5. Otro tenant no puede enviar reviews ajenas.
6. La API evita reenviar una review ya enviada.
7. La UI muestra accion de envio y link al issue.
8. Tests/checks pasan.
9. Quality/refactor gate queda aplicado antes de commit.
10. La rama se sube con commit atomico.

## Testing minimo

- `python -m pytest apps/api/tests/test_jira_integration.py`.
- `python -m pytest`.
- `npm run check`.
- `npm audit --audit-level=moderate`.
- `git diff --check`.
- Smoke API con cliente falso o modo sin red.
- Smoke browser de carga/render de la zona Jira.
- `rg` de referencias prohibidas o naming heredado en documentacion.

## Riesgos

- No almacenar ni loguear el client secret, access token o refresh token.
- No duplicar issues para la misma review.
- Si falla el adjunto despues de crear issue, conservar el issue key y marcar `partial_failure`.
- Mantener el cliente real aislado para poder mockearlo en tests.
- No prometer sincronizacion de estado Jira en esta meta.

## Siguiente accion

Implementar sincronizacion manual de estado Jira y mapeo configurable entre estados Jira e internos.
