from __future__ import annotations

import uuid
from typing import Any

from fastapi import Depends, FastAPI, HTTPException
from sqlmodel import Session, select

from .database import get_session
from .models import JiraConnection, utc_now
from .schemas import (
    JiraConnectionCreate,
    JiraConnectionRead,
    JiraConnectionTestRead,
    JiraConnectionUpdate,
)
from .tenant import TenantContext, require_tenant_context


def register_jira_routes(app: FastAPI) -> None:
    @app.get("/api/v1/integrations/jira", response_model=list[JiraConnectionRead])
    def list_jira_connections(
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> list[dict[str, Any]]:
        connections = session.exec(
            select(JiraConnection)
            .where(JiraConnection.tenant_id == tenant.tenant_id)
            .order_by(JiraConnection.created_at.desc())
        ).all()
        return [_jira_connection_read(connection) for connection in connections]

    @app.post(
        "/api/v1/integrations/jira",
        response_model=JiraConnectionRead,
        status_code=201,
    )
    def create_jira_connection(
        payload: JiraConnectionCreate,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        _require_integration_admin(tenant)
        connection = _new_jira_connection(tenant.tenant_id, payload)
        if connection.is_active:
            _deactivate_other_jira_connections(session, tenant.tenant_id, connection.id)
        session.add(connection)
        session.commit()
        session.refresh(connection)
        return _jira_connection_read(connection)

    @app.patch(
        "/api/v1/integrations/jira/{connection_id}",
        response_model=JiraConnectionRead,
    )
    def update_jira_connection(
        connection_id: uuid.UUID,
        payload: JiraConnectionUpdate,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        _require_integration_admin(tenant)
        connection = _get_jira_connection(session, tenant.tenant_id, connection_id)
        _apply_jira_connection_update(connection, payload)
        if connection.is_active:
            _deactivate_other_jira_connections(session, tenant.tenant_id, connection.id)
        connection.updated_at = utc_now()
        session.add(connection)
        session.commit()
        session.refresh(connection)
        return _jira_connection_read(connection)

    @app.post(
        "/api/v1/integrations/jira/{connection_id}/test",
        response_model=JiraConnectionTestRead,
    )
    def test_jira_connection(
        connection_id: uuid.UUID,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        _require_integration_admin(tenant)
        connection = _get_jira_connection(session, tenant.tenant_id, connection_id)
        checked_at = utc_now()
        status, message = _jira_connection_test_result(connection)
        connection.last_test_status = status
        connection.last_test_message = message
        connection.last_tested_at = checked_at
        connection.updated_at = checked_at
        session.add(connection)
        session.commit()
        return {
            "connection_id": connection.id,
            "status": status,
            "message": message,
            "checked_at": checked_at,
        }


def _require_integration_admin(tenant: TenantContext) -> None:
    if tenant.role not in {"owner", "admin"}:
        raise HTTPException(status_code=403, detail="Admin role is required.")


def _get_jira_connection(
    session: Session,
    tenant_id: uuid.UUID,
    connection_id: uuid.UUID,
) -> JiraConnection:
    connection = session.exec(
        select(JiraConnection).where(
            JiraConnection.id == connection_id,
            JiraConnection.tenant_id == tenant_id,
        )
    ).first()
    if connection is None:
        raise HTTPException(status_code=404, detail="Jira connection not found.")
    return connection


def _new_jira_connection(
    tenant_id: uuid.UUID,
    payload: JiraConnectionCreate,
) -> JiraConnection:
    return JiraConnection(
        tenant_id=tenant_id,
        base_url=_normalize_jira_base_url(payload.base_url),
        auth_type=payload.auth_type,
        auth_email=_clean_optional(payload.auth_email),
        credential_status=_credential_status_from_token(payload.api_token),
        default_project_key=_normalize_project_key(payload.default_project_key),
        default_issue_type=_clean_required(payload.default_issue_type, "Issue type"),
        default_assignee=_clean_optional(payload.default_assignee),
        field_mapping_json=_clean_mapping(payload.field_mapping),
        status_mapping_json=_clean_mapping(payload.status_mapping),
        is_active=payload.is_active,
    )


def _apply_jira_connection_update(
    connection: JiraConnection,
    payload: JiraConnectionUpdate,
) -> None:
    updates = payload.model_dump(exclude_unset=True)
    if "base_url" in updates and updates["base_url"] is not None:
        connection.base_url = _normalize_jira_base_url(updates["base_url"])
    if "auth_type" in updates and updates["auth_type"] is not None:
        connection.auth_type = updates["auth_type"]
    if "auth_email" in updates:
        connection.auth_email = _clean_optional(updates["auth_email"])
    if "api_token" in updates:
        connection.credential_status = _credential_status_from_token(
            updates["api_token"],
            current_status=connection.credential_status,
        )
    if "default_project_key" in updates and updates["default_project_key"] is not None:
        connection.default_project_key = _normalize_project_key(updates["default_project_key"])
    if "default_issue_type" in updates and updates["default_issue_type"] is not None:
        connection.default_issue_type = _clean_required(
            updates["default_issue_type"],
            "Issue type",
        )
    if "default_assignee" in updates:
        connection.default_assignee = _clean_optional(updates["default_assignee"])
    if "field_mapping" in updates and updates["field_mapping"] is not None:
        connection.field_mapping_json = _clean_mapping(updates["field_mapping"])
    if "status_mapping" in updates and updates["status_mapping"] is not None:
        connection.status_mapping_json = _clean_mapping(updates["status_mapping"])
    if "is_active" in updates and updates["is_active"] is not None:
        connection.is_active = updates["is_active"]


def _deactivate_other_jira_connections(
    session: Session,
    tenant_id: uuid.UUID,
    active_connection_id: uuid.UUID,
) -> None:
    connections = session.exec(
        select(JiraConnection).where(
            JiraConnection.tenant_id == tenant_id,
            JiraConnection.id != active_connection_id,
            JiraConnection.is_active.is_(True),
        )
    ).all()
    for connection in connections:
        connection.is_active = False
        connection.updated_at = utc_now()
        session.add(connection)


def _jira_connection_test_result(connection: JiraConnection) -> tuple[str, str]:
    missing_fields = []
    if connection.credential_status != "configured":
        missing_fields.append("API token")
    if not connection.auth_email and connection.auth_type == "api_token":
        missing_fields.append("auth email")
    if not connection.default_project_key:
        missing_fields.append("project key")
    if not connection.default_issue_type:
        missing_fields.append("issue type")

    if missing_fields:
        return (
            "configuration_error",
            f"Missing Jira configuration: {', '.join(missing_fields)}.",
        )
    return (
        "ready_for_client",
        "Jira settings are complete; live Atlassian API testing is not implemented yet.",
    )


def _jira_connection_read(connection: JiraConnection) -> dict[str, Any]:
    return {
        **connection.model_dump(mode="json"),
        "field_mapping": connection.field_mapping_json,
        "status_mapping": connection.status_mapping_json,
    }


def _normalize_jira_base_url(value: str) -> str:
    base_url = _clean_required(value, "Base URL").rstrip("/")
    if not base_url.startswith(("https://", "http://")):
        raise HTTPException(status_code=400, detail="Jira base URL must start with http or https.")
    return base_url


def _normalize_project_key(value: str) -> str:
    return _clean_required(value, "Project key").upper()


def _clean_required(value: str, field_name: str) -> str:
    cleaned = value.strip()
    if not cleaned:
        raise HTTPException(status_code=400, detail=f"{field_name} is required.")
    return cleaned


def _clean_optional(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None


def _clean_mapping(mapping: dict[str, str]) -> dict[str, str]:
    return {
        key.strip(): value.strip()
        for key, value in mapping.items()
        if key.strip() and value.strip()
    }


def _credential_status_from_token(
    token: str | None,
    current_status: str = "missing",
) -> str:
    if token is None:
        return current_status
    return "configured" if token.strip() else "missing"
