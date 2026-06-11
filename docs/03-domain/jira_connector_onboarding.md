# Jira connector onboarding

Este documento congela que necesita FormulIA Cloud para conectar con un Jira Cloud de cualquier empresa sin hardcodear datos del cliente en codigo.

## Principio

Jira debe tratarse como un conector configurable por tenant. El codigo solo conoce el contrato generico de FormulIA; cada empresa aporta site, proyecto, issue types, credenciales y mapeos de campos.

## Que pedir al cliente

### Acceso y autenticacion

- URL del site Jira Cloud, por ejemplo `https://example.atlassian.net`.
- Metodo preferido:
  - OAuth 2.0 / 3LO para integraciones compartidas.
  - API token personal solo para pruebas controladas o scripts internos.
- Si usan OAuth propio:
  - Client ID.
  - Client Secret.
  - Callback URL autorizada. Para local: `http://localhost:3000/callback`.
  - Scopes concedidos.
  - Cloud ID, si lo tienen. Si no, se obtiene con `accessible-resources` tras autorizar.
- Usuario o grupo que debe autorizar la app.
- Politica de rotacion y revocacion de credenciales.

### Permisos minimos

- Leer usuario, proyectos, issue types y campos.
- Crear y editar issues.
- Subir adjuntos.
- Leer transiciones si se sincronizaran estados.
- `offline_access` cuando se necesite refresh token OAuth.

Scopes habituales para Jira Cloud REST v3:

```text
read:issue:jira
write:issue:jira
read:issue-meta:jira
read:issue-details:jira
read:issue-field-values:jira
read:issue.transition:jira
read:issue-type:jira
read:issue-status:jira
read:field:jira
read:field.option:jira
read:project:jira
read:user:jira
read:comment:jira
write:comment:jira
read:attachment:jira
write:attachment:jira
read:label:jira
read:priority:jira
offline_access
```

### Proyecto y flujo

- Project key destino, por ejemplo `LAB`.
- Issue types disponibles para el flujo de formulas.
- Issue type por defecto.
- Estados y transiciones relevantes.
- Si se debe crear siempre issue nuevo o enlazar con issues existentes.
- Politica de assignee/reporter:
  - Assignee por defecto, si aplica.
  - Account ID de usuario o cola destino, si Jira lo exige.
  - Si reporter debe ser automatico, el usuario autenticado o un campo no gestionado.

### Campos obligatorios

Pedir una tabla por issue type:

| Campo Jira | Field ID | Tipo Jira | Obligatorio | Valores permitidos | Campo FormulIA |
| --- | --- | --- | --- | --- | --- |
| Ejemplo proyecto funcional | `customfield_20011` | text | si | texto libre | `jira_project_id` |
| Ejemplo tipo producto | `customfield_20012` | option | si | `Nuevo`, `Mod A` | `jira_product_type_option` |

Tambien pedir:

- Campos que Jira exige aunque no aparezcan en pantalla.
- Valores exactos de opciones, mayusculas incluidas.
- Formato esperado para campos usuario, labels, componentes, versiones, prioridad y fechas.
- Si la descripcion debe usar Atlassian Document Format.
- Limites de tamano y tipos permitidos para adjuntos `.xlsx`.

## Mapeo FormulIA -> Jira

El conector soporta `field_mapping` como JSON por tenant. Las claves de FormulIA disponibles hoy son:

```json
{
  "formula_id": "customfield_20001",
  "formula_short_id": "customfield_20002",
  "formula_name": "customfield_20003",
  "formula_version": "customfield_20004",
  "formula_status": "customfield_20005",
  "jira_project_id": "customfield_20006",
  "jira_issue_type": "customfield_20007",
  "jira_product_type": "customfield_20008",
  "jira_product_type_option": "customfield_20009",
  "estimated_cost": "customfield_20010",
  "notes": "customfield_20011"
}
```

Usar `jira_product_type_option` cuando el campo Jira sea selector, porque envia `{ "value": "..." }`. Usar `jira_product_type` cuando el campo sea texto.

## Configuracion local

Variables locales esperadas para OAuth:

```text
FORMULIA_JIRA_OAUTH_CLIENT_ID
FORMULIA_JIRA_OAUTH_CLIENT_SECRET
FORMULIA_JIRA_OAUTH_REDIRECT_URI
FORMULIA_JIRA_SITE_URL
FORMULIA_JIRA_CLOUD_ID
FORMULIA_JIRA_OAUTH_ACCESS_TOKEN
FORMULIA_JIRA_OAUTH_REFRESH_TOKEN
FORMULIA_JIRA_OAUTH_EXPIRES_AT
```

El script `scripts/set-jira-oauth-env.ps1` solicita Client ID, Client Secret, Redirect URI, Site URL, Cloud ID opcional y access token opcional. Nunca commitear `.env.local`.

## Validacion antes de activar

1. Crear conexion Jira en FormulIA con URL, auth, project key, issue type y `field_mapping`.
2. Ejecutar `Test` y validar `/myself`, proyecto y issue type.
3. Ejecutar `Metadata` en Integrations para cargar proyectos, issue types y campos disponibles.
4. Usar el selector de clave FormulIA y el boton de mapeo de cada campo Jira para construir `field_mapping`.
5. Revisar el JSON resultante y pulsar `Save Jira`.
6. Crear una formula de prueba con datos no sensibles.
7. Enviar un issue controlado y adjuntar Excel.
8. Confirmar en Jira:
   - issue creado en proyecto correcto,
   - issue type correcto,
   - campos obligatorios rellenados,
   - descripcion legible,
   - Excel adjunto,
   - permisos y auditoria aceptables.
9. Documentar el mapping final del cliente en un entorno seguro, no en repositorio publico.

## Fuera de alcance actual

- Almacenamiento cifrado multi-tenant de OAuth en base de datos.
- Descubrimiento de transiciones/estados Jira en la UI.
- Webhooks y sincronizacion bidireccional de estados.
- Transformaciones avanzadas por campo mas alla de los mapeos soportados.
