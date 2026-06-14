from __future__ import annotations

import argparse
import os
import uuid
from copy import deepcopy
from urllib.parse import urlparse, urlunparse

from sqlmodel import Session, select

from formulia_api.database import create_db_engine, init_db
from formulia_api.iso_design import default_iso_config
from formulia_api.jira_client import JIRA_API_TOKEN_CREDENTIAL_KEY
from formulia_api.local_env import load_local_env
from formulia_api.models import (
    IsoTenantSettings,
    JiraConnection,
    Tenant,
    TenantMember,
    User,
    utc_now,
)
from formulia_api.tenant import DEV_USER_ID


ATLANTICA_SLUG = "atlantica-agricola"
ATLANTICA_NAME = "Atlantica Agricola"
ATLANTICA_JIRA_SITE_URL = "https://atlanticaagricola.atlassian.net"
ATLANTICA_JIRA_PROJECT_KEY = "ID"
ATLANTICA_JIRA_DEFAULT_ISSUE_TYPE = "Prototipo"
ATLANTICA_JIRA_FIELD_MAPPING = {
    "jira_project_id": "customfield_10658",
    "jira_product_type_option": "customfield_10856",
    "technical_result": "customfield_11024",
}
ATLANTICA_JIRA_STATUS_MAPPING = {
    "PENDIENTE": "sent_to_jira",
    "Pendiente": "sent_to_jira",
    "Pendiente de revision": "sent_to_jira",
    "CALIDAD": "in_lab_review",
    "Calidad": "in_lab_review",
    "LABORATORIO": "in_lab_review",
    "En pruebas": "in_testing",
    "FINALIZADO": "closed",
    "LIBERADO": "closed",
    "OK": "approved",
    "OK NO LIBERADO": "approved",
    "NOK": "rejected",
    "Cancelado": "closed",
    "CANCELADO": "closed",
}


def main() -> None:
    load_local_env()
    parser = argparse.ArgumentParser(
        description="Enable and configure ISO 9001/Jira for a tenant."
    )
    parser.add_argument("--tenant-slug", default=ATLANTICA_SLUG)
    parser.add_argument("--tenant-name", default=ATLANTICA_NAME)
    parser.add_argument("--database-url", default=None)
    parser.add_argument(
        "--use-transaction-pooler",
        action="store_true",
        help="Use Supabase transaction pooler port 6543 instead of session pooler 5432.",
    )
    parser.add_argument("--admin-email", default=os.getenv("FORMULIA_ADMIN_EMAIL", "dev@local.formulia"))
    parser.add_argument("--jira-site-url", default=os.getenv("FORMULIA_JIRA_SITE_URL", ATLANTICA_JIRA_SITE_URL))
    parser.add_argument("--jira-project-key", default=ATLANTICA_JIRA_PROJECT_KEY)
    parser.add_argument("--jira-default-issue-type", default=ATLANTICA_JIRA_DEFAULT_ISSUE_TYPE)
    parser.add_argument("--jira-auth-email", default=os.getenv("FORMULIA_JIRA_AUTH_EMAIL"))
    args = parser.parse_args()

    database_url = args.database_url or os.getenv("DATABASE_URL")
    if args.use_transaction_pooler and database_url:
        database_url = _transaction_pooler_url(database_url)
    engine = create_db_engine(database_url)
    try:
        init_db(engine)
        with Session(engine) as session:
            tenant = ensure_tenant(session, args.tenant_slug, args.tenant_name, args.admin_email)
            settings = upsert_iso_settings(session, tenant)
            connection = upsert_jira_connection(
                session,
                tenant,
                site_url=args.jira_site_url,
                project_key=args.jira_project_key,
                default_issue_type=args.jira_default_issue_type,
                auth_email=args.jira_auth_email,
            )
            session.commit()
            print(
                {
                    "tenant_slug": tenant.slug,
                    "iso_enabled": settings.enabled,
                    "jira_project_key": connection.default_project_key,
                    "jira_issue_type": connection.default_issue_type,
                    "jira_credential_status": connection.credential_status,
                }
            )
    finally:
        engine.dispose()


def ensure_tenant(session: Session, slug: str, name: str, admin_email: str) -> Tenant:
    tenant = session.exec(select(Tenant).where(Tenant.slug == slug)).first()
    if tenant is None:
        tenant = Tenant(name=name, slug=slug, status="active")
    else:
        tenant.name = name
        tenant.status = "active"
    session.add(tenant)
    session.flush()

    user = session.get(User, DEV_USER_ID)
    if user is None:
        user = User(id=DEV_USER_ID, email=admin_email, name=name)
        session.add(user)
        session.flush()

    membership = session.exec(
        select(TenantMember).where(
            TenantMember.tenant_id == tenant.id,
            TenantMember.user_id == user.id,
        )
    ).first()
    if membership is None:
        membership = TenantMember(tenant_id=tenant.id, user_id=user.id, role="owner")
    membership.role = "owner"
    membership.status = "active"
    session.add(membership)
    session.flush()
    return tenant


def upsert_iso_settings(session: Session, tenant: Tenant) -> IsoTenantSettings:
    settings = session.exec(
        select(IsoTenantSettings).where(IsoTenantSettings.tenant_id == tenant.id)
    ).first()
    if settings is None:
        settings = IsoTenantSettings(tenant_id=tenant.id)
    config = deepcopy(default_iso_config())
    config["tenant_profile"] = tenant.slug
    settings.enabled = True
    settings.config_json = config
    settings.updated_by = DEV_USER_ID
    settings.updated_at = utc_now()
    session.add(settings)
    session.flush()
    return settings


def upsert_jira_connection(
    session: Session,
    tenant: Tenant,
    *,
    site_url: str,
    project_key: str,
    default_issue_type: str,
    auth_email: str | None,
) -> JiraConnection:
    connection = session.exec(
        select(JiraConnection)
        .where(JiraConnection.tenant_id == tenant.id)
        .order_by(JiraConnection.created_at.desc())
    ).first()
    if connection is None:
        connection = JiraConnection(
            tenant_id=tenant.id,
            base_url=site_url.rstrip("/"),
            auth_type="api_token",
            default_project_key=project_key,
            default_issue_type=default_issue_type,
        )
    connection.base_url = site_url.rstrip("/")
    connection.auth_type = "api_token"
    connection.auth_email = auth_email or connection.auth_email
    connection.default_project_key = project_key.strip().upper()
    connection.default_issue_type = default_issue_type.strip()
    connection.field_mapping_json = dict(ATLANTICA_JIRA_FIELD_MAPPING)
    connection.status_mapping_json = dict(ATLANTICA_JIRA_STATUS_MAPPING)
    connection.is_active = True
    api_token = os.getenv("FORMULIA_JIRA_API_TOKEN", "").strip()
    if api_token:
        credentials = dict(connection.credential_json or {})
        credentials[JIRA_API_TOKEN_CREDENTIAL_KEY] = api_token
        connection.credential_json = credentials
        connection.credential_status = "configured"
    elif connection.credential_json:
        connection.credential_status = "configured"
    else:
        connection.credential_status = "missing"
    connection.updated_at = utc_now()
    session.add(connection)
    session.flush()

    other_connections = session.exec(
        select(JiraConnection).where(
            JiraConnection.tenant_id == tenant.id,
            JiraConnection.id != connection.id,
            JiraConnection.is_active.is_(True),
        )
    ).all()
    for other in other_connections:
        other.is_active = False
        other.updated_at = utc_now()
        session.add(other)
    return connection


def _transaction_pooler_url(database_url: str) -> str:
    parsed = urlparse(database_url)
    if not parsed.hostname or not parsed.hostname.endswith("pooler.supabase.com"):
        return database_url
    if parsed.port == 6543:
        return database_url
    if parsed.port is None:
        next_netloc = f"{parsed.netloc}:6543"
    else:
        next_netloc = parsed.netloc.replace(f":{parsed.port}", ":6543", 1)
    return urlunparse(parsed._replace(netloc=next_netloc))


if __name__ == "__main__":
    main()
