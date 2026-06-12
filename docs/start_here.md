# START HERE - instrucciones para otra IA o agente de desarrollo

Eres una IA/desarrollador encargada de construir FormulIA Cloud como SaaS multi-tenant.

Antes de escribir código, lee estos documentos en este orden:

1. [`README.md`](README.md)
2. [`00-meta/meta_prompts.md`](00-meta/meta_prompts.md)
3. [`00-meta/meta_001_foundation_slice.md`](00-meta/meta_001_foundation_slice.md)
4. [`01-product/product_brief.md`](01-product/product_brief.md)
5. [`01-product/specs.md`](01-product/specs.md)
6. [`02-architecture/architecture.md`](02-architecture/architecture.md)
7. [`02-architecture/data_model.md`](02-architecture/data_model.md)
8. [`02-architecture/tenancy_billing.md`](02-architecture/tenancy_billing.md)
9. [`01-product/rules.md`](01-product/rules.md)
10. [`04-ai/agents.md`](04-ai/agents.md)
11. [`05-delivery/roadmap.md`](05-delivery/roadmap.md)
12. [`05-delivery/backlog.md`](05-delivery/backlog.md)
13. [`05-delivery/formula_builder_migration_plan.md`](05-delivery/formula_builder_migration_plan.md)

## Fuente legacy de formulación

La app Streamlit de referencia para la migración funcional está en [`ivnamo/formulator`](https://github.com/ivnamo/formulator), rama `main`.

Úsala como fuente de comportamiento del editor de fórmulas, conceptos de producto, flujos existentes y lógica reutilizable. No copies directamente la navegación Streamlit, `session_state` ni la estructura monolítica: la migración objetivo es SaaS multi-tenant con backend, frontend y core determinista separados.

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

## Workflow obligatorio por rama

1. Crear rama descriptiva.
2. Hacer commits atomicos.
3. Ejecutar tests/checks proporcionales.
4. Con tests/checks verdes, ejecutar quality/refactor gate contra SOLID, KISS, YAGNI, DRY razonable, boundaries, naming, complejidad y tenant isolation.
5. Si el gate produce cambios, reejecutar los tests/checks afectados.
6. Cerrar con worktree limpio y push.

Regla solodev permanente: `main` debe quedar siempre recuperable; no commitear secretos, no mezclar cambios grandes sin necesidad y preferir ramas cortas con commits pequenos verificables.

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
