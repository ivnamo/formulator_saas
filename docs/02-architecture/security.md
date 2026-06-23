# Seguridad

## Objetivos

- Aislamiento de tenants.
- Protección de documentos y fórmulas.
- Protección de credenciales ERP.
- Auditoría de cambios críticos.
- Control de uso IA.

## Tenant isolation

- Validar membership antes de cada request.
- En backend, tenant_id debe provenir de contexto validado.
- RLS en Postgres/Supabase si aplica.
- Tests específicos de fuga cross-tenant.

## Secretos

- Credenciales ERP cifradas.
- Variables de entorno para secrets globales.
- No guardar tokens en logs.
- Rotación de tokens.

## Uploads

- Validar tipo de archivo.
- Limitar tamaño por plan.
- Escanear si se añade antivirus.
- Guardar en path/prefix por tenant.

## IA

- No enviar datos de otro tenant.
- Minimizar datos enviados al LLM.
- Registrar tool calls.
- Permitir configuración de privacidad por tenant.
- Redactar secretos antes de prompts.

## Auditoría

Auditar:

- creación/edición/borrado de materias primas,
- cambio de precios,
- creación/edición/aprobación de fórmulas,
- importaciones ERP,
- reglas de incompatibilidad,
- uso de IA,
- cambios de billing/roles.

## Permisos mínimos

- Viewer no puede crear fórmulas.
- Formulador no puede cambiar billing ni credenciales ERP.
- Admin puede gestionar datos técnicos.
- Owner controla billing y usuarios.
- Owner es el unico rol que puede archivar formulas y materias primas operativas.
- Formulator puede editar datos tecnicos, pero no cambiar `status`, `is_active` o `is_obsolete`.

## Rate limiting

- IA.
- Uploads.
- Login.
- Importaciones ERP.
- Endpoints públicos/webhooks.
