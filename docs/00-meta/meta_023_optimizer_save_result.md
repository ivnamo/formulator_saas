# META-023 - Optimizer save result

## Decision

La vigesimotercera meta implementable de FormulIA Cloud es permitir guardar explicitamente una formula optimizada desde el panel del optimizador.

El resultado optimizado ya se carga en el editor como borrador. Este corte hace visible el paso de revision y guardado, sin persistencia automatica: el usuario decide guardar la formula candidata cuando el resultado es `success`.

## Alcance incluido

- Rama `codex/optimizer-save-result`.
- Boton visible `Save optimized` para resultados `success`.
- Reutilizacion del flujo existente de crear formula y calcular.
- Refactor pequeno para evitar duplicar guardado/calculo.
- Actualizacion de biblioteca despues de guardar.
- Smoke local que optimiza, guarda y verifica la formula en biblioteca.
- Quality/refactor gate antes de cerrar rama.

## Fuera de alcance

- Persistencia automatica al optimizar.
- Versionado especial de formulas optimizadas.
- Metadatos de job de optimizacion.
- Comparacion automatica contra formula anterior.
- Multiples alternativas.

## Criterios de done

1. El resultado optimizado no se guarda automaticamente.
2. La UI muestra una accion explicita para guardar resultados `success`.
3. La accion crea una formula persistida usando el tenant activo.
4. La formula guardada aparece en la biblioteca.
5. Tests/checks pasan.
6. Quality/refactor gate queda aplicado.
7. Worktree limpio y rama subida.

## Testing minimo

- `python -m pytest`.
- `npm run check`.
- Smoke local:
  1. crear workspace,
  2. crear parametro y dos materias,
  3. ejecutar optimizador,
  4. verificar que aun no hay formulas guardadas,
  5. pulsar `Save optimized`,
  6. verificar que aparece una formula en biblioteca.
- `npm audit --audit-level=moderate`.
- `rg` de referencias prohibidas o naming heredado.
- `git diff --check`.

## Riesgos

- No duplicar la logica de guardado del editor.
- No guardar si el resultado es `invalid` o `infeasible`.
- No mezclar persistencia con ejecucion del solver.
- Mantener el flujo de revision manual.

## Siguiente accion

Extraer un helper de guardado/calculo reutilizable y anadir una accion `Save optimized` al panel cuando el resultado es exitoso.
