# META-019 - Optimizer candidate bounds

## Decision

La decimonovena meta implementable de FormulIA Cloud es permitir elegir candidatos y limites por materia prima en el panel del optimizador.

Este corte convierte el optimizador minimo en una herramienta mas controlable: el usuario puede incluir/excluir materias primas y marcar porcentajes minimo/maximo por materia antes de ejecutar el solver. Sigue siendo un flujo de revision, sin persistencia automatica.

## Alcance incluido

- Rama `codex/optimizer-candidate-bounds`.
- Estado frontend para candidatos activos del optimizador.
- Inputs opcionales de minimo y maximo por materia prima.
- Payload `candidate_raw_material_ids` filtrado por materias seleccionadas.
- Payload `raw_material_bounds` generado solo para bounds validos.
- Validacion UI de numeros invalidos antes de llamar a la API.
- Visualizacion compacta de candidatos en el panel actual.
- Smoke local con materia excluida y bound minimo.
- Quality/refactor gate antes de cerrar rama.

## Fuera de alcance

- Maximos por parametro.
- Selector avanzado por familias o tags.
- Guardar presets de optimizacion.
- Persistir formula optimizada.
- Varias alternativas.
- Explicaciones avanzadas de infeasible.

## Criterios de done

1. La UI muestra cada materia prima como candidata configurable.
2. El usuario puede incluir o excluir cada materia del solver.
3. El usuario puede definir minimo/maximo por materia.
4. El payload solo incluye materias seleccionadas.
5. Los bounds invalidos se bloquean en UI antes de llamar a la API.
6. Un resultado `success` sigue cargando la formula candidata en el editor.
7. Tests/checks pasan.
8. Quality/refactor gate queda aplicado.
9. Worktree limpio y rama subida.

## Testing minimo

- `python -m pytest`.
- `npm run check`.
- Smoke local:
  1. crear workspace,
  2. crear parametro y tres materias,
  3. excluir una materia barata,
  4. forzar minimo de una materia candidata,
  5. ejecutar optimizador,
  6. verificar que el resultado respeta candidatos y bounds.
- `npm audit --audit-level=moderate`.
- `rg` de referencias prohibidas o naming heredado.
- `git diff --check`.

## Riesgos

- No duplicar validaciones complejas del backend en la UI.
- No esconder los errores de API si el problema es invalid o infeasible.
- Mantener controles densos y escaneables.
- Evitar que cambios en materiales dejen estado de candidatos obsoleto.

## Siguiente accion

Anadir estado de candidatos/bounds, renderizar controles por materia en el panel de optimizacion y ajustar el payload de `runOptimizer`.
