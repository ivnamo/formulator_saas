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

## Optimizador actual

El workspace actual incluye un panel de optimizacion dentro del editor de formula:

- seleccionar materias candidatas,
- definir bounds minimos/maximos por materia,
- definir minimo/maximo del parametro activo,
- ejecutar objetivo `minimize_price`,
- ver estado `success`, `invalid` o `infeasible`,
- cargar el resultado exitoso como borrador editable,
- guardar explicitamente el resultado optimizado.

## Parser de requisitos

El editor de formula incluye un panel compacto de requisitos antes del optimizador:

- texto libre de peticion,
- accion `Parse`,
- fuente del parseo,
- objetivo detectado,
- precio maximo si existe,
- numero de alternativas si existe,
- bounds del parametro activo,
- materias obligatorias/excluidas,
- incertidumbres,
- accion `Apply bounds` para copiar min/max del parametro activo al optimizador.

El parser actual es determinista y no debe mostrarse como IA generativa. Si el texto es ambiguo, la UI debe conservar incertidumbres visibles y no aplicar constraints automaticamente.

## Historial de optimizaciones

La biblioteca muestra el historial de `optimization_runs` del tenant activo:

- fecha de ejecucion,
- estado legible,
- precio calculado si existe,
- numero de lineas,
- formula vinculada si el resultado ya fue guardado,
- accion `Details` para inspeccionar el snapshot,
- accion `Load` solo para runs exitosos.

Los runs `invalid` e `infeasible` deben ser visibles pero no cargables como formula.

El detalle de un run muestra candidatos, bounds por materia, bounds por parametro, mensajes, issues y resultado calculado cuando exista. El detalle no recalcula ni modifica el snapshot historico.

La comparacion de runs permite elegir baseline y candidate desde el historial. Debe mostrar estado, objetivo, delta de precio cuando ambos tienen calculo, delta de lineas, candidatos anadidos/retirados/compartidos, bounds por materia, bounds por parametro y mensajes de ambos snapshots. La comparacion no recalcula ni modifica runs historicos.

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

## ERP settings

- crear conexión,
- probar conexión,
- ver último sync,
- ver staging,
- aplicar cambios.

## UX crítica

No ocultar incertidumbre. Si el sistema no sabe emparejar una materia prima, debe pedir selección humana.
