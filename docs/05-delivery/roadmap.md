# Roadmap

## Fase 0 - Foundation SaaS

Objetivo: base comercial y técnica multi-tenant.

Entregables:

- Monorepo.
- Auth.
- Tenants.
- Roles.
- Middleware tenant.
- DB schema inicial.
- Billing skeleton.
- Audit logs.

## Fase 1 - Core técnico sin IA

Objetivo: sustituir la app Streamlit en funcionalidad principal.

Entregables:

- Materias primas.
- Parámetros configurables.
- Precios.
- Fórmulas manuales.
- Cálculo de coste y riqueza.
- Exportación Excel/PDF inicial.

## Fase 2 - Importador Excel

Objetivo: subir fórmulas existentes y calcularlas.

Entregables:

- Upload Excel.
- Detección de hojas/columnas.
- Matching materias primas.
- Resolución manual.
- Creación de alias.
- Guardar fórmula importada.

## Fase 3 - Optimización

Objetivo: generar fórmulas con restricciones.

Entregables:

- Linear optimizer.
- Restricciones.
- Alternativas.
- Comparador.
- Infeasible explanations.

## Fase 4 - ERP-ready

Objetivo: conectar datos externos.

Entregables:

- Integration Hub.
- CSV/SFTP connector.
- REST connector.
- SAP/OData skeleton.
- Staging.
- Precios históricos.
- Jira ticketing connector para revision de formulas de laboratorio.
- Envio de snapshot/version de formula con Excel adjunto a tablero Jira.
- Sincronizacion de estado Jira hacia FormulIA.

Referencia funcional: [`../03-domain/jira_formula_review.md`](../03-domain/jira_formula_review.md).

## Fase 5 - RAG documental

Objetivo: conocimiento técnico por tenant.

Entregables:

- Upload docs.
- Ingesta.
- Embeddings.
- Search.
- Ask docs.
- Evidencias.

## Fase 6 - Incompatibilidades

Objetivo: validación técnica avanzada.

Entregables:

- Reglas manuales.
- Evaluador de reglas.
- Severidades.
- Evidencias.
- Sugerencias IA pendientes de validación.

## Fase 7 - IA multiagente

Objetivo: asistente formulador.

Entregables:

- DeepAgents/LangChain supervisor.
- Tools internas.
- Requirement parser.
- Formula generation flow.
- Explicaciones.
- Logs.

## Fase 8 - Papers y mercado

Objetivo: fuentes externas.

Entregables:

- Scientific search.
- Market search.
- Incorporación opcional al RAG.
- Observaciones de mercado.

## Fase 9 - Comercialización SaaS

Objetivo: vender.

Entregables:

- Stripe completo.
- Customer portal.
- Plan enforcement.
- Onboarding.
- Admin panel.
- Documentación cliente.
