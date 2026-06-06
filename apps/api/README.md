# FormulIA API

FastAPI backend for FormulIA Cloud.

The first slice must expose a healthcheck, tenant-scoped MVP endpoints, deterministic formula calculation, and tenant isolation tests.

## OpenAI requirement parser

By default, `POST /api/v1/ai/requirements/parse` uses the local deterministic parser.

To enable OpenAI locally:

```powershell
.\scripts\set-openai-api-key.ps1
```

Then restart the API. The script writes ignored `.env.local` settings for `OPENAI_API_KEY`, `REQUIREMENT_PARSER_PROVIDER=llm`, and `REQUIREMENT_PARSER_MODEL=gpt-5-nano`.
