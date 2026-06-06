# Market intelligence

## Objetivo

Permitir que el sistema consulte internet/fuentes externas para obtener señales de mercado sobre materias primas.

## Casos de uso

- Precio orientativo.
- Disponibilidad.
- Proveedores.
- Tendencias.
- Alternativas.
- Sustitutos.
- Riesgo de escasez.

## Principio clave

El precio interno/ERP tiene prioridad sobre internet. El mercado externo es señal secundaria.

## Modelo de datos

```sql
CREATE TABLE market_observations (
  id uuid PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id),
  raw_material_id uuid REFERENCES raw_materials(id),
  raw_material_name text,
  supplier_or_source text,
  price numeric,
  currency text,
  unit text,
  region text,
  url text,
  observed_at timestamptz,
  confidence numeric,
  metadata jsonb DEFAULT '{}'
);
```

## Output de búsqueda

```json
{
  "observations": [
    {
      "raw_material_name": "potassium hydroxide",
      "price": 1.2,
      "currency": "EUR",
      "unit": "kg",
      "source": "supplier website",
      "url": "...",
      "observed_at": "2026-06-06",
      "confidence": 0.6
    }
  ]
}
```

## Guardrails

- Marcar claramente fuentes externas.
- No actualizar precios internos automáticamente.
- No usar precios sin unidad/moneda.
- Normalizar moneda y unidad.
- Guardar fecha de observación.
