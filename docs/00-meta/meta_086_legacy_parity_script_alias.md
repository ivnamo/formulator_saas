# Meta 086 - Legacy parity script alias

## Meta

Hacer repetible desde el flujo habitual del repo la comprobacion de paridad real contra `ivnamo/formulator`.

## Cambios

- Se anade `npm run check:legacy` como alias de `python scripts/legacy_formula_parity.py --limit 20`.
- Se documenta en la estrategia de testing que este check aplica a cambios de calculo, importacion legacy, precios o parametros tecnicos.

## Revision

- El alias no forma parte de `npm run check` porque requiere credenciales locales de legacy.
- No se guardan secretos en git.
- La comprobacion actual contra Supabase legacy pasa con 20 formulas reales y 52 parametros tecnicos.
