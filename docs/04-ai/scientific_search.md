# Búsqueda científica

## Objetivo

Permitir que el agente busque papers científicos y evidencia externa para complementar el RAG interno.

## Casos de uso

- Determinar incompatibilidades.
- Buscar estabilidad de mezclas.
- Evaluar interacciones químicas.
- Encontrar evidencia sobre eficacia.
- Buscar dosis o rangos técnicos.
- Localizar alternativas de materias primas.

## Fuentes candidatas

Validar APIs disponibles antes de implementar:

- Crossref.
- Semantic Scholar.
- PubMed si aplica al dominio.
- Europe PMC si aplica.
- OpenAlex.
- Lens/Patents si se decide incluir patentes.

Evitar scraping no permitido de fuentes sin API.

## Flujo

```text
Pregunta técnica
↓
Construir query científica
↓
Buscar metadatos
↓
Filtrar por relevancia y fecha
↓
Resumir evidencia
↓
Devolver fuentes
↓
Opcional: incorporar paper al RAG del tenant
```

## Output

```json
{
  "papers": [
    {
      "title": "...",
      "authors": ["..."],
      "year": 2023,
      "doi": "...",
      "url": "...",
      "abstract": "...",
      "relevance": 0.82,
      "claim": "...",
      "limitations": "..."
    }
  ]
}
```

## Guardrails

- Diferenciar paper revisado por pares, preprint, patente y fuente comercial.
- No convertir un paper en regla blocker sin validación humana.
- Citar DOI/URL.
- Guardar consulta y resultados para trazabilidad.
