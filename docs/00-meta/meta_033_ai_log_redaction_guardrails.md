# META-033 - AI log redaction guardrails

## Decision

La trigesimotercera meta implementable de FormulIA Cloud es anadir guardrails de redaccion al logging IA.

Antes de conectar un proveedor LLM real, `ai_runs` y `ai_tool_calls` deben evitar persistir secretos obvios en `input_json` y `output_json`. Este corte mantiene la trazabilidad del run, pero redacciona claves y patrones sensibles antes de guardar logs. No introduce llamadas externas ni cambia el parser determinista.

## Alcance incluido

- Rama `codex/ai-log-redaction-guardrails`.
- Redaccion recursiva de claves sensibles en payloads IA.
- Redaccion conservadora de patrones de texto comunes: passwords, tokens, secrets, authorization y API keys.
- Aplicacion de redaccion a `ai_runs.input_json`, `ai_runs.output_json`, `ai_tool_calls.input_json` y `ai_tool_calls.output_json`.
- Tests API que prueban que el parser sigue funcionando pero los logs no guardan secretos obvios.
- Documentacion de seguridad/logging si hace falta ajustar detalles.
- Quality/refactor gate antes de cerrar rama.

## Fuera de alcance

- DLP avanzado.
- Clasificacion semantica de PII.
- Retencion o borrado programado de logs.
- Cifrado por campo.
- Llamadas a OpenAI u otro proveedor LLM.
- Provisionar `OPENAI_API_KEY`.

## Criterios de done

1. Los payloads IA se redaccionan antes de persistirse.
2. La redaccion cubre claves sensibles anidadas.
3. La redaccion cubre secretos obvios escritos dentro de strings.
4. El parser de requisitos sigue devolviendo la respuesta funcional completa al usuario.
5. Los endpoints de lectura devuelven payloads ya redaccionados.
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

- No sobrerredactar contenido tecnico normal.
- No confiar en la UI para ocultar secretos: la proteccion debe estar en backend antes de persistir.
- No tratar esta redaccion como DLP completo.
- Mantener el contrato compatible con futuros providers, tokens y coste real.

## Siguiente accion

Crear helper backend de redaccion, aplicarlo en `_persist_ai_run` y cubrirlo con tests API y unitarios proporcionales.
