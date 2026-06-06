# FormulIA Cloud

FormulIA Cloud is a multi-tenant SaaS platform for AI-assisted technical formulation.

This repository is being built from the planning documents in `docs/`. Start with:

1. `docs/README.md`
2. `docs/start_here.md`
3. `docs/00-meta/meta_prompts.md`
4. `docs/00-meta/meta_001_foundation_slice.md`

## Repository Layout

```text
apps/
  api/      FastAPI backend
  web/      Next.js frontend
packages/
  core/     deterministic formulation logic
  shared/   shared contracts and types
infra/
  db/       migrations, seeds, and local database assets
docs/       product, architecture, and delivery documentation
```

## Work Discipline

- Work on descriptive branches, not directly on `main`.
- Keep commits atomic.
- Add proportional tests for code changes.
- After tests/checks pass, run a quality/refactor gate before closing a branch.
- Keep tenant isolation and deterministic calculation ahead of AI features.

## Local Development

From the repository root:

```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install --upgrade pip
.\.venv\Scripts\python -m pip install -e packages/core -e apps/api pytest
npm install
```

Run the API:

```powershell
.\.venv\Scripts\python -m uvicorn formulia_api.main:app --reload --host 127.0.0.1 --port 8000
```

Configure the OpenAI-backed requirement parser:

```powershell
.\scripts\set-openai-api-key.ps1
```

The script prompts for `OPENAI_API_KEY`, writes it to ignored `.env.local`, and enables:

```text
REQUIREMENT_PARSER_PROVIDER=llm
REQUIREMENT_PARSER_MODEL=gpt-5-nano
```

Restart the API after updating `.env.local`. Without that configuration, the parser stays in deterministic mode for local checks.

Run the web app:

```powershell
npm run dev:web -- --hostname 127.0.0.1 --port 3000
```

Checks:

```powershell
.\.venv\Scripts\python -m pytest
npm run check
npm audit --audit-level=moderate
```

The first web screen can seed a demo tenant, raw materials, parameter values, a formula, and then calculate the formula through the FastAPI backend.
