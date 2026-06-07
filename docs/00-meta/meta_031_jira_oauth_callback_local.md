# META-031 - Jira OAuth callback local

## Decision

La trigesima primera meta implementable de FormulIA Cloud es completar el flujo OAuth 2.0 (3LO) local para Jira Cloud.

El usuario autoriza la app Atlassian en navegador, Atlassian redirige a `http://localhost:3000/callback`, el frontend entrega el `authorization code` al backend, y el backend intercambia ese code por tokens, obtiene `cloudId` y guarda los tokens en `.env.local`.

## Datos confirmados

- Jira site: configurado localmente mediante `FORMULIA_JIRA_SITE_URL` y el formulario de integracion.
- Cloud ID: `61c328dd-e711-487e-9cfc-931d7a48d006`.
- Project key: `ID`.
- Issue types:
  - `Prototipo` (`10659`).
  - `PoC` (`10884`).
  - `Calidad` (`10885`).
- Issue type recomendado para revision: `Calidad`.
- Callback URL: `http://localhost:3000/callback`.
- OAuth authorization URL: `https://auth.atlassian.com/authorize`.
- OAuth token URL: `https://auth.atlassian.com/oauth/token`.
- Accessible resources URL: `https://api.atlassian.com/oauth/token/accessible-resources`.
- Jira REST API base: `https://api.atlassian.com/ex/jira/61c328dd-e711-487e-9cfc-931d7a48d006/rest/api/3`.

## Scopes configurados

- `read:issue:jira`
- `write:issue:jira`
- `read:issue-meta:jira`
- `read:issue-details:jira`
- `read:issue-field-values:jira`
- `read:issue.transition:jira`
- `read:issue-type:jira`
- `read:issue-status:jira`
- `read:field:jira`
- `write:field:jira`
- `read:field.option:jira`
- `write:field.option:jira`
- `read:project:jira`
- `read:user:jira`
- `read:comment:jira`
- `write:comment:jira`
- `read:attachment:jira`
- `write:attachment:jira`
- `read:label:jira`
- `read:priority:jira`
- `offline_access` para recibir `refresh_token`

## Alcance incluido

- Rama `codex/jira-oauth-callback-local`.
- Endpoint backend para construir URL de autorizacion.
- Pagina frontend `/callback` para capturar `code` y `state`.
- Endpoint backend para intercambiar `code` por `access_token` y `refresh_token`.
- Llamada a `accessible-resources` para resolver o validar `cloudId`.
- Guardado local de tokens en `.env.local`.
- Refresh automatico de access token cuando falte o este caducado.
- UI minima en Integrations para iniciar autorizacion OAuth.
- Tests sin llamadas reales a Atlassian.

## Fuera de alcance

- Persistencia cifrada multi-tenant en base de datos.
- Callback OAuth productivo publico.
- Login real de usuarios SaaS.
- Gestion multi-site avanzada.
- Listado/edicion/transiciones de issues.
- Webhooks Jira.

## Criterios de done

1. El usuario puede iniciar autorizacion OAuth desde FormulIA.
2. `/callback` muestra estado claro del exchange.
3. El backend intercambia `code` por tokens con `client_id`, `client_secret` y `redirect_uri`.
4. El backend obtiene/valida `cloudId`.
5. `.env.local` queda actualizado con `FORMULIA_JIRA_OAUTH_ACCESS_TOKEN`, `FORMULIA_JIRA_OAUTH_REFRESH_TOKEN`, `FORMULIA_JIRA_CLOUD_ID` y expiracion.
6. El cliente Jira refresca el access token si ha expirado antes de crear issues.
7. Tests/checks pasan.
8. Quality/refactor gate queda aplicado.
9. La rama se sube con commit atomico.

## Testing minimo

- `python -m pytest apps/api/tests/test_jira_oauth.py apps/api/tests/test_jira_client.py apps/api/tests/test_jira_integration.py`.
- `python -m pytest`.
- `npm run check`.
- `npm audit --audit-level=moderate`.
- `git diff --check`.
- Smoke browser de `/callback` sin code y de Integrations renderizando accion OAuth.

## Riesgos

- No imprimir ni commitear tokens, refresh token ni client secret.
- No confundir callback frontend `localhost:3000` con API backend `localhost:8000`.
- Mantener `.env.local` ignorado por git.
- Los tokens OAuth son secretos aunque se guarden localmente.

## Siguiente accion

Listar issues (`GET /rest/api/3/search?jql=project=ID`) y exponer acciones de transicion para los estados reales del proyecto ID.
