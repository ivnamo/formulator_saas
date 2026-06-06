# META-009 - Excel fuzzy suggestions

## Decision

La novena meta implementable de FormulIA Cloud es anadir sugerencias fuzzy conservadoras en el preview Excel sin resolver automaticamente la fila.

El objetivo es acelerar la revision humana cuando el nombre importado se parece mucho a una materia existente, manteniendo el control del usuario sobre la resolucion final.

## Alcance incluido

- Rama `feature/excel-fuzzy-suggestions`.
- Calculo determinista de similitud entre texto importado y materias del tenant.
- Campos opcionales de sugerencia en cada fila del preview.
- Mantener `needs_review` y `pending_rows` cuando solo existe sugerencia fuzzy.
- UI para mostrar sugerencia y score en la fila pendiente.
- Accion para aceptar la sugerencia usando la resolucion manual existente.
- Tests backend de sugerencia fuzzy sin auto-match.
- Smoke local con Excel que contiene un typo o variante cercana.
- Quality/refactor gate antes de cerrar rama.

## Fuera de alcance

- Auto-match fuzzy.
- Entrenamiento, IA, embeddings o RAG.
- Umbrales configurables por tenant.
- Multiples sugerencias ordenadas.
- Resolver porcentajes invalidos.
- Guardar imports como entidad historica.

## Criterios de done

1. Una fila sin match exacto puede traer `suggested_raw_material_id`.
2. La sugerencia incluye nombre visible y score.
3. Una sugerencia fuzzy no cambia `status` a `matched_exact`.
4. Una sugerencia fuzzy no baja `pending_rows` por si sola.
5. La UI muestra la sugerencia en filas `needs_review`.
6. El usuario puede aceptar la sugerencia y resolver la fila.
7. La formula importada puede guardarse tras aceptar la sugerencia.
8. Tests/checks pasan.
9. Quality/refactor gate queda aplicado.
10. Worktree limpio y rama subida.

## Testing minimo

- `npm run check`.
- `python -m pytest`.
- Smoke local:
  1. crear workspace,
  2. crear materia existente,
  3. subir Excel con nombre parecido pero no exacto,
  4. comprobar sugerencia fuzzy,
  5. aceptar sugerencia,
  6. guardar formula.
- `rg` de referencias prohibidas o naming heredado.
- `git diff --check`.

## Riesgos

- No resolver automaticamente por fuzzy: podria crear errores silenciosos.
- No sugerir matches con score bajo.
- No mezclar score fuzzy con confianza de IA.
- Mantener exact code/name/alias por encima de sugerencias.

## Siguiente accion

Anadir campos opcionales de sugerencia al preview y calcular el mejor candidato fuzzy para filas `needs_review`.
