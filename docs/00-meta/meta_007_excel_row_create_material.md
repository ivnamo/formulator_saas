# META-007 - Create material from Excel row

## Decision

La septima meta implementable de FormulIA Cloud es permitir crear una materia prima desde una fila pendiente del preview Excel y resolver esa fila con la materia recien creada.

Esta meta reduce friccion en imports reales: si el Excel contiene una materia que aun no existe en el workspace, el usuario no debe abandonar el flujo de importacion para crearla en otra seccion.

## Alcance incluido

- Rama `feature/excel-row-create-material`.
- Accion de UI para crear materia prima desde una fila `needs_review`.
- Reutilizar el `material_code` y `material_name` detectados en el Excel.
- Resolver automaticamente la fila con la materia creada.
- Mantener la materia creada en el estado local del workspace.
- Permitir guardar la formula importada tras resolver la fila.
- Mostrar avisos de calculo existentes si la materia creada no tiene precio o valores de parametro.
- Smoke local con Excel que contiene una materia no existente.
- Quality/refactor gate antes de cerrar rama.

## Fuera de alcance

- Fuzzy matching automatico.
- Crear alias desde una fila pendiente.
- Editar precio o parametros dentro de la tabla de importacion.
- Seleccion de hoja Excel.
- Guardar imports como entidad historica.
- Resolver porcentajes invalidos.
- IA, embeddings o RAG.

## Criterios de done

1. Una fila `needs_review` permite crear materia prima sin salir del preview.
2. La materia creada usa codigo y nombre del Excel cuando existen.
3. La fila queda resuelta automaticamente con `matched_by = manual`.
4. El contador de pendientes baja.
5. La formula importada puede guardarse cuando no quedan filas pendientes.
6. La formula guardada puede calcularse con los avisos actuales si faltan datos.
7. Tests/checks pasan.
8. Quality/refactor gate queda aplicado.
9. Worktree limpio y rama subida.

## Testing minimo

- `npm run check`.
- `python -m pytest`.
- Smoke local:
  1. crear workspace,
  2. subir Excel con una materia nueva,
  3. crear materia desde la fila pendiente,
  4. guardar formula,
  5. calcular y revisar avisos esperados.
- `rg` de referencias prohibidas o naming heredado.
- `git diff --check`.

## Riesgos

- No duplicar logica de alta de materia mas alla del minimo necesario.
- No presentar materias sin precio o parametros como completas.
- Mantener la validacion backend como ultima barrera.
- Evitar que el boton de crear materia tape o reordene el selector manual existente.

## Siguiente accion

Anadir una accion en la tabla de importacion para crear materia prima desde una fila `needs_review` y resolverla automaticamente.
