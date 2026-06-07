# META-029 - Jira review Excel artifact

## Decision

La vigesima novena meta implementable de FormulIA Cloud es generar un Excel persistido a partir de una solicitud de revision Jira.

El objetivo es que el equipo pueda preparar un paquete tecnico descargable antes de crear el issue real en Jira. El Excel nace del snapshot guardado en `formula_review_requests`.

## Alcance incluido

- Rama `codex/jira-review-excel-artifact`.
- Tabla `formula_review_artifacts` con `tenant_id`.
- Generador XLSX para snapshot de revision Jira.
- Endpoint para listar artefactos de una review.
- Endpoint idempotente para crear/recuperar el Excel de una review.
- Endpoint tenant-scoped para descargar el XLSX.
- UI minima en la ficha de formula para generar y descargar el Excel.
- Tests de generacion, descarga, idempotencia y aislamiento tenant.

## Fuera de alcance

- Crear issue real en Jira.
- Subir adjuntos a Atlassian.
- Sincronizar estados Jira.
- Gestion avanzada de versiones de artefactos.
- Storage externo de ficheros.
- Cifrado real de credenciales Jira.

## Criterios de done

1. Una review Jira preparada puede generar un XLSX descargable.
2. El XLSX incluye resumen, composicion, calculo/validaciones y metadatos del snapshot.
3. El artefacto queda asociado a tenant y review.
4. Repetir la generacion no duplica el artefacto.
5. Otro tenant no puede listar ni descargar artefactos ajenos.
6. La UI permite generar y descargar el Excel desde la review.
7. Tests/checks pasan.
8. Quality/refactor gate queda aplicado antes de commit.
9. La rama se sube con commit atomico.

## Testing minimo

- `python -m pytest apps/api/tests/test_jira_integration.py`.
- `python -m pytest`.
- `npm run check`.
- `npm audit --audit-level=moderate`.
- `git diff --check`.
- Smoke API creando tenant, formula, conexion Jira, review y Excel.
- Smoke browser verificando que la UI de review muestra accion de Excel sin errores de consola.
- `rg` de referencias prohibidas o naming heredado en documentacion.

## Riesgos

- No presentar el Excel como adjunto enviado a Jira.
- Evitar duplicados silenciosos por la misma review.
- Mantener el download tenant-scoped porque usa cabeceras de contexto.
- No esconder errores de snapshot incompleto: el Excel debe degradar con valores vacios, no romper la UI.

## Siguiente accion

Crear el cliente Atlassian real para abrir issue y, en una meta posterior, adjuntar el XLSX generado.
