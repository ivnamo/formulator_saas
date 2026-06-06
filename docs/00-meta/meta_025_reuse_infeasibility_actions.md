# META-025 - Reuse infeasibility actions

## Decision

La vigesima quinta meta implementable de FormulIA Cloud es permitir que el usuario reutilice manualmente una accion sugerida por el optimizer cuando no hay alternativa viable.

Esta meta convierte las explicaciones de META-024 en un gesto de UI. No relaja restricciones automaticamente ni vuelve a ejecutar el supervisor sin decision humana.

## Alcance incluido

- Rama `codex/reuse-infeasibility-actions`.
- Boton de accion por cada `infeasibility_explanation`.
- El boton anade la accion sugerida al textarea de requisitos.
- Evita duplicar la misma accion si ya esta en el texto.
- Mantiene el plan existente visible hasta que el usuario vuelva a ejecutar `Plan`.
- Documentacion de UX y supervisor actualizada.
- Tests/checks y smoke browser desktop/mobile.

## Fuera de alcance

- Reintentos automaticos.
- Relaxation engine.
- Cambios backend en el solver.
- Persistir ajustes sugeridos.
- Generar prompts IA nuevos.
- Workflow de aprobacion o Jira.

## Criterios de done

1. Cada explicacion de inviabilidad muestra una accion manual.
2. La accion sugerida puede reutilizarse en el requisito del usuario.
3. La UI no dispara `Plan` automaticamente.
4. No se duplican acciones ya presentes en el textarea.
5. El layout sigue funcionando en desktop y mobile.
6. Tests/checks pasan.
7. Quality/refactor gate queda aplicado.
8. La rama se sube sin mezclar cambios Jira pendientes.

## Testing minimo

- `npm run check`.
- `python -m pytest`.
- `npm audit --audit-level=moderate`.
- `git diff --check`.
- Smoke browser con un caso `blocked` y click en la accion sugerida.
- Smoke browser mobile para confirmar que la accion no rompe layout.
- `rg` de referencias prohibidas o naming heredado.

## Riesgos

- El usuario podria interpretar la accion como correccion automatica. La UI debe mantenerla como gesto manual.
- No ocultar la explicacion original al anadir el texto, para que siga habiendo contexto.
- No convertir esta meta en un motor de relajacion de restricciones.

## Siguiente accion

Registrar en `ai_runs` la relacion entre plan original y posterior replanificacion solo cuando exista un flujo persistido de ajustes.
