# Meta 078 - Compatibility state hook

## Objetivo

Agrupar estado de compatibilidad y sacar el tipo de formulario del componente visual.

## Cambios

- Nuevo `useCompatibilityState` para reglas y formulario de compatibilidad.
- `CompatibilityRuleForm` queda en el modulo de estado y lo comparten panel y actions.
- `page.tsx` deja de inicializar directamente este dominio.

## Verificacion prevista

- `npm run typecheck --workspace apps/web`
- `npm run check --workspace apps/web`
- Smoke test de navegacion hacia Compatibilidad sin errores nuevos.
