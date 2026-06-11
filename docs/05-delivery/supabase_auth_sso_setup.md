# Supabase Auth, SSO and Invitations

## Current State

- Supabase project: `formulator` (`jungmcialbypqeggnmiq`).
- FormulIA data schema: `formulia`.
- Tenant used by the app first: `atlantica-agricola`.
- Ivan invitation: `bioivannavarro@hotmail.com`, role `owner`, status `pending`.
- Access policy: no auto-join. A Supabase-authenticated user must have a pending invitation or an active tenant membership.
- SAML SSO status: hidden from the UI until Supabase SAML enablement and Atlantica Microsoft Entra configuration are ready.

The frontend uses Supabase Auth for login and sends `Authorization: Bearer <access_token>` to the FastAPI backend. The backend validates the token against Supabase Auth, then checks `tenant_members`.

## Local Environment

The root `.env.local` must contain:

```text
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
DATABASE_URL=...
FORMULIA_DB_SCHEMA=formulia
```

`apps/web/next.config.ts` loads the root `.env.local` for local Next.js builds and dev runs, so the public Supabase values do not need to be duplicated under `apps/web`.

## Invite a User

Admins invite users from `Configuracion > Invitaciones` once logged in as `owner` or `admin`. The public login screen does not expose magic-link sending.

The backend sends Supabase invite links with the service-role key, so `SUPABASE_SERVICE_ROLE_KEY` must be configured server-side. Never expose it as a `NEXT_PUBLIC_*` variable.

After a user receives the admin invitation, they can set or recover their password through the password flow below.

For local or scripted invitation records, use the script from the repo root:

```powershell
.\.venv\Scripts\python.exe scripts\invite_tenant_user.py user@example.com --tenant-slug atlantica-agricola --role formulator
```

Allowed roles are `owner`, `admin`, `formulator`, `formulador`, and `viewer`. `formulador` is normalized to `formulator`.

## Login Flow

1. User opens the app.
2. Next.js `proxy.ts` redirects unauthenticated users to `/login`.
3. User signs in with email/password.
4. Frontend loads the Supabase session.
5. Backend validates the bearer token.
6. Backend accepts a pending invitation and creates/activates `tenant_members`.
7. The app loads `atlantica-agricola` and its raw materials.

## Password Flow

Users can create or recover their password from `/reset-password`.

1. User enters their invited email.
2. Supabase sends a recovery email.
3. Supabase redirects through `/auth/callback?next=/update-password`.
4. User sets a new password in `/update-password`.
5. User continues to the app or returns to `/login`.

Logged-in users can also open `Configuracion > Mi cuenta > Cambiar contrasena`.

## SSO Setup

SSO is intentionally hidden from the login UI for now. It should only be exposed after a SAML provider is configured in Supabase and in the identity provider.

This requires help from Atlantica IT. Microsoft Entra SAML setup must be done by a tenant administrator with permission to create/configure Enterprise Applications, typically at least `Cloud Application Administrator` or equivalent.

What we need from Atlantica IT:

- Create a non-gallery Enterprise Application for FormulIA Cloud in Microsoft Entra.
- Configure SAML single sign-on.
- Enter the Supabase/FormulIA Service Provider values:
  - Entity ID / Identifier from Supabase SAML configuration.
  - Reply URL / ACS URL from Supabase SAML configuration.
  - Optional Sign-on URL for the deployed FormulIA URL.
- Map at least:
  - NameID or email to the user's corporate email.
  - first name / last name or display name if available.
- Assign Ivan's Atlantica user, and later the required users/groups, to the Enterprise Application.
- Provide the Microsoft Entra Federation Metadata URL or Metadata XML back to the FormulIA/Supabase project admin.

Recommended setup for Microsoft Entra ID:

1. In Supabase Dashboard, open the `formulator` project.
2. Go to Authentication providers and configure SAML/SSO for the Atlantica domain.
3. Copy Supabase SP values, such as Entity ID and ACS URL, into Microsoft Entra ID.
4. Copy the Entra metadata URL or certificate values back into Supabase.
5. Add the app callback URL to Supabase Auth redirect URLs:
   - local: `http://localhost:3000/auth/callback`
   - production: the deployed FormulIA URL plus `/auth/callback`
6. Test from `/login` with an email on the configured domain.

If Supabase SAML SSO is not available on the current plan, the app remains secured by invitation-only email/password login and admin-sent invitation links until the provider is enabled.

## Can Ivan Enter With an Atlantica Email Now?

Yes, if Ivan provides the exact Atlantica email address and that email is invited to `atlantica-agricola`, he can use email/password login or the password flow without any Microsoft Entra admin work.

That path is not SSO. It only requires:

- the email invitation in `tenant_invitations`,
- Supabase Auth email/password or admin invitation enabled,
- the app callback URL allowed in Supabase Auth URL configuration,
- access to the mailbox if the admin sends an invitation link.

For true SSO through the Atlantica Microsoft account, wait for the Entra admin checklist above.
