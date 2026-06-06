# Testing strategy

## Norma del proyecto

- Todo cambio de codigo debe venir con test o una justificacion explicita de por que no aplica todavia.
- Cambios en calculo, dominio, API o tenant isolation requieren tests automatizados.
- Cambios de UI requieren al menos typecheck/lint y smoke test cuando exista servidor local.
- Cambios documentales requieren checks de coherencia con `rg` y worktree limpio.
- Cada rama debe cerrar con una verificacion clara antes de commit o push.

## Tipos de tests

- Unit tests.
- Integration tests.
- API tests.
- Tenant isolation tests.
- E2E frontend tests.
- IA/tool tests.
- Import Excel golden files.
- Optimization tests.

## Tests críticos

### Tenant isolation

- Usuario de tenant A no puede leer datos de tenant B.
- RAG search filtra tenant.
- Documents storage respeta tenant.
- ERP staging respeta tenant.

### Cálculo

- Precio ponderado correcto.
- Parámetros ponderados correctos.
- Fórmula incompleta genera warning.
- Materia sin precio genera warning.

### Importación Excel

- Detecta columnas comunes.
- Matching exacto.
- Matching alias.
- Matching fuzzy.
- Materias no encontradas requieren revisión.
- Suma porcentajes valida.

### Optimización

- Problema simple con solución.
- Problema infeasible.
- Restricción de precio máximo.
- Restricción de parámetro mínimo.
- Límites por materia prima.

### IA

- Requirement parser produce JSON válido.
- Supervisor no devuelve fórmula sin tool calls.
- CompatibilityAgent respeta blockers.
- No mezcla tenants.

### ERP

- Sync crea staging.
- Cambios no se aplican sin aprobación si política lo requiere.
- Precios se guardan históricamente.

## Golden files

Crear carpeta de Excels de prueba:

- formato simple,
- múltiples hojas,
- columnas renombradas,
- materias alias,
- materias no encontradas,
- porcentajes con coma decimal,
- totales no 100.

## CI

- Lint.
- Type check.
- Unit tests.
- Migration check.
- E2E smoke.
