# Backlog inicial priorizado

## P0 - No negociable

- Crear monorepo.
- Configurar backend FastAPI.
- Configurar frontend Next.js.
- Configurar Postgres/Supabase.
- Crear tablas tenants/users/members.
- Middleware tenant context.
- Tenant isolation tests.
- Modelo de materias primas.
- Modelo de parámetros.
- Modelo de fórmulas.
- Endpoint de cálculo.
- UI básica de materias primas.
- UI básica de fórmulas.

## P1 - MVP funcional

- Precios históricos.
- Editor de fórmula cómodo.
- Cálculo de riqueza/precio.
- Exportación Excel.
- Importador Excel básico.
- Matching exacto/alias/fuzzy.
- Resolver materias primas manualmente.
- Guardar alias.

## P2 - Diferenciación técnica

- Optimizador lineal.
- Comparador de fórmulas.
- Restricciones técnicas.
- Incompatibilidades manuales.
- RAG documental básico.

## P3 - SaaS comercial

- Stripe checkout.
- Stripe webhooks.
- Planes y entitlements.
- Usage events.
- Billing portal.

## P4 - Integraciones

- CSV import ERP-like.
- REST connector.
- SAP/OData connector skeleton.
- Staging review.
- Jira connector para revision de formulas.
- Configuracion de proyecto, issue type y campos Jira por tenant.
- Enviar snapshot de formula a Jira con Excel adjunto.
- Mostrar issue key, URL y estado Jira en la ficha de formula.
- Sincronizar estados Jira: pendiente, en revision, cambios solicitados, aprobada, rechazada, validada.

## P5 - IA avanzada

- DeepAgents/LangChain.
- Tools.
- Requirement parser.
- AI formulate endpoint.
- Scientific search.
- Market search.
- AI logs.

## P6 - Enterprise

- SSO.
- Audit advanced.
- Custom roles.
- Private deployments.
- Admin reporting.
