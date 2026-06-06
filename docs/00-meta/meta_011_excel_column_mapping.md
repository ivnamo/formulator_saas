# META-011 - Excel column mapping

## Decision

La undecima meta implementable de FormulIA Cloud es permitir mapear manualmente columnas de una hoja Excel cuando las cabeceras no coinciden con los nombres detectados automaticamente.

Esta meta completa la parte practica de deteccion de hojas/columnas del importador: el usuario puede elegir hoja y, si el archivo usa cabeceras propias, indicar que columna contiene materia, codigo y porcentaje.

## Alcance incluido

- Rama `feature/excel-column-mapping`.
- Endpoint para listar columnas candidatas de una hoja Excel.
- Preview Excel con mapeo manual opcional de columnas.
- UI para seleccionar columnas de nombre, codigo y porcentaje.
- Reprevisualizacion al aplicar el mapeo.
- Soporte para usar nombre o codigo como identificador de materia.
- Smoke local con cabeceras no reconocidas automaticamente.
- Quality/refactor gate antes de cerrar rama.

## Fuera de alcance

- Guardar plantillas de mapeo por tenant.
- Mapeo por indice avanzado con columnas duplicadas.
- Importar varias hojas a la vez.
- Deteccion inteligente de mejor mapeo.
- Guardar imports como entidad historica.
- IA, embeddings o RAG.

## Criterios de done

1. El backend lista columnas de una hoja seleccionada.
2. El preview acepta mapeo manual de columnas.
3. El mapeo manual permite detectar porcentaje aunque la cabecera no sea conocida.
4. El mapeo manual permite usar nombre o codigo de materia.
5. La UI muestra selectores de columnas cuando hay archivo/hoja.
6. La UI permite aplicar mapeo y regenerar preview sin re-subir.
7. La formula importada puede guardarse tras aplicar mapeo.
8. Tests/checks pasan.
9. Quality/refactor gate queda aplicado.
10. Worktree limpio y rama subida.

## Testing minimo

- `npm run check`.
- `python -m pytest`.
- Smoke local:
  1. crear workspace,
  2. crear materia existente,
  3. subir Excel con cabeceras no reconocidas,
  4. elegir columnas manualmente,
  5. previsualizar,
  6. guardar formula.
- `rg` de referencias prohibidas o naming heredado.
- `git diff --check`.

## Riesgos

- No aceptar mapeos incompletos que no tengan porcentaje.
- No obligar a usar nombre y codigo a la vez.
- Mantener exact code/name/alias/fuzzy igual tras parsear las filas.
- Evitar que el mapeo manual complique el parser automatico existente.

## Siguiente accion

Anadir contrato de columnas al backend y conectar una seccion compacta de mapeo manual en la UI de importacion.
