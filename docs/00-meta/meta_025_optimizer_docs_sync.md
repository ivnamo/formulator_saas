# META-025 - Optimizer docs sync

## Decision

La vigesimoquinta meta implementable de FormulIA Cloud es sincronizar la documentacion del optimizador con el contrato y flujo que ya existen en backend y frontend.

Este corte no cambia comportamiento. Congela el estado real de la Fase 3 para que futuras metas, prompts y agentes partan de la misma base: validacion de restricciones, solver lineal de precio minimo, UI con bounds, explicaciones de problemas infeasible y guardado explicito del resultado optimizado.

## Alcance incluido

- Rama `codex/optimizer-docs-sync`.
- Documentar `POST /api/v1/optimizations/validate`.
- Documentar `POST /api/v1/optimizations/run`.
- Sustituir el contrato antiguo de `constraints` por `raw_material_bounds` y `parameter_bounds`.
- Documentar que el objetivo implementado es `minimize_price`.
- Documentar que `Save optimized` persiste la formula con `objective=minimize_price`.
- Actualizar tools IA para que apunten al contrato actual.
- Quality/refactor gate proporcional a una rama documental.

## Fuera de alcance

- Nuevos endpoints.
- Cambios de modelo de datos.
- Persistencia de jobs de optimizacion.
- Persistencia del payload completo de restricciones.
- Multiples alternativas.
- Integracion IA real con el optimizador.

## Criterios de done

1. La spec API refleja rutas, request y response actuales del optimizador.
2. La documentacion de dominio diferencia scope actual y futuro.
3. Las tools IA no muestran el contrato antiguo.
4. No aparecen referencias prohibidas ni naming heredado.
5. Checks documentales pasan.
6. Worktree limpio y rama subida.

## Testing minimo

- `git diff --check`.
- `rg` de referencias prohibidas o naming heredado.
- `rg` de contratos antiguos del optimizador en documentacion.
- `npm audit --audit-level=moderate`.
- Tests completos solo si los cambios dejan de ser documentales.

## Riesgos

- No prometer capacidades futuras como si ya estuvieran implementadas.
- No documentar persistencia de restricciones hasta decidir modelo.
- No reintroducir el contrato antiguo de `constraints`.
- Mantener el lenguaje alineado con FormulIA Cloud.

## Siguiente accion

Actualizar `api_spec.md`, `optimization_engine.md` y `tools.md`, manteniendo el cambio acotado a documentacion.
