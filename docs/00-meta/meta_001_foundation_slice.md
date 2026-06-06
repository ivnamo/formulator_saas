# META-001 - Foundation slice

## Decision

La primera meta implementable de FormulIA Cloud es una foundation slice end-to-end: monorepo, backend minimo, modelo multi-tenant, calculo determinista y UI operativa basica.

Esta meta no intenta completar el MVP comercial. Su objetivo es demostrar que el nucleo de FormulIA Platform puede crear datos por tenant, calcular una formula y verificar aislamiento.

## Alcance incluido

- Monorepo base.
- Backend FastAPI.
- Frontend Next.js.
- Configuracion local reproducible.
- Modelo inicial: tenants, users o auth placeholder, tenant_members, parameters, raw_materials, raw_material_parameter_values, raw_material_prices, formulas, formula_items y formula_calculation_results.
- Tenant context por header validado contra membership.
- CRUD minimo de materias primas.
- CRUD minimo de parametros.
- Crear formula manual.
- Calcular coste y composicion tecnica en backend.
- Guardar formula y resultado de calculo.
- UI basica para materias primas, parametros y formulas.
- Tests unitarios de calculo.
- Tests de API para tenant isolation.

## Fuera de alcance

- IA conversacional.
- RAG.
- Importador Excel completo.
- Optimizador matematico.
- ERP real.
- Billing real.
- Exportacion Excel/PDF.
- Landing comercial.
- Roles avanzados o permisos granulares.
- Auditoria completa.

## Documentos fuente

- `docs/00-meta/meta_prompts.md`
- `docs/start_here.md`
- `docs/01-product/product_brief.md`
- `docs/01-product/specs.md`
- `docs/01-product/rules.md`
- `docs/02-architecture/architecture.md`
- `docs/02-architecture/data_model.md`
- `docs/02-architecture/api_spec.md`
- `docs/05-delivery/testing.md`

## Codigo que se tocara despues

```text
apps/
  api/
  web/
packages/
  core/
  shared/
infra/
  db/
```

## Criterios de done

1. Un desarrollador puede instalar dependencias y arrancar API y web en local.
2. La API expone healthcheck y endpoints MVP bajo `/api/v1`.
3. Todas las tablas funcionales iniciales tienen `tenant_id`.
4. El backend rechaza acceso de un usuario a datos de otro tenant.
5. El calculo oficial ocurre en backend o paquete core llamado por backend.
6. Una formula con dos materias primas calcula porcentaje total, precio ponderado, parametros ponderados y warnings.
7. La UI permite crear datos minimos y ver el resultado del calculo.
8. Hay tests automatizados para calculo y tenant isolation.
9. La rama queda con commits atomicos y worktree limpio.

## Secuencia de commits sugerida

1. `Define foundation slice docs`
2. `Scaffold monorepo`
3. `Add API domain models`
4. `Add formula calculator tests`
5. `Add tenant-scoped API endpoints`
6. `Add tenant isolation API tests`
7. `Add web foundation UI`
8. `Wire formula calculation flow`

Cada commit debe compilar o dejar una razon clara si es solo scaffold documental.

## Testing minimo por fase

- Docs: busqueda de referencias antiguas y coherencia de indices.
- Core: unit tests de calculo.
- API: integration/API tests de CRUD y tenant isolation.
- Web: typecheck/lint y, cuando haya servidor local, smoke test visual.
- Antes de merge: `git status --short --branch` debe quedar limpio.

## Riesgos

- Auth puede frenar la primera slice si se intenta resolver completamente desde el inicio.
- Supabase local puede anadir complejidad prematura; se permite auth placeholder si queda protegido por ADR o nota tecnica.
- UI puede crecer demasiado; debe limitarse a herramienta operativa.
- Billing, IA, ERP y RAG deben mantenerse como skeleton o backlog hasta que el core determinista este probado.

## Siguiente accion

Crear el scaffold del monorepo en una rama nueva de implementacion y empezar por backend/core:

1. estructura de carpetas,
2. tooling basico,
3. paquete core de calculo,
4. tests de calculo,
5. API healthcheck.
