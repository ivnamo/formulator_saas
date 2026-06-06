# Multi-tenant, suscripciones y pagos

## Requisito obligatorio

La app debe nacer como SaaS multi-tenant. No añadir multi-tenancy después.

## Tenant isolation

- Toda query funcional filtra por `tenant_id`.
- El tenant activo se valida contra membresía del usuario.
- RAG, documentos, precios y fórmulas están aislados por tenant.
- Las credenciales ERP son por tenant.

## Roles

- Owner.
- Admin.
- Formulador.
- Viewer.
- External Consultant.

## Billing

Proveedor recomendado: Stripe.

Flujo:

```text
Tenant Owner elige plan
↓
Stripe Checkout
↓
Webhook confirma subscription
↓
Actualizar subscription
↓
Crear entitlements
↓
Aplicar límites
```

## Entitlements

No codificar límites rígidos en el código. Usar feature flags por tenant.

Ejemplos:

```json
{
  "ai.formulation.enabled": true,
  "ai.monthly_runs": 500,
  "erp.sap.enabled": true,
  "documents.max_storage_gb": 10,
  "users.max": 25,
  "excel_import.enabled": true
}
```

## Planes iniciales

### Starter

- 3 usuarios.
- Materias primas limitadas.
- Fórmulas limitadas.
- Importación Excel básica.
- Sin ERP.
- IA limitada o no incluida.

### Professional

- Usuarios ampliados.
- Materias primas/fórmulas ampliadas.
- RAG documental.
- Importador Excel avanzado.
- Optimizador.
- IA mensual incluida.

### Enterprise

- SAP/ERP.
- SSO opcional.
- Límites custom.
- Auditoría avanzada.
- Soporte dedicado.
- Despliegue privado opcional.

## Usage events

Registrar:

- ai_run,
- rag_query,
- document_upload,
- erp_sync,
- formula_optimization,
- excel_import,
- user_invite.

## Trial

Soportar trial por tenant con fecha de expiración y límites.

## Suspensión

Si una suscripción expira:

- bloquear nuevas operaciones premium,
- mantener datos,
- permitir exportación si política lo permite,
- avisar al Owner.
