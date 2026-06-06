# FormulIA Cloud - documentación de trabajo

Fecha: 2026-06-06

Esta carpeta contiene la documentación inicial para construir FormulIA Cloud como una plataforma SaaS multi-tenant de formulación técnica asistida por IA.

La documentación está pensada para desarrollo asistido por IA o por equipo técnico. No es todavía documentación de usuario final.

## Cómo empezar

1. Lee [`start_here.md`](start_here.md).
2. Lee [`00-meta/meta_prompts.md`](00-meta/meta_prompts.md) para trabajar con decisiones congeladas y prompts de planificación.
3. Usa [`manifest.md`](manifest.md) como inventario completo.
4. Para arrancar implementación, sigue esta ruta mínima:
   - [`00-meta/meta_prompts.md`](00-meta/meta_prompts.md)
   - [`01-product/product_brief.md`](01-product/product_brief.md)
   - [`01-product/specs.md`](01-product/specs.md)
   - [`02-architecture/architecture.md`](02-architecture/architecture.md)
   - [`02-architecture/data_model.md`](02-architecture/data_model.md)
   - [`02-architecture/tenancy_billing.md`](02-architecture/tenancy_billing.md)
   - [`01-product/rules.md`](01-product/rules.md)
   - [`05-delivery/roadmap.md`](05-delivery/roadmap.md)
   - [`05-delivery/backlog.md`](05-delivery/backlog.md)

## Estructura

### Raíz

- [`README.md`](README.md): índice y orientación general.
- [`start_here.md`](start_here.md): instrucciones de lectura para una IA o desarrollador.
- [`manifest.md`](manifest.md): inventario completo de documentos.

### `00-meta`

Define cómo usar la documentación como base de trabajo.

- [`meta_prompts.md`](00-meta/meta_prompts.md): modo meta, prompts reutilizables, decisiones congeladas y primera vertical slice.

### `01-product`

Define qué se está construyendo y cómo debe comportarse.

- [`product_brief.md`](01-product/product_brief.md): visión, usuarios, alcance y posicionamiento.
- [`specs.md`](01-product/specs.md): especificación funcional principal.
- [`frontend_ux.md`](01-product/frontend_ux.md): propuesta de experiencia y pantallas.
- [`rules.md`](01-product/rules.md): reglas de negocio y guardrails.

### `02-architecture`

Define la base técnica y los contratos principales.

- [`architecture.md`](02-architecture/architecture.md): arquitectura propuesta del monorepo y flujos.
- [`data_model.md`](02-architecture/data_model.md): modelo de datos SaaS multi-tenant.
- [`api_spec.md`](02-architecture/api_spec.md): endpoints iniciales del backend.
- [`tenancy_billing.md`](02-architecture/tenancy_billing.md): tenants, roles, planes y suscripciones.
- [`security.md`](02-architecture/security.md): aislamiento, secretos, auditoría y seguridad.

### `03-domain`

Profundiza en capacidades funcionales del motor de formulación.

- [`excel_import.md`](03-domain/excel_import.md): importación inteligente de fórmulas Excel.
- [`optimization_engine.md`](03-domain/optimization_engine.md): motor matemático de optimización.
- [`compatibility_engine.md`](03-domain/compatibility_engine.md): incompatibilidades y evidencias.
- [`erp_integrations.md`](03-domain/erp_integrations.md): integraciones ERP/SAP.

### `04-ai`

Define cómo debe trabajar la IA cuando el core determinista ya exista.

- [`agents.md`](04-ai/agents.md): arquitectura de agentes IA.
- [`tools.md`](04-ai/tools.md): tools disponibles para agentes.
- [`skills.md`](04-ai/skills.md): módulos reutilizables a implementar.
- [`memory.md`](04-ai/memory.md): memoria persistente para agentes.
- [`prompts.md`](04-ai/prompts.md): prompts base.
- [`rag.md`](04-ai/rag.md): diseño RAG documental.
- [`scientific_search.md`](04-ai/scientific_search.md): búsqueda científica.
- [`market_intelligence.md`](04-ai/market_intelligence.md): señales de mercado.

### `05-delivery`

Ordena decisiones, prioridades, testing y migración desde la app actual.

- [`roadmap.md`](05-delivery/roadmap.md): fases de construcción.
- [`backlog.md`](05-delivery/backlog.md): backlog priorizado.
- [`testing.md`](05-delivery/testing.md): estrategia de testing.
- [`decisions.md`](05-delivery/decisions.md): decisiones arquitectónicas iniciales.
- [`open_questions.md`](05-delivery/open_questions.md): preguntas pendientes.
- [`repo_migration.md`](05-delivery/repo_migration.md): migración desde Streamlit.

## Resumen del producto

FormulIA Cloud será una aplicación web SaaS para:

- Gestionar materias primas y parámetros técnicos.
- Crear, importar, editar, calcular y optimizar fórmulas.
- Calcular riqueza/composición técnica y coste por fórmula.
- Importar fórmulas desde Excel aunque los nombres de materias primas no coincidan exactamente.
- Generar alternativas de formulación con IA, RAG documental, búsqueda científica y señales de mercado.
- Detectar incompatibilidades entre materias primas mediante reglas, documentación y validación técnica.
- Conectarse a ERP/SAP para sincronizar precios, materias primas, proveedores, unidades y disponibilidad.
- Operar como SaaS multi-tenant con planes, roles, límites de uso y aislamiento de datos.

## Principio fundamental

La IA no debe inventar fórmulas finales sin pasar por cálculo, optimización y validación. El flujo correcto es:

```text
Usuario -> IA interpreta -> busca evidencia -> genera restricciones -> optimizador calcula -> validador comprueba -> usuario aprueba
```

## Prioridad inicial

1. SaaS multi-tenant desde el primer commit.
2. Modelo de datos configurable por tenant.
3. Core de cálculo determinista.
4. Importador Excel con matching de materias primas.
5. Optimización matemática.
6. ERP-ready con staging y precios históricos.
7. RAG documental por tenant.
8. Agentes IA con tools controladas.
9. Búsqueda científica y de mercado.
10. Billing, límites de uso y hardening.
