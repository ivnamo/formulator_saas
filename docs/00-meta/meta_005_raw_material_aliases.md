# META-005 - Raw material aliases

## Decision

La quinta meta implementable de FormulIA Cloud es anadir aliases persistentes para materias primas y usarlos en el matching exacto del importador Excel.

Esta meta prepara la base para Excels reales sin introducir todavia fuzzy matching ni resolucion manual avanzada. El objetivo es cubrir variaciones conocidas de nombres con control humano y tenant isolation.

## Alcance incluido

- Rama `feature/raw-material-aliases`.
- Modelo persistente de alias por materia prima.
- Endpoint para listar aliases de una materia prima.
- Endpoint para crear alias manual.
- Normalizacion de alias.
- Matching exacto por alias en preview Excel.
- UI compacta para anadir alias a una materia prima.
- Visualizacion simple de aliases creados en el workspace actual.
- Tests API de creacion/listado de alias.
- Tests de importacion Excel usando alias.
- Tenant context obligatorio.
- Quality/refactor gate antes de cerrar rama.

## Fuera de alcance

- Fuzzy matching.
- Alias sugeridos automaticamente.
- Alias globales entre tenants.
- Merge de materias primas.
- Resolucion manual avanzada de filas importadas.
- Auditoria completa de cambios.
- IA o embeddings.

## Contrato minimo

```http
GET /api/v1/raw-materials/{id}/aliases
POST /api/v1/raw-materials/{id}/aliases
```

`POST` recibe:

```json
{
  "alias": "Nombre alternativo"
}
```

El preview Excel debe devolver `matched_by: "alias"` cuando resuelva por alias exacto.

## Criterios de done

1. Un usuario puede crear alias para una materia prima del tenant.
2. Puede listar aliases de esa materia prima.
3. No puede crear/listar aliases de materias de otro tenant.
4. El importador Excel matchea por alias exacto normalizado.
5. La UI permite anadir alias desde la tabla de materias.
6. El preview Excel muestra filas resueltas por alias.
7. Tests/checks pasan.
8. Quality/refactor gate queda aplicado.
9. Worktree limpio y rama subida.

## Testing minimo

- API tests de aliases.
- API test de preview Excel con alias.
- `python -m pytest`.
- `npm run check`.
- Smoke local:
  1. crear workspace,
  2. crear materia,
  3. crear alias,
  4. subir Excel que use alias,
  5. comprobar preview `matched_exact` y `matched_by: alias`,
  6. guardar formula.
- `rg` de referencias prohibidas o naming heredado.
- `git diff --check`.

## Riesgos

- No duplicar logica de normalizacion sin necesidad.
- No permitir alias vacios.
- No convertir alias en un sistema fuzzy prematuro.
- Mantener alias aislados por tenant.

## Siguiente accion

Anadir modelo y endpoints de alias con tests. Despues conectar el matching Excel y la UI.
