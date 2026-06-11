# Formula Builder migration plan

## Contexto

La fuente legacy correcta para el flujo de formulacion es [`ivnamo/formulator`](https://github.com/ivnamo/formulator), rama `main`.

La conclusion de producto es que FormulIA SaaS no debe separar la tarea diaria de formular en pantallas independientes por entidad. Debe ofrecer una mesa de trabajo unica donde el formulador pueda buscar materias primas, anadirlas, editar porcentajes, cambiar orden, elegir familias/parametros, ver calculo, guardar, exportar y enviar a revision.

La separacion correcta es por intencion de usuario:

- Formular: pantalla principal unificada.
- Gestionar catalogo: CRUD de materias primas separado.
- Importar Excel: herramienta avanzada que termina abriendo el Formula Builder.
- Configurar tenant, parametros, Jira, SAP/ERP, usuarios y billing: area admin.
- Optimizar o usar IA: herramienta avanzada que genera borradores para revisar en Formula Builder.

## Fuentes a revisar

Legacy `ivnamo/formulator`:

- `app.py`
- `crud_formulas/crear_formula.py`
- `crud_formulas/update_formula.py`
- `crud_formulas/list_formulas.py`
- `crud_formulas/optimizar_formula.py`
- `utils/editor.py`
- `utils/resultados.py`
- `utils/formula_resultados.py`
- `utils/families.py`
- `utils/cargar_formula.py`
- `utils/exportar_formula.py`
- `crud_mp/ver_materia_prima.py`
- `crud_mp/update_materia_prima.py`
- `utils/filtros_materias_primas.py`

SaaS `formulator_saas`:

- `apps/web/app/page.tsx`
- `apps/web/app/globals.css`
- `apps/web/app/workspace-model.ts`
- `apps/web/app/workspace-api.ts`
- `apps/web/package.json`
- `apps/api/src/formulia_api/main.py`
- `apps/api/src/formulia_api/schemas.py`
- `packages/core/src/formulia_core/calculator.py`
- `docs/01-product/frontend_ux.md`
- `docs/01-product/specs.md`
- `docs/01-product/rules.md`

## Meta 1 - Alinear producto y documentacion

Objetivo: dejar claro que el flujo legacy de referencia es el editor de formulas de `ivnamo/formulator`.

Entregables:

- Documentacion actualizada con `ivnamo/formulator` como repositorio fuente.
- `frontend_ux.md` ajustado para priorizar Formula Builder sobre navegacion por entidades.
- `repo_migration.md` ampliado con el flujo real que se conserva.
- Criterios de aceptacion del Formula Builder documentados.

Revision:

- Confirmar que no queda ninguna referencia a fuentes legacy incorrectas para el flujo de formulacion.
- Confirmar que el documento no invita a copiar UI Streamlit ni `session_state`.

## Meta 2 - Preparar arquitectura frontend

Objetivo: reducir el riesgo antes de redisenar UI separando estado, tipos y componentes desde `page.tsx`.

Entregables:

- Tipos de materia prima enriquecidos con precios, aliases, estado activo/obsoleto, familia, funcion y parametros tecnicos multiples.
- Tipos de formula con orden, porcentaje, coste parcial, warnings y notas de linea.
- Helpers de preview local determinista para total %, coste estimado y parametros visibles.
- Componentes base extraidos sin cambiar todavia la experiencia completa.

Revision:

- El backend sigue siendo fuente oficial de calculo.
- El preview local queda marcado como estimacion, no como resultado oficial.
- No se introduce logica de tenant ni calculo critico duplicada de forma opaca.

## Meta 3 - Construir Formula Builder como pantalla principal

Objetivo: permitir crear una formula completa sin salir de una sola pantalla.

Entregables:

- `FormulaBuilderPage`
- `FormulaHeader`
- `FormulaMaterialSearch`
- `RawMaterialQuickPicker`
- `FormulaLineTable`
- `FormulaCalculationPanel`
- `FormulaActionsBar`

La pantalla debe incluir:

- Nombre editable de formula.
- Estado: borrador, calculada, lista para revision o final.
- Buscador de materias primas por nombre, codigo interno, codigo SAP/ERP y alias.
- Tabla editable de lineas con orden, materia prima, porcentaje, precio, coste parcial, parametros visibles, warnings y acciones.
- Panel fijo de calculo con total %, balance, precio, parametros, warnings y ultimo calculo backend.
- Acciones de guardar, guardar y calcular, exportar Excel y enviar a Jira.

Revision:

- El usuario puede formular sin abrir la pantalla CRUD de materias primas.
- No aparece la URL de API ni informacion tecnica irrelevante para usuario final.
- Jira queda como accion final discreta, no como bloque central de trabajo.

## Meta 4 - Reproducir familias y parametros del legacy

Objetivo: recuperar la utilidad real de `utils/families.py` sin congelar el SaaS a columnas fijas.

Entregables:

- Selector de familias de parametros.
- Selector de parametros visibles.
- Opcion de mostrar solo parametros con contribucion mayor que 0.
- Favoritos de parametros si el modelo de datos lo permite.
- Mapeo inicial de familias legacy a parametros configurables por tenant.

Familias legacy iniciales:

- Macronutriente
- Secundario
- Micronutriente
- Fraccion Organica
- Aminoacidos
- Aminograma
- Metales pesados

Revision:

- No reintroducir columnas tecnicas fijas como modelo principal.
- La UI debe soportar tenants con parametros distintos.
- Los parametros sin dato deben generar incertidumbre o warning cuando sean relevantes.

## Meta 5 - Separar CRUD de catalogo y seleccion rapida

Objetivo: limpiar la pantalla de materias primas para que sea gestion de catalogo, no el paso obligatorio para formular.

Entregables:

- `RawMaterialsCrudPage`
- `RawMaterialTable`
- `RawMaterialDetailDrawer`
- `RawMaterialParameterEditor`
- `RawMaterialAliasEditor`
- `RawMaterialPriceEditor`

La pantalla CRUD debe gestionar:

- Alta y edicion de materia prima.
- Parametros tecnicos.
- Precios historicos.
- Aliases.
- Codigos SAP/ERP.
- Estado activo/obsoleto.
- Documentos.
- Auditoria.

Revision:

- No mostrar editor de aliases en cada fila principal.
- Click en fila abre detalle o drawer.
- La tabla principal debe ser escaneable y densa.

## Meta 6 - Reordenar herramientas avanzadas

Objetivo: que importacion, IA, optimizacion, compatibilidad y Jira no compitan con el flujo diario.

Entregables:

- Importador Excel como wizard: subir, hoja, mapping, resolucion, revisar, guardar como borrador, abrir en Formula Builder.
- Optimizacion e IA como generadores de propuestas.
- Accion `Apply draft` que abre el borrador en Formula Builder para revision humana.
- Configuracion Jira en admin/settings.
- Envio a Jira desde Formula Builder solo cuando la formula ya esta guardada y calculada.

Revision:

- Ninguna herramienta avanzada reemplaza el Formula Builder.
- El importador Excel termina en Formula Builder.
- Las propuestas IA u optimizadas no se convierten en formula final sin calculo backend y revision humana.

## Meta 7 - Verificacion funcional y visual

Objetivo: cerrar el redisenio con pruebas proporcionales y revision de flujo real.

Checks minimos:

- `npm run check`
- Tests backend afectados con `pytest`
- Smoke test manual o browser test del flujo Formula Builder.
- Revision responsive en desktop y movil.
- Revision de accesibilidad basica: labels, botones icono con `aria-label`, foco de teclado.

Escenarios de aceptacion:

- Crear formula desde cero sin cambiar de pantalla.
- Buscar y anadir materias primas desde la formula.
- Editar porcentajes rapido.
- Cambiar orden de adicion.
- Ver total % siempre visible.
- Ver precio y parametros calculados en vivo.
- Filtrar parametros por familia.
- Guardar borrador incompleto.
- Guardar y calcular con backend.
- Ver warnings tecnicos.
- Exportar Excel.
- Enviar a Jira solo si esta configurado y la formula cumple prerequisitos.
- Importar Excel y abrir resultado como borrador en Formula Builder.

## Plan de commits pequenos

1. Documentar fuente legacy y plan Formula Builder.
2. Actualizar documentacion de UX y migracion.
3. Extraer tipos/helpers frontend para Formula Builder.
4. Crear estructura de componentes sin cambiar comportamiento.
5. Implementar buscador rapido de materias en Formula Builder.
6. Implementar tabla editable con reordenacion.
7. Implementar panel de calculo vivo y filtros de parametros.
8. Mover resultados dentro del Formula Builder.
9. Reubicar Jira como accion final y configuracion admin.
10. Limpiar CRUD de materias primas.
11. Ajustar importador Excel para abrir borrador en Formula Builder.
12. Pulido visual, responsive y accesibilidad.
13. Ejecutar checks y documentar riesgos restantes.

## Gates de revision

### Revision de producto

Pregunta clave: un formulador puede hacer su trabajo principal sin navegar entre pantallas?

Debe validar:

- Rapidez del flujo.
- Bajo ruido visual.
- Acciones frecuentes visibles.
- Acciones avanzadas accesibles pero secundarias.

### Revision tecnica

Debe validar:

- Backend como fuente oficial de calculo.
- Tenant isolation en cada request.
- Componentes React con responsabilidades claras.
- Sin mezclar CRUD completo dentro del builder.
- Sin duplicar reglas criticas de negocio solo en frontend.

### Revision de datos

Debe validar:

- Parametros configurables por tenant.
- Familias legacy mapeadas sin bloquear extensibilidad.
- Precios historicos y aliases disponibles para el builder.
- Materias obsoletas o sin precio visibles como warnings.

### Revision UX/UI

Debe validar:

- Interfaz B2B tecnica, densa y escaneable.
- Tabla central como pieza principal.
- Panel de calculo persistente.
- Texto sin solapamientos.
- Controles familiares: iconos para acciones, menus para opciones, toggles para filtros, inputs para porcentajes.

### Revision QA

Debe validar:

- Checks verdes.
- Flujo manual completo probado.
- No regresion en importador Excel, comparador, IA y Jira.
- Estados vacios, loading, error y permisos.

## Riesgos principales

- Intentar resolver el redisenio desde un unico `page.tsx` demasiado grande.
- Reintroducir columnas legacy fijas en vez de mapearlas a parametros configurables.
- Convertir Jira o IA en flujo central antes de estabilizar la mesa de formulacion.
- Confundir preview local con calculo oficial.
- Hacer un CRUD de materias primas demasiado ruidoso y poco usable.

## Decision de prioridad

Primero Formula Builder. Despues CRUD de materias primas. Despues importacion Excel. Despues admin/configuracion. Despues IA, optimizacion y Jira avanzado.
