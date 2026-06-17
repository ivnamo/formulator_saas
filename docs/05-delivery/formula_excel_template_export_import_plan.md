# Plan - Exportacion e importacion con plantilla Excel I+D

## Objetivo

Implementar en FormulIA SaaS una exportacion e importacion especifica para el formato real de I+D usado en `ID.280 MICROCAT BON + AA F1 - rev.xlsx`.

El mismo formato debe estar disponible desde:

- Formula Builder, para exportar la formula/draft que se esta editando.
- Biblioteca de formulas, para exportar formulas guardadas.
- Importador Excel, para leer un documento de este tipo y cargarlo en el Builder.
- Flujo Jira/laboratorio, reutilizando la misma plantilla cuando se necesite un adjunto tecnico.

La fuente de verdad debe seguir siendo FormulIA: formulas, materias primas, precios vigentes, parametros activos y valores de riqueza. El Excel se genera desde esos datos y conserva formulas de Excel donde el formato original las usa.

## Factibilidad

Es factible.

El libro analizado no contiene macros, tablas estructuradas, nombres definidos ni referencias externas. Es un `.xlsx` simple con 3 hojas, formulas normales/compartidas, una imagen de logo, estilos de celda y rangos combinados. Esto permite implementarlo con el stack actual del backend, que ya usa `openpyxl` para importacion y generacion de Excel.

La parte delicada no es leer/escribir el archivo, sino preservar el significado funcional:

- Parametros dinamicos por tenant, sin congelar columnas fijas.
- Precios y riquezas recalculados desde catalogo, no desde valores viejos del Excel.
- Versiones/snapshots inmutables cuando el archivo se usa como evidencia de laboratorio o Jira.
- Importacion con resolucion humana cuando un nombre del Excel no coincide con la base de datos.

## Plantilla analizada

Archivo fuente:

`C:/Users/IVANNAVARRO/ATLANTICA AGRICOLA/I+D+i - Documentos/0. Investigación y Desarrollo/Fórmulas/1. LIBERADOS/ID.280 MICROCAT BON + AA F1 - rev.xlsx`

### Hojas

1. `Calculadora`
2. `Hoja Lab`
3. `Composición`

### Hoja `Calculadora`

Rango usado: `A1:BC10`.

Estructura:

- Fila 1: cabeceras.
- Columna A: `Materia Prima`.
- Columna B: `%`.
- Columna C: `Precio`.
- Columnas D:BC: parametros/riquezas.
- Filas 2:8: materias primas.
- Fila 9: separador en blanco.
- Fila 10: `TOTAL`.

Cabeceras de parametros detectadas:

`Ntotal`, `Norg`, `Nnitr`, `Nure`, `Namo`, `K2O`, `P2O5`, `CaO`, `MgO`, `SO3`, `Zn`, `Mn`, `Fe`, `Cu`, `B`, `Mo`, `Co`, `SiO2`, `Mseca`, `Morg`, `Corg`, `Extracto Húmico total`, `Acidos fulvicos`, `Acidos húmicos`, `Extracto de Algas`, `Polisacaridos`, `Sum AA totales`, `Sum AA libres`, `Ac aspartico`, `Ac glutamico`, `Alanina`, `Glicina`, `Histidina`, `Isoleucina`, `Leucina`, `Lisina`, `Serina`, `Tirosina`, `Treonina`, `Valina`, `Arginina`, `Fenilalanina`, `Metionina`, `Prolina`, `Hidroxiprolina`, `Triptofano`, `As`, `Hg`, `Pb`, `Cd`, `Cr`, `Ni`.

Formulas:

```excel
B10 = SUM(B2:B9)
C10 = SUMPRODUCT($B$2:$B$8,C2:C8)/100
D10 = SUMPRODUCT($B$2:$B$8,D2:D8)/100
E10:BC10 = SUMPRODUCT($B$2:$B$8,<col>2:<col>8)/100
```

Nota tecnica: en el `.xlsx`, `E10:BC10` esta guardado como formula compartida de Excel. El generador debe escribir la formula equivalente por columna o usar relleno horizontal.

Formato:

- Sin merges.
- Estilo mayoritariamente por defecto.
- Anchos de columna personalizados para que quepan nombres y parametros.

### Hoja `Hoja Lab`

Rango usado real: `A1:G19`; zona visible principal: `A1:G17`.

Estructura:

- Logo Atlántica en `A1:C2`.
- `F2:G2`: texto de fecha, por ejemplo `FECHA: 02-10-2025`.
- `C3:F3`: titulo de formula/muestra, por ejemplo `MICROCAT BON + AA - MUESTRA: F1`.
- `F4`: fecha Excel con formato fecha.
- Fila 5: cabeceras de orden, cantidad y ensayos.
- Filas 6:12: orden de adicion.
- Fila 14: totales de porcentaje y escalados.
- `E15`: fecha Excel con formato fecha.
- `C16:C17`: bloque `EXPERIMENTAL 02/10/2025`.
- `D16:E17`: densidad y pH.
- `G11:G12`: observaciones libres.

Merges:

```text
A1:XFD1
F2:G2
C3:F3
C16:C17
```

Formulas:

```excel
E6 = D6*10/2
F6 = D6*10*2
E7:E12 = D<row>*10/2
F7:F12 = D<row>*10*2
D14 = SUM(D6:D12)
E14 = SUM(E6:E12)
F14 = SUM(F6:F12)
```

Formato relevante:

- Bordes medios en tabla de fabricacion.
- Cabeceras y nombres de materia en negrita.
- Numeros de ensayo con formato `0.0`.
- Bloque experimental con relleno verde claro y borde medio.
- Densidad/pH en negrita, tamano 14, centrado.
- Filas con alturas personalizadas.

Dato a corregir en implementacion: el archivo contiene textos de fecha `02-10-2025`, pero las celdas fecha `F4` y `E15` tienen serial Excel `45947`, que renderiza como `10/17/25`. El parser debe tratarlo como inconsistencia y preferir una fuente de fecha configurable/explicita.

### Hoja `Composición`

Rango usado: `A2:B55`.

Estructura:

- Fila 2: `Parametro` y `% p/p`.
- Fila 3: `Precio`.
- Filas 4:55: parametros en el mismo orden conceptual que `Calculadora`.
- Columna B con formato `0.000`.

El archivo original no tiene formulas en esta hoja: guarda valores calculados. Para cumplir el requisito de autoactualizacion dentro del Excel generado, la version SaaS debe rellenar `B3:B...` con formulas que referencien la fila `TOTAL` de `Calculadora`, manteniendo el aspecto original.

## Criterio de diseno

### "Literal de plantilla"

La plantilla debe conservar:

- Nombres y orden de hojas.
- Logo.
- Posiciones de celdas relevantes.
- Merges.
- Bordes, fuentes, formatos numericos, anchos y alturas.
- Formulas de `Calculadora` y `Hoja Lab`.
- Layout de `Composición`.

La plantilla no debe congelar:

- Numero de materias primas.
- Numero de parametros.
- Fecha, muestra, densidad, pH u observaciones.
- Precios y valores de riqueza.

### Fuente de verdad

El Excel exportado se debe construir desde:

- `Formula` y `FormulaItem`.
- `RawMaterial`.
- `RawMaterialPrice` vigente.
- `RawMaterialParameterValue`.
- `Parameter` activo del tenant.
- Ultimo calculo backend, cuando exista.
- Metadata opcional de laboratorio.

No se debe actualizar un Excel historico para cambiar su significado. Para biblioteca y Builder puede generarse "actual" bajo demanda; para Jira/laboratorio se debe guardar un snapshot inmutable.

## Modelo de datos propuesto

### Parametros exportables

Agregar configuracion de exportacion por parametro. Opciones:

1. Campos nuevos en `Parameter`:
   - `excel_label`
   - `excel_order`
   - `is_exportable`
2. Tabla nueva `parameter_export_settings` por tenant.

Recomendacion: tabla/configuracion separada para no mezclar el concepto tecnico del parametro con una plantilla concreta.

Datos minimos:

```text
tenant_id
parameter_id
template_key = "atlantica_id_lab"
label
order_index
is_visible
```

### Metadata de formula/laboratorio

Agregar almacenamiento flexible para datos que hoy no existen en `Formula`:

```text
formula_id
template_key
sample_code
lab_date
experiment_date
density
ph
notes
line_display_overrides
line_observations
```

Para MVP puede ser una columna JSON en una entidad nueva `formula_template_metadata`. A futuro puede normalizarse si laboratorio lo usa intensivamente.

### Overrides de linea

La plantilla distingue algunos nombres de materia entre hojas, por ejemplo `AGUA` en `Calculadora` y `AGUA INICIAL` en `Hoja Lab`. Se necesita admitir:

```text
formula_item_id
display_name_calculator
display_name_lab
lab_observation
```

Para MVP puede vivir dentro de `formula_template_metadata.line_overrides`.

## Servicio de exportacion

Crear un modulo backend:

```text
apps/api/src/formulia_api/formula_excel_template.py
```

Responsabilidades:

1. Construir un `FormulaExportContext` desde DB o desde payload ad hoc.
2. Resolver parametros exportables en orden.
3. Resolver materiales, precios y riquezas actuales.
4. Cargar una plantilla base limpia o construirla por codigo.
5. Escribir hojas `Calculadora`, `Hoja Lab`, `Composición`.
6. Insertar formulas con rangos dinamicos.
7. Marcar recalculo al abrir el archivo.
8. Devolver bytes, nombre de archivo, checksum y metadata.

### Plantilla base

Crear una plantilla base redacted, sin datos de formula real, por ejemplo:

```text
apps/api/src/formulia_api/assets/templates/atlantica_id_lab_template.xlsx
```

La plantilla debe conservar logo, estilos, merges, anchos y alturas. No conviene commitear el libro real con datos de I+D. Si el logo no se puede incluir por licencia interna, usar un asset aprobado.

Alternativa: construir todo por codigo con `openpyxl`. Es mas auditable, pero menos "literal". Recomendacion: empezar desde plantilla limpia y tener tests que verifiquen estilos/rangos criticos.

### Layout dinamico

Variables principales:

```text
material_start_row_calculadora = 2
material_start_row_lab = 6
material_count = len(formula_items)
blank_separator_rows = 1
total_row_calculadora = material_start_row_calculadora + material_count + blank_separator_rows
total_row_lab = material_start_row_lab + material_count + blank_separator_rows
parameter_start_col = D
parameter_count = len(exportable_parameters)
```

Las formulas deben generarse con los rangos reales:

```excel
B{total} = SUM(B2:B{total-1})
<param_total> = SUMPRODUCT($B$2:$B${last_material_row},<col>2:<col>${last_material_row})/100
```

En `Hoja Lab`:

```excel
E{row} = D{row}*10/2
F{row} = D{row}*10*2
D{total} = SUM(D{first}:D{last})
E{total} = SUM(E{first}:E{last})
F{total} = SUM(F{first}:F{last})
```

En `Composición`, para que el Excel tambien se actualice si se edita manualmente:

```excel
B3 = 'Calculadora'!C{total_row}
B4 = 'Calculadora'!D{total_row}
B5 = 'Calculadora'!E{total_row}
...
```

## Endpoints propuestos

### Exportar formula guardada

```http
GET /api/v1/formulas/{formula_id}/exports/atlantica-id-lab.xlsx?mode=current
```

`mode=current` recalcula con precios/riquezas vigentes.

```http
GET /api/v1/formulas/{formula_id}/exports/atlantica-id-lab.xlsx?mode=last_calculation
```

Usa el ultimo resultado guardado si se quiere reproducir el estado calculado.

### Exportar draft del Builder

```http
POST /api/v1/formulas/exports/atlantica-id-lab.xlsx
```

Payload:

```json
{
  "name": "MICROCAT BON + AA - MUESTRA: F1",
  "items": [
    { "raw_material_id": "...", "percentage": 21.1, "order_index": 0 }
  ],
  "metadata": {
    "sample_code": "F1",
    "lab_date": "2025-10-02",
    "density": 1.01592,
    "ph": 10.48
  }
}
```

### Generar artefacto de review/Jira

Reutilizar el generador en:

```http
POST /api/v1/formula-reviews/{review_id}/artifacts/excel
```

Mantener compatibilidad con el artefacto actual, pero cambiar el contenido a la plantilla I+D o permitir `template_key`.

### Importar plantilla

Extender los endpoints actuales:

```http
POST /api/v1/imports/formulas/excel/sheets
POST /api/v1/imports/formulas/excel/preview
POST /api/v1/imports/formulas/excel/save
```

El `preview` debe detectar automaticamente:

```json
{
  "parser": "atlantica_id_lab",
  "confidence": 0.98,
  "recognized_sheets": ["Calculadora", "Hoja Lab", "Composición"]
}
```

## Parser especifico

Crear un parser junto al generico actual:

```text
apps/api/src/formulia_api/excel_import.py
```

Refactor sugerido:

```text
excel_import/
  __init__.py
  generic_table.py
  atlantica_id_lab.py
```

### Deteccion

Un archivo se reconoce como plantilla I+D si:

- Existe hoja `Calculadora`.
- `A1` normalizado es `materia prima`.
- `B1` es `%`.
- `C1` es `precio`.
- Hay al menos una cabecera de parametro en `D1:...`.
- Existe una fila `TOTAL`.

`Hoja Lab` y `Composición` son opcionales para importacion, pero si existen se parsean.

### Extraccion desde `Calculadora`

Extraer:

- Materia prima original.
- Porcentaje.
- Precio importado.
- Parametros por columna.
- Orden de linea.
- Totales de la fila `TOTAL`.
- Formulas encontradas, para diagnostico.

No guardar automaticamente precio/riqueza importada en catalogo. Mostrar diferencias contra la base de datos y pedir confirmacion.

### Extraccion desde `Hoja Lab`

Extraer:

- Nombre/titulo de formula.
- Muestra.
- Fecha textual.
- Fecha serial, si existe.
- Orden de adicion.
- Nombres para laboratorio.
- Porcentajes.
- Escalados de ensayo.
- Observaciones por linea.
- Densidad y pH.

Validar contra `Calculadora`:

- Mismo numero de lineas o diferencias explicadas.
- Porcentajes iguales.
- Orden consistente.
- Advertir si nombres difieren.

### Extraccion desde `Composición`

Extraer resumen y compararlo contra totales de `Calculadora`.

Si no coincide:

- Marcar warning `composition_mismatch`.
- Permitir importar la formula igualmente usando `Calculadora` como fuente principal.

### Matching

Reutilizar el matching actual:

1. Codigo exacto.
2. Alias exacto.
3. Nombre normalizado exacto.
4. Fuzzy matching.
5. Seleccion humana.
6. Crear materia prima.
7. Crear alias.

Ampliar preview con:

```text
imported_price
catalog_price
price_delta
imported_parameters
catalog_parameters
parameter_deltas
lab_display_name
lab_observation
```

## UX propuesta

### Formula Builder

Agregar accion `Exportar Excel I+D`.

Comportamiento:

- Si la formula esta guardada, descargar desde endpoint de formula.
- Si es draft no guardado, enviar payload ad hoc.
- Si hay cambios sin calcular, recalcular transitoriamente antes de exportar.
- Mostrar modal opcional de datos de laboratorio: muestra, fecha, densidad, pH, observaciones.

### Biblioteca

Agregar por formula:

- `Descargar Excel I+D actual`.
- `Descargar Excel de ultimo calculo`, si hay historial.
- `Abrir en Builder`, ya existente o reforzado.

Para reviews/Jira:

- Mostrar artefactos generados con fecha/checksum.
- No sobrescribir snapshots ya enviados.

### Importador Excel

Si detecta la plantilla I+D:

- Mostrar badge `Plantilla I+D reconocida`.
- Mostrar resumen de `Calculadora`, `Hoja Lab` y `Composición`.
- Permitir resolver materias primas.
- Mostrar diferencias de precio/riqueza.
- Guardar como formula y abrir automaticamente en Builder.

## Autoactualizacion

### Dentro de FormulIA

La autoactualizacion se consigue generando el archivo desde datos vigentes cada vez que el usuario descarga:

- Nuevo parametro activo: aparece como nueva columna en `Calculadora` y nueva fila en `Composición`.
- Cambio de precio: `Precio` y total se recalculan.
- Cambio de riqueza: cambia la matriz de parametros y los totales.
- Cambio de formula: cambia lineas, orden, porcentajes y formulas.

### Dentro del Excel

El archivo generado conserva formulas para recalcular si alguien edita el Excel manualmente:

- Fila `TOTAL` en `Calculadora`.
- Escalados y totales en `Hoja Lab`.
- Referencias desde `Composición` a `Calculadora`.

Marcar el workbook para recalculo al abrir, porque `openpyxl` escribe formulas pero no evalua valores cacheados.

### Snapshots

Para biblioteca y Builder, el usuario puede pedir siempre el estado actual.

Para Jira/laboratorio, el archivo debe quedar inmutable. Si cambia un precio, parametro o formula, se crea una nueva version/artefacto en vez de mutar el anterior.

## Testing

### Backend unitario

- Parser detecta la plantilla por hoja/cabeceras.
- Parser extrae las 7 lineas del archivo analizado.
- Parser extrae precios y parametros.
- Parser extrae formulas compartidas o sus equivalentes.
- Parser detecta fecha inconsistente entre texto y serial.
- Generator crea las 3 hojas con nombres exactos.
- Generator conserva merges de `Hoja Lab`.
- Generator conserva formulas principales.
- Generator genera columnas dinamicas cuando se anade un parametro.
- Generator genera filas dinamicas cuando cambia el numero de materias.
- Generator marca recalculo al abrir.

### Backend API

- Export de formula guardada respeta tenant.
- Export ad hoc de Builder no persiste formula si no se pide.
- Import preview reconoce plantilla I+D.
- Import save crea formula y lineas ordenadas.
- Import no actualiza precios/parametros sin confirmacion.
- Artefacto Jira usa snapshot inmutable.

### Frontend

- Builder muestra accion de export.
- Builder exporta draft y formula guardada.
- Biblioteca descarga export actual.
- Import wizard muestra parser reconocido y diferencias.
- Save import abre Builder con la formula.

### Round-trip

Escenario clave:

1. Crear formula en Builder.
2. Exportar Excel I+D.
3. Importar ese Excel.
4. Resolver materias.
5. Abrir en Builder.
6. Comparar lineas, porcentajes, parametros y coste.

## Riesgos y decisiones

- `Composición` original no tiene formulas. Para autoactualizacion conviene anadir referencias a `Calculadora`, manteniendo el aspecto.
- El archivo real contiene datos de I+D. Se debe crear una plantilla limpia/redacted antes de commitearla.
- La fecha del ejemplo esta inconsistente. La UI debe pedir fecha unica y el parser debe advertir discrepancias.
- `openpyxl` no recalcula formulas. El Excel debe abrirse con recalculo forzado; los valores oficiales siguen viniendo del core backend.
- Si se permite importar precios/riquezas desde Excel, debe ser flujo explicito de actualizacion de catalogo, no efecto colateral del guardado de formula.
- La lista de parametros del tenant puede no coincidir con las cabeceras legacy. Hace falta mapping configurable.

## Fases de implementacion

### Fase 1 - Contrato de plantilla

- Crear plantilla limpia `atlantica_id_lab_template.xlsx`.
- Definir `template_key = atlantica_id_lab`.
- Documentar mapping inicial de cabeceras a parametros.
- Crear fixtures de test basados en el archivo analizado sin datos sensibles.

### Fase 2 - Generador backend

- Implementar `FormulaExportContext`.
- Implementar generador de `Calculadora`.
- Implementar generador de `Hoja Lab`.
- Implementar generador de `Composición`.
- Anadir endpoints de export guardado y ad hoc.
- Anadir tests de formulas/layout.

### Fase 3 - UI de exportacion

- Agregar accion en Formula Builder.
- Agregar accion en Biblioteca.
- Agregar modal de metadata laboratorio.
- Manejar descarga y errores.

### Fase 4 - Parser especifico

- Separar parser generico y parser I+D.
- Implementar deteccion.
- Extraer datos de las 3 hojas.
- Ampliar preview con precios/parametros/metadata.
- Reutilizar matching existente.

### Fase 5 - Importacion a Builder

- Guardar formula importada con orden y porcentajes.
- Guardar metadata de plantilla.
- Abrir la formula en Builder al completar.
- Permitir crear alias desde diferencias de nombre.

### Fase 6 - Snapshots y Jira

- Reutilizar el generador en artefactos de review.
- Mantener artefactos inmutables por version/snapshot.
- Permitir regeneracion solo creando nueva version o nuevo artefacto.

### Fase 7 - Autoactualizacion y cache

- Export actual siempre recalcula desde DB.
- Invalidar cache por hash de formula + precios + parametros.
- Mostrar fecha de datos usados en el export.
- Diferenciar claramente `actual` vs `snapshot`.

## Criterios de aceptacion

- Desde Builder se descarga un `.xlsx` con hojas `Calculadora`, `Hoja Lab`, `Composición`.
- Desde Biblioteca se descarga el mismo formato para cualquier formula guardada.
- Las formulas de Excel aparecen en las celdas equivalentes al formato original.
- Al anadir un parametro activo, el siguiente export lo incluye en `Calculadora` y `Composición`.
- Al cambiar precio o riqueza de una materia prima, el siguiente export actual refleja el cambio.
- Al actualizar una formula, el siguiente export refleja lineas, orden y porcentajes.
- El importador reconoce un documento como este y genera una preview enriquecida.
- Una importacion resuelta puede abrir la formula en Builder.
- Los artefactos de revision/Jira no cambian silenciosamente despues de generados.
