# Plan accionable - refactor UX frontend

## Estado

Documento de planificacion. No implementa cambios de producto.

Este plan convierte la revision actualizada del frontend en una hoja de ruta accionable para transformar la app Next actual desde una consola tecnica monolitica hacia una experiencia SaaS usable, empezando por el caso de uso real del primer usuario.

## Fuentes revisadas

- Adjunto de revision UX recibido en Codex.
- [`../../apps/web/app/page.tsx`](../../apps/web/app/page.tsx): componente principal de 3553 lineas.
- [`../../apps/web/app/globals.css`](../../apps/web/app/globals.css): CSS global de 1923 lineas.
- [`../../apps/web/app/workspace-api.ts`](../../apps/web/app/workspace-api.ts): `userId` fijo de demo.
- [`../../apps/web/package.json`](../../apps/web/package.json): Next, React, TypeScript y `lucide-react`; aun no incluye Tailwind, shadcn/ui, TanStack Query/Table, React Hook Form ni Zod.
- [`../01-product/frontend_ux.md`](../01-product/frontend_ux.md): vision UX objetivo.
- [`../01-product/product_brief.md`](../01-product/product_brief.md): posicionamiento y usuario objetivo.
- [`../01-product/rules.md`](../01-product/rules.md): reglas de negocio y guardrails.
- [`../03-domain/excel_import.md`](../03-domain/excel_import.md): flujo ideal de importacion Excel.
- [`../03-domain/jira_formula_review.md`](../03-domain/jira_formula_review.md): rol de Jira como revision de laboratorio.

## Diagnostico

La app ya tiene producto real: workspace, materias primas, parametros, formulas, calculo, importacion Excel, alias, IA, compatibilidad, comparador, historial y Jira. El problema no es que falten piezas, sino que casi todas compiten en una unica experiencia.

El archivo `apps/web/app/page.tsx` concentra:

- 20+ estados React para dominios distintos.
- 50+ funciones entre operaciones de workspace, materiales, importacion, IA, formula, comparacion y Jira.
- 9 secciones visibles al mismo nivel: `Workspace`, `Materials`, `Compatibility`, `Library`, `Parameters`, `Integrations`, `Import`, `AI parser`, `Results`.
- Configuracion avanzada de Jira dentro del flujo principal.
- Edicion de aliases dentro de cada fila de materia prima.
- Comparador mezclado con biblioteca de formulas.
- Importacion Excel como pantalla densa, no como wizard.

El efecto para un formulador es que la pantalla muestra "todo lo que el sistema puede hacer" en lugar de "la siguiente decision que toca tomar".

## Principio de producto para este repo

Primero debe funcionar muy bien para el uso real del tenant piloto: crear o importar formulas, resolver materias primas, calcular coste y riqueza, revisar warnings, guardar versiones y preparar revision tecnica cuando haga falta.

Despues debe generalizarse como SaaS configurable. Por eso el rediseño no debe borrar el modelo multi-tenant ni las integraciones; debe sacarlas del camino principal hasta que sean necesarias.

## Objetivo operativo

Convertir el frontend en una experiencia progresiva donde:

1. `Formula actual` sea el centro del producto.
2. `Materias primas` sea una tabla de consulta y accion rapida, con detalle lateral.
3. `Importar Excel` sea un wizard guiado.
4. `Resultados` sea una pantalla de validacion y lectura tecnica.
5. Jira, parametros, workspace e integraciones vivan en `Configuracion`.
6. IA y comparador sean modos especificos, no ruido permanente.
7. El backend siga siendo la fuente de verdad para calculos, validaciones y persistencia.

## Navegacion objetivo

### MVP visible

```text
Formula actual
Materias primas
Importar Excel
Resultados
Configuracion
```

### Navegacion completa posterior

```text
Inicio
  - Resumen

Formulacion
  - Formula actual
  - Materias primas
  - Biblioteca
  - Comparador

Importacion
  - Importar Excel
  - Resolver coincidencias

Validacion
  - Resultados
  - Compatibilidad
  - Historial

Automatizacion
  - Asistente IA

Configuracion
  - Workspace
  - Parametros
  - Jira / Integraciones
```

## Arquitectura objetivo

La propuesta evita una migracion "big bang". Primero se separan rutas, features y componentes sin cambiar reglas de negocio ni endpoints.

```text
apps/web/app
  layout.tsx
  page.tsx
  formulas/current/page.tsx
  formulas/library/page.tsx
  formulas/compare/page.tsx
  materials/page.tsx
  imports/excel/page.tsx
  validation/results/page.tsx
  validation/compatibility/page.tsx
  ai/page.tsx
  settings/workspace/page.tsx
  settings/parameters/page.tsx
  settings/integrations/page.tsx

apps/web/features
  workspace
  materials
  formulas
  imports
  results
  compatibility
  ai
  integrations
  shared

apps/web/features/shared/ui
  Button.tsx
  Badge.tsx
  Alert.tsx
  Field.tsx
  Table.tsx
  Tabs.tsx
  Sidebar.tsx
  PageHeader.tsx
  SummaryPanel.tsx
  EmptyState.tsx
```

## Plan por cortes

### Corte 0 - Baseline y contrato de comportamiento

Objetivo: congelar que se esta refactorizando UI, no cambiando dominio.

Entregables:

- Captura del estado actual de rutas, secciones y flujos.
- Lista de endpoints usados desde `page.tsx`.
- Checklist manual de flujos existentes:
  - crear workspace,
  - crear parametro,
  - crear materia prima,
  - añadir materia a formula,
  - calcular formula,
  - guardar formula,
  - importar Excel,
  - resolver fila,
  - crear alias,
  - comparar formulas,
  - configurar Jira,
  - enviar revision Jira.

Criterios de aceptacion:

- El equipo sabe que comportamientos no deben romperse.
- El plan de pruebas manual queda escrito antes de mover codigo.
- No se instalan dependencias ni se modifica backend.

### Corte 1 - App shell y rutas sin rediseño profundo

Objetivo: reducir la navegacion plana sin reimplementar cada feature.

Entregables:

- Crear un `AppShell` con sidebar agrupado y header.
- Convertir `app/page.tsx` en entrada hacia `Formula actual`.
- Crear rutas de alto nivel con placeholders funcionales o componentes movidos:
  - `/formulas/current`,
  - `/materials`,
  - `/imports/excel`,
  - `/validation/results`,
  - `/settings/workspace`,
  - `/settings/parameters`,
  - `/settings/integrations`.
- Mantener los textos y acciones criticas existentes durante el movimiento.

Criterios de aceptacion:

- La primera pantalla abre el editor de formula, no el dashboard total.
- Jira desaparece de la navegacion principal y vive en Settings.
- No se pierden acciones existentes.
- `npm run check` pasa.

### Corte 2 - Formula actual como flujo principal

Objetivo: construir la experiencia central del producto.

Entregables:

- `CurrentFormulaPage`.
- Tabla de lineas de formula con materia, porcentaje y acciones.
- Busqueda o selector para añadir materia prima.
- Total de porcentaje visible y estable.
- Panel lateral de resumen:
  - coste,
  - parametros calculados,
  - warnings,
  - bloqueadores,
  - estado de guardado/calculo.
- Accion principal unica: `Validar y calcular`.
- Acciones secundarias: guardar borrador, abrir biblioteca, enviar a revision si aplica.

Criterios de aceptacion:

- Un formulador puede crear una formula manual sin pasar por Jira, IA o importacion.
- El backend sigue calculando oficialmente.
- La UI separa claramente borrador, calculo y revision.
- El usuario entiende si falta porcentaje, precio, parametro o materia.

### Corte 3 - Materias primas con tabla limpia y panel lateral

Objetivo: bajar el ruido de la lista de materias.

Entregables:

- `MaterialsPage`.
- Tabla con:
  - codigo,
  - nombre,
  - precio,
  - parametro principal,
  - estado,
  - accion de añadir a formula.
- Panel lateral al seleccionar fila:
  - resumen,
  - aliases,
  - precios,
  - parametros,
  - notas/documentos futuros.
- Formulario de alta separado de la tabla, preferiblemente en modal o panel.
- Aliases fuera de cada fila.

Criterios de aceptacion:

- La tabla se puede escanear rapidamente.
- Añadir materia a formula sigue siendo una accion rapida.
- Crear alias no ensucia todas las filas.
- La estructura queda preparada para TanStack Table, aunque no sea obligatorio introducirlo en este corte.

### Corte 4 - Importacion Excel como wizard

Objetivo: convertir la importacion en una secuencia de decisiones humanas claras.

Entregables:

- `ExcelImportWizard`.
- Pasos:
  - subir archivo,
  - elegir hoja,
  - revisar columnas detectadas,
  - resolver materias primas,
  - revisar calculo,
  - guardar formula.
- Estado visual por fila:
  - exacto,
  - alias,
  - sugerido,
  - necesita revision,
  - no encontrada,
  - obsoleta,
  - porcentaje invalido.
- Acciones por fila:
  - aceptar sugerencia,
  - elegir materia,
  - crear materia,
  - crear alias,
  - ignorar si procede.

Criterios de aceptacion:

- No se puede guardar como formula final con materias sin resolver.
- El usuario ve claramente que decision falta.
- El flujo conserva el archivo, mapping y resoluciones segun lo definido en docs.

### Corte 5 - Resultados y validacion

Objetivo: separar lectura tecnica de edicion.

Entregables:

- `ResultsPage`.
- Resumen de formula calculada:
  - total %,
  - coste,
  - parametros,
  - warnings,
  - bloqueadores,
  - historial.
- `CompatibilityPage` como validacion especifica, no como panel siempre visible.
- Severidades `blocker`, `warning`, `info` consistentes con META-027.

Criterios de aceptacion:

- Los resultados se leen sin editar la formula.
- Los warnings no quedan ocultos entre formularios.
- `blocker` no implica bloqueo funcional si el backend todavia no lo aplica.

### Corte 6 - Biblioteca y comparador separados

Objetivo: que la biblioteca sirva para encontrar y abrir; el comparador para comparar.

Entregables:

- `FormulaLibraryPage`:
  - buscar,
  - filtrar,
  - abrir,
  - duplicar futuro,
  - ver coste/resumen.
- `FormulaComparePage`:
  - seleccionar base,
  - seleccionar candidata,
  - definir restricciones,
  - comparar,
  - ver deltas y cumplimiento.

Criterios de aceptacion:

- La biblioteca deja de mezclar listado, comparacion, restricciones e historial en un unico bloque.
- El comparador conserva la logica determinista existente.
- No se persisten comparaciones salvo que una meta futura lo pida.

### Corte 7 - Configuracion y Jira fuera del flujo principal

Objetivo: tratar Jira como configuracion avanzada y revision de laboratorio, no como parte diaria de crear una formula.

Entregables:

- `SettingsWorkspacePage`.
- `SettingsParametersPage`.
- `SettingsIntegrationsPage`.
- Jira dentro de integraciones:
  - conexion,
  - auth,
  - test,
  - metadata,
  - field mapping,
  - status mapping futuro.
- En la formula solo queda:
  - estado de revision,
  - enviar a Jira,
  - sincronizar,
  - abrir issue,
  - descargar Excel.

Criterios de aceptacion:

- Un formulador puede trabajar sin ver campos de configuracion Jira.
- Un admin puede configurar Jira desde Settings.
- La ficha de formula muestra solo lo necesario para revision.

### Corte 8 - IA como flujo guiado

Objetivo: que la IA ayude a formular sin parecer un chatbot generico ni tapar el calculo determinista.

Entregables:

- `AiAssistantPage`.
- Flujo:
  - prompt/requisito,
  - requisitos detectados,
  - restricciones editables,
  - materias candidatas,
  - alternativas,
  - aplicar como borrador,
  - calcular con backend.
- Historial de runs accesible, no dominante.

Criterios de aceptacion:

- La IA no genera formula final sin calculo determinista.
- El usuario puede editar requisitos antes de optimizar.
- Las incertidumbres quedan visibles.

### Corte 9 - Librerias y deuda tecnica UI

Objetivo: introducir dependencias cuando ya haya boundaries claros.

Entregables recomendados:

- React Hook Form + Zod para formularios complejos.
- TanStack Table para tablas de materias, formulas e importaciones.
- TanStack Query para carga/cache/mutaciones cuando las rutas esten separadas.
- Tailwind/shadcn solo si se decide migrar el sistema visual completo; si no, mantener componentes propios ligeros con tokens.
- Reducir `globals.css` a tokens, layout base y estilos compartidos.

Criterios de aceptacion:

- Las dependencias reducen complejidad real, no se instalan por estetica.
- Los formularios tienen validacion consistente.
- Las tablas complejas dejan de ser HTML ad hoc.

### Corte 10 - Usuario, tenant y sesion

Objetivo: preparar el paso de demo local a SaaS real.

Entregables:

- Sustituir `userId` hardcodeado por una capa de sesion.
- Definir como se obtiene `X-User-Id` y tenant activo.
- Mantener modo demo local si sigue siendo necesario para desarrollo.

Criterios de aceptacion:

- No hay identidad productiva fija en frontend.
- Las llamadas siguen enviando tenant activo validado por backend.
- No se mezcla con una implementacion completa de billing o SSO si no toca.

## Priorizacion recomendada

1. Corte 0.
2. Corte 1.
3. Corte 2.
4. Corte 3.
5. Corte 4.
6. Corte 7.
7. Corte 5.
8. Corte 6.
9. Corte 8.
10. Corte 9.
11. Corte 10.

La razon de adelantar `Configuracion/Jira` antes de resultados/biblioteca es practica: ahora Jira ocupa demasiado espacio en el flujo principal. Sacarlo pronto reduce ruido sin cambiar la logica de negocio.

## Metas candidatas

### META-036 - Frontend UX foundation

Meta formalizada en [`../00-meta/meta_036_frontend_ux_foundation.md`](../00-meta/meta_036_frontend_ux_foundation.md).

Objetivo: separar el shell, la navegacion y las rutas principales para que `Formula actual` sea la entrada del producto.

Alcance incluido:

- Crear `AppShell`.
- Crear navegacion MVP: Formula actual, Materias primas, Importar Excel, Resultados, Configuracion.
- Mover Jira a Settings/Integrations.
- Convertir `page.tsx` en contenedor o redirect hacia el flujo principal.
- Extraer componentes compartidos minimos: `Button`, `Badge`, `Alert`, `PageHeader`, `SummaryPanel`, `EmptyState`.
- No cambiar endpoints ni reglas de negocio.

Fuera de alcance:

- Rediseño visual completo.
- Tailwind/shadcn obligatorio.
- Auth real.
- Reescritura completa de importador, IA o comparador.
- Cambios backend.

Criterios de done:

1. La primera pantalla del usuario es `Formula actual`.
2. La navegacion visible baja de 9 entradas planas a 5 entradas principales.
3. Jira queda bajo Configuracion.
4. El calculo de una formula existente sigue funcionando.
5. Crear workspace, parametro, materia y formula sigue funcionando.
6. `npm run check` pasa.
7. Smoke browser desktop y mobile confirma que no hay pantalla en blanco ni solapamientos graves.

### META-037 - Materials table and side panel

Objetivo: convertir materias primas en tabla limpia con detalle lateral y alias fuera de la fila.

### META-038 - Excel import wizard

Objetivo: convertir la importacion Excel en flujo guiado de subida, hoja, mapping, resolucion, revision y guardado.

### META-039 - Current formula refinement

Objetivo: completar la experiencia central de formula con panel lateral de coste, riqueza, warnings y estado.

### META-040 - Validation, library and compare split

Objetivo: separar resultados, compatibilidad, biblioteca y comparador en pantallas con intenciones claras.

## Lista de commits sugeridos para META-036

1. `docs: add frontend ux refactor plan`
2. `web: add app shell and grouped navigation`
3. `web: add route structure for core product areas`
4. `web: move jira integration UI into settings`
5. `web: extract shared ui primitives`
6. `web: make current formula the default workspace view`
7. `web: add smoke coverage for primary frontend flows`

## Riesgos y mitigaciones

- Riesgo: intentar rediseñar todo a la vez.
  Mitigacion: empezar por shell/rutas y mantener comportamiento.

- Riesgo: romper calculo o endpoints por mover UI.
  Mitigacion: no cambiar contratos API en las primeras metas.

- Riesgo: introducir muchas dependencias antes de tener boundaries.
  Mitigacion: instalar React Hook Form, Zod, TanStack Query/Table solo cuando el corte lo necesite.

- Riesgo: ocultar demasiado para el caso real.
  Mitigacion: mantener visibles las acciones diarias del formulador: editar formula, añadir materia, importar Excel, calcular, revisar warnings.

- Riesgo: dejar Jira demasiado escondido para revision real.
  Mitigacion: la configuracion va a Settings, pero el estado y envio de revision siguen en la ficha de formula.

## No hacer de momento

- No crear landing page comercial.
- No convertir la app en chatbot.
- No empezar por IA si la formula manual e importacion Excel no estan comodas.
- No hacer un cambio visual superficial sin separar flujos.
- No cambiar el backend como parte del primer refactor UX.
- No eliminar funciones existentes por simplificar la navegacion.

## Definicion de exito

El primer usuario debe poder abrir la app y entender rapidamente:

1. Que formula esta preparando.
2. Que materias primas puede usar.
3. Como importar una formula historica desde Excel.
4. Que datos faltan para calcular.
5. Que warnings o bloqueos tecnicos existen.
6. Como guardar o enviar la formula a revision cuando este lista.

Si la interfaz cumple eso, despues se puede empaquetar como SaaS vendible sin arrastrar una consola interna como producto final.
