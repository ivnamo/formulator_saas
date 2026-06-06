# START HERE - instrucciones para otra IA o agente de desarrollo

Eres una IA/desarrollador encargada de construir FormulIA Cloud como SaaS multi-tenant.

Antes de escribir código, lee estos documentos en este orden:

1. [`README.md`](README.md)
2. [`00-meta/meta_prompts.md`](00-meta/meta_prompts.md)
3. [`01-product/product_brief.md`](01-product/product_brief.md)
4. [`01-product/specs.md`](01-product/specs.md)
5. [`02-architecture/architecture.md`](02-architecture/architecture.md)
6. [`02-architecture/data_model.md`](02-architecture/data_model.md)
7. [`02-architecture/tenancy_billing.md`](02-architecture/tenancy_billing.md)
8. [`01-product/rules.md`](01-product/rules.md)
9. [`04-ai/agents.md`](04-ai/agents.md)
10. [`05-delivery/roadmap.md`](05-delivery/roadmap.md)
11. [`05-delivery/backlog.md`](05-delivery/backlog.md)

## Objetivo inmediato

Crear la base técnica de FormulIA Platform con:

- Backend FastAPI.
- Frontend Next.js/React.
- Postgres/Supabase multi-tenant.
- Modelo de datos configurable.
- Cálculo de fórmulas.
- Importación Excel básica.
- Autenticación, roles y tenant context.

## No hacer todavía

No empieces por un chatbot generalista. La IA viene después de tener:

- datos fiables,
- cálculo determinista,
- tenant isolation,
- alias de materias primas,
- importación Excel,
- precios históricos,
- optimizador mínimo.

Tampoco añadas módulos de usuario final, landing comercial o rediseños visuales antes de cerrar la base multi-tenant y el core de cálculo.

## Estilo de implementación

- Código modular.
- Separar dominio, infraestructura, API y UI.
- No mezclar tenant data.
- Toda tabla funcional debe incluir `tenant_id` salvo tablas globales explícitas.
- Toda llamada a IA debe quedar registrada en `ai_runs` y `ai_tool_calls`.
- Toda respuesta IA que proponga fórmula debe incluir evidencia, supuestos y validaciones.

## Stack recomendado

```text
Frontend: Next.js + TypeScript + Tailwind + shadcn/ui + TanStack Query/Table
Backend: FastAPI + Pydantic + SQLAlchemy/SQLModel + Alembic
DB: Postgres/Supabase + pgvector
Storage: Supabase Storage o S3-compatible
Queue: Celery/RQ/Arq + Redis
IA: DeepAgents/LangChain + LLM + embeddings
Billing: Stripe
ERP: Integration Hub con conectores SAP/OData/REST/SFTP/CSV
```

## Definición de done para MVP técnico

- Un tenant puede registrarse.
- Un usuario puede pertenecer a un tenant.
- El usuario puede crear materias primas.
- Puede configurar parámetros técnicos.
- Puede crear una fórmula manual.
- El sistema calcula coste y riqueza.
- Puede importar una fórmula desde Excel y resolver nombres no exactos.
- Puede guardar la fórmula importada.
- Toda operación respeta tenant isolation.
