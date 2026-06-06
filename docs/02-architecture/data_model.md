# Modelo de datos propuesto

## Convenciones

- Todas las tablas funcionales deben tener `tenant_id`.
- Usar UUID como primary key.
- Usar `created_at`, `updated_at` y, cuando aplique, `created_by`.
- No borrar datos críticos: usar soft delete o estados.
- Mantener auditoría para cambios técnicos, precios, fórmulas y reglas.

## Corte META-001

La primera migracion debe limitarse a las tablas necesarias para crear datos por tenant y calcular formulas manuales:

- tenants.
- users o auth placeholder local.
- tenant_members.
- parameters.
- raw_materials.
- raw_material_parameter_values.
- raw_material_prices.
- formulas.
- formula_items.
- formula_calculation_results.

Quedan fuera de la primera migracion: billing real, RAG, IA, ERP, importaciones Excel completas e incompatibilidades avanzadas. Pueden documentarse o dejarse como migraciones posteriores, pero no deben bloquear el primer core ejecutable.

Reglas de implementacion:

- Validar membership antes de aceptar `X-Tenant-Id`.
- No leer ni escribir entidades funcionales sin tenant context.
- Indexar claves frecuentes por `(tenant_id, ...)`.
- Los resultados de calculo deben guardar suficiente `result_json` para auditoria y reproducibilidad basica.

## SaaS

```sql
CREATE TABLE tenants (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  status text NOT NULL,
  plan_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tenant_members (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  user_id uuid NOT NULL,
  role text NOT NULL,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

## Planes y suscripciones

```sql
CREATE TABLE plans (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  price_monthly numeric,
  currency text,
  limits_json jsonb NOT NULL DEFAULT '{}'
);

CREATE TABLE subscriptions (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  provider text NOT NULL,
  provider_customer_id text,
  provider_subscription_id text,
  status text NOT NULL,
  current_period_start timestamptz,
  current_period_end timestamptz
);

CREATE TABLE usage_events (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  event_type text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
```

## Parámetros configurables

```sql
CREATE TABLE parameters (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  code text NOT NULL,
  name text NOT NULL,
  unit text NOT NULL,
  family text,
  decimals int DEFAULT 2,
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE (tenant_id, code)
);
```

## Materias primas

```sql
CREATE TABLE raw_materials (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  code text,
  external_code text,
  name text NOT NULL,
  normalized_name text NOT NULL,
  family text,
  subfamily text,
  physical_state text,
  density numeric,
  ph_min numeric,
  ph_max numeric,
  solubility text,
  is_active boolean NOT NULL DEFAULT true,
  is_obsolete boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);

CREATE TABLE raw_material_aliases (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  raw_material_id uuid NOT NULL REFERENCES raw_materials(id),
  alias text NOT NULL,
  normalized_alias text NOT NULL,
  source text,
  confidence numeric,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, normalized_alias)
);

CREATE TABLE raw_material_parameter_values (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  raw_material_id uuid NOT NULL REFERENCES raw_materials(id),
  parameter_id uuid NOT NULL REFERENCES parameters(id),
  value numeric NOT NULL,
  source text,
  confidence numeric,
  UNIQUE (tenant_id, raw_material_id, parameter_id)
);
```

## Precios históricos

```sql
CREATE TABLE raw_material_prices (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  raw_material_id uuid NOT NULL REFERENCES raw_materials(id),
  price numeric NOT NULL,
  currency text NOT NULL,
  unit text NOT NULL,
  supplier text,
  source text NOT NULL,
  valid_from date NOT NULL,
  valid_to date,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

## Fórmulas

```sql
CREATE TABLE formulas (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  name text NOT NULL,
  version int NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'draft',
  objective text,
  total_price numeric,
  currency text DEFAULT 'EUR',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE formula_items (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  formula_id uuid NOT NULL REFERENCES formulas(id),
  raw_material_id uuid NOT NULL REFERENCES raw_materials(id),
  percentage numeric NOT NULL,
  quantity numeric,
  unit text,
  order_index int NOT NULL DEFAULT 0
);

CREATE TABLE formula_calculation_results (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  formula_id uuid NOT NULL REFERENCES formulas(id),
  price_total numeric,
  result_json jsonb NOT NULL,
  calculated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE optimization_runs (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  user_id uuid REFERENCES users(id),
  formula_id uuid REFERENCES formulas(id),
  status text NOT NULL,
  objective text NOT NULL,
  request_json jsonb NOT NULL,
  result_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

## Importaciones Excel

```sql
CREATE TABLE formula_imports (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  file_name text NOT NULL,
  file_path text NOT NULL,
  status text NOT NULL,
  uploaded_by uuid,
  mapping_json jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE formula_import_rows (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  import_id uuid NOT NULL REFERENCES formula_imports(id),
  row_number int NOT NULL,
  raw_name text,
  normalized_name text,
  raw_percentage text,
  percentage numeric,
  matched_raw_material_id uuid REFERENCES raw_materials(id),
  match_score numeric,
  status text NOT NULL,
  candidates_json jsonb DEFAULT '[]'
);
```

## Documentos y RAG

```sql
CREATE TABLE documents (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  raw_material_id uuid REFERENCES raw_materials(id),
  title text NOT NULL,
  document_type text,
  source text,
  file_path text NOT NULL,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE document_chunks (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  document_id uuid NOT NULL REFERENCES documents(id),
  chunk_text text NOT NULL,
  page int,
  section text,
  embedding vector,
  metadata jsonb DEFAULT '{}'
);
```

## Incompatibilidades

```sql
CREATE TABLE compatibility_rules (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  rule_type text NOT NULL,
  severity text NOT NULL,
  condition_json jsonb NOT NULL,
  message text NOT NULL,
  source_type text NOT NULL,
  validated_by uuid,
  validated_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

## IA

```sql
CREATE TABLE ai_runs (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  user_id uuid,
  run_type text NOT NULL,
  input_json jsonb NOT NULL,
  output_json jsonb,
  status text NOT NULL,
  model text,
  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

CREATE TABLE ai_tool_calls (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  ai_run_id uuid NOT NULL REFERENCES ai_runs(id),
  tool_name text NOT NULL,
  input_json jsonb NOT NULL,
  output_json jsonb,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

## ERP

```sql
CREATE TABLE erp_connections (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  type text NOT NULL,
  name text NOT NULL,
  status text NOT NULL,
  credentials_encrypted text,
  config_json jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE erp_sync_jobs (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  connection_id uuid NOT NULL REFERENCES erp_connections(id),
  status text NOT NULL,
  started_at timestamptz,
  finished_at timestamptz,
  error text
);

CREATE TABLE erp_raw_material_staging (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  sync_job_id uuid NOT NULL REFERENCES erp_sync_jobs(id),
  external_id text,
  name text,
  price numeric,
  currency text,
  unit text,
  status text,
  payload_json jsonb NOT NULL DEFAULT '{}',
  matched_raw_material_id uuid REFERENCES raw_materials(id),
  action_required text
);
```
