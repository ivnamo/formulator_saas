# Importación inteligente de fórmulas Excel

## Objetivo

Permitir que el usuario suba una fórmula Excel, aunque los nombres no coincidan exactamente con la base de datos, y que el sistema la traduzca, calcule y guarde.

## Casos de uso

- Fórmula histórica en Excel.
- Fórmula de proveedor.
- Fórmula en formato distinto.
- Fórmula sin códigos exactos.
- Recalcular coste actual con precios ERP.
- Ver riqueza técnica de una fórmula externa.

## Flujo UX

```text
1. Subir archivo Excel
2. Seleccionar hoja si hay varias
3. Detectar columnas automáticamente
4. Confirmar mapping
5. Resolver materias primas no exactas
6. Calcular coste/riqueza
7. Guardar fórmula
8. Crear alias si el usuario lo aprueba
```

## Detección de columnas

Buscar nombres como:

- Materia Prima
- Ingrediente
- Raw Material
- MP
- Componente
- %
- Porcentaje
- Cantidad %
- Dosificación
- Precio

## Matching de materias primas

Orden de matching:

1. Código ERP exacto.
2. Código interno exacto.
3. Alias exacto.
4. Nombre normalizado exacto.
5. Fuzzy matching.
6. Embeddings semánticos.
7. Selección humana.

## Estados por fila

- `matched_exact`
- `matched_alias`
- `matched_fuzzy_high`
- `matched_fuzzy_low`
- `needs_review`
- `not_found`
- `obsolete`
- `invalid_percentage`

## Pantalla de resolución

Columnas:

- fila,
- nombre original,
- porcentaje,
- candidato sugerido,
- score,
- estado,
- acción.

Acciones:

- confirmar,
- elegir otro,
- crear materia prima,
- ignorar fila,
- crear alias,
- marcar como comentario/no ingrediente.

## Validaciones

- Suma de porcentajes.
- Porcentajes negativos.
- Duplicados.
- Materias obsoletas.
- Materias sin precio.
- Materias sin parámetros.

## Cálculo

Una vez resueltas las filas, usar el mismo core que las fórmulas manuales:

- precio total,
- riqueza,
- warnings,
- compatibilidad.

## Guardado

Guardar:

- archivo original,
- mapping,
- filas importadas,
- alias creados,
- fórmula resultante,
- resultados calculados.
