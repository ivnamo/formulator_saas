# Testing strategy

## Norma del proyecto

- Todo cambio de codigo debe venir con test o una justificacion explicita de por que no aplica todavia.
- Cambios en calculo, dominio, API o tenant isolation requieren tests automatizados.
- Cambios de UI requieren al menos typecheck/lint y smoke test cuando exista servidor local.
- Cambios documentales requieren checks de coherencia con `rg` y worktree limpio.
- Cada rama debe cerrar con una verificacion clara antes de commit o push.
- Tests/checks verdes son obligatorios pero no suficientes para cerrar una rama.
- Despues de tests/checks verdes debe hacerse un quality/refactor gate.
- Si el gate produce cambios de codigo, se reejecutan los tests/checks afectados antes de push.
- La paridad real contra `ivnamo/formulator` se ejecuta manualmente con `npm run check:legacy` cuando se toquen calculo, importacion legacy, precios o parametros tecnicos.
- El frontend mantiene las llamadas HTTP en `workspace-api.ts` o clientes `*-api.ts`; `npm run check:web-api-boundaries` bloquea rutas API directas en hooks/componentes.

## Quality/refactor gate

Ejecutar despues de la primera verificacion verde de cada rama.

Checklist minimo:

1. SOLID: responsabilidades claras, dependencias en la direccion correcta y sin acoplamiento accidental.
2. KISS: la solucion mas simple que cumple la meta, sin capas ceremoniales.
3. YAGNI: no incluir hooks, flags, extensiones o abstracciones para features futuras.
4. DRY razonable: eliminar duplicacion que ya cause riesgo, sin abstraer patrones todavia inestables.
5. Boundaries: dominio determinista en `packages/core`, API en `apps/api`, UI en `apps/web`.
6. Tenant isolation: ningun acceso funcional sin `tenant_id` o contexto equivalente.
7. Naming: conceptos de producto, dominio y codigo consistentes con FormulIA Cloud.
8. Tests: cobertura proporcional al riesgo real del cambio.

Resultado esperado:

- Refactor obligatorio antes de merge.
- Aceptar con nota.
- Mover deuda no bloqueante a backlog.

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
- Paridad legacy: `npm run check:legacy` debe pasar con 20 formulas reales y 52 parametros cuando existan credenciales locales.

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
