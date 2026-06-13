# Meta 135 - Compatibility API client

## Meta

Separar la llamada HTTP de creacion de reglas de compatibilidad del hook de acciones UI.

## Cambios

- Se crea `compatibility-api.ts` con `createCompatibilityRuleApi`.
- Se tipa el payload de creacion de regla.
- `compatibility-actions.ts` conserva validaciones, estado local, reseteo del formulario y mensajes.

## Revision

- Sin cambio funcional esperado.
- El dominio de compatibilidad queda alineado con el patron de clientes API dedicados.
- El hook queda menos acoplado a rutas HTTP concretas.
