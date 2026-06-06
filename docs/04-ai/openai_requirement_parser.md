# OpenAI requirement parser

## Proposito

El primer uso real de LLM en FormulIA Cloud es el `RequirementParserAgent`: convertir una peticion de formulacion en JSON estructurado que despues pueda alimentar tools deterministas.

No genera formulas finales y no sustituye calculo, optimizacion ni validacion tecnica.

## Configuracion local

Ejecutar desde la raiz del repo:

```powershell
.\scripts\set-openai-api-key.ps1
```

El script solicita `OPENAI_API_KEY` mediante consola segura y actualiza `.env.local` con:

```text
OPENAI_API_KEY=...
REQUIREMENT_PARSER_PROVIDER=llm
REQUIREMENT_PARSER_MODEL=gpt-5-nano
```

`.env.local` esta ignorado por Git. Reiniciar la API para cargar el cambio.

## Providers

- `deterministic`: modo local por defecto, sin coste y sin llamada externa.
- `llm` o `openai`: llama a OpenAI Responses API con Structured Outputs.

## Modelo

El default es `gpt-5-nano` porque es el modelo GPT-5 mas eficiente en coste para tareas simples de clasificacion/extraccion y soporta Structured Outputs. El modelo puede cambiarse con `REQUIREMENT_PARSER_MODEL`.

## Endpoints

- `POST /api/v1/ai/requirements/parse`
- `GET /api/v1/ai/runs`

## Contrato de salida

El parser devuelve:

- `product_type`
- `objectives`
- `technical_constraints`
- `economic_constraints`
- `mandatory_raw_materials`
- `excluded_raw_materials`
- `preferences`
- `alternatives`
- `uncertainties`

## Auditoria

Cada parse crea un registro en `ai_runs` con:

- tenant y usuario,
- provider y modelo,
- estado,
- input/output JSON,
- tokens y coste estimado si OpenAI devuelve usage,
- error si falla.

Las claves como `api_key`, `authorization`, `token`, `secret` o `password` se redactan antes de persistir payloads.
