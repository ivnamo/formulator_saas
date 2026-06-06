# Motor de optimización

## Objetivo

Generar fórmulas que cumplan restricciones técnicas y económicas.

## Alcance actual implementado

- Programacion lineal con `scipy.optimize.linprog` y metodo HiGHS.
- Objetivo unico: `minimize_price`.
- Candidatos restringidos al tenant activo.
- Suma de porcentajes igual a 100.
- Bounds opcionales por materia prima: `min_percentage` y `max_percentage`.
- Bounds opcionales por parametro tecnico: `min_value` y `max_value`.
- Resultado unico, no multiples alternativas.
- Estados `success`, `invalid` e `infeasible`.
- Mensajes deterministas para casos simples de problemas infeasible.
- La UI carga la solucion en el editor y solo la persiste al pulsar `Save optimized`.
- La formula guardada conserva `objective=minimize_price`.

## Entrada actual

- Materias primas candidatas.
- Parametros tecnicos por codigo.
- Precios.
- Bounds por materia prima.
- Bounds por parametro.
- Objetivo `minimize_price`.

Ejemplo:

```json
{
  "objective": "minimize_price",
  "candidate_raw_material_ids": ["uuid"],
  "raw_material_bounds": [
    {"raw_material_id": "uuid", "min_percentage": 10.0, "max_percentage": 80.0}
  ],
  "parameter_bounds": [
    {"code": "active_content", "min_value": 20.0, "max_value": 40.0}
  ]
}
```

## Objetivos futuros

- Maximizar un parámetro.
- Minimizar uso de una materia prima.
- Maximizar uso de una materia prima.
- Balancear coste y concentración.
- Generar alternativas diversas.

## Restricciones actuales

- Suma porcentajes = 100.
- Parámetro mínimo.
- Parámetro máximo.
- Materia prima mínima/máxima.

## Restricciones futuras

- Precio máximo.
- Materia prima obligatoria.
- Materia prima excluida.
- Solo activas.
- Solo disponibles.
- Sin blockers de compatibilidad.

## Motores

### MVP

- Linear programming con scipy `linprog`/HiGHS para minimizar precio.

### Futuro

- SLSQP.
- COBYLA.
- Algoritmos genéticos.
- Multi-objective optimization.

## Output

```json
{
  "status": "success",
  "objective": "minimize_price",
  "items": [
    {"raw_material_id": "uuid", "percentage": 40.0}
  ],
  "calculation": {
    "total_percentage": 100.0,
    "price_total": 2.2,
    "currency": "EUR",
    "parameters": [
      {"code": "active_content", "value": 20.0, "unit": "% p/p"}
    ],
    "warnings": []
  },
  "messages": [],
  "issues": []
}
```

## Infeasible problems

Si no hay solución:

- devolver `status=infeasible`,
- no devolver items ni calculation,
- incluir mensajes deterministas para bounds simples.

Sugerencias de relajacion, alternativas y explicaciones completas quedan para metas futuras.

## Relación con IA

La IA interpreta y prepara el problema. El optimizador calcula de forma determinista.

La integracion IA todavia no debe llamar a contratos antiguos basados en `constraints`; debe preparar `candidate_raw_material_ids`, `raw_material_bounds` y `parameter_bounds`.
