# Frontend UX

## Objetivo

Crear una experiencia mucho más cómoda y funcional que Streamlit.

## Stack

- Next.js.
- TypeScript.
- Tailwind.
- shadcn/ui.
- TanStack Query.
- TanStack Table.
- React Hook Form.
- Zod.
- Plotly/Recharts.

## Navegación principal

```text
Dashboard
Materias primas
Fórmulas
Importar Excel
Optimizador
Asistente IA
Documentos/RAG
Incompatibilidades
Integraciones ERP
Settings/Billing
```

## Dashboard

Mostrar:

- fórmulas recientes,
- materias primas activas/obsoletas,
- precios actualizados,
- imports pendientes,
- alertas de incompatibilidad,
- uso IA del mes,
- estado ERP sync.

## Materias primas

- Tabla potente.
- Filtros.
- Edición inline controlada.
- Panel lateral de detalle.
- Precios históricos.
- Documentos asociados.
- Alias.
- Parámetros técnicos.

## Editor de fórmula

Debe permitir:

- búsqueda rápida de materias primas,
- añadir por teclado,
- reordenar,
- editar porcentaje,
- ver suma total en tiempo real,
- ver coste y riqueza,
- warnings,
- comparación con versión anterior,
- guardado como draft/final.

## Importador Excel

Pantalla tipo wizard:

1. Upload.
2. Selección de hoja.
3. Mapeo columnas.
4. Resolución de materias.
5. Resultado/cálculo.
6. Guardar.

## Asistente IA

Interfaz mixta:

- chat,
- panel de requisitos estructurados,
- panel de materias candidatas,
- panel de alternativas,
- evidencias,
- warnings.

El usuario debe poder editar los requisitos antes de lanzar optimización.

## Comparador de fórmulas

Comparar:

- coste,
- riqueza,
- materias primas,
- riesgos,
- cumplimiento de restricciones,
- disponibilidad.

### META-018

El primer comparador MVP vive en la biblioteca de formulas:

- selecciona una formula base y una candidata,
- recalcula ambas con el backend determinista,
- muestra deltas de precio, porcentaje total, parametros y materias primas,
- no usa IA,
- no persiste comparaciones.

## ERP settings

- crear conexión,
- probar conexión,
- ver último sync,
- ver staging,
- aplicar cambios.

## UX crítica

No ocultar incertidumbre. Si el sistema no sabe emparejar una materia prima, debe pedir selección humana.
