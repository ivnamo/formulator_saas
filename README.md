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
- Solo-dev rule: keep `main` recoverable at all times. Prefer short branches, scoped commits,
  explicit verification notes, ignored local secrets, and a clean worktree before handoff or merge.

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
npm run dev:api
```

This starts FastAPI on `http://127.0.0.1:8010` and applies the small local database pool settings used during authenticated QA.

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
npm run dev:web
```

Then open `http://127.0.0.1:3000`.

For the authenticated real flow, keep `.env.local` configured with Supabase and the API URL:

```text
NEXT_PUBLIC_API_URL=http://127.0.0.1:8010
```

If Supabase returns `EMAXCONNSESSION max clients reached` while loading the app, use the Supabase transaction pooler URL in `DATABASE_URL` (`:6543`) and keep the local pool small with:

```text
FORMULIA_DB_POOL_SIZE=4
FORMULIA_DB_MAX_OVERFLOW=2
FORMULIA_DB_POOL_TIMEOUT=30
```

## Docker Development

Docker is available for the same real authenticated flow. It runs the FastAPI API on `8010`, the Next.js web app on `3000`, and reads secrets from ignored `.env.local`.

Start Docker Desktop first, then run:

Start:

```powershell
npm run dev:docker
```

Rebuild the Docker images only when dependencies or Docker files change:

```powershell
npm run dev:docker:build
```

Open:

```text
http://127.0.0.1:3000
```

Healthcheck:

```text
http://127.0.0.1:8010/health
```

Stop:

```powershell
npm run dev:docker:down
```

The Docker setup intentionally does not copy `.env.local` into images. It is passed at runtime through Compose.

During normal development, source files are mounted into the containers and both dev servers reload automatically:

- Python/API changes reload through `uvicorn --reload`.
- Next.js/web changes reload through `next dev`.
- `.env.local` changes need a service restart, not an image rebuild.
- `package.json`, `package-lock.json`, `pyproject.toml`, `Dockerfile` or `docker-compose.yml` changes usually need `npm run dev:docker:build`.

Checks:

```powershell
.\.venv\Scripts\python -m pytest
npm run check
npm audit --audit-level=moderate
```

The first web screen can seed a demo tenant, raw materials, parameter values, a formula, and then calculate the formula through the FastAPI backend.
