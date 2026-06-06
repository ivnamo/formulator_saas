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

### META-019

El comparador MVP permite evaluar restricciones editables:

- precio maximo,
- codigo de parametro tecnico,
- minimo de parametro,
- estado `passed`, `failed` o `missing` para formula base y candidata.

La evaluacion usa los calculos backend de la comparacion y no persiste reglas.

### META-020

El comparador MVP permite evaluar limites de uso por materia prima:

- selector de materia prima,
- porcentaje minimo,
- porcentaje maximo,
- la ausencia de la materia en una formula cuenta como 0%,
- los resultados se muestran como `passed`, `failed` o `missing` junto al resto de restricciones.

Solo se evalua una materia a la vez y no se persisten reglas.

### META-021

El comparador MVP muestra un resumen de cumplimiento cuando hay restricciones evaluadas:

- conteo `passed`, `failed` y `missing` para formula base,
- conteo `passed`, `failed` y `missing` para formula candidata,
- indicacion de si lidera base, candidata o si hay empate,
- el detalle de cada restriccion sigue visible debajo del resumen.

El resumen no es una aprobacion tecnica final ni persiste scoring.

## ERP settings

- crear conexión,
- probar conexión,
- ver último sync,
- ver staging,
- aplicar cambios.

## UX crítica

No ocultar incertidumbre. Si el sistema no sabe emparejar una materia prima, debe pedir selección humana.
