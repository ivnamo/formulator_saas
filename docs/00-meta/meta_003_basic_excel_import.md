# META-003 - Basic Excel import

## Decision

La tercera meta implementable de FormulIA Cloud es un importador Excel basico para formulas simples. Debe permitir subir un `.xlsx`, detectar columnas habituales, emparejar filas por codigo o nombre exacto contra materias primas del tenant y crear una formula si todas las lineas estan resueltas.

Esta meta no intenta resolver importacion inteligente completa. Su objetivo es validar el flujo inicial: archivo externo -> preview estructurado -> matching exacto -> formula calculable con el mismo backend determinista.

## Alcance incluido

- Rama `feature/basic-excel-import`.
- Parser `.xlsx` simple con primera hoja activa.
- Deteccion de columnas para material/codigo/nombre y porcentaje.
- Normalizacion basica de textos y porcentajes.
- Matching exacto por codigo de materia prima.
- Matching exacto por nombre normalizado de materia prima.
- Respuesta de preview con estado por fila.
- Endpoint para subir Excel y recibir preview.
- Endpoint o accion para guardar como formula cuando todas las filas estan resueltas.
- UI minima en workspace editor para subir archivo, ver preview y guardar formula importada.
- Tests con archivos Excel sinteticos generados en memoria.
- Tenant context obligatorio.
- Quality/refactor gate antes de cerrar rama.

## Fuera de alcance

- Fuzzy matching.
- Alias persistentes.
- Resolucion manual avanzada.
- Seleccion de hoja.
- Importacion de multiples formulas por archivo.
- Guardar archivo original en storage.
- Tabla historica de imports.
- IA, RAG o embeddings.
- Optimizador.
- Exportacion Excel/PDF.

## Contrato minimo

`POST /api/v1/imports/formulas/excel/preview`

- Entrada: multipart con `file`.
- Salida: filas detectadas, columnas usadas, total de porcentaje, filas resueltas y filas con revision pendiente.

`POST /api/v1/imports/formulas/excel/save`

- Entrada: nombre de formula y filas resueltas del preview.
- Salida: formula creada.

Si el preview contiene filas sin `raw_material_id`, la accion de guardado debe rechazar la peticion.

## Criterios de done

1. Un usuario puede subir un `.xlsx` simple desde la UI.
2. El backend detecta columnas de material/codigo/nombre y porcentaje.
3. Las filas con codigo exacto se resuelven contra materias primas del tenant.
4. Las filas sin codigo pero con nombre exacto normalizado se resuelven.
5. Las filas no resueltas aparecen como `needs_review`.
6. Porcentajes invalidos aparecen como `invalid_percentage`.
7. Si todas las filas estan resueltas, la UI permite guardar como formula.
8. La formula importada puede calcularse con el flujo existente.
9. Tenant isolation se mantiene en endpoints de importacion.
10. Tests/checks pasan.
11. Quality/refactor gate queda aplicado.
12. Worktree limpio y rama subida.

## Testing minimo

- Unit tests del parser con `.xlsx` en memoria.
- API tests para preview, save y tenant isolation.
- `python -m pytest`.
- `npm run check`.
- Smoke local:
  1. crear workspace,
  2. crear parametro y dos materias,
  3. subir `.xlsx` simple,
  4. guardar formula importada,
  5. calcular.
- `rg` de referencias prohibidas o naming heredado.
- `git diff --check`.

## Riesgos

- La dependencia Excel debe mantenerse pequena y explicita.
- No sobredisenar persistence de imports antes de validar formatos reales.
- No mezclar matching fuzzy o alias hasta tener casos reales.
- Evitar que la UI esconda filas no resueltas.

## Siguiente accion

Implementar primero parser y tests de API. Despues conectar la UI con un control de archivo y preview compacto.
