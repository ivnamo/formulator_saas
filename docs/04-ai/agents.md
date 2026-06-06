# Agents - arquitectura IA con DeepAgents/LangChain

## Principio general

La IA debe actuar como orquestador y asistente experto, no como calculadora final. Toda propuesta de fórmula debe pasar por tools deterministas.

## Agent graph propuesto

```text
FormulationSupervisorAgent
├── RequirementParserAgent
├── RawMaterialResearchAgent
├── RAGDocsAgent
├── ScientificResearchAgent
├── MarketResearchAgent
├── CompatibilityAgent
├── OptimizationAgent
├── FormulaCalculationAgent
├── ExplanationAgent
└── HumanReviewAgent
```

## 1. FormulationSupervisorAgent

Responsable de coordinar todo.

Input:

- Petición del usuario.
- Tenant context.
- Preferencias.
- Fórmulas/materias primas seleccionadas.

Output:

- Alternativas de fórmula.
- Explicación.
- Evidencias.
- Riesgos.
- Validaciones.

Debe decidir qué tools usar y en qué orden.

## 2. RequirementParserAgent

Convierte lenguaje natural en JSON estructurado.

Ejemplo:

```json
{
  "product_type": "concentrado liquido",
  "objectives": [
    {"type": "minimize", "target": "price"}
  ],
  "constraints": [
    {"type": "parameter_min", "parameter": "Contenido activo", "value": 12.0},
    {"type": "parameter_max", "parameter": "Viscosidad", "value": 1500},
    {"type": "price_max", "value": 2.0, "unit": "EUR/kg"}
  ],
  "preferences": {
    "avoid_incompatibilities": true,
    "only_active_materials": true,
    "generate_alternatives": 3
  }
}
```

## 3. RawMaterialResearchAgent

Busca candidatas en la BBDD del tenant.

Debe considerar:

- Materias activas.
- Parámetros relevantes.
- Estado físico.
- Precio.
- Disponibilidad.
- Historial de uso.
- Documentación disponible.
- Obsolescencia.

## 4. RAGDocsAgent

Consulta documentación interna del tenant:

- fichas técnicas,
- SDS,
- COA,
- documentos internos,
- notas de formulación,
- especificaciones.

Debe devolver evidencias con documento, página/sección y fragmento.

## 5. ScientificResearchAgent

Busca papers científicos, patentes o literatura externa.

Uso:

- Compatibilidad.
- Estabilidad.
- eficacia técnica/química.
- dosis orientativas.
- interacciones entre compuestos.

Debe distinguir paper revisado, patente, web, blog o fuente comercial.

## 6. MarketResearchAgent

Busca información de mercado:

- precios orientativos,
- disponibilidad,
- proveedores,
- tendencias,
- alternativas.

No debe sobrescribir el precio interno sin validación.

## 7. CompatibilityAgent

Evalúa incompatibilidades con tres niveles:

1. Reglas duras validadas.
2. Evidencia documental/RAG.
3. Inferencia IA con baja autoridad.

Debe devolver severidad:

- `blocker`: no proponer salvo override explícito.
- `warning`: proponer con advertencia.
- `info`: observación.

## 8. OptimizationAgent

Convierte requisitos en problema matemático y llama a `OptimizerTool`.

Nunca debe inventar porcentajes sin tool.

## 9. FormulaCalculationAgent

Llama a cálculo determinista para:

- coste,
- riqueza,
- suma de porcentajes,
- contribución por materia prima,
- composición final.

## 10. ExplanationAgent

Construye la respuesta final:

- fórmula propuesta,
- por qué se eligió,
- qué restricciones cumple,
- coste,
- riqueza,
- riesgos,
- fuentes,
- alternativas.

## 11. HumanReviewAgent

Detecta si hace falta revisión humana:

- evidencia insuficiente,
- incompatibilidad blocker,
- match dudoso de materia prima,
- precio no disponible,
- paper contradictorio,
- fórmula fuera de límites.

## Logging obligatorio

Cada agent run debe registrar:

- input,
- output,
- tools llamadas,
- evidencias usadas,
- modelo,
- tenant_id,
- usuario,
- coste aproximado si aplica.
