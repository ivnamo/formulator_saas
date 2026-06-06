# Skills/módulos reutilizables a implementar

Este documento define capacidades internas del sistema, no necesariamente Skills de ChatGPT.

## 1. FormulaCalculationSkill

Entrada:

- lista de materias primas,
- porcentajes,
- modo de precio.

Salida:

- precio total,
- composición,
- warnings,
- contribución por materia prima.

## 2. ExcelFormulaImportSkill

Entrada:

- archivo Excel,
- mapping opcional.

Salida:

- filas detectadas,
- materias primas candidatas,
- estado de matching,
- fórmula calculable.

## 3. RawMaterialMatchingSkill

Entrada:

- nombre libre,
- tenant_id.

Métodos:

- normalización,
- alias exactos,
- fuzzy matching,
- embeddings opcional,
- scoring combinado.

## 4. OptimizationSkill

Entrada:

- candidatas,
- restricciones,
- objetivo.

Salida:

- alternativas,
- estado,
- razón de inviabilidad si falla.

## 5. RAGIngestionSkill

Entrada:

- documento,
- tipo,
- materia prima opcional.

Salida:

- chunks,
- embeddings,
- metadatos.

## 6. RAGQuerySkill

Entrada:

- pregunta,
- filtros.

Salida:

- evidencias,
- documentos,
- fragmentos,
- score.

## 7. CompatibilitySkill

Entrada:

- fórmula,
- tipo de producto.

Salida:

- blockers,
- warnings,
- info,
- fuentes.

## 8. MarketSearchSkill

Entrada:

- materia prima o familia.

Salida:

- señales de precio,
- disponibilidad,
- fuentes,
- confianza.

## 9. ScientificSearchSkill

Entrada:

- consulta técnica.

Salida:

- papers,
- DOI,
- resumen,
- relevancia.

## 10. ERPSyncSkill

Entrada:

- conexión ERP,
- entidad.

Salida:

- staging rows,
- diffs,
- errores.

## 11. TenantEntitlementSkill

Entrada:

- tenant_id,
- feature_key.

Salida:

- permitido,
- límites,
- uso actual.
