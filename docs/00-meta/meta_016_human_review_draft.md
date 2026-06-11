# META-016 - Human review for optimizer drafts

## Decision

La decimosexta meta implementable de FormulIA Cloud es anadir una revision humana ligera antes de guardar una propuesta generada por el optimizer.

Esta meta mantiene la revision como estado local de UI. No introduce workflow persistido, aprobaciones formales ni integraciones externas.

## Alcance incluido

- Rama `codex/human-review-draft`.
- Estado local de revision para drafts aplicados desde `formula_candidates`.
- Notas de decision del usuario antes de guardar.
- Bloqueo de `Save & calculate` mientras el draft aplicado siga pendiente de revision.
- Si se modifica el contenido revisado despues de confirmar, la revision vuelve a quedar pendiente.
- La confirmacion de revision permite guardar y calcular explicitamente.
- Tests/checks y smoke browser desktop/mobile.

## Fuera de alcance

- Persistir revisiones en backend.
- Roles de aprobacion.
- Workflow formal de aprobado/rechazado.
- Versionado de propuestas IA.
- Jira o laboratorio.
- Comparador de alternativas.

## Criterios de done

1. Aplicar un draft crea una revision local pendiente.
2. El usuario puede escribir notas de decision.
3. `Save & calculate` queda bloqueado mientras la revision este pendiente.
4. Confirmar revision desbloquea el guardado explicito.
5. Cambiar nombre, lineas o porcentajes tras confirmar deja la revision pendiente otra vez.
6. Abrir una formula guardada, crear workspace o guardar importacion limpia la revision local.
7. No se guarda ninguna formula automaticamente.
8. Tests/checks pasan.
9. Quality/refactor gate queda aplicado.
10. La rama se sube sin mezclar cambios Jira pendientes.

## Testing minimo

- `npm run check`.
- `python -m pytest`.
- `npm audit --audit-level=moderate`.
- `git diff --check`.
- Smoke browser aplicando draft, confirmando revision y guardando.
- `rg` de referencias prohibidas o naming heredado.

## Riesgos

- No convertir una confirmacion local en aprobacion regulatoria.
- No bloquear formulas manuales que no vienen de un draft IA.
- No ocultar que el calculo backend sigue siendo la fuente de verdad.

## Siguiente accion

Anadir comparacion basica entre la propuesta IA aplicada, la formula guardada y el resultado calculado para detectar cambios manuales antes de persistir.
