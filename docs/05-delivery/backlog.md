# Backlog FormulIA

Ultima revision: 2026-06-22

Este archivo es el backlog vivo del producto. Las tareas nuevas entran primero en
`Inbox`; despues se refinan con prioridad, area, criterios de aceptacion y estado.

## Como registrar tareas

Usar este formato para cada tarea nueva:

```md
### BL-000 - Titulo breve

- Estado: Inbox | Ready | In progress | Blocked | Done | Discarded
- Prioridad: P0 | P1 | P2 | P3
- Area: Formula Builder | Biblioteca | Import Excel | Jira | ISO | Materias primas | Backend | DevOps | UX | QA
- Origen: Usuario | Beta tester | Codex | Bug | Mejora
- Fecha alta: YYYY-MM-DD
- Descripcion:
- Criterios de aceptacion:
- Validacion beta:
- Notas:
```

## Inbox

_Tareas nuevas sin refinar. Anadir aqui lo que vaya dictando el usuario._

### BL-001 - Owner puede borrar y archivar entidades gestionables

- Estado: In progress
- Prioridad: P1
- Area: Materias primas | Biblioteca | Backend | UX
- Origen: Usuario
- Fecha alta: 2026-06-22
- Descripcion: Si el usuario es owner debe poder borrar o archivar cualquier entidad susceptible de gestion, por ejemplo materias primas y formulas guardadas en biblioteca.
- Criterios de aceptacion:
  - Un owner ve acciones de archivar y, cuando proceda, borrar.
  - Las acciones respetan permisos por tenant y no aparecen para usuarios sin permiso.
  - Las entidades archivadas dejan de aparecer en selectores operativos, pero pueden consultarse/recuperarse si se define vista de archivo.
  - El borrado evita romper historicos, formulas, revisiones Jira/ISO o auditoria.
- Validacion beta: Probar con usuario owner y no-owner en materias primas y formulas.
- Notas: Definir para cada entidad si aplica hard delete, soft delete, archive o ambos.

### BL-002 - Versionado ligado de formulas

- Estado: Done
- Prioridad: P0
- Area: Biblioteca | Formula Builder | Jira | ISO
- Origen: Usuario
- Fecha alta: 2026-06-22
- Descripcion: Poder crear versiones ligadas de una formula desde biblioteca o builder, por ejemplo abrir F2 y crear F3 cambiando nombre/datos sin pisar la version anterior.
- Criterios de aceptacion:
  - Una formula puede crear una nueva version enlazada a la familia/version anterior.
  - La biblioteca muestra version actual, historial y relacion entre versiones.
  - El usuario puede elegir actualizar version existente o crear nueva version.
  - Jira recibe/refleja la version correcta de la formula.
  - ISO puede asociar F10-02/revision a la version correcta cuando aplique.
- Validacion beta: Abrir F2 desde biblioteca, crear F3, guardar y comprobar biblioteca/Jira.
- Notas: Revisar modelo de datos antes de implementar para evitar duplicados sueltos. Rama `codex/backlog-builder-basics`: anadido modo visible nueva/editar/version y guardado como nuevo registro cuando el modo no es editar. Rama `codex/builder-working-mode-clarity`: reforzada banda superior siempre visible con modo de trabajo y feedback especifico al guardar. Pendiente versionado ligado real en backend/biblioteca/Jira.

### BL-003 - Precios de formulas no actualizados en biblioteca

- Estado: Done
- Prioridad: P0
- Area: Biblioteca | Backend | QA
- Origen: Usuario
- Fecha alta: 2026-06-22
- Descripcion: En la biblioteca no se ven todos los precios de formulas actualizados.
- Criterios de aceptacion:
  - La biblioteca muestra precio recalculado/actualizado para cada formula.
  - Se distingue precio guardado, precio recalculado y fuente/fecha del calculo si aplica.
  - Al cambiar precio de materia prima, la formula afectada se actualiza o queda marcada como pendiente de recalculo.
- Validacion beta: Cambiar precio de materia prima y verificar formula afectada en biblioteca.
- Notas: Investigar si el fallo es de cache, snapshot, query o recalculo.

### BL-004 - Crear herramienta unica de comparador

- Estado: In progress
- Prioridad: P2
- Area: UX | Biblioteca | Materias primas
- Origen: Usuario
- Fecha alta: 2026-06-22
- Descripcion: Hay varios comparadores dispersos, por ejemplo comparador de materias primas y comparador de formulas de biblioteca. Agruparlos en una herramienta propia llamada comparador.
- Criterios de aceptacion:
  - Existe una entrada unica de navegacion para Comparador.
  - Permite comparar formulas y materias primas desde un flujo coherente.
  - Las acciones de comparar desde otras pantallas envian elementos al comparador o abren esa herramienta.
  - Se reduce duplicacion visual/funcional de comparadores.
- Validacion beta: Comparar dos materias primas y dos formulas desde la nueva herramienta.
- Notas: Implementada vista `Comparador` en navegacion avanzada. Agrupa comparacion de formulas guardadas y materias primas; Biblioteca queda para listar/abrir/exportar formulas. Las acciones de comparar materias del builder comparten seleccion con el nuevo comparador. Pendiente validacion beta y posible retirada final de accesos secundarios.

### BL-005 - Revisar utilidad de filtros avanzados en Formula Library

- Estado: In progress
- Prioridad: P2
- Area: Biblioteca | UX | QA
- Origen: Usuario
- Fecha alta: 2026-06-22
- Descripcion: En Formula Library no queda claro para que sirven los campos Max price EUR/kg, Parameter code, Parameter min, Material, Material min % y Material max %. Estudiar si son utiles, eliminarlos, redisenarlos o moverlos.
- Criterios de aceptacion:
  - Se documenta el uso real esperado de esos filtros.
  - Si se mantienen, tienen labels/copy claros y producen resultados verificables.
  - Si no aportan, se ocultan o reemplazan por filtros mas utiles.
  - La biblioteca no muestra controles que no tengan efecto claro.
- Validacion beta: Usuario filtra formulas por precio, parametro y material entendiendo el resultado.
- Notas: Auditado: los campos no filtran la lista; alimentan restricciones del comparador. Implementado panel plegable `Criterios de comparacion`, sin parametro por defecto confuso, con etiquetas orientadas a evaluacion y contador de criterios activos reales. Pendiente validacion beta.

### BL-006 - Renombrar Formula actual a Formula Builder en sidebar

- Estado: Done
- Prioridad: P1
- Area: Formula Builder | UX
- Origen: Usuario
- Fecha alta: 2026-06-22
- Descripcion: En el sidebar, cambiar el nombre de Formula actual a Formula Builder.
- Criterios de aceptacion:
  - La navegacion lateral muestra Formula Builder.
  - No quedan textos antiguos confusos en cabeceras o rutas visibles.
- Validacion beta: Revisar sidebar tras iniciar sesion.
- Notas: Implementado en `codex/backlog-builder-basics`; validado con `npm run check`.

### BL-007 - Marcar campos obligatorios con asterisco rojo

- Estado: Done
- Prioridad: P1
- Area: Formula Builder | UX
- Origen: Usuario
- Fecha alta: 2026-06-22
- Descripcion: En Formula Builder no queda claro que campos son obligatorios. Mostrar el tipico asterisco rojo en campos requeridos.
- Criterios de aceptacion:
  - Todos los campos obligatorios visibles tienen asterisco rojo.
  - La validacion del formulario coincide con los campos marcados.
  - Los mensajes de bloqueo explican que falta completar.
- Validacion beta: Intentar guardar/enviar sin campos requeridos y comprobar feedback.
- Notas: Implementado asterisco y bloqueo de nombre/descripcion en Datos basicos de Formula Builder. Rama `codex/backlog-required-field-markers`: ProyectoID solo se marca obligatorio cuando aplica a formula de Calidad/Jira y muestra ayuda contextual para alinear asterisco, `aria-required` y validacion.

### BL-008 - ProyectoID debe mostrar etiqueta completa y ordenar naturalmente

- Estado: In progress
- Prioridad: P1
- Area: Formula Builder | ISO | Jira | UX
- Origen: Usuario
- Fecha alta: 2026-06-22
- Descripcion: En Formula Builder, ProyectoID parece numerico pero se selecciona un texto. Debe aparecer completo, por ejemplo `1/2026 - ARCHER ECLIPSE SP9TDK`, y ordenarse naturalmente para que no pase de 1 a 10 antes de 2.
- Criterios de aceptacion:
  - El selector muestra codigo ISO/proyecto completo y nombre de producto/proyecto.
  - La ordenacion es natural por numero y ano, no lexicografica.
  - El valor guardado sigue siendo el identificador correcto para Jira/ISO.
  - La UI evita confundir ProyectoID con un numero simple.
- Validacion beta: Crear proyectos 1/2026, 2/2026 y 10/2026 y verificar orden.
- Notas: Sustituido datalist por select que muestra etiqueta completa y orden natural con `Intl.Collator`; pendiente validacion beta con proyectos 1/2026, 2/2026 y 10/2026.

### BL-009 - Evitar nombre por defecto Atlantica Agricola Formula

- Estado: In progress
- Prioridad: P1
- Area: Formula Builder | Biblioteca | UX
- Origen: Usuario
- Fecha alta: 2026-06-22
- Descripcion: El nombre por defecto `Atlantica Agricola Formula` puede confundir. Evitar que aparezca como nombre real pre-rellenado o hacer que sea claramente placeholder.
- Criterios de aceptacion:
  - Una formula nueva no queda guardada con ese nombre por accidente.
  - El campo de nombre obliga al usuario a escribir un nombre propio si es requerido.
  - Importaciones y formulas nuevas usan nombre propuesto solo si el usuario lo confirma.
- Validacion beta: Crear formula nueva y comprobar que no se guarda con nombre generico.
- Notas: Eliminado nombre generico al crear/cargar workspace y bloqueado guardado sin nombre; pendiente revisar importaciones Excel y nombres propuestos.

### BL-010 - Mover guardar y exportar a Revision y salidas

- Estado: Done
- Prioridad: P1
- Area: Formula Builder | UX
- Origen: Usuario
- Fecha alta: 2026-06-22
- Descripcion: En Revision y salidas deberian aparecer exportar y guardar. Los avisos deben quedarse en Calculo vivo.
- Criterios de aceptacion:
  - Calculo vivo muestra resultados y avisos.
  - Revision y salidas agrupa guardar, exportar Excel y Jira.
  - El estado de bloqueo de guardado/exportacion es claro.
  - No se duplican acciones principales en varias secciones.
- Validacion beta: Formular, revisar avisos, guardar, exportar y enviar a Jira siguiendo el flujo final.
- Notas: Implementado en `codex/backlog-builder-basics`; Calculo vivo conserva parametros/avisos y Revision y salidas agrupa guardar/exportar/Jira. Validado con `npm run check`.

### BL-011 - Descripcion obligatoria de formula reutilizable en Jira e ISO

- Estado: In progress
- Prioridad: P0
- Area: Formula Builder | Jira | ISO | Biblioteca
- Origen: Usuario
- Fecha alta: 2026-06-22
- Descripcion: Las formulas deben tener obligatoriamente una descripcion en Datos basicos antes de Expediente ISO. Esa descripcion se usara para Jira, ISO y cualquier salida documental necesaria.
- Criterios de aceptacion:
  - Datos basicos incluye campo Descripcion obligatorio antes del bloque ISO.
  - Guardar/exportar/enviar a Jira queda bloqueado si falta descripcion.
  - Jira usa esa descripcion sin inventar texto.
  - ISO recibe o muestra esa descripcion cuando aplique.
  - La biblioteca conserva y muestra la descripcion.
- Validacion beta: Crear formula sin descripcion y verificar bloqueo; crear con descripcion y verificar Jira/ISO.
- Notas: Implementado usando `objective` como descripcion persistente de formula. Datos basicos la edita, guardar/exportar/Jira la exigen, Jira/ISO/Excel la reutilizan y biblioteca la muestra. Validado con `npm run check`.

### BL-012 - Limpiar Excel Import despues de guardar formula

- Estado: Done
- Prioridad: P1
- Area: Import Excel | UX
- Origen: Usuario
- Fecha alta: 2026-06-22
- Descripcion: En Excel Import, cuando se guarda una formula importada, deben limpiarse todos los campos y estado de importacion.
- Criterios de aceptacion:
  - Tras guardar, se limpia archivo seleccionado, preview, mappings, nombre, hoja, texto pegado y mensajes temporales.
  - No queda una importacion anterior lista para guardarse de nuevo por error.
  - La formula guardada permanece accesible en biblioteca.
- Validacion beta: Importar, guardar, comprobar formulario limpio y biblioteca actualizada.
- Notas: Implementado: tras guardar se resetean archivo, preview, nombre, descripcion, hojas y texto pegado. Validado con `npm run check`.

### BL-013 - Enviar importacion Excel al Formula Builder

- Estado: Done
- Prioridad: P0
- Area: Import Excel | Formula Builder | ISO | Jira
- Origen: Usuario
- Fecha alta: 2026-06-22
- Descripcion: Tras importar una formula desde Excel, debe existir opcion para mandarla al Formula Builder para modificarla, asociarla a proyecto, completar descripcion, versionarla y preparar salidas.
- Criterios de aceptacion:
  - El preview/importacion ofrece accion `Abrir en Formula Builder` o equivalente.
  - Las lineas, nombre, descripcion si existe y materias resueltas pasan al builder.
  - El usuario puede asociar ProyectoID/ISO/Jira antes de guardar definitivamente.
  - No se pierde trazabilidad de que viene de Excel import.
- Validacion beta: Importar Excel, abrir en builder, modificar porcentajes, asociar proyecto y guardar.
- Notas: Implementado como carga local en Formula Builder sin guardar; requiere filas resueltas y mantiene nombre/descripcion importados. Validado con `npm run check`.

### BL-014 - Mover Configuracion del sidebar al account menu

- Estado: Done
- Prioridad: P1
- Area: UX | Settings
- Origen: Usuario
- Fecha alta: 2026-06-22
- Descripcion: La seccion Configuracion no deberia ocupar una entrada propia en el sidebar. Debe moverse al menu de cuenta y unificarse ahi con las opciones de usuario/tenant.
- Criterios de aceptacion:
  - El sidebar deja de mostrar Configuracion como item principal.
  - El account menu incluye acceso claro a Configuracion.
  - Las opciones de cuenta, tenant, integraciones y configuracion quedan agrupadas de forma coherente.
  - Los permisos de owner/admin siguen respetandose dentro del menu/configuracion.
  - No se rompe la navegacion directa a la pantalla de configuracion si existe ruta/estado interno.
- Validacion beta: Abrir menu de cuenta, entrar a Configuracion y volver al flujo principal sin perder contexto.
- Notas: Implementado: Configuracion desaparece del sidebar y queda accesible desde el menu de cuenta. Validado con `npm run check`.

### BL-015 - Priorizar composicion quimica en Materias primas

- Estado: In progress
- Prioridad: P1
- Area: Materias primas | UX
- Origen: Usuario
- Fecha alta: 2026-06-22
- Descripcion: En la vista/formulario de materias primas, la informacion de Master data debe considerarse secundaria y aparecer despues de la composicion quimica. Incluye Code, SAP code, Name, Family, Subfamily, Physical state, Density, pH min, pH max, Solubility, Notes, metadatos SAP/source, Active y Obsolete.
- Criterios de aceptacion:
  - La composicion quimica/parametros aparece antes que master data en el flujo visual.
  - Master data queda agrupado en una seccion secundaria clara.
  - Metadatos tecnicos/SAP/source se muestran de forma legible, no como JSON crudo salvo modo diagnostico.
  - Active/Obsolete quedan en una zona administrativa, no mezclados con composicion.
  - La edicion sigue permitiendo modificar todos los campos necesarios.
- Validacion beta: Abrir una materia prima y confirmar que lo primero que se ve es composicion quimica, no datos administrativos.
- Notas: Implementado en detalle de materias primas: composicion quimica abierta y ordenada antes de master data; master data secundaria queda plegada e incluye Active/Obsolete; notas JSON de SAP/source se muestran como metadatos legibles con edicion cruda bajo desplegable. Pendiente verificacion visual beta.

### BL-016 - Observabilidad de uso para mejorar UI/UX

- Estado: Inbox
- Prioridad: P1
- Area: UX | Observabilidad | QA | Backend
- Origen: Usuario
- Fecha alta: 2026-06-22
- Descripcion: Añadir observabilidad sencilla de producto para entender donde clica mas cada usuario, que flujos usa, donde se atasca y que pantallas/acciones generan mas friccion, con el objetivo de mejorar UI y UX.
- Criterios de aceptacion:
  - Se registran eventos de uso relevantes: navegacion, clicks principales, formularios guardados, importaciones, errores de validacion, envios a Jira, exportaciones y abandonos de flujo.
  - Se puede filtrar por usuario, tenant, fecha, modulo y tipo de evento.
  - Existe una vista simple para consultar actividad agregada y actividad por usuario.
  - Se evitan datos sensibles en payloads de eventos o se anonimizan cuando proceda.
  - El tracking no degrada la experiencia ni bloquea acciones si falla.
  - Se documenta el diccionario de eventos.
- Validacion beta: Durante una sesion de beta, revisar que se ve que pantallas se usan mas y donde se producen clicks/errores frecuentes.
- Notas: Evaluar si usar PostHog/Plausible/Supabase events propio. Importante separar observabilidad de producto de logs tecnicos/auditoria.

### BL-017 - Sistema de roles y permisos por feature

- Estado: In progress
- Prioridad: P0
- Area: Backend | UX | Settings | Seguridad
- Origen: Usuario
- Fecha alta: 2026-06-22
- Descripcion: Crear un sistema de roles que permita capar features, pantallas, acciones y opciones a determinados perfiles de usuario.
- Criterios de aceptacion:
  - Existen roles/perfiles configurables por tenant o al menos un set inicial claro.
  - Cada feature/accion sensible tiene permiso asociado en backend y frontend.
  - La UI oculta o deshabilita opciones no permitidas con feedback adecuado.
  - El backend bloquea acciones aunque alguien intente llamarlas directamente por API.
  - Owner/admin puede gestionar usuarios, roles y permisos segun alcance definido.
  - Se documenta una matriz de permisos por rol.
  - Las reglas cubren como minimo: borrar/archivar, editar materias primas, editar formulas, enviar a Jira, gestionar ISO, configurar integraciones, importar/exportar y ver observabilidad.
- Validacion beta: Probar con owner, usuario tecnico y usuario limitado que cada uno solo ve/ejecuta lo permitido.
- Notas: Primer corte implementado en `codex/backlog-role-permissions-matrix`. Matriz inicial:
  - `owner` y `admin`: gestion de usuarios/settings/integraciones/ISO, materias primas, formulas, import/export, Jira, comparador, IA, compatibilidad y observabilidad.
  - `formulator`: materias primas, formulas, import/export, Jira, comparador, IA y compatibilidad.
  - `viewer`: comparador/lectura operativa, sin acciones de escritura.
  - Backend: los mutadores principales de parametros, materias primas, formulas, importaciones, IA y exports bloquean por rol; Jira/ISO mantienen helpers propios.
  - Pendiente: UI de administracion fina de roles/permisos y permisos para borrar/archivar cuando BL-001 se cierre.

### BL-018 - Foco y feedback al seleccionar/anadir materia prima en Formula Builder

- Estado: In progress
- Prioridad: P1
- Area: Formula Builder | Materias primas | UX
- Origen: Usuario
- Fecha alta: 2026-06-22
- Descripcion: En Formula Builder, al pinchar en una materia prima debe tomar foco automaticamente y mostrar sus detalles. Al pulsar Anadir, debe haber feedback claro de que se ha anadido correctamente.
- Criterios de aceptacion:
  - Clickar una materia prima en la lista la selecciona y abre/muestra el panel de detalle sin requerir otro boton.
  - El estado seleccionado es visualmente claro.
  - Al anadir una materia a la formula aparece feedback inmediato tipo `Anadido correctamente`.
  - Si la materia ya esta en la formula, el feedback explica que ya estaba anadida o mantiene el boton deshabilitado con estado claro.
  - El feedback no bloquea el flujo y desaparece solo o queda en la zona de mensajes existente.
- Validacion beta: Buscar materia, clickar fila, ver detalle, anadir y confirmar feedback visible.
- Notas: Implementado en Formula Builder: la zona principal de cada materia es clicable/focalizable y selecciona la materia; el inspector recibe foco al cambiar la seleccion; el boton de anadir indica `En formula` cuando ya existe; la accion de anadir avisa si la materia ya estaba o si esta obsoleta. Pendiente validacion beta visual.

### BL-019 - Filosofia global de feedback, foco y confirmacion de acciones

- Estado: In progress
- Prioridad: P1
- Area: UX | QA | Frontend
- Origen: Usuario
- Fecha alta: 2026-06-22
- Descripcion: Estudiar los puntos debiles de feedback en toda la aplicacion y anadir respuestas claras a las acciones del usuario mediante foco, toast, mensaje inline, estado visual, loading, confirmacion o error segun corresponda.
- Criterios de aceptacion:
  - Se auditan los flujos principales: Formula Builder, Biblioteca, Import Excel, Materias primas, Jira, ISO, Comparador y Configuracion.
  - Cada accion importante tiene feedback visible: exito, error, cargando, bloqueado, seleccionado, guardado, exportado, importado, enviado o eliminado/archivado.
  - Los cambios de foco guian al usuario al siguiente paso natural cuando sea util.
  - Los toasts/mensajes no tapan informacion importante ni sustituyen validacion inline cuando el usuario debe corregir algo.
  - Se define un patron reutilizable de feedback para toda la app.
  - Se evitan mensajes genericos tipo `Done` cuando se pueda decir exactamente que ocurrio.
- Validacion beta: Beta tester ejecuta flujos principales y puede entender siempre si la accion funciono, fallo o necesita siguiente paso.
- Notas: BL-018 es un caso concreto dentro de esta filosofia. Implementado primer patron global: la linea de estado distingue working/success/error/idle, usa iconos y aria-live, permite descartar mensajes y auto-limpia exitos. Pendiente inventario completo de acciones sin feedback.

### BL-020 - Accion Completar porcentaje en Formula editable

- Estado: Done
- Prioridad: P1
- Area: Formula Builder | UX
- Origen: Usuario
- Fecha alta: 2026-06-22
- Descripcion: En Formula editable, cada linea debe tener un boton de accion `Completar`. Si la formula suma menos de 100%, calcula la diferencia entre 100% y la suma actual y se la anade a la materia prima de esa linea.
- Criterios de aceptacion:
  - Cada linea de formula muestra accion `Completar`.
  - Al pulsar, se calcula `diferencia = 100 - total_actual`.
  - La accion solo esta disponible si `diferencia > 0`.
  - El porcentaje de la linea seleccionada pasa a `porcentaje_actual_linea + diferencia`.
  - Si la formula suma 100% o mas, la accion esta deshabilitada o no aparece.
  - Si la formula ya suma 100%, la accion esta deshabilitada o muestra feedback de que no hay diferencia que completar.
  - En el campo `%` es imposible introducir valores negativos.
  - El usuario puede borrar temporalmente el `0` por defecto para escribir un nuevo valor sin que el input lo fuerce inmediatamente.
  - Si un `%` queda en blanco, aparece advertencia en la misma zona donde se informa del estado de guardado.
  - Si el usuario guarda con algun `%` en blanco, el sistema convierte ese blanco a `0` antes de guardar.
  - La validacion normaliza o rechaza valores menores que 0 tambien si vienen por pegado, teclado o API interna.
  - Tras aplicar, se recalculan total, precio, parametros y avisos.
  - Se muestra feedback claro indicando cuanto se ha ajustado y en que materia.
- Validacion beta: Crear formula que suma 96.5%, pulsar Completar en una linea y comprobar que esa linea sube 3.5 puntos y total queda 100.0%.
- Notas: Implementado nucleo de Completar, clamp de negativos, porcentaje en blanco temporal, aviso en guardado y normalizacion a 0 en calculo/export/save. Rama `codex/backlog-complete-percentage-guards`: backend rechaza porcentajes negativos en `FormulaItemCreate`, el feedback de Completar incluye la materia prima ajustada y existe test API para `%` negativo.

### BL-021 - Modo de trabajo en Formula Builder: nueva, editar o modificacion/version

- Estado: In progress
- Prioridad: P0
- Area: Formula Builder | Biblioteca | UX
- Origen: Usuario
- Fecha alta: 2026-06-22
- Descripcion: En Formula Builder debe quedar claro si el usuario esta creando una formula nueva, editando una formula cargada existente o preparando una modificacion/nueva version de una formula cargada.
- Criterios de aceptacion:
  - El builder muestra un modo visible: `Formula nueva`, `Editando formula existente` o `Nueva version/modificacion`.
  - Si se abre una formula desde biblioteca, el sistema muestra su origen, version y estado.
  - El usuario puede elegir guardar cambios sobre la formula existente o guardar como nueva version cuando proceda.
  - El nombre/version sugerido ayuda a pasar de F2 a F3 sin pisar F2.
  - Las acciones de guardar/exportar/Jira usan el modo seleccionado para evitar sobrescrituras accidentales.
  - El modo queda reflejado en biblioteca y en historico/versionado.
- Validacion beta: Abrir una formula desde biblioteca y comprobar que el usuario entiende si esta editando, duplicando o versionando antes de guardar.
- Notas: Implementado selector de modo y semantica de guardar/exportar/Jira segun modo. Rama `codex/builder-working-mode-clarity`: el modo queda en una banda superior siempre visible, con contexto de formula cargada/sin cargar y feedback especifico al guardar (`Formula nueva guardada`, `Formula cargada actualizada`, `Nueva version guardada`). Pendiente sugerencia F2/F3 y reflejo completo en biblioteca/historico/versionado ligado.

## Ready

_Tareas preparadas para implementar._

## In Progress

_Tareas en curso._

## Blocked

_Tareas bloqueadas por decision, datos, acceso, dependencia externa o validacion._

## Done

_Tareas cerradas y verificadas._

## Discarded

_Tareas descartadas, duplicadas o reemplazadas._

## Historico heredado

Lista inicial anterior, pendiente de depurar contra el estado real del producto.

### P0 - No negociable

- Crear monorepo.
- Configurar backend FastAPI.
- Configurar frontend Next.js.
- Configurar Postgres/Supabase.
- Crear tablas tenants/users/members.
- Middleware tenant context.
- Tenant isolation tests.
- Modelo de materias primas.
- Modelo de parametros.
- Modelo de formulas.
- Endpoint de calculo.
- UI basica de materias primas.
- UI basica de formulas.

### P1 - MVP funcional

- Precios historicos.
- Editor de formula comodo.
- Calculo de riqueza/precio.
- Exportacion Excel.
- Importador Excel basico.
- Matching exacto/alias/fuzzy.
- Resolver materias primas manualmente.
- Guardar alias.

### P2 - Diferenciacion tecnica

- Optimizador lineal.
- Comparador de formulas.
- Restricciones tecnicas.
- Incompatibilidades manuales.
- RAG documental basico.

### P3 - SaaS comercial

- Stripe checkout.
- Stripe webhooks.
- Planes y entitlements.
- Usage events.
- Billing portal.

### P4 - Integraciones

- CSV import ERP-like.
- REST connector.
- SAP/OData connector skeleton.
- Staging review.
- Jira connector para revision de formulas.
- Configuracion de proyecto, issue type y campos Jira por tenant.
- Enviar snapshot de formula a Jira con Excel adjunto.
- Mostrar issue key, URL y estado Jira en la ficha de formula.
- Sincronizar estados Jira: pendiente, en revision, cambios solicitados, aprobada, rechazada, validada.

### P5 - IA avanzada

- DeepAgents/LangChain.
- Tools.
- Requirement parser.
- AI formulate endpoint.
- Scientific search.
- Market search.
- AI logs.

### P6 - Enterprise

- SSO.
- Audit advanced.
- Custom roles.
- Private deployments.
- Admin reporting.
