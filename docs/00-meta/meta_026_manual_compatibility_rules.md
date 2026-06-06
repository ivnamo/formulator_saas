# META-026 - Manual compatibility rules

## Decision

La vigesima sexta meta implementable de FormulIA Cloud es introducir la primera slice de incompatibilidades manuales por tenant.

Esta meta cubre reglas simples de par de materias primas. No implementa RAG, IA, documentos, reglas por parametro ni aprobaciones con override.

## Alcance incluido

- Rama `codex/manual-compatibility-rules`.
- Tabla funcional `compatibility_rules` con `tenant_id`.
- Endpoints para listar y crear reglas manuales.
- Regla MVP `material_pair`.
- Validacion tenant-scoped de materias primas usadas por la regla.
- Evaluacion de reglas activas durante el calculo de formulas.
- Warnings de calculo con `severity`, `rule_id` y `recommended_action`.
- UI minima para crear y listar reglas manuales por par de materias primas.
- Tests de creacion, aislamiento tenant y evaluacion en calculo.

## Fuera de alcance

- Motor completo de `condition_json`.
- Reglas por parametros, pH, estado fisico o tipo de producto.
- Reglas sugeridas por IA.
- RAG documental o evidencia externa.
- Override autorizado.
- Bloquear guardado de formulas.
- Workflow Jira o laboratorio.

## Criterios de done

1. Un tenant puede crear una regla `material_pair`.
2. Otro tenant no puede ver ni usar esa regla.
3. Calcular una formula con ambos materiales emite un warning de compatibilidad.
4. Calcular una formula sin ambos materiales no emite ese warning.
5. La UI permite crear y ver reglas manuales.
6. Tests/checks pasan.
7. Quality/refactor gate queda aplicado.
8. La rama se sube sin mezclar cambios Jira pendientes.

## Testing minimo

- `python -m pytest apps/api/tests/test_api_foundation.py`.
- `python -m pytest`.
- `npm run check`.
- `npm audit --audit-level=moderate`.
- `git diff --check`.
- Smoke browser creando dos materias primas, una regla y calculando una formula.
- `rg` de referencias prohibidas o naming heredado.

## Riesgos

- No presentar `blocker` como bloqueo real hasta existir workflow de aprobacion.
- No abrir condiciones arbitrarias sin tests.
- Mantener la evaluacion determinista y tenant-scoped.

## Siguiente accion

Anadir foco visual en la lista de warnings para distinguir `blocker`, `warning` e `info`.
