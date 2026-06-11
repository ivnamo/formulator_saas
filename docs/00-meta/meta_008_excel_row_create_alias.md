# META-008 - Create alias from Excel row

## Decision

La octava meta implementable de FormulIA Cloud es permitir crear un alias de materia prima desde una fila pendiente del preview Excel y resolver esa fila con la materia existente seleccionada.

Esta meta hace que el importador aprenda del trabajo manual del usuario: si un proveedor, ERP o archivo historico usa otro nombre para una materia ya existente, el usuario puede guardarlo como alias sin salir del flujo de importacion.

## Alcance incluido

- Rama `feature/excel-row-create-alias`.
- Accion de UI para seleccionar materia existente en una fila `needs_review`.
- Accion de UI para guardar como alias el texto detectado en la fila.
- Resolucion automatica de la fila tras crear el alias.
- Actualizacion del estado local de aliases de la materia seleccionada.
- Guardado de formula importada tras resolver la fila.
- Smoke local que verifica que el alias creado permite que un segundo preview matchee automaticamente.
- Quality/refactor gate antes de cerrar rama.

## Fuera de alcance

- Fuzzy matching automatico.
- Edicion avanzada del alias antes de guardarlo.
- Gestion de aliases duplicados en UI mas alla de la validacion backend.
- Seleccion de hoja Excel.
- Guardar imports como entidad historica.
- Resolver porcentajes invalidos.
- IA, embeddings o RAG.

## Criterios de done

1. Una fila `needs_review` permite seleccionar una materia existente.
2. La fila permite crear alias con el nombre o codigo detectado en el Excel.
3. El alias se persiste mediante el endpoint existente.
4. La materia local muestra el alias creado.
5. La fila queda resuelta automaticamente con `matched_by = manual`.
6. Un segundo preview del mismo Excel matchea por alias.
7. La formula importada puede guardarse cuando no quedan filas pendientes.
8. Tests/checks pasan.
9. Quality/refactor gate queda aplicado.
10. Worktree limpio y rama subida.

## Testing minimo

- `npm run check`.
- `python -m pytest`.
- Smoke local:
  1. crear workspace,
  2. crear materia existente,
  3. subir Excel con nombre alternativo,
  4. seleccionar la materia,
  5. guardar alias desde la fila,
  6. volver a previsualizar el Excel y comprobar matching por alias,
  7. guardar formula.
- `rg` de referencias prohibidas o naming heredado.
- `git diff --check`.

## Riesgos

- No crear aliases vacios si la fila no trae nombre ni codigo.
- No duplicar logica de aliases ya existente en materiales.
- No hacer que la resolucion simple dependa de guardar alias.
- Mantener la validacion backend como ultima barrera.

## Siguiente accion

Anadir estado de seleccion por fila y una accion `Save alias` en filas `needs_review` del importador Excel.
