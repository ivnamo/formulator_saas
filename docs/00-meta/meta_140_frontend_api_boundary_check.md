# Meta 140 - Frontend API boundary check

## Meta

Anadir un guardrail para que las llamadas HTTP del frontend se mantengan en clientes API dedicados.

## Cambios

- Se crea `scripts/check_frontend_api_boundaries.py`.
- `npm run check:web-api-boundaries` falla si detecta `request<`, `fetch(`, `apiUrl` o `/api/v1/` fuera de `workspace-api.ts` o archivos `*-api.ts`.
- El `npm run check` raiz ejecuta el guardrail antes de los checks de workspaces.
- `docs/05-delivery/testing.md` documenta la regla.

## Revision

- Sin cambio funcional en la app.
- El refactor de clientes API queda protegido frente a regresiones.
- El check es intencionalmente simple y rapido para uso solo-dev.
