# META-020 - Optimizer parameter bounds

## Decision

La vigesima meta implementable de FormulIA Cloud es permitir configurar minimo y maximo del parametro activo desde el panel del optimizador.

El backend y el solver ya aceptan `min_value` y `max_value`. Este corte completa la UI minima de restricciones tecnicas sin introducir varios parametros, presets ni IA.

## Alcance incluido

- Rama `codex/optimizer-parameter-bounds-ui`.
- Renombrar el estado frontend de minimo de parametro a bounds tecnicos.
- Input opcional de minimo para el parametro activo.
- Input opcional de maximo para el parametro activo.
- Validacion UI de numeros invalidos y minimo mayor que maximo.
- Payload `parameter_bounds` con `min_value` y/o `max_value`.
- Smoke local con maximo de parametro activo.
- Quality/refactor gate antes de cerrar rama.

## Fuera de alcance

- Multiples parametros simultaneos.
- Selector de parametros.
- Presets de restricciones.
- Explicaciones avanzadas de infeasible.
- Alternativas multiples.

## Criterios de done

1. La UI muestra minimo y maximo del parametro activo.
2. Ambos campos son opcionales.
3. Los numeros invalidos se bloquean antes de llamar a la API.
4. Minimo mayor que maximo se bloquea antes de llamar a la API.
5. El payload incluye `min_value` y `max_value` cuando proceda.
6. Tests/checks pasan.
7. Quality/refactor gate queda aplicado.
8. Worktree limpio y rama subida.

## Testing minimo

- `python -m pytest`.
- `npm run check`.
- Smoke local:
  1. crear workspace,
  2. crear parametro y dos materias,
  3. configurar maximo del parametro activo,
  4. ejecutar optimizador,
  5. verificar que el resultado respeta el maximo.
- `npm audit --audit-level=moderate`.
- `rg` de referencias prohibidas o naming heredado.
- `git diff --check`.

## Riesgos

- No duplicar todo el motor de validacion del backend en la UI.
- Mantener una sola restriccion tecnica visible hasta que haya selector de parametros.
- No confundir bounds de parametro con bounds de materia.

## Siguiente accion

Actualizar estado, controles y payload del panel de optimizacion para soportar minimo y maximo del parametro activo.
