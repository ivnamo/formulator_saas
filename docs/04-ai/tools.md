# Tools para agentes IA

## Reglas de diseño

- Todas las tools reciben `tenant_id`.
- Ninguna tool puede consultar datos de otro tenant.
- Las tools devuelven JSON tipado.
- Las tools críticas deben ser deterministas.
- Las tools que consultan internet/papers deben marcar fuente y fecha.

## RawMaterialDBTool

Busca materias primas del tenant.

Input:

```json
{
  "tenant_id": "uuid",
  "query": "activo tecnico",
  "filters": {
    "is_active": true,
    "parameters": ["Contenido activo", "Viscosidad"]
  }
}
```

Output:

```json
{
  "results": [
    {
      "raw_material_id": "uuid",
      "name": "ACTIVO TECNICO 40",
      "price": 2.4,
      "parameters": {"Contenido activo": 40.0},
      "confidence": 0.95
    }
  ]
}
```

## FormulaCalculatorTool

Calcula coste y riqueza.

Input:

```json
{
  "tenant_id": "uuid",
  "items": [
    {"raw_material_id": "uuid", "percentage": 10.0}
  ]
}
```

Output:

```json
{
  "total_percentage": 100,
  "price_total": 1.85,
  "parameters": {"active_content": 12.5},
  "warnings": []
}
```

## RequirementParserTool

Convierte una peticion textual en requisitos estructurados.

Input:

```json
{
  "tenant_id": "uuid",
  "text": "Minimiza coste con active content entre 20 y 40",
  "active_parameter_code": "active_content",
  "active_parameter_name": "Active content"
}
```

Output:

```json
{
  "source": "deterministic",
  "objectives": [{"type": "minimize", "target": "price"}],
  "parameter_bounds": [
    {"code": "active_content", "min_value": 20.0, "max_value": 40.0}
  ],
  "price_constraint": null,
  "alternatives": null,
  "mandatory_raw_materials": [],
  "excluded_raw_materials": [],
  "uncertainties": []
}
```

Notas:

- El corte actual usa reglas deterministas, no LLM.
- La tool no genera formula final.
- La tool no selecciona materias candidatas automaticamente.
- Una version LLM debera registrar `ai_runs` y `ai_tool_calls`.

## OptimizerTool

Ejecuta optimización matemática.

Input:

```json
{
  "tenant_id": "uuid",
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

Output:

```json
{
  "id": "uuid",
  "created_at": "2026-06-06T10:00:00Z",
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

Notas:

- La tool debe usar el contrato actual de `POST /api/v1/optimizations/run`.
- `constraints` queda reservado como lenguaje natural o estructura intermedia del agente, no como payload API.
- La ejecucion queda registrada en `optimization_runs`.
- El resultado no se persiste automaticamente como formula; si se guarda, debe conservar `objective=minimize_price` y enlazarse con `optimization_run_id`.

## RAGMaterialDocsTool

Busca evidencia interna.

Input:

```json
{
  "tenant_id": "uuid",
  "raw_material_ids": ["uuid"],
  "question": "compatibility and pH stability"
}
```

## ScientificPapersSearchTool

Busca literatura científica externa.

Debe soportar fuentes como:

- Crossref.
- Semantic Scholar.
- PubMed si aplica.
- Google Scholar no siempre tiene API oficial; evitar scraping no permitido.
- Patents/public databases si se habilitan.

Output debe contener:

- título,
- autores,
- año,
- DOI/URL,
- resumen,
- fragmentos relevantes,
- tipo de fuente,
- confianza.

## MarketSearchTool

Busca precios y disponibilidad.

Output:

- precio,
- moneda,
- unidad,
- proveedor/fuente,
- URL,
- fecha,
- confianza,
- advertencias.

## CompatibilityCheckerTool

Evalúa reglas de compatibilidad.

Input:

```json
{
  "tenant_id": "uuid",
  "formula_items": [
    {"raw_material_id": "uuid", "percentage": 10}
  ],
  "product_type": "liquid"
}
```

Output:

```json
{
  "issues": [
    {
      "severity": "warning",
      "message": "Possible precipitation risk",
      "evidence": []
    }
  ]
}
```

## ExcelFormulaImportTool

Parsea y mapea Excel.

Input:

```json
{
  "tenant_id": "uuid",
  "file_id": "uuid",
  "mapping": {
    "raw_material_column": "A",
    "percentage_column": "B"
  }
}
```

## ERPDataTool

Consulta o sincroniza ERP.

Funciones:

- listar materias primas nuevas,
- consultar precio actual,
- consultar estado obsoleto,
- sincronizar staging.

## CitationEvidenceTool

Normaliza evidencias para la respuesta final.

Debe marcar:

- fuente interna,
- paper,
- web/mercado,
- regla validada,
- inferencia IA.
