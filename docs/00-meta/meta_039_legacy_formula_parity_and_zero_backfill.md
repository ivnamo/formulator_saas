# META-039 - Paridad legacy y ceros explicitos

## Decision

La trigesima novena meta implementable de FormulIA Cloud es convertir la comparacion con `ivnamo/formulator` en una comprobacion repetible y cerrar el criterio de dominio: un parametro sin valor equivale a 0 tanto en calculo como en persistencia.

## Contexto

El legacy calcula precio y riquezas directamente desde las filas guardadas en `formulas.materias_primas`:

- Filtra materias con `% > 0`.
- Calcula precio como `Precio EUR/kg * % / 100`.
- Calcula cada riqueza tecnica como `valor_parametro * % / 100`.
- Guarda `precio_total` redondeado a 2 decimales.

La app nueva ya trataba los parametros ausentes como 0 en lectura y calculo, pero quedaban huecos fisicos en la base de datos. Eso podia generar dudas al revisar materias primas, aunque el resultado operativo fuera correcto.

## Alcance de esta slice

- Anadir `scripts/legacy_formula_parity.py` para comparar formulas reales legacy contra el core SaaS.
- Leer legacy Supabase con usuario/password local en `.env.legacy.local` o desde un export JSON.
- Comparar 52 parametros tecnicos legacy por formula.
- Verificar precio calculado, riquezas calculadas y `precio_total` legacy redondeado.
- Anadir `scripts/backfill_zero_parameter_values.py` para insertar valores `0` explicitos donde falten pares materia prima/parametro activo.
- Ejecutar el backfill en la base local/configurada de SaaS.

## Validacion ejecutada

- `.\.venv\Scripts\python scripts\legacy_formula_parity.py --limit 20`
  - `formulas_available`: 20
  - `formulas_checked`: 20
  - `passed`: 20
  - `failed`: 0
  - `skipped`: 0
  - `technical_parameter_count`: 52
  - `max_price_delta`: `2.220446049250313e-16`
  - `max_parameter_delta`: `3.552713678800501e-15`
  - `max_saved_price_delta`: `0.0`
- `.\.venv\Scripts\python scripts\backfill_zero_parameter_values.py --dry-run`
  - Antes: 373 materias, 13 pares materia/parametro ausentes.
- `.\.venv\Scripts\python scripts\backfill_zero_parameter_values.py`
  - Insertadas 13 filas `default_zero`.
- `.\.venv\Scripts\python scripts\backfill_zero_parameter_values.py --dry-run`
  - Despues: `missing_pairs: 0`.

## Como repetirlo

Las credenciales legacy no se guardan en git. El archivo local esperado es:

```env
LEGACY_SUPABASE_EMAIL=...
LEGACY_SUPABASE_PASSWORD=...
```

Comandos:

```powershell
.\.venv\Scripts\python scripts\legacy_formula_parity.py --limit 20
.\.venv\Scripts\python scripts\legacy_formula_parity.py --legacy-export tmp\legacy_formulas.json --limit 20
.\.venv\Scripts\python scripts\backfill_zero_parameter_values.py --dry-run
.\.venv\Scripts\python scripts\backfill_zero_parameter_values.py
```

## Criterios de done

1. Al menos 20 formulas reales legacy pasan paridad de precio y riquezas contra el core SaaS.
2. El parity check compara los 52 parametros tecnicos legacy.
3. La diferencia maxima de precio y parametros es solo ruido numerico de coma flotante.
4. La base SaaS no tiene pares materia prima/parametro activo ausentes.
5. Nuevas materias primas y nuevos parametros siguen creando ceros explicitos automaticamente.
6. Tests API y checks web pasan.

## Riesgos y deuda aceptada

- La comparacion valida la matematica legacy, no que el mapeo historico de nombres sea perfecto para futuras importaciones con columnas nuevas.
- Si legacy cambia nombres de columnas, el script tolera variantes comunes y mojibake, pero puede requerir ampliar alias.
- El backfill se ejecuta contra la base apuntada por `.env.local`; antes de correrlo en otro entorno conviene hacer `--dry-run`.

## Siguiente accion recomendada

Usar este parity check como guardarrail antes de tocar:

- importacion masiva de materias primas,
- migracion completa desde legacy,
- optimizador,
- export Excel,
- nuevas familias o parametros tecnicos.
