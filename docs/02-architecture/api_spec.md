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
POST /formulas/{id}/calculate
POST /formulas/{id}/duplicate
POST /formulas/{id}/export/excel
POST /formulas/{id}/export/pdf
```

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

## Optimización

```http
POST /optimizations/validate
GET /optimizations/runs
POST /optimizations/run
```

Alcance actual: objetivo `minimize_price`, materias candidatas del tenant activo, bounds por materia prima y bounds por parametro tecnico. Cada ejecucion de `run` persiste un snapshot de request/response en `optimization_runs`; no hay workflow asincrono de jobs ni re-ejecucion historica.

### Validar optimizacion

```http
POST /optimizations/validate
```

Request:

```json
{
  "objective": "minimize_price",
  "candidate_raw_material_ids": ["uuid"],
  "raw_material_bounds": [
    {"raw_material_id": "uuid", "min_percentage": 10.0, "max_percentage": 80.0}
  ],
  "parameter_bounds": [
    {"code": "active_content", "min_value": 20.0, "max_value": 40.0}
  ]
}
```

Response:

```json
{
  "status": "valid",
  "objective": "minimize_price",
  "candidate_count": 2,
  "raw_material_bound_count": 1,
  "parameter_bound_count": 1,
  "issues": []
}
```

Si el contrato es incoherente o referencia materias fuera del tenant, `status` es `invalid` y `issues` contiene objetos `{code, target, message}`.

### Ejecutar optimizacion

```http
POST /optimizations/run
```

Usa el mismo request que `POST /optimizations/validate`.

Response con solucion:

```json
{
  "id": "uuid",
  "created_at": "2026-06-06T10:00:00Z",
  "status": "success",
  "objective": "minimize_price",
  "items": [
    {"raw_material_id": "uuid", "percentage": 40.0}
  ],
  "calculation": {
    "total_percentage": 100.0,
    "price_total": 2.2,
    "currency": "EUR",
    "parameters": [
      {"code": "active_content", "value": 20.0, "unit": "% p/p"}
    ],
    "warnings": []
  },
  "messages": [],
  "issues": []
}
```

Response sin solucion factible:

```json
{
  "id": "uuid",
  "created_at": "2026-06-06T10:00:00Z",
  "status": "infeasible",
  "objective": "minimize_price",
  "items": [],
  "calculation": null,
  "messages": ["Raw material maximum percentages total 80%, below 100%."],
  "issues": []
}
```

Response con request invalido:

```json
{
  "id": "uuid",
  "created_at": "2026-06-06T10:00:00Z",
  "status": "invalid",
  "objective": "minimize_price",
  "items": [],
  "calculation": null,
  "messages": [],
  "issues": [
    {
      "code": "candidate_not_found",
      "target": "uuid",
      "message": "Candidate raw material was not found for the active tenant"
    }
  ]
}
```

La UI no guarda automaticamente el resultado como formula. Al pulsar `Save optimized`, el frontend persiste la formula mediante `POST /formulas` con `objective: "minimize_price"` y `optimization_run_id`; el historial del run queda enlazado a la formula guardada y la biblioteca muestra ese objetivo como `Low cost`.

### Historial de optimizaciones

```http
GET /optimizations/runs
```

Response:

```json
[
  {
    "id": "uuid",
    "tenant_id": "uuid",
    "user_id": "uuid",
    "formula_id": "uuid",
    "status": "success",
    "objective": "minimize_price",
    "request_json": {
      "objective": "minimize_price",
      "candidate_raw_material_ids": ["uuid"],
      "raw_material_bounds": [],
      "parameter_bounds": [{"code": "active_content", "min_value": 20.0}]
    },
    "result_json": {
      "status": "success",
      "objective": "minimize_price",
      "items": [{"raw_material_id": "uuid", "percentage": 40.0}],
      "calculation": {
        "total_percentage": 100.0,
        "price_total": 2.2,
        "currency": "EUR",
        "parameters": [],
        "warnings": []
      },
      "messages": [],
      "issues": []
    },
    "created_at": "2026-06-06T10:00:00Z"
  }
]
```

El listado esta filtrado por tenant activo y ordenado por `created_at` descendente.

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
