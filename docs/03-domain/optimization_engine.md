# Motor de optimización

## Objetivo

Generar fórmulas que cumplan restricciones técnicas y económicas.

## Entrada

- Materias primas candidatas.
- Parámetros técnicos.
- Precios.
- Restricciones.
- Objetivo.
- Opciones.

## Objetivos posibles

- Minimizar precio.
- Maximizar un parámetro.
- Minimizar uso de una materia prima.
- Maximizar uso de una materia prima.
- Balancear coste y concentración.
- Generar alternativas diversas.

## Restricciones posibles

- Suma porcentajes = 100.
- Parámetro mínimo.
- Parámetro máximo.
- Precio máximo.
- Materia prima mínima/máxima.
- Materia prima obligatoria.
- Materia prima excluida.
- Solo activas.
- Solo disponibles.
- Sin blockers de compatibilidad.

## Motores

### MVP

- Linear programming con scipy `linprog`/HiGHS.

### Futuro

- SLSQP.
- COBYLA.
- Algoritmos genéticos.
- Multi-objective optimization.

## Output

```json
{
  "alternatives": [
    {
      "name": "Low cost",
      "items": [
        {"raw_material_id": "uuid", "percentage": 12.5}
      ],
      "price_total": 1.84,
      "parameters": {"active_content": 12.5},
      "constraints_status": [],
      "compatibility_issues": []
    }
  ],
  "status": "success"
}
```

## Infeasible problems

Si no hay solución:

- explicar qué restricciones chocan,
- sugerir relajaciones,
- mostrar materias candidatas insuficientes,
- proponer alternativas.

## Relación con IA

La IA interpreta y prepara el problema. El optimizador calcula.
