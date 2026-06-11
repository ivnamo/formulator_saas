# META-010 - Excel sheet selection

## Decision

La decima meta implementable de FormulIA Cloud es permitir seleccionar la hoja de un archivo Excel antes de previsualizar y guardar la formula importada.

Muchos archivos reales contienen hojas de portada, notas, calculos auxiliares o varias formulas. El importador debe dejar elegir la hoja sin abandonar el flujo.

## Alcance incluido

- Rama `feature/excel-sheet-selection`.
- Endpoint para listar hojas disponibles de un `.xlsx`.
- Preview Excel con parametro opcional `sheet_name`.
- Respuesta de preview con hojas disponibles y hoja seleccionada.
- UI con selector de hoja cuando el archivo tiene mas de una.
- Reprevisualizacion al cambiar de hoja.
- Smoke local con workbook multi-hoja donde la formula no esta en la primera hoja.
- Quality/refactor gate antes de cerrar rama.

## Fuera de alcance

- Importar varias hojas a la vez.
- Fusionar formulas de varias hojas.
- Deteccion inteligente de la mejor hoja.
- Guardar imports como entidad historica.
- Resolver columnas manualmente.
- IA, embeddings o RAG.

## Criterios de done

1. El backend lista las hojas de un `.xlsx`.
2. El preview puede recibir `sheet_name`.
3. Si se pide una hoja inexistente, el backend devuelve error claro.
4. El preview conserva `available_sheets`.
5. La UI guarda el archivo seleccionado en estado local.
6. La UI muestra selector de hoja si hay varias hojas.
7. Al cambiar de hoja se vuelve a pedir preview.
8. La formula importada puede guardarse desde la hoja elegida.
9. Tests/checks pasan.
10. Quality/refactor gate queda aplicado.
11. Worktree limpio y rama subida.

## Testing minimo

- `npm run check`.
- `python -m pytest`.
- Smoke local:
  1. crear workspace,
  2. crear materia existente,
  3. subir workbook con hoja inicial no importable y hoja de formula,
  4. seleccionar hoja de formula,
  5. resolver/guardar formula.
- `rg` de referencias prohibidas o naming heredado.
- `git diff --check`.

## Riesgos

- No perder el `File` en estado al fallar el preview de una hoja.
- No obligar a re-subir el archivo para cambiar de hoja.
- Mantener la seleccion de hoja tenant-scoped solo por cabeceras actuales.
- No convertir esta meta en mapeo manual de columnas.

## Siguiente accion

Anadir listado de hojas al backend y conectar un selector de hoja en la UI de importacion.
