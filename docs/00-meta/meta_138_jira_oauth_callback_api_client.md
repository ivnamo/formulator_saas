# Meta 138 - Jira OAuth callback API client

## Meta

Separar el POST de callback OAuth Jira de la pagina visual de callback.

## Cambios

- `jira-connection-api.ts` expone `completeJiraOAuthCallback`.
- `callback/page.tsx` conserva lectura de query params, estados visuales y mensajes.
- La ruta y el payload del callback OAuth no cambian.

## Revision

- La pagina queda sin rutas HTTP directas.
- El dominio Jira mantiene sus endpoints en un cliente API unico.
- Sin cambio funcional esperado.
