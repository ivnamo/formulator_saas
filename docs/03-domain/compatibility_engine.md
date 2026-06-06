# Motor de incompatibilidades

## Objetivo

Detectar riesgos al combinar materias primas o alcanzar ciertos rangos de parámetros en una fórmula.

## Niveles de evidencia

1. Regla manual validada por el tenant.
2. Regla derivada de documentación interna.
3. Evidencia de paper.
4. Fuente externa/web.
5. Inferencia IA.

## Severidad

- `blocker`: impide aprobación salvo override autorizado.
- `warning`: permite continuar con advertencia.
- `info`: información técnica.

## Tipos de regla

- Par de materias primas incompatible.
- Parámetros incompatibles por umbral.
- pH fuera de rango.
- Riesgo de precipitación.
- Límite máximo de ingrediente.
- Reglas por estado físico.
- Reglas por tipo de producto.

## Modelo flexible

Usar `condition_json` para soportar reglas configurables.

Ejemplo:

```json
{
  "all": [
    {"parameter": "Sólidos totales", "formula_value_gt": 45.0},
    {"parameter": "Viscosidad", "formula_value_gt": 1500},
    {"product_type": "liquid"}
  ]
}
```

## Proceso

```text
Formula items
↓
Calcular composición
↓
Evaluar reglas por materia prima
↓
Evaluar reglas por parámetro
↓
Consultar RAG si falta evidencia
↓
Consultar papers si hace falta
↓
Emitir blockers/warnings/info
```

## Revisión humana

Las reglas sugeridas por IA no deben activarse como blocker hasta validación humana.

## Output

```json
{
  "issues": [
    {
      "severity": "warning",
      "rule_id": "uuid",
      "message": "Riesgo de precipitación en formulación líquida",
      "evidence": [
        {"type": "document", "document_id": "uuid", "page": 4}
      ],
      "recommended_action": "Reducir sólidos totales o ajustar co-solvente"
    }
  ]
}
```
