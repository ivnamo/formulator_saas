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
- Keep tenant isolation and deterministic calculation ahead of AI features.
