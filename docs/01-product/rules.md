# Reglas de negocio y guardrails

## Reglas generales

1. Toda entidad funcional pertenece a un tenant.
2. No se permite mezclar datos entre tenants.
3. Toda fórmula debe tener suma de porcentajes validada.
4. Se puede guardar borrador incompleto, pero no aprobar fórmula final incompleta.
5. El cálculo oficial se ejecuta en backend.
6. La IA no es fuente de verdad para precios ni composición.
7. Las propuestas IA deben ser explicables.
8. Las reglas de incompatibilidad blocker impiden aprobación salvo override autorizado.
9. Las credenciales ERP deben cifrarse.
10. Todos los cambios críticos deben auditarse.

## Reglas de cálculo

- Precio fórmula = sumatorio de precio vigente por materia prima multiplicado por porcentaje / 100.
- Parámetro fórmula = sumatorio de valor del parámetro en cada materia prima multiplicado por porcentaje / 100.
- Si falta precio, marcar warning.
- Si falta parámetro técnico usado como restricción, no asumir 0 salvo configuración explícita.
- Si materia prima está obsoleta, warning o bloqueo según configuración del tenant.

## Reglas de importación Excel

- No guardar fórmula importada como final si hay materias primas sin resolver.
- Si el match es menor al umbral configurable, requiere confirmación humana.
- Si el usuario confirma match, puede crearse alias.
- Mantener archivo original.
- Mantener mapping usado.

## Reglas de IA

- No inventar datos técnicos.
- No usar fuentes de mercado como precio interno.
- No usar papers sin citar metadatos.
- No generar fórmula final sin `FormulaCalculatorTool`.
- No generar fórmula optimizada sin `OptimizerTool` cuando haya restricciones matemáticas.
- Marcar claramente incertidumbres.

## Reglas de ERP

- ERP entra por staging.
- No sobrescribir materias primas directamente sin política configurada.
- Precios se versionan históricamente.
- Materias obsoletas no se eliminan: se marcan.
- Cambios masivos deben tener job log.

## Reglas de billing

- Validar entitlement antes de ejecutar features premium.
- Registrar usage para IA, documentos, ERP syncs y usuarios.
- Bloquear o degradar funciones al superar límites según plan.

## Reglas de seguridad

- Comprobar tenant membership en cada request.
- No confiar en tenant_id enviado sin validar membresía.
- Rate limits en endpoints IA y upload.
- Sanitizar archivos subidos.
- Escanear o validar tipos de documentos.
