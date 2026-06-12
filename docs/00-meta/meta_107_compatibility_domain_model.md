# Meta 107 - Compatibility domain model

## Meta

Separar el contrato de reglas de compatibilidad del modelo global del workspace.

## Cambios

- Se crea `compatibility-model.ts`.
- Se mueve `CompatibilityRuleRead`.
- `workspace-model.ts` reexporta el tipo para mantener estables los imports actuales.

## Revision

- Alcance sin cambio funcional.
- El dominio de compatibilidad queda alineado con sus hooks y paneles dedicados.
- El modelo global del workspace reduce otro contrato de dominio lateral.
