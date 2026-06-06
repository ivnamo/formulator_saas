# RAG documental

## Objetivo

Permitir que el sistema consulte documentación técnica de materias primas y use evidencia interna al formular.

## Tipos de documentos

- Ficha técnica.
- SDS/MSDS.
- COA.
- Especificación interna.
- Nota técnica.
- Ensayo.
- Paper incorporado.
- Documento proveedor.
- Documento regulatorio.

## Ingesta

Flujo:

```text
Upload documento
↓
Guardar original
↓
Extraer texto
↓
Detectar idioma
↓
Chunking
↓
Embeddings
↓
Guardar chunks con tenant_id
↓
Asociar a materia prima si aplica
```

## Chunking

Recomendado:

- chunks de 500-1200 tokens,
- overlap 10-20%,
- preservar página y sección,
- preservar tablas como markdown cuando sea posible.

## Metadatos por chunk

```json
{
  "tenant_id": "uuid",
  "document_id": "uuid",
  "raw_material_id": "uuid",
  "document_type": "TDS",
  "page": 3,
  "section": "Compatibility",
  "language": "es"
}
```

## Búsqueda

Combinar:

- vector search,
- keyword search,
- filtros por materia prima,
- filtros por tipo de documento,
- reranking.

## Respuestas

Toda respuesta RAG debe incluir:

- documento,
- página/sección,
- fragmento,
- score,
- fecha/documento si existe.

## Seguridad

- El índice debe filtrar siempre por `tenant_id`.
- No usar chunks de otros tenants.
- Los papers globales no forman parte del RAG de un tenant hasta que se incorporen.

## Extracción estructurada

Usar IA para extraer de documentos:

- pH,
- solubilidad,
- dosis recomendada,
- incompatibilidades,
- estabilidad,
- condiciones de almacenamiento,
- concentración,
- pureza,
- metales pesados.

La extracción debe marcar confianza y fuente.
