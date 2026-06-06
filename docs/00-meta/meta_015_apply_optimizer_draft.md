# META-015 - Apply optimizer draft

## Decision

La decimoquinta meta implementable de FormulIA Cloud es convertir la propuesta draft del optimizer en una accion UI controlada: aplicar al editor manual, recalcular con backend y dejar el guardado como accion explicita del usuario.

Esta meta mejora el flujo de revision sin automatizar persistencia ni saltarse control humano.

## Alcance incluido

- Rama `codex/apply-optimizer-draft`.
- Boton `Apply draft` en cada formula candidata del supervisor.
- Al aplicar:
  - copia items y porcentajes al editor manual,
  - renombra la formula como draft aplicado,
  - limpia `formulaId` para no sobrescribir una formula existente,
  - llama a `POST /api/v1/formulas/calculate`,
  - muestra resultados en `Calculation results`.
- El usuario debe pulsar `Save` para persistir.
- Tests/checks y smoke browser desktop/mobile.

## Fuera de alcance

- Guardado automatico.
- Versionado de propuestas.
- Comparativa entre alternativas.
- Aprobacion/rechazo formal.
- Human review workflow persistido.

## Criterios de done

1. La UI muestra `Apply draft` solo cuando hay formula candidata.
2. Aplicar una candidata rellena el editor manual.
3. Aplicar una candidata recalcula con el backend.
4. El resultado calculado coincide con la propuesta.
5. No se guarda ninguna formula automaticamente.
6. `formulaId` queda limpio para evitar sobrescrituras.
7. Tests/checks pasan.
8. Quality/refactor gate queda aplicado.
9. La rama se sube sin mezclar cambios Jira pendientes.

## Testing minimo

- `npm run check`.
- `python -m pytest`.
- `npm audit --audit-level=moderate`.
- `git diff --check`.
- Smoke browser aplicando draft.
- `rg` de referencias prohibidas o naming heredado.

## Riesgos

- No confundir aplicar al editor con guardar en biblioteca.
- Mantener el calculo backend como fuente de verdad.
- Evitar duplicar conversiones de formula en varios sitios si crece el flujo.

## Siguiente accion

Anadir revision humana ligera: estado local de propuesta revisada, notas de decision y guardado solo tras confirmacion explicita.
