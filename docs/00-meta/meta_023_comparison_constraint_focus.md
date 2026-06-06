# META-023 - Comparison constraint focus

## Decision

La vigesima tercera meta implementable de FormulIA Cloud es permitir enfocar el comparador en restricciones que requieren atencion.

Esta meta no cambia como se evaluan las restricciones. Solo permite filtrar la lista visible para ver rapidamente las reglas con estado `failed` o `missing` en cualquiera de las dos formulas.

## Alcance incluido

- Rama `codex/comparison-constraint-focus`.
- Toggle local en el bloque de restricciones del comparador.
- Modo normal: muestra todas las restricciones evaluadas.
- Modo `Needs attention`: muestra solo restricciones donde base o candidata no estan `passed`.
- Estado vacio cuando el filtro no encuentra restricciones con problemas.
- El resumen de cumplimiento sigue calculandose con todas las restricciones.
- Tests/checks y smoke browser desktop/mobile.

## Fuera de alcance

- Persistir la preferencia de filtro.
- Busqueda textual de restricciones.
- Agrupacion avanzada.
- Severidades configurables.
- Nuevos tipos de restricciones.
- Cambios en backend o modelo de datos.

## Criterios de done

1. El usuario puede activar y desactivar el filtro de restricciones con problemas.
2. El filtro muestra restricciones `failed` o `missing` de base o candidata.
3. Las restricciones `passed` para ambas formulas se ocultan en modo foco.
4. El resumen de cumplimiento no cambia al activar el filtro.
5. Si no hay problemas, se muestra un estado vacio claro.
6. Tests/checks pasan.
7. Quality/refactor gate queda aplicado.
8. La rama se sube sin mezclar cambios Jira pendientes.

## Testing minimo

- `npm run check`.
- `python -m pytest`.
- `npm audit --audit-level=moderate`.
- `git diff --check`.
- Smoke browser con restricciones mezcladas `passed`, `failed` y `missing`.
- Smoke browser mobile para confirmar que el toggle y la lista filtrada no rompen el layout.
- `rg` de referencias prohibidas o naming heredado.

## Riesgos

- No ocultar el resumen: el filtro solo afecta el detalle.
- No tratar `missing` como valido.
- No sobredisenar filtros hasta tener mas reglas reales.

## Siguiente accion

Volver al optimizador y anadir explicaciones deterministas de inviabilidad cuando no pueda producir una alternativa.
