# Integraciones ERP/SAP

## Objetivo

Permitir que FormulIA Cloud se conecte a ERP como SAP para actualizar materias primas, precios, estado de obsolescencia, proveedores y disponibilidad.

## Principio

ERP no escribe directamente en materias primas. Todo entra por staging.

## Conectores iniciales

- SAP OData.
- REST genérico.
- SFTP CSV.
- Upload manual CSV/Excel.
- Webhook genérico.

## Datos a sincronizar

- Código ERP.
- Nombre.
- Descripción.
- Estado activo/obsoleto.
- Precio.
- Moneda.
- Unidad.
- Proveedor.
- Centro/planta.
- Stock si aplica.
- Fecha de validez.

## Flujo

```text
Conector ejecuta sync
↓
Crea erp_sync_job
↓
Carga datos en staging
↓
Matching contra materias primas
↓
Detecta altas, cambios, obsoletos
↓
Usuario/aprobación automática según política
↓
Aplica cambios
↓
Guarda auditoría
```

## Políticas de aplicación

Por tenant:

- Auto-actualizar precios.
- Requerir aprobación para nuevas materias.
- Requerir aprobación para obsoletos.
- Crear alias automáticamente desde ERP.
- Convertir moneda/unidad.

## Precios

Guardar siempre histórico:

- fuente: SAP/ERP/manual/mercado,
- valid_from,
- valid_to,
- proveedor,
- moneda,
- unidad.

## Seguridad

- Credenciales cifradas.
- Rotación de secretos.
- Logs sin secretos.
- Permisos solo para Admin/Owner.
- Test connection antes de activar.

## SAP

Posibles vías:

- SAP OData Services.
- SAP Business One Service Layer.
- SAP S/4HANA APIs.
- Export CSV programado.
- Middleware del cliente.

No asumir una única integración SAP. Diseñar un Integration Hub configurable.
