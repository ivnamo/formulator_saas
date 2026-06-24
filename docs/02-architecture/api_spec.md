# API spec inicial

Base path: `/api/v1`

Todas las rutas funcionales requieren autenticación y tenant context. El tenant activo puede enviarse por header:

```http
X-Tenant-Id: <uuid>
```

## Corte META-001

Los primeros endpoints implementables son:

```http
GET /health
GET /me
GET /tenants
POST /tenants
GET /parameters
POST /parameters
GET /raw-materials
POST /raw-materials
GET /raw-materials/{id}
PATCH /raw-materials/{id}
POST /raw-materials/{id}/prices
POST /raw-materials/{id}/parameter-values
GET /compatibility-rules
POST /compatibility-rules
GET /formulas
POST /formulas
GET /formulas/{id}
PATCH /formulas/{id}
POST /formulas/{id}/calculate
POST /formulas/calculate
```

Fuera del primer corte: IA, RAG, ERP, billing real, exportaciones e importador Excel completo.

La API debe validar tenant membership antes de ejecutar cualquier endpoint funcional.

## Auth / tenants

```http
GET /me
GET /tenants
POST /tenants
GET /tenants/{tenant_id}
POST /tenants/{tenant_id}/members
PATCH /tenants/{tenant_id}/members/{member_id}
```

## Parámetros

```http
GET /parameters
POST /parameters
GET /parameters/{id}
PATCH /parameters/{id}
DELETE /parameters/{id}
```

## Materias primas

```http
GET /raw-materials
POST /raw-materials
GET /raw-materials/{id}
PATCH /raw-materials/{id}
DELETE /raw-materials/{id}
POST /raw-materials/{id}/archive
POST /raw-materials/{id}/restore
POST /raw-materials/{id}/aliases
GET /raw-materials/{id}/prices
POST /raw-materials/{id}/prices
GET /raw-materials/{id}/documents
```

## Fórmulas

```http
GET /formulas
POST /formulas
GET /formulas/{id}
PATCH /formulas/{id}
DELETE /formulas/{id}
POST /formulas/{id}/archive
POST /formulas/{id}/restore
POST /formulas/{id}/calculate
POST /formulas/{id}/duplicate
POST /formulas/{id}/export/excel
POST /formulas/{id}/export/pdf
```

`POST /formulas` acepta `source_formula_id` opcional. Si se informa, debe apuntar a
una formula del mismo tenant; la nueva formula queda ligada como version derivada y
el backend asigna el siguiente `version` numerico de esa rama. `GET /formulas` y
`GET /formulas/{id}` devuelven `source_formula_id` para que Biblioteca, Jira e ISO
puedan reconstruir la relacion.

`GET /formulas?include_archived=true` y las acciones `archive`/`restore` son
owner-only. Las formulas archivadas quedan fuera del listado operativo por defecto.

## Cálculo ad hoc

```http
POST /formulas/calculate
```

Request:

```json
{
  "items": [
    {"raw_material_id": "uuid", "percentage": 10.0},
    {"raw_material_id": "uuid", "percentage": 90.0}
  ],
  "price_mode": "current"
}
```

Response:

```json
{
  "total_percentage": 100.0,
  "price_total": 1.82,
  "parameters": [
    {"code": "active_content", "value": 12.5, "unit": "% p/p"}
  ],
  "warnings": []
}
```

## Incompatibilidades manuales

```http
GET /compatibility-rules
POST /compatibility-rules
```

META-026 implementa solo `material_pair`:

```json
{
  "rule_type": "material_pair",
  "severity": "blocker",
  "material_a_id": "uuid",
  "material_b_id": "uuid",
  "message": "These materials should not be combined.",
  "recommended_action": "Replace one of the two materials."
}
```

Las reglas son tenant-scoped y se evaluan durante `POST /formulas/calculate` y `POST /formulas/{id}/calculate` como warnings con `severity`, `rule_id` y `recommended_action`.

## Optimización

```http
POST /optimizer/run
```

Request:

```json
{
  "candidate_raw_material_ids": ["uuid"],
  "objective": {"type": "minimize", "target": "price"},
  "constraints": [
    {"type": "parameter_min", "parameter_code": "active_content", "value": 12.0},
    {"type": "parameter_max", "parameter_code": "viscosity", "value": 1500},
    {"type": "raw_material_max", "raw_material_id": "uuid", "value": 20.0}
  ],
  "options": {"alternatives": 3}
}
```

## Excel import

```http
POST /imports/formulas/excel
GET /imports/formulas/{id}
PATCH /imports/formulas/{id}/mapping
POST /imports/formulas/{id}/resolve-row
POST /imports/formulas/{id}/calculate
POST /imports/formulas/{id}/save-as-formula
```

## RAG/documentos

```http
POST /documents
GET /documents
GET /documents/{id}
DELETE /documents/{id}
POST /documents/{id}/ingest
POST /rag/search
POST /rag/ask
```

## IA

```http
POST /ai/formulate
POST /ai/analyze-formula
POST /ai/suggest-alternatives
GET /ai/runs/{id}
```

## ERP

```http
GET /erp/connections
POST /erp/connections
GET /erp/connections/{id}
PATCH /erp/connections/{id}
POST /erp/connections/{id}/test
POST /erp/connections/{id}/sync
GET /erp/sync-jobs/{id}
GET /erp/staging/raw-materials
POST /erp/staging/raw-materials/{id}/apply
```

## Billing

```http
GET /billing/plan
POST /billing/checkout
POST /billing/portal
POST /webhooks/stripe
```
