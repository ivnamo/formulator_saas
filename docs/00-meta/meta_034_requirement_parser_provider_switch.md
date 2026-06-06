# META-034 - Requirement parser provider switch

## Decision

La trigesimocuarta meta implementable de FormulIA Cloud es preparar el parser de requisitos para un futuro proveedor LLM mediante configuracion explicita.

El sistema debe seguir usando el parser determinista por defecto. Si se activa modo `llm` sin credenciales o sin implementacion habilitada, el endpoint debe fallar de forma controlada y auditable, sin intentar llamadas externas ni degradar silenciosamente. Este corte deja el contrato listo para conectar OpenAI u otro proveedor en una meta posterior que si requerira validar modelo, coste y `OPENAI_API_KEY`.

## Alcance incluido

- Rama `codex/requirement-parser-provider-switch`.
- Configuracion backend `REQUIREMENT_PARSER_PROVIDER`.
- Valor por defecto `deterministic`.
- Validacion de proveedores soportados.
- Error claro si se solicita `llm` antes de configurar credenciales/adapter real.
- El flujo determinista conserva respuesta, logging y redaccion existentes.
- Tests API para provider por defecto, provider invalido y provider `llm` no configurado.
- Documentacion de entorno y siguiente decision requerida.
- Quality/refactor gate antes de cerrar rama.

## Fuera de alcance

- Llamadas a OpenAI u otro proveedor LLM.
- Provisionar `OPENAI_API_KEY`.
- Elegir modelo definitivo.
- Streaming, reintentos o jobs asincronos.
- Prompt final del parser LLM.
- UI para cambiar provider por tenant.

## Criterios de done

1. Sin variables de entorno, `POST /requirements/parse` sigue funcionando como antes.
2. `REQUIREMENT_PARSER_PROVIDER=deterministic` conserva `provider=deterministic` y `model=rules:v1` en logs.
3. Provider desconocido devuelve error 500 controlado con mensaje operativo.
4. `REQUIREMENT_PARSER_PROVIDER=llm` devuelve error controlado mientras no haya credenciales/adapter real.
5. No se realizan llamadas externas.
6. Tests/checks pasan.
7. Quality/refactor gate queda aplicado.
8. Worktree limpio y rama subida.

## Testing minimo

- `python -m pytest`.
- `npm run check`.
- `npm audit --audit-level=moderate`.
- `rg` de referencias prohibidas o naming heredado.
- `rg` de deuda explicita.
- `git diff --check`.

## Riesgos

- No hacer fallback silencioso de `llm` a determinista si el operador pidio LLM.
- No introducir secretos en repo ni docs locales.
- No acoplar el provider al frontend todavia.
- Mantener trazabilidad y redaccion de META-031/META-033.

## Siguiente accion

Extraer la seleccion de provider del endpoint, mantener determinista como default y anadir tests de configuracion.
