# META-012 - Formula Excel export

## Decision

La duodecima meta implementable de FormulIA Cloud es permitir exportar una formula guardada a Excel.

Esta meta cierra el ciclo funcional basico de formula: crear o importar, calcular, guardar y sacar un archivo portable para revision tecnica o trabajo externo. Sigue siendo core determinista; no introduce IA, PDF ni plantillas avanzadas.

## Alcance incluido

- Rama `feature/formula-excel-export`.
- Endpoint tenant-aware para descargar una formula guardada en `.xlsx`.
- Workbook con resumen de formula, lineas, porcentajes, precio y parametros calculados.
- Uso del mismo calculo determinista que la app usa para formulas manuales/importadas.
- Boton de descarga en la biblioteca de formulas.
- Test API que verifica tenant isolation y contenido minimo del workbook.
- Smoke local que crea una formula y descarga el Excel.
- Quality/refactor gate antes de cerrar rama.

## Fuera de alcance

- Exportacion PDF.
- Plantillas de marca avanzadas.
- Almacenamiento historico de exports.
- Auditoria de descargas.
- Export masivo.
- Envio por email.
- IA, RAG o explicaciones generativas.

## Criterios de done

1. El backend expone `GET /api/v1/formulas/{id}/export/excel`.
2. El endpoint rechaza formulas de otro tenant.
3. El archivo descargado es un `.xlsx` valido.
4. El workbook incluye datos principales de formula.
5. El workbook incluye materias primas, codigos, porcentajes, precio unitario y coste ponderado.
6. El workbook incluye parametros calculados cuando existen.
7. La UI permite descargar desde la biblioteca de formulas.
8. Tests/checks pasan.
9. Quality/refactor gate queda aplicado.
10. Worktree limpio y rama subida.

## Testing minimo

- `python -m pytest`.
- `npm run check`.
- Smoke local:
  1. crear workspace,
  2. crear parametro y materia,
  3. guardar formula,
  4. descargar Excel desde biblioteca,
  5. verificar nombre de archivo y contenido basico.
- `npm audit --audit-level=moderate`.
- `rg` de referencias prohibidas o naming heredado.
- `git diff --check`.

## Riesgos

- No recalcular con una logica distinta a la del core actual.
- No filtrar formulas sin tenant context.
- No acoplar el export a la UI; el contrato principal debe vivir en API.
- Evitar una plantilla visual compleja antes de saber que datos necesita el cliente.

## Siguiente accion

Implementar un generador `.xlsx` pequeno en API, exponer el endpoint y conectar una accion de descarga en la biblioteca de formulas.
