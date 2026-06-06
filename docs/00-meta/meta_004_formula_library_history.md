# META-004 - Formula library and calculation history

## Decision

La cuarta meta implementable de FormulIA Cloud es convertir las formulas guardadas en una biblioteca operativa. El usuario debe poder ver las formulas del tenant, abrir una formula existente en el editor y consultar su historial de calculos.

Esta meta consolida el core manual e importado antes de avanzar a matching Excel avanzado u optimizacion. No introduce IA ni versionado complejo.

## Alcance incluido

- Rama `feature/formula-library-history`.
- Listado de formulas del tenant desde backend.
- Apertura de una formula existente en el editor UI.
- Endpoint para consultar historial de calculos de una formula.
- UI compacta para ver ultimo precio, moneda, estado, numero de lineas y calculos.
- Historial visible con fecha, precio, porcentaje total y warnings.
- Boton para refrescar biblioteca.
- Tenant context obligatorio.
- Tests API de biblioteca, historial y aislamiento tenant.
- Smoke local con crear formula, calcular, refrescar, abrir e inspeccionar historial.
- Quality/refactor gate antes de cerrar rama.

## Fuera de alcance

- Versionado avanzado.
- Comparador de formulas.
- Duplicar formula.
- Borrado de formulas.
- Permisos granulares.
- Auditoria completa.
- Exportacion Excel/PDF.
- Optimizacion.
- IA o RAG.

## Contrato minimo

Ya existe:

```http
GET /api/v1/formulas
GET /api/v1/formulas/{id}
```

Nuevo:

```http
GET /api/v1/formulas/{id}/calculations
```

Devuelve calculos persistidos ordenados de mas reciente a mas antiguo.

## Criterios de done

1. Un usuario puede refrescar la biblioteca de formulas del tenant.
2. La biblioteca lista formulas guardadas manuales o importadas.
3. Un usuario puede abrir una formula de la biblioteca en el editor.
4. Al abrir, se reconstruyen las lineas de formula con porcentajes.
5. El usuario puede calcular la formula abierta.
6. El historial muestra al menos el ultimo calculo persistido.
7. El historial no expone calculos de otro tenant.
8. Tests/checks pasan.
9. Quality/refactor gate queda aplicado.
10. Worktree limpio y rama subida.

## Testing minimo

- API tests para `GET /formulas/{id}/calculations`.
- API test de tenant isolation sobre historial.
- `python -m pytest`.
- `npm run check`.
- Smoke local:
  1. crear workspace,
  2. crear datos y formula,
  3. calcular,
  4. refrescar biblioteca,
  5. abrir formula,
  6. comprobar historial.
- `rg` de referencias prohibidas o naming heredado.
- `git diff --check`.

## Riesgos

- No resolver versionado antes de tener necesidad real.
- No meter tabla compleja o filtros avanzados todavia.
- Evitar duplicar estado entre biblioteca, editor e historial.
- Mantener calculo determinista en backend.

## Siguiente accion

Anadir endpoint de historial con tests y conectar la biblioteca en la UI del workspace.
