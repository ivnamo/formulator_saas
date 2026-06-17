# Evidencia smoke Codex - Excel I+D

Fecha: 2026-06-14

Rama: `codex/formula-excel-id-template-e2e`

Objetivo: hacer una pasada como usuario tecnico antes de la beta humana para validar que la plantilla Excel I+D se puede generar, recalcular con datos vivos y parsear de vuelta al sistema.

## Alcance probado

| Area | Resultado | Evidencia |
| --- | --- | --- |
| Backend completo | PASS | `.\.venv\Scripts\python -m pytest apps/api/tests -q` -> `103 passed, 1 warning` |
| Frontend build/typecheck | PASS | `npm run check` -> checks API boundary, typecheck y build Next OK |
| Parseo del Excel real de referencia | PASS | Parser `atlantica_id_lab`, hoja `Calculadora`, formula `MICROCAT BON + AA - MUESTRA: F1`, 7 lineas, total 100.0, 52 parametros, 0 warnings |
| Exportacion Excel I+D desde formula guardada | PASS | Workbook con hojas `Calculadora`, `Hoja Lab`, `Composición`; formulas y referencias internas presentes |
| Autoactualizacion por precio/riqueza | PASS | Al cambiar precio y riqueza de una materia prima y reexportar, el Excel nuevo refleja los valores actualizados |
| Importacion Excel I+D -> formula | PASS | El Excel real se previsualiza, resuelve 7 lineas y se guarda con el nombre detectado |
| Navegacion E2E publica de materias primas | PASS | `/e2e/raw-materials` carga, filtra, edita material, edita composicion, anade precio y aplica import SAP fixture |
| Screenshot desktop/mobile | PASS | Capturas generadas en el directorio temporal indicado abajo |

## Flujo API simulado

La prueba API simulo este recorrido:

1. Crear tenant de beta `beta-qa`.
2. Crear parametros `Ntotal` y `K2O`.
3. Crear materias primas `AGUA` y `GLICINA`.
4. Anadir precios y riquezas activas.
5. Crear formula `Beta Excel Formula`.
6. Exportar Excel I+D desde formula guardada.
7. Verificar hojas esperadas y formulas internas.
8. Cambiar precio de `GLICINA` a `2.5` y `Ntotal` a `20`.
9. Reexportar y verificar que el workbook refleja el nuevo precio y riqueza.
10. Parsear el Excel real `ID.280 MICROCAT BON + AA F1 - rev.xlsx`.
11. Crear las materias primas pendientes del Excel real.
12. Previsualizar de nuevo y confirmar 7 lineas resueltas.
13. Guardar formula importada con el nombre detectado.

Resultado observado:

```text
tenant: beta-qa
saved_export_sheets: Calculadora, Hoja Lab, Composición
initial_glycine_price: 1
updated_glycine_price: 2.5
updated_glycine_ntotal: 20
source_parser: atlantica_id_lab
source_rows: 7
source_total: 100.0
source_parameters: 52
imported_formula: MICROCAT BON + AA - MUESTRA: F1
```

## Flujo navegador simulado

Servidor local usado:

```powershell
$env:FORMULIA_E2E_AUTH_BYPASS = "1"
npm --workspace apps/web run dev -- -H 127.0.0.1 -p 3102
```

Ruta probada:

```text
http://127.0.0.1:3102/e2e/raw-materials
```

Comprobaciones realizadas:

| Check | Resultado |
| --- | --- |
| Titulo de pagina `FormulIA Cloud` | PASS |
| Ruta correcta `/e2e/raw-materials` | PASS |
| Contenido principal no vacio | PASS |
| Sin overlay de Next/Vite/Webpack | PASS |
| Sin errores/warnings relevantes en consola | PASS |
| Filtro de busqueda responde | PASS |
| Resultado `Extracto vegetal experimental` visible tras filtrar | PASS |

Script E2E ejecutado:

```powershell
$env:RAW_MATERIALS_E2E_URL = "http://127.0.0.1:3102"
$env:RAW_MATERIALS_E2E_ARTIFACT_DIR = Join-Path $env:TEMP "formulia-beta-raw-materials-e2e"
npm run e2e:raw-materials
```

Resultado:

```text
Raw material master e2e smoke passed
```

Capturas generadas fuera del repositorio:

```text
C:\Users\IVANNAVARRO\AppData\Local\Temp\formulia-beta-raw-materials-browser.png
C:\Users\IVANNAVARRO\AppData\Local\Temp\formulia-beta-raw-materials-e2e\raw-materials-e2e-desktop.png
C:\Users\IVANNAVARRO\AppData\Local\Temp\formulia-beta-raw-materials-e2e\raw-materials-e2e-mobile.png
```

## Flujo autenticado con usuario demo

Despues de la primera evidencia tecnica se ejecuto una pasada de navegador autenticada usando un usuario demo real de Supabase:

```text
usuario demo: codex.excel.qa.20260614163621@example.com
tenant: atlantica-agricola
rol observado: FORMULATOR
web local: http://127.0.0.1:3000
api local: http://127.0.0.1:8010
```

Nota operativa: la API se lanzo contra el pooler transaccional de Supabase (`:6543`) con pool local reducido porque el pooler de sesion (`:5432`) devolvio `EMAXCONNSESSION max clients reached` durante la carga concurrente del workspace. No se cambio el `.env.local` del repositorio.

La prueba uso Playwright normal para poder validar descargas reales. El Browser integrado se uso para inspeccion inicial, pero no soporta eventos de descarga en esta sesion. Para evitar problemas de encoding con rutas largas y acentos en el upload desde Node/PowerShell, el Excel real se copio temporalmente a:

```text
C:\Users\IVANNAVARRO\AppData\Local\Temp\formulia-authenticated-excel-e2e\source-id280.xlsx
```

Comprobaciones autenticadas:

| Check | Resultado | Evidencia |
| --- | --- | --- |
| Login con usuario demo Supabase | PASS | Workspace cargado en `atlantica-agricola` como `FORMULATOR` |
| Formula Builder con datos reales | PASS | Materias primas cargadas y formula de prueba balanceada al 100% |
| Exportacion draft desde Builder | PASS | Descarga real `builder-draft-export.xlsx` con hojas `Calculadora`, `Hoja Lab`, `Composicion` |
| Guardado de formula | PASS | UI muestra estado `Formula saved` |
| Exportacion desde biblioteca | PASS | Descarga real `library-saved-export.xlsx` desde una formula guardada |
| Importacion del Excel I+D real | PASS | Upload del archivo `ID.280 MICROCAT BON + AA F1 - rev.xlsx` copiado a fixture temporal |
| Seleccion de hoja | PASS | UI pide elegir hoja porque el workbook tiene varias; se selecciona `Calculadora` |
| Preview de importacion | PASS | Parser `Plantilla I+D`, formula `MICROCAT BON + AA - MUESTRA: F1`, total `100.0%`, 7 lineas resueltas, 0 pendientes, 52 parametros |
| Guardado de formula importada | PASS | UI muestra `Imported formula saved` y vuelve al Formula Builder con la formula cargada |
| Consola navegador | PASS | Sin errores de pagina en el flujo final exitoso |

Artefactos generados fuera del repositorio:

```text
C:\Users\IVANNAVARRO\AppData\Local\Temp\formulia-authenticated-excel-e2e\authenticated-excel-e2e-result.json
C:\Users\IVANNAVARRO\AppData\Local\Temp\formulia-authenticated-excel-e2e\builder-ready.png
C:\Users\IVANNAVARRO\AppData\Local\Temp\formulia-authenticated-excel-e2e\builder-draft-export.xlsx
C:\Users\IVANNAVARRO\AppData\Local\Temp\formulia-authenticated-excel-e2e\library-saved-formula.png
C:\Users\IVANNAVARRO\AppData\Local\Temp\formulia-authenticated-excel-e2e\library-saved-export.xlsx
C:\Users\IVANNAVARRO\AppData\Local\Temp\formulia-authenticated-excel-e2e\import-preview-atlantica.png
C:\Users\IVANNAVARRO\AppData\Local\Temp\formulia-authenticated-excel-e2e\imported-formula-builder.png
```

## Incidencias vistas

| Severidad | Incidencia | Estado |
| --- | --- | --- |
| Baja | Turbopack emitio `Persisting failed: Unable to commit operations` con `Acceso denegado (os error 5)` durante el dev server local | No bloquea la app ni los tests; revisar permisos/cache si se repite |
| Media | No hay harness E2E UI formal para Formula Builder + biblioteca + export/import Excel con usuario autenticado | Cubierto con script ad hoc en esta pasada; conviene convertirlo en comando repetible |
| Baja | El workbook real tiene varias hojas y el importador exige seleccionar `Calculadora` antes de previsualizar | Correcto funcionalmente; documentar para beta o preseleccionar la hoja cuando se detecte plantilla I+D |
| Baja | Rutas Windows con acentos pueden complicar el upload automatizado desde scripts Node/PowerShell | No afecta a la UI humana; el test copio el fixture a un path ASCII temporal |

## Riesgo residual

- No se valido Excel abierto en Microsoft Excel de escritorio; se validaron estructura, formulas y valores con `openpyxl`.
- La pasada autenticada uso un usuario demo local contra el entorno configurado en `.env.local`, no un usuario beta humano de staging.
- El Browser integrado no pudo validar descargas; las descargas se validaron con Playwright Chromium normal.
- Quedan datos de QA asociados al usuario demo creado durante la prueba; pueden limpiarse cuando se cierre la revision.

## Propuestas de mejora

- Anadir un harness E2E especifico `npm run e2e:formula-excel` que haga login demo, cree una formula, descargue Builder/biblioteca, importe el Excel I+D real y guarde la formula resultante.
- Anadir una prueba Playwright autenticada de staging cuando exista un usuario beta estable.
- Guardar un workbook golden generado por el sistema para comparacion de regresion visual/estructural.
- Anadir en UI un panel/modal para metadatos de laboratorio del Excel: muestra, fecha, densidad, pH, observaciones y responsable.
- Anadir `data-testid` estables en buscador, filas de biblioteca, botones de exportacion y estados de importacion para que los E2E dependan menos del texto visible.
