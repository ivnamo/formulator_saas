# META-017 - Linear optimizer MVP

## Decision

La decimoseptima meta implementable de FormulIA Cloud es ejecutar el primer optimizador lineal determinista.

Este corte usa el contrato validado en META-016 para generar una formula candidata de coste minimo con programacion lineal. El objetivo es tener una base matematica real, pequena y testeada antes de anadir alternativas, explicaciones avanzadas o IA.

## Alcance incluido

- Rama `codex/linear-optimizer-mvp`.
- Solver puro en `packages/core` usando `scipy.optimize.linprog`.
- Objetivo inicial: minimizar precio.
- Restriccion de suma de porcentajes igual a 100.
- Bounds por materia prima.
- Bounds mínimos/máximos por parámetro técnico.
- Endpoint tenant-aware `POST /api/v1/optimizations/run`.
- Respuesta con estado `success` o `infeasible`.
- Formula candidata no persistida con lineas, precio y parametros calculados.
- Tests core del solver.
- Tests API de ejecucion, tenant isolation e infeasible.
- Quality/refactor gate antes de cerrar rama.

## Fuera de alcance

- Persistir resultados de optimización.
- Generar varias alternativas diversas.
- Explicaciones detalladas de infeasible.
- UI completa del optimizador.
- Objetivos distintos a minimizar precio.
- Compatibilidad/incompatibilidades.
- Parser IA de requisitos.

## Criterios de done

1. El core expone una funcion determinista para resolver el problema lineal minimo.
2. El solver respeta suma 100, bounds de materias y bounds de parámetros.
3. El solver rechaza o marca como infeasible problemas sin solución.
4. La API adapta datos del tenant activo al solver sin mezclar tenants.
5. La respuesta API incluye lineas de formula, precio total y parametros calculados.
6. Tests/checks pasan.
7. Quality/refactor gate queda aplicado.
8. Worktree limpio y rama subida.

## Testing mínimo

- `python -m pytest`.
- `npm run check` si se toca frontend.
- Tests core de:
  1. minimizacion por precio,
  2. bound minimo de parametro,
  3. problema infeasible.
- Tests API de:
  1. optimizacion valida,
  2. materia candidata de otro tenant,
  3. infeasible por restricciones.
- `npm audit --audit-level=moderate`.
- `rg` de referencias prohibidas o naming heredado.
- `git diff --check`.

## Riesgos

- No esconder errores de datos como resultados válidos.
- No persistir formulas generadas hasta tener flujo de revision.
- Mantener el solver sin dependencias de DB, HTTP o UI.
- Evitar duplicar cálculo de coste/parámetros fuera del core.
- Asegurar que la API reutiliza la validación de META-016.

## Siguiente acción

Crear `optimizer.py` en el core, añadir dependencia `scipy`, exponer el endpoint `POST /api/v1/optimizations/run` y cubrirlo con tests core/API.
