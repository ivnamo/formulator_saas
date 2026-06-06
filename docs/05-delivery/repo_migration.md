# Migración desde la app Streamlit actual

## Qué conservar

- Concepto de materias primas.
- Familias/parámetros técnicos.
- Fórmulas con materias primas y porcentajes.
- Cálculo de precio y composición.
- Exportación Excel.
- Optimización matemática.

## Qué descartar

- Módulo Calidad.
- Navegación Streamlit.
- Session state como lógica de producto.
- Estructura monolítica.
- Parámetros como columnas fijas para futuro SaaS.

## Migración de lógica

### Cálculo

Extraer a módulo puro:

```text
core/calculator.py
```

Funciones:

- calculate_formula_price.
- calculate_formula_parameters.
- validate_formula.

### Optimización

Extraer a:

```text
core/optimizer.py
```

Mantener Simplex como primer motor.

### Exportación

Extraer a servicio:

```text
services/export_service.py
```

### Materias primas

Migrar datos actuales a:

- raw_materials,
- parameters,
- raw_material_parameter_values,
- raw_material_prices.

## Tabla antigua vs nueva

Si actualmente las materias primas tienen columnas técnicas fijas:

```text
Materia Prima | Precio €/kg | Contenido activo | Viscosidad | ...
```

Migrar a:

```text
raw_materials
parameters
raw_material_parameter_values
raw_material_prices
```

## Riesgos

- Nombres de parámetros no normalizados.
- Materias primas duplicadas.
- Precios sin fecha.
- Fórmulas antiguas sin versión.
- Unidades inconsistentes.

## Recomendación

Crear scripts de migración idempotentes y reportes de problemas antes de importar definitivamente.
