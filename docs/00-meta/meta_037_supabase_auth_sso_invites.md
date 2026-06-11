# META-037 - Supabase Auth, SSO e invitaciones

## Decision

La trigesima septima meta implementable de FormulIA Cloud es introducir autenticacion real con Supabase Auth y preparar SSO empresarial sin abrir auto-join.

El tenant piloto es `Atlantica Agricola`. El owner/admin inicial sera Ivan Navarro, asociado por email confirmado durante la implementacion. Los usuarios posteriores entraran solo mediante invitacion por email.

## Contexto

La app aun usa un usuario de desarrollo hardcodeado (`X-User-Id`) y tenant activo manual. Esto sirve para el MVP tecnico, pero no es aceptable para operar como SaaS multi-tenant.

Ya existe estructura de tenant en backend:

- `users`,
- `tenants`,
- `tenant_members`,
- validacion de `X-Tenant-Id` contra membresia.

Tambien existe un proyecto Supabase compartido con otra app. FormulIA debe seguir aislada en el schema Postgres `formulia`, sin tocar tablas existentes en `public`.

## Decisiones cerradas

- Supabase Auth sera la fuente de identidad.
- El backend FastAPI validara JWT de Supabase; no aceptara `X-User-Id` como identidad real.
- `tenant_members` seguira siendo la fuente de autorizacion SaaS.
- No habra auto-join por dominio en este corte.
- El acceso sera por invitacion por email.
- Ivan Navarro sera owner/admin inicial del tenant `Atlantica Agricola`.
- SSO se preparara como camino preferente, idealmente Microsoft Entra ID si Atlantica usa Microsoft 365.
- Si SSO SAML requiere plan de Supabase no disponible, el corte debe dejar email/magic link funcional y SSO documentado como bloqueado por plan/configuracion.
- La activacion real de Microsoft Entra SAML requiere un admin de Atlantica con permisos para crear/configurar Enterprise Applications y asignar usuarios o grupos.

## Alcance incluido

- Rama recomendada: `codex/supabase-auth-sso-invites`.
- Configurar variables de Supabase Auth en frontend y backend:
  - project URL,
  - anon/public key para frontend,
  - JWKS/JWT verification config para backend.
- Instalar cliente Supabase recomendado para Next.js SSR/cookies.
- Crear pantalla de login.
- Crear callback/confirmacion de sesion si el flujo elegido lo requiere.
- Proteger la app web: sin sesion, redirigir a login.
- Sustituir `userId` hardcodeado del frontend por sesion real.
- Enviar `Authorization: Bearer <access_token>` desde frontend al backend.
- En backend:
  - validar token Supabase,
  - mapear `auth.users.id` a `users.id`,
  - crear usuario local si la sesion es valida y el email esta invitado,
  - rechazar usuarios no invitados,
  - mantener `X-Tenant-Id` solo como tenant activo, no como prueba de identidad.
- Crear mecanismo de invitaciones por email:
  - tabla `tenant_invitations` o equivalente,
  - email invitado,
  - tenant,
  - rol,
  - estado,
  - expiracion,
  - aceptada por `auth_user_id`,
  - auditoria basica.
- No exponer magic link en el login publico; `Enviar enlace` queda solo para `owner/admin` dentro de Configuracion.
- Los usuarios invitados deben poder crear o recuperar contrasena desde `/reset-password`, y usuarios logueados deben poder cambiarla desde `Configuracion > Mi cuenta`.
- Seed/control administrativo para invitar al admin inicial Ivan Navarro al tenant `Atlantica Agricola`.
- Validar que Ivan puede entrar y queda como `owner` o `admin`.
- Preparar soporte SSO:
  - no mostrar boton SSO hasta que el proveedor este configurado,
  - configuracion por tenant,
  - documentacion de setup SAML,
  - error claro si SSO no esta configurado.
- Mantener compatibilidad local razonable para tests.

## Fuera de alcance

- Auto-join por dominio corporativo.
- SCIM provisioning.
- Gestion avanzada de grupos desde IdP.
- RLS completa para acceso directo desde navegador a tablas funcionales.
- Multi-factor authentication obligatoria.
- Recuperacion avanzada de cuentas.
- Panel completo de administracion de usuarios.
- Billing ligado a usuarios.
- Eliminar el schema `formulia` o mover datos entre schemas.
- Reescribir permisos funcionales mas alla de membership/roles basicos.

## Modelo de datos propuesto

```sql
CREATE TABLE tenant_invitations (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  email text NOT NULL,
  role text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  invited_by uuid REFERENCES users(id),
  accepted_by uuid REFERENCES users(id),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  UNIQUE (tenant_id, email)
);
```

Reglas:

- `email` debe normalizarse a lowercase/trim.
- Solo invitaciones `pending` no expiradas permiten crear membership.
- Aceptar invitacion crea o activa `tenant_members`.
- Reinvitar no duplica membership.
- Roles permitidos inicialmente: `owner`, `admin`, `formulador`, `viewer`.

## Flujo UX

```text
Usuario abre app
↓
Si no hay sesion: login
↓
Login por email/password o magic link; SSO solo cuando este configurado
↓
Frontend obtiene sesion Supabase
↓
Backend valida JWT
↓
Backend comprueba invitacion/membership
↓
Usuario entra al tenant Atlantica Agricola
```

## Flujo de invitacion

```text
Admin invita email
↓
Sistema crea tenant_invitations
↓
Usuario recibe email o enlace de acceso
↓
Usuario autentica con Supabase Auth
↓
Backend valida email contra invitacion pendiente
↓
Sistema crea tenant_members
↓
Invitacion pasa a accepted
```

## Criterios de done

1. La app ya no depende de `X-User-Id` hardcodeado en frontend.
2. Un usuario sin sesion no puede abrir la app.
3. Un JWT invalido o ausente recibe 401 en endpoints protegidos.
4. Un usuario autenticado pero no invitado no puede entrar a ningun tenant.
5. Un usuario autenticado e invitado puede aceptar invitacion.
6. Ivan Navarro puede iniciar sesion y entrar al tenant `Atlantica Agricola`.
7. Ivan queda con rol `owner` o `admin`.
8. `X-Tenant-Id` se valida contra `tenant_members` del usuario autenticado.
9. No existe auto-join por dominio.
10. La otra app del proyecto Supabase no se ve afectada.
11. El schema `public` no recibe tablas nuevas de FormulIA.
12. Tests backend cubren 401, 403, invitacion aceptada y tenant isolation.
13. Smoke browser valida login y entrada a Atlantica.
14. La documentacion indica como configurar SSO SAML y que datos faltan si no esta activo.

## Testing minimo

- Backend:
  - token ausente -> 401,
  - token invalido -> 401,
  - token valido sin invitacion -> 403,
  - token valido con invitacion pendiente -> membership creado,
  - usuario de tenant A no puede leer tenant B,
  - Ivan/admin puede listar materias primas de Atlantica.
- Frontend:
  - sin sesion redirige a login,
  - login correcto carga tenant,
  - boton/logout limpia sesion,
  - API calls llevan `Authorization`.
- Smoke browser:
  - abrir app sin sesion,
  - autenticar,
  - ver tenant `Atlantica Agricola`,
  - ver materias primas cargadas.

## Riesgos

- Supabase SAML SSO puede requerir plan o configuracion enterprise.
- Microsoft Entra SAML requiere intervencion de IT/admin de Atlantica; no basta con que Ivan tenga una cuenta corporativa normal.
- Reutilizar un proyecto Supabase compartido exige no tocar `public`.
- Mezclar identidad (`auth.users`) con autorizacion (`tenant_members`) puede crear bugs si no se prueba bien.
- El pooler/SSR puede tener diferencias entre local y produccion.
- Magic link/email puede requerir configurar redirect URLs correctamente.

## Estrategia recomendada

Implementar en dos fases dentro de la misma meta si hace falta:

1. Autenticacion base con Supabase Auth, cookies SSR, JWT en FastAPI e invitaciones por email.
2. Preparacion SSO SAML: configuracion por tenant y documentacion; el boton se expone solo cuando el proveedor/plan este listo.

No bloquear la seguridad basica esperando SSO. Si SSO no esta disponible por plan/configuracion, la app debe quedar segura con invitacion por email y sin auto-join.

## Estado SSO

SSO esta preparado en codigo, pero queda a la espera de dos confirmaciones externas:

- Supabase: SAML 2.0 habilitado en el proyecto y plan compatible.
- Atlantica: admin de Microsoft Entra que cree/configure la Enterprise Application de FormulIA y entregue la Federation Metadata URL o XML.

Ivan puede entrar antes de SSO usando email/password, recuperacion de contrasena o un enlace enviado por un admin desde la app, incluido su email de Atlantica si se invita explicitamente. Ese camino no requiere admin de Atlantica, solo una invitacion FormulIA y acceso al buzon si se usa enlace o recuperacion.

## Referencias

- Supabase Auth con Next.js SSR: https://supabase.com/docs/guides/auth/quickstarts/nextjs
- Supabase SAML SSO: https://supabase.com/docs/guides/auth/enterprise-sso/auth-sso-saml

## Siguiente accion recomendada

Confirmar el email exacto de Ivan Navarro que sera owner/admin inicial y empezar por el reemplazo de `X-User-Id` por sesion Supabase validada en backend.
