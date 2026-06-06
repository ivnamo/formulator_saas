# Arquitectura técnica

## Arquitectura general

```text
apps/
  web/              # Next.js frontend
  api/              # FastAPI backend
  worker/           # background jobs

packages/
  core/             # cálculo, optimización, reglas
  ai/               # agentes, tools, prompts
  integrations/     # ERP/SAP/REST/SFTP
  shared/           # tipos compartidos, contratos
```

## Componentes

### Frontend

- Next.js.
- TypeScript.
- Tailwind.
- shadcn/ui.
- TanStack Query.
- TanStack Table.
- React Hook Form.
- Zod.
- Plotly/Recharts para visualización.

### Backend

- FastAPI.
- Pydantic.
- SQLAlchemy/SQLModel.
- Alembic.
- Auth vía Supabase Auth o proveedor dedicado.
- Middleware de tenant context.
- Endpoints REST.
- Jobs asíncronos.

### Base de datos

- Postgres.
- pgvector.
- Row Level Security si se usa Supabase.
- Todas las tablas funcionales llevan `tenant_id`.

### Storage

- Supabase Storage o S3.
- Separar buckets o prefijos por tenant.
- Documentos originales, previews, exports.

### Queue

- Redis + Celery/RQ/Arq.
- Jobs para ingesta documental, embeddings, importación ERP, generación IA larga.

### IA

- DeepAgents/LangChain como orquestador.
- Tools estrictamente tipadas.
- Structured outputs.
- Logs por ejecución.
- No acceso directo a datos sin tenant context.

## Flujo de petición normal

```text
Frontend -> API -> Service Layer -> Repository -> DB
```

## Flujo IA

```text
Frontend -> API /ai/formulate
API crea ai_run
Supervisor Agent recibe tenant context
Tools consultan DB/RAG/ERP/mercado/papers
Optimizer genera alternativas
Validator comprueba reglas
API devuelve resultado con evidencias
```

## Flujo importación Excel

```text
Upload Excel
↓
Guardar archivo original
↓
Parse workbook
↓
Detectar hoja/columnas
↓
Crear formula_import + rows
↓
Matching de materias primas
↓
Usuario resuelve conflictos
↓
Calcular fórmula
↓
Guardar fórmula
```

## Flujo ERP

```text
ERP Connector
↓
Sync Job
↓
Staging
↓
Matching
↓
Revisión/aprobación
↓
Aplicar cambios
↓
Auditoría
```

## Regla crítica de arquitectura

No permitir que el frontend calcule resultados críticos. El frontend puede hacer previews, pero el backend es la fuente de verdad para:

- precio,
- riqueza,
- restricciones,
- compatibilidad,
- importación confirmada,
- guardado de fórmula,
- consumo de plan/billing.
