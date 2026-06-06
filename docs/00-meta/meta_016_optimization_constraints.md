# META-016 - Optimization constraints

## Decision

La decimosexta meta implementable de FormulIA Cloud es definir y validar el contrato minimo de restricciones para el optimizador.

Este corte prepara la Fase 3 sin generar formulas todavia: antes de resolver con programacion lineal, la plataforma debe poder recibir objetivos, materias candidatas y restricciones tecnicas de forma tenant-aware, tipada y testeable.

## Alcance incluido

- Rama `codex/optimization-constraints`.
- Schemas API para una peticion de optimizacion determinista.
- Restricciones de porcentaje minimo/maximo por materia prima.
- Restricciones de parametro minimo/maximo por codigo tecnico.
- Objetivo inicial: minimizar precio.
- Validacion de tenant isolation para materias candidatas.
- Validacion de rangos incoherentes antes de ejecutar cualquier solver.
- Tests API del contrato y errores de validacion.
- UI minima o preparacion de modelo frontend solo si no abre demasiado el alcance.
- Quality/refactor gate antes de cerrar rama.

## Fuera de alcance

- Solver lineal real.
- Generacion de alternativas.
- Persistencia de jobs de optimizacion.
- Explicaciones completas de infeasible.
- Integracion con IA o parser de requisitos.
- Optimizacion multiobjetivo.

## Criterios de done

1. Existe un contrato tipado para solicitar optimizacion.
2. El backend valida que las materias candidatas pertenecen al tenant activo.
3. El backend rechaza restricciones incoherentes, como minimo mayor que maximo.
4. El contrato representa objetivo, candidatos, bounds por materia y bounds por parametro.
5. Los errores son deterministas y utiles para la UI.
6. Tests/checks pasan.
7. Quality/refactor gate queda aplicado.
8. Worktree limpio y rama subida.

## Testing minimo

- `python -m pytest`.
- `npm run check` si se toca frontend.
- Tests API de:
  1. contrato valido,
  2. materia de otro tenant,
  3. rango de materia incoherente,
  4. rango de parametro incoherente.
- `npm audit --audit-level=moderate`.
- `rg` de referencias prohibidas o naming heredado.
- `git diff --check`.

## Riesgos

- No introducir un solver antes de que el contrato sea estable.
- No duplicar reglas de calculo que ya viven en el core.
- No acoplar el contrato a una UI concreta.
- Evitar abstracciones prematuras para objetivos futuros.
- Mantener tenant isolation como primer invariant.

## Siguiente accion

Anadir schemas y endpoint de validacion `POST /api/v1/optimizations/validate`, con tests API antes de implementar el solver real en la siguiente meta.
