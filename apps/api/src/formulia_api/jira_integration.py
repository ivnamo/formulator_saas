from __future__ import annotations

import uuid
from datetime import datetime
from io import BytesIO
from typing import Any, Callable

from fastapi import Depends, FastAPI, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select

from . import jira_oauth
from .database import get_session
from .iso_design import upsert_iso_design_trial_from_review
from .jira_client import (
    JIRA_API_TOKEN_CREDENTIAL_KEY,
    JiraClientError,
    JiraConfigurationError,
    JiraIssueResult,
    build_jira_issue_payload,
    check_jira_connection,
    make_jira_client,
)
from .jira_excel import JIRA_REVIEW_EXCEL_TYPE, JiraReviewExcel, build_jira_review_excel
from .models import (
    Formula,
    FormulaCalculationResult,
    FormulaItem,
    FormulaReviewArtifact,
    FormulaReviewRequest,
    IntegrationEvent,
    JiraConnection,
    RawMaterial,
    utc_now,
)
from .schemas import (
    FormulaJiraReviewCreate,
    FormulaReviewArtifactRead,
    FormulaReviewRequestRead,
    JiraConnectionCreate,
    JiraConnectionRead,
    JiraConnectionTestRead,
    JiraFieldMetadataRead,
    JiraIssueTypeMetadataRead,
    JiraOAuthAuthorizeRead,
    JiraOAuthCallbackCreate,
    JiraOAuthCallbackRead,
    JiraProjectMetadataRead,
    JiraConnectionUpdate,
)
from .tenant import TenantContext, require_tenant_context

def register_jira_routes(app: FastAPI) -> None:
    @app.get(
        "/api/v1/integrations/jira/oauth/authorize-url",
        response_model=JiraOAuthAuthorizeRead,
    )
    def get_jira_oauth_authorize_url(
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, str]:
        _require_integration_admin(tenant)
        try:
            authorization_url, state = jira_oauth.build_jira_oauth_authorization_url(tenant)
        except jira_oauth.JiraOAuthError as exc:
            raise HTTPException(status_code=503, detail=str(exc)) from exc
        return {"authorization_url": authorization_url, "state": state}

    @app.post(
        "/api/v1/integrations/jira/oauth/callback",
        response_model=JiraOAuthCallbackRead,
    )
    def complete_jira_oauth_callback(
        payload: JiraOAuthCallbackCreate,
    ) -> dict[str, Any]:
        try:
            result = jira_oauth.complete_jira_oauth_callback(payload.code, payload.state)
        except jira_oauth.JiraOAuthError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        return {
            "status": "connected",
            "cloud_id": result.cloud_id,
            "site_url": result.site_url,
            "expires_at": result.expires_at,
            "scope": result.scope,
        }

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
        _record_integration_event(
            session,
            tenant.tenant_id,
            entity_type="jira_connection",
            entity_id=connection.id,
            event_type="connection_test",
            status="success" if status == "ready_for_client" else "error",
            payload_summary={
                "test_status": status,
                "project_key": connection.default_project_key,
                "issue_type": connection.default_issue_type,
            },
            error_message=None if status == "ready_for_client" else message,
        )
        session.commit()
        return {
            "connection_id": connection.id,
            "status": status,
            "message": message,
            "checked_at": checked_at,
        }

    @app.get(
        "/api/v1/integrations/jira/{connection_id}/projects",
        response_model=list[JiraProjectMetadataRead],
    )
    def list_jira_projects(
        connection_id: uuid.UUID,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> list[dict[str, Any]]:
        _require_integration_admin(tenant)
        connection = _get_jira_connection(session, tenant.tenant_id, connection_id)
        return _jira_metadata_or_http(lambda: _jira_projects(connection))

    @app.get(
        "/api/v1/integrations/jira/{connection_id}/issue-types",
        response_model=list[JiraIssueTypeMetadataRead],
    )
    def list_jira_issue_types(
        connection_id: uuid.UUID,
        project_key: str | None = Query(default=None),
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> list[dict[str, Any]]:
        _require_integration_admin(tenant)
        connection = _get_jira_connection(session, tenant.tenant_id, connection_id)
        return _jira_metadata_or_http(
            lambda: _jira_issue_types(connection, project_key or connection.default_project_key)
        )

    @app.get(
        "/api/v1/integrations/jira/{connection_id}/fields",
        response_model=list[JiraFieldMetadataRead],
    )
    def list_jira_fields(
        connection_id: uuid.UUID,
        project_key: str | None = Query(default=None),
        issue_type: str | None = Query(default=None),
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> list[dict[str, Any]]:
        _require_integration_admin(tenant)
        connection = _get_jira_connection(session, tenant.tenant_id, connection_id)
        return _jira_metadata_or_http(
            lambda: _jira_fields(
                connection,
                project_key or connection.default_project_key,
                issue_type or connection.default_issue_type,
            )
        )

    @app.get(
        "/api/v1/formulas/{formula_id}/reviews",
        response_model=list[FormulaReviewRequestRead],
    )
    def list_formula_review_requests(
        formula_id: uuid.UUID,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> list[dict[str, Any]]:
        _get_formula(session, tenant.tenant_id, formula_id)
        requests = session.exec(
            select(FormulaReviewRequest)
            .where(
                FormulaReviewRequest.tenant_id == tenant.tenant_id,
                FormulaReviewRequest.formula_id == formula_id,
            )
            .order_by(FormulaReviewRequest.created_at.desc())
        ).all()
        return [_formula_review_request_read(request) for request in requests]

    @app.post(
        "/api/v1/formulas/{formula_id}/reviews/jira",
        response_model=FormulaReviewRequestRead,
        status_code=201,
    )
    def create_formula_jira_review_request(
        formula_id: uuid.UUID,
        payload: FormulaJiraReviewCreate,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        _require_formula_reviewer(tenant)
        formula = _get_formula(session, tenant.tenant_id, formula_id)
        connection = _get_active_jira_connection(session, tenant.tenant_id)
        items = _formula_items(session, tenant.tenant_id, formula.id)
        if not items:
            raise HTTPException(
                status_code=400,
                detail="Formula needs at least one line before Jira review.",
            )
        _validate_formula_jira_ready(formula, connection)
        review = FormulaReviewRequest(
            tenant_id=tenant.tenant_id,
            formula_id=formula.id,
            formula_version=formula.version,
            jira_connection_id=connection.id,
            review_status="ready_for_jira",
            sent_by_user_id=tenant.user_id,
            snapshot_json=_formula_jira_snapshot(
                session,
                tenant.tenant_id,
                formula,
                items,
                connection,
                notes=payload.notes,
                design_project_id=payload.design_project_id,
                iso_trial_number=payload.iso_trial_number,
                iso_reason_comment=payload.iso_reason_comment,
            ),
        )
        session.add(review)
        _upsert_iso_trial_for_review_if_configured(
            session,
            tenant,
            review,
            trial_number=payload.iso_trial_number,
            reason_comment=payload.iso_reason_comment,
        )
        session.commit()
        session.refresh(review)
        return _formula_review_request_read(review)

    @app.get(
        "/api/v1/formula-reviews/{review_id}/artifacts",
        response_model=list[FormulaReviewArtifactRead],
    )
    def list_formula_review_artifacts(
        review_id: uuid.UUID,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> list[dict[str, Any]]:
        _get_formula_review_request(session, tenant.tenant_id, review_id)
        artifacts = session.exec(
            select(FormulaReviewArtifact)
            .where(
                FormulaReviewArtifact.tenant_id == tenant.tenant_id,
                FormulaReviewArtifact.review_request_id == review_id,
            )
            .order_by(FormulaReviewArtifact.created_at.desc())
        ).all()
        return [_formula_review_artifact_read(artifact) for artifact in artifacts]

    @app.post(
        "/api/v1/formula-reviews/{review_id}/artifacts/excel",
        response_model=FormulaReviewArtifactRead,
        status_code=201,
    )
    def create_formula_review_excel_artifact(
        review_id: uuid.UUID,
        response: Response,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        _require_formula_reviewer(tenant)
        review = _get_formula_review_request(session, tenant.tenant_id, review_id)
        existing = _existing_review_artifact(session, tenant.tenant_id, review.id)
        if existing is not None:
            response.status_code = 200
            return _formula_review_artifact_read(existing)

        artifact = _create_review_excel_artifact(session, tenant.tenant_id, review)
        return _formula_review_artifact_read(artifact)

    @app.get("/api/v1/formula-review-artifacts/{artifact_id}/download")
    def download_formula_review_artifact(
        artifact_id: uuid.UUID,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> StreamingResponse:
        artifact = _get_formula_review_artifact(session, tenant.tenant_id, artifact_id)
        return StreamingResponse(
            BytesIO(artifact.content),
            media_type=artifact.content_type,
            headers={
                "Content-Disposition": f'attachment; filename="{artifact.file_name}"',
            },
        )

    @app.post(
        "/api/v1/formula-reviews/{review_id}/jira/send",
        response_model=FormulaReviewRequestRead,
    )
    def send_formula_review_to_jira(
        review_id: uuid.UUID,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        _require_formula_reviewer(tenant)
        review = _get_formula_review_request(session, tenant.tenant_id, review_id)
        if review.jira_issue_key:
            raise HTTPException(status_code=409, detail="Formula review is already sent to Jira.")

        connection = _get_jira_connection(
            session,
            tenant.tenant_id,
            review.jira_connection_id,
        )
        _validate_review_snapshot_jira_ready(review.snapshot_json, connection)
        try:
            jira_client = make_jira_client(connection)
            payload = _validated_jira_issue_payload(
                review.snapshot_json,
                connection,
                jira_client,
            )
            artifact = _ensure_review_excel_artifact(session, tenant.tenant_id, review)
            issue = jira_client.create_issue(payload)
        except JiraConfigurationError as exc:
            _record_integration_event(
                session,
                tenant.tenant_id,
                entity_type="formula_review_request",
                entity_id=review.id,
                event_type="jira_issue_create",
                status="error",
                payload_summary={"formula_id": str(review.formula_id)},
                error_message=str(exc),
            )
            session.commit()
            raise HTTPException(status_code=503, detail=str(exc)) from exc
        except JiraClientError as exc:
            _record_integration_event(
                session,
                tenant.tenant_id,
                entity_type="formula_review_request",
                entity_id=review.id,
                event_type="jira_issue_create",
                status="error",
                payload_summary={"formula_id": str(review.formula_id)},
                error_message=str(exc),
            )
            session.commit()
            raise HTTPException(status_code=502, detail=str(exc)) from exc

        sent_at = utc_now()
        try:
            jira_client.add_attachment(issue.key, _excel_from_artifact(artifact))
        except JiraClientError as exc:
            _mark_review_jira_sent(
                review,
                issue,
                sent_at=sent_at,
                sent_by_user_id=tenant.user_id,
                review_status="partial_failure",
                jira_status="attachment_failed",
            )
            _record_integration_event(
                session,
                tenant.tenant_id,
                entity_type="formula_review_request",
                entity_id=review.id,
                event_type="jira_attachment_upload",
                status="error",
                payload_summary={
                    "jira_issue_key": issue.key,
                    "artifact_id": str(artifact.id),
                    "file_name": artifact.file_name,
                },
                error_message=str(exc),
            )
            session.add(review)
            _upsert_iso_trial_for_review_if_configured(session, tenant, review)
            session.commit()
            session.refresh(review)
            return _formula_review_request_read(review)

        _mark_review_jira_sent(
            review,
            issue,
            sent_at=sent_at,
            sent_by_user_id=tenant.user_id,
            review_status="sent_to_jira",
            jira_status=issue.status,
        )
        _upsert_iso_trial_for_review_if_configured(session, tenant, review)
        _record_integration_event(
            session,
            tenant.tenant_id,
            entity_type="formula_review_request",
            entity_id=review.id,
            event_type="jira_review_send",
            status="success",
            payload_summary={
                "jira_issue_key": issue.key,
                "jira_issue_url": issue.url,
                "artifact_id": str(artifact.id),
                "file_name": artifact.file_name,
            },
        )
        session.add(review)
        session.commit()
        session.refresh(review)
        return _formula_review_request_read(review)

    @app.post(
        "/api/v1/formula-reviews/{review_id}/jira/retry-attachment",
        response_model=FormulaReviewRequestRead,
    )
    def retry_formula_review_jira_attachment(
        review_id: uuid.UUID,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        _require_formula_reviewer(tenant)
        review = _get_formula_review_request(session, tenant.tenant_id, review_id)
        if not review.jira_issue_key:
            raise HTTPException(
                status_code=409,
                detail="Jira issue is required before retrying the Excel attachment.",
            )
        if review.review_status != "partial_failure" or review.jira_status != "attachment_failed":
            raise HTTPException(
                status_code=409,
                detail="Only reviews with failed Jira attachments can be retried.",
            )

        connection = _get_jira_connection(session, tenant.tenant_id, review.jira_connection_id)
        artifact = _ensure_review_excel_artifact(session, tenant.tenant_id, review)
        try:
            jira_client = make_jira_client(connection)
            jira_client.add_attachment(review.jira_issue_key, _excel_from_artifact(artifact))
        except JiraConfigurationError as exc:
            _record_integration_event(
                session,
                tenant.tenant_id,
                entity_type="formula_review_request",
                entity_id=review.id,
                event_type="jira_attachment_retry",
                status="error",
                payload_summary={
                    "jira_issue_key": review.jira_issue_key,
                    "artifact_id": str(artifact.id),
                },
                error_message=str(exc),
            )
            session.commit()
            raise HTTPException(status_code=503, detail=str(exc)) from exc
        except JiraClientError as exc:
            _record_integration_event(
                session,
                tenant.tenant_id,
                entity_type="formula_review_request",
                entity_id=review.id,
                event_type="jira_attachment_retry",
                status="error",
                payload_summary={
                    "jira_issue_key": review.jira_issue_key,
                    "artifact_id": str(artifact.id),
                    "file_name": artifact.file_name,
                },
                error_message=str(exc),
            )
            session.commit()
            raise HTTPException(status_code=502, detail=str(exc)) from exc

        checked_at = utc_now()
        review.review_status = "sent_to_jira"
        review.jira_status = "created"
        review.last_sync_at = checked_at
        _upsert_iso_trial_for_review_if_configured(session, tenant, review)
        _record_integration_event(
            session,
            tenant.tenant_id,
            entity_type="formula_review_request",
            entity_id=review.id,
            event_type="jira_attachment_retry",
            status="success",
            payload_summary={
                "jira_issue_key": review.jira_issue_key,
                "artifact_id": str(artifact.id),
                "file_name": artifact.file_name,
            },
        )
        session.add(review)
        session.commit()
        session.refresh(review)
        return _formula_review_request_read(review)

    @app.post(
        "/api/v1/formula-reviews/{review_id}/sync",
        response_model=FormulaReviewRequestRead,
    )
    def sync_formula_review_from_jira(
        review_id: uuid.UUID,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        _require_formula_reviewer(tenant)
        review = _get_formula_review_request(session, tenant.tenant_id, review_id)
        if not review.jira_issue_key:
            raise HTTPException(
                status_code=409,
                detail="Formula review must be sent to Jira before sync.",
            )

        connection = _get_jira_connection(session, tenant.tenant_id, review.jira_connection_id)
        transition_names: list[str] = []
        transition_error: str | None = None
        try:
            jira_client = make_jira_client(connection)
            issue = jira_client.get_issue(
                review.jira_issue_key,
                fields=_jira_issue_sync_fields(connection),
            )
            try:
                transitions = jira_client.get_issue_transitions(review.jira_issue_key)
                transition_names = _jira_transition_names(transitions)
            except JiraClientError as exc:
                transition_error = str(exc)
            jira_status = _jira_issue_status_name(issue)
            technical_result = _jira_issue_technical_result(issue, connection)
            normalized_technical_result = _normalize_jira_technical_result(technical_result)
        except JiraConfigurationError as exc:
            _record_jira_sync_error(session, tenant.tenant_id, review, str(exc))
            session.commit()
            raise HTTPException(status_code=503, detail=str(exc)) from exc
        except JiraClientError as exc:
            _record_jira_sync_error(session, tenant.tenant_id, review, str(exc))
            session.commit()
            raise HTTPException(status_code=502, detail=str(exc)) from exc

        synced_at = utc_now()
        was_mapped = jira_status in connection.status_mapping_json
        mapped_status = _mapped_review_status(
            connection.status_mapping_json,
            jira_status,
            fallback=review.review_status,
        )
        review.jira_status = jira_status
        review.review_status = mapped_status
        review.last_sync_at = synced_at
        if technical_result:
            _store_review_snapshot_technical_result(
                review,
                raw_result=technical_result,
                normalized_result=normalized_technical_result,
            )
        payload_summary: dict[str, Any] = {
            "jira_issue_key": review.jira_issue_key,
            "jira_status": jira_status,
            "review_status": mapped_status,
            "mapped": was_mapped,
            "available_transitions": transition_names,
        }
        if technical_result:
            payload_summary["jira_technical_result"] = technical_result
            payload_summary["technical_result"] = normalized_technical_result
        if transition_error:
            payload_summary["transition_error"] = transition_error
        _upsert_iso_trial_for_review_if_configured(session, tenant, review)
        _record_integration_event(
            session,
            tenant.tenant_id,
            entity_type="formula_review_request",
            entity_id=review.id,
            event_type="jira_status_sync",
            status="success",
            payload_summary=payload_summary,
        )
        session.add(review)
        session.commit()
        session.refresh(review)
        return _formula_review_request_read(review)


def _require_integration_admin(tenant: TenantContext) -> None:
    if tenant.role not in {"owner", "admin"}:
        raise HTTPException(status_code=403, detail="Admin role is required.")


def _require_formula_reviewer(tenant: TenantContext) -> None:
    if tenant.role not in {"owner", "admin", "formulator"}:
        raise HTTPException(status_code=403, detail="Formula review role is required.")


def _validate_formula_jira_ready(formula: Formula, connection: JiraConnection) -> None:
    _validate_jira_formula_fields(
        field_mapping=connection.field_mapping_json,
        jira_project_id=formula.jira_project_id,
        jira_issue_type=formula.jira_issue_type,
        jira_product_type=formula.jira_product_type,
    )


def _validate_review_snapshot_jira_ready(
    snapshot: dict[str, Any],
    connection: JiraConnection,
) -> None:
    formula = snapshot.get("formula") if isinstance(snapshot.get("formula"), dict) else {}
    _validate_jira_formula_fields(
        field_mapping=connection.field_mapping_json,
        jira_project_id=formula.get("jira_project_id"),
        jira_issue_type=formula.get("jira_issue_type"),
        jira_product_type=formula.get("jira_product_type"),
    )


def _validate_jira_formula_fields(
    *,
    field_mapping: dict[str, str],
    jira_project_id: Any,
    jira_issue_type: Any,
    jira_product_type: Any,
) -> None:
    issue_type = str(jira_issue_type or "").strip()
    if not issue_type:
        raise HTTPException(status_code=400, detail="Jira activity is required before sending.")


def _validated_jira_issue_payload(
    snapshot: dict[str, Any],
    connection: JiraConnection,
    jira_client: Any,
) -> dict[str, Any]:
    project_key = _normalize_project_key(connection.default_project_key)
    issue_type = _snapshot_jira_issue_type(snapshot, connection)
    issue_type_metadata = _resolve_jira_issue_type(jira_client, project_key, issue_type)
    create_metadata = jira_client.get_create_issue_fields(project_key, issue_type_metadata["id"])
    create_fields = _jira_create_field_metadata(create_metadata)
    payload = build_jira_issue_payload(snapshot, connection)
    fields = dict(payload["fields"])
    fields["project"] = {"key": project_key}
    fields["issuetype"] = {"name": issue_type_metadata["name"]}
    fields = _filter_jira_payload_fields(fields, create_fields)
    _validate_required_jira_payload_fields(fields, create_fields, issue_type_metadata["name"])
    _validate_jira_payload_field_values(fields, create_fields, issue_type_metadata["name"])
    return {"fields": fields}


def _snapshot_jira_issue_type(snapshot: dict[str, Any], connection: JiraConnection) -> str:
    jira = _mapping(snapshot.get("jira"))
    formula = _mapping(snapshot.get("formula"))
    issue_type = str(
        jira.get("issue_type") or formula.get("jira_issue_type") or connection.default_issue_type
    ).strip()
    if not issue_type:
        raise HTTPException(status_code=400, detail="Jira issue type is required before sending.")
    return issue_type


def _resolve_jira_issue_type(
    jira_client: Any,
    project_key: str,
    requested_issue_type: str,
) -> dict[str, Any]:
    project = jira_client.get_project(project_key)
    issue_types = [
        issue_type
        for issue_type in (
            _jira_issue_type_read(item) for item in _sequence(project.get("issueTypes"))
        )
        if issue_type["id"] and issue_type["name"] and not issue_type["subtask"]
    ]
    requested = requested_issue_type.casefold()
    issue_type = next(
        (
            item
            for item in issue_types
            if item["id"] == requested_issue_type or item["name"].casefold() == requested
        ),
        None,
    )
    if issue_type is None:
        available = ", ".join(item["name"] for item in issue_types) or "none"
        raise HTTPException(
            status_code=400,
            detail=(
                f"Jira issue type {requested_issue_type!r} is not available in project "
                f"{project_key}. Available issue types: {available}."
            ),
        )
    return issue_type


def _jira_create_field_metadata(metadata: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        {
            "field_id": str(field.get("fieldId") or field.get("id") or ""),
            "name": str(field.get("name") or field.get("fieldId") or field.get("id") or ""),
            "required": bool(field.get("required")),
            "has_default": bool(field.get("hasDefaultValue")),
            "schema_type": _optional_str(_mapping(field.get("schema")).get("type")),
            "allowed_values": _jira_allowed_values(field.get("allowedValues")),
        }
        for field in _jira_raw_create_fields(metadata)
        if field.get("fieldId") or field.get("id")
    ]


def _jira_raw_create_fields(metadata: dict[str, Any]) -> list[dict[str, Any]]:
    fields = metadata.get("fields")
    if isinstance(fields, dict):
        return [
            {**field, "fieldId": field.get("fieldId") or field_id}
            for field_id, field in fields.items()
            if isinstance(field, dict)
        ]
    if isinstance(fields, list):
        return [field for field in fields if isinstance(field, dict)]
    return []


def _filter_jira_payload_fields(
    fields: dict[str, Any],
    create_fields: list[dict[str, Any]],
) -> dict[str, Any]:
    allowed_field_ids = {field["field_id"] for field in create_fields}
    if not allowed_field_ids:
        return fields
    return {
        field_id: value
        for field_id, value in fields.items()
        if field_id in allowed_field_ids
    }


def _validate_required_jira_payload_fields(
    fields: dict[str, Any],
    create_fields: list[dict[str, Any]],
    issue_type: str,
) -> None:
    missing = [
        field["name"]
        for field in create_fields
        if field["required"]
        and not field["has_default"]
        and _jira_payload_value_is_empty(fields.get(field["field_id"]))
    ]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Jira issue type {issue_type!r} requires fields before sending: "
                f"{', '.join(missing)}."
            ),
        )


def _validate_jira_payload_field_values(
    fields: dict[str, Any],
    create_fields: list[dict[str, Any]],
    issue_type: str,
) -> None:
    metadata_by_id = {field["field_id"]: field for field in create_fields}
    for field_id, value in fields.items():
        metadata = metadata_by_id.get(field_id)
        if metadata is None or not metadata["allowed_values"]:
            continue
        candidate = _jira_payload_allowed_value_label(value)
        if candidate is None:
            continue
        allowed = {
            label.casefold()
            for raw_value in metadata["allowed_values"]
            for label in (
                raw_value.get("value"),
                raw_value.get("name"),
                raw_value.get("key"),
                raw_value.get("id"),
            )
            if label
        }
        if allowed and candidate.casefold() not in allowed:
            allowed_values = ", ".join(
                str(raw_value.get("value") or raw_value.get("name") or raw_value.get("key") or raw_value.get("id"))
                for raw_value in metadata["allowed_values"]
                if raw_value.get("value") or raw_value.get("name") or raw_value.get("key") or raw_value.get("id")
            )
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Jira field {metadata['name']!r} value {candidate!r} is not allowed "
                    f"for issue type {issue_type!r}. Allowed values: {allowed_values}."
                ),
            )


def _jira_payload_value_is_empty(value: Any) -> bool:
    if value is None:
        return True
    if isinstance(value, str):
        return not value.strip()
    if isinstance(value, dict):
        return all(_jira_payload_value_is_empty(item) for item in value.values())
    if isinstance(value, list):
        return not value
    return False


def _jira_payload_allowed_value_label(value: Any) -> str | None:
    if isinstance(value, dict):
        for key in ("value", "name", "key", "id"):
            candidate = value.get(key)
            if candidate is not None:
                return str(candidate)
        return None
    if isinstance(value, str):
        return value
    return None


def _jira_issue_status_name(issue: dict[str, Any]) -> str:
    status = _mapping(_mapping(issue.get("fields")).get("status"))
    name = _optional_str(status.get("name"))
    if name:
        return name
    status = _mapping(issue.get("status"))
    name = _optional_str(status.get("name"))
    if name:
        return name
    raise JiraClientError("Jira issue did not include a status.")


def _jira_issue_sync_fields(connection: JiraConnection) -> str:
    fields = ["status", "summary"]
    technical_result_field = connection.field_mapping_json.get("technical_result")
    if technical_result_field:
        fields.append(technical_result_field)
    return ",".join(fields)


def _jira_issue_technical_result(
    issue: dict[str, Any],
    connection: JiraConnection,
) -> str | None:
    field_id = connection.field_mapping_json.get("technical_result")
    if not field_id:
        return None
    return _jira_issue_field_label(issue, field_id)


def _jira_issue_field_label(issue: dict[str, Any], field_id: str) -> str | None:
    value = _mapping(issue.get("fields")).get(field_id)
    if isinstance(value, dict):
        for key in ("value", "name", "key", "id"):
            candidate = value.get(key)
            if candidate is not None:
                return str(candidate)
        return None
    if isinstance(value, str):
        stripped = value.strip()
        return stripped or None
    return None


def _normalize_jira_technical_result(value: str | None) -> str | None:
    if not value:
        return None
    normalized = value.strip().casefold()
    return {
        "liberado": "LIBERADO",
        "ok no liberado": "OK_NO_LIBERADO",
        "nok tecnico": "NOK",
        "nok técnico": "NOK",
        "iterado": "ITERADO",
        "abandonado": "ABANDONADO",
        "cancelado administrativo": "CANCELADO",
    }.get(normalized, "pending_mapping")


def _store_review_snapshot_technical_result(
    review: FormulaReviewRequest,
    *,
    raw_result: str,
    normalized_result: str | None,
) -> None:
    snapshot = dict(review.snapshot_json)
    jira = dict(_mapping(snapshot.get("jira")))
    jira["technical_result_raw"] = raw_result
    jira["technical_result"] = normalized_result
    snapshot["jira"] = jira
    review.snapshot_json = snapshot


def _jira_transition_names(transitions: dict[str, Any]) -> list[str]:
    return [
        name
        for name in (
            _optional_str(transition.get("name"))
            for transition in _sequence(transitions.get("transitions"))
            if isinstance(transition, dict)
        )
        if name
    ]


def _mapped_review_status(
    status_mapping: dict[str, str],
    jira_status: str,
    *,
    fallback: str,
) -> str:
    return status_mapping.get(jira_status, fallback)


def _record_jira_sync_error(
    session: Session,
    tenant_id: uuid.UUID,
    review: FormulaReviewRequest,
    error_message: str,
) -> None:
    _record_integration_event(
        session,
        tenant_id,
        entity_type="formula_review_request",
        entity_id=review.id,
        event_type="jira_status_sync",
        status="error",
        payload_summary={"jira_issue_key": review.jira_issue_key},
        error_message=error_message,
    )


def _upsert_iso_trial_for_review_if_configured(
    session: Session,
    tenant: TenantContext,
    review: FormulaReviewRequest,
    *,
    trial_number: int | None = None,
    reason_comment: str | None = None,
) -> None:
    design_project_id = _review_iso_design_project_id(review)
    if design_project_id is None:
        return
    iso = _mapping(_mapping(review.snapshot_json).get("iso"))
    upsert_iso_design_trial_from_review(
        session,
        tenant,
        design_project_id=design_project_id,
        review=review,
        trial_number=trial_number if trial_number is not None else _optional_int(iso.get("trial_number")),
        reason_comment=reason_comment or _optional_str(iso.get("reason_comment")),
    )


def _review_iso_design_project_id(review: FormulaReviewRequest) -> uuid.UUID | None:
    iso = _mapping(_mapping(review.snapshot_json).get("iso"))
    raw_project_id = _optional_str(iso.get("design_project_id"))
    if raw_project_id is None:
        return None
    try:
        return uuid.UUID(raw_project_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail="ISO design project id in the review snapshot is invalid.",
        ) from exc


def _optional_int(value: Any) -> int | None:
    if value is None or value == "":
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _record_integration_event(
    session: Session,
    tenant_id: uuid.UUID,
    *,
    entity_type: str,
    entity_id: uuid.UUID,
    event_type: str,
    status: str,
    payload_summary: dict[str, Any] | None = None,
    error_message: str | None = None,
) -> None:
    session.add(
        IntegrationEvent(
            tenant_id=tenant_id,
            integration_type="jira",
            entity_type=entity_type,
            entity_id=entity_id,
            event_type=event_type,
            status=status,
            payload_summary=payload_summary or {},
            error_message=error_message,
        )
    )


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


def _get_active_jira_connection(session: Session, tenant_id: uuid.UUID) -> JiraConnection:
    connection = session.exec(
        select(JiraConnection)
        .where(
            JiraConnection.tenant_id == tenant_id,
            JiraConnection.is_active.is_(True),
        )
        .order_by(JiraConnection.created_at.desc())
    ).first()
    if connection is None:
        raise HTTPException(status_code=409, detail="Active Jira connection is required.")
    return connection


def _get_formula(session: Session, tenant_id: uuid.UUID, formula_id: uuid.UUID) -> Formula:
    formula = session.exec(
        select(Formula).where(Formula.id == formula_id, Formula.tenant_id == tenant_id)
    ).first()
    if formula is None:
        raise HTTPException(status_code=404, detail="Formula not found.")
    return formula


def _get_formula_review_request(
    session: Session,
    tenant_id: uuid.UUID,
    review_id: uuid.UUID,
) -> FormulaReviewRequest:
    review = session.exec(
        select(FormulaReviewRequest).where(
            FormulaReviewRequest.id == review_id,
            FormulaReviewRequest.tenant_id == tenant_id,
        )
    ).first()
    if review is None:
        raise HTTPException(status_code=404, detail="Formula review request not found.")
    return review


def _get_formula_review_artifact(
    session: Session,
    tenant_id: uuid.UUID,
    artifact_id: uuid.UUID,
) -> FormulaReviewArtifact:
    artifact = session.exec(
        select(FormulaReviewArtifact).where(
            FormulaReviewArtifact.id == artifact_id,
            FormulaReviewArtifact.tenant_id == tenant_id,
        )
    ).first()
    if artifact is None:
        raise HTTPException(status_code=404, detail="Formula review artifact not found.")
    return artifact


def _new_jira_connection(
    tenant_id: uuid.UUID,
    payload: JiraConnectionCreate,
) -> JiraConnection:
    return JiraConnection(
        tenant_id=tenant_id,
        base_url=_normalize_jira_base_url(payload.base_url),
        auth_type=payload.auth_type,
        auth_email=_clean_optional(payload.auth_email),
        credential_status=_credential_status_from_token(
            payload.api_token,
            auth_type=payload.auth_type,
        ),
        credential_json=_jira_credential_json(payload.api_token, auth_type=payload.auth_type),
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
        if connection.auth_type == "oauth" and "api_token" not in updates:
            connection.credential_status = "external"
    if "auth_email" in updates:
        connection.auth_email = _clean_optional(updates["auth_email"])
    if "api_token" in updates:
        connection.credential_status = _credential_status_from_token(
            updates["api_token"],
            current_status=connection.credential_status,
            auth_type=connection.auth_type,
        )
        _set_jira_api_token(connection, updates["api_token"])
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
    if connection.auth_type == "oauth":
        if not connection.default_project_key:
            missing_fields.append("project key")
        if not connection.default_issue_type:
            missing_fields.append("issue type")
        if not connection.base_url:
            missing_fields.append("base URL")
        if missing_fields:
            return (
                "configuration_error",
                f"Missing Jira configuration: {', '.join(missing_fields)}.",
            )
        return _live_jira_connection_test_result(connection)

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
    return _live_jira_connection_test_result(connection)


def _live_jira_connection_test_result(connection: JiraConnection) -> tuple[str, str]:
    try:
        result = check_jira_connection(connection)
    except JiraConfigurationError as exc:
        return "configuration_error", str(exc)
    except JiraClientError as exc:
        return "connection_error", str(exc)
    return result.status, result.message


def _jira_metadata_or_http(action: Callable[[], Any]) -> Any:
    try:
        return action()
    except JiraConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except JiraClientError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


def _jira_projects(connection: JiraConnection) -> list[dict[str, Any]]:
    response = make_jira_client(connection).list_projects()
    projects = response.get("values")
    if not isinstance(projects, list):
        projects = []
    return [
        {
            "id": str(project.get("id")) if project.get("id") is not None else None,
            "key": str(project.get("key") or ""),
            "name": str(project.get("name") or project.get("key") or ""),
            "project_type_key": _optional_str(project.get("projectTypeKey")),
            "simplified": (
                project.get("simplified") if isinstance(project.get("simplified"), bool) else None
            ),
        }
        for project in projects
        if isinstance(project, dict) and project.get("key")
    ]


def _jira_issue_types(connection: JiraConnection, project_key: str) -> list[dict[str, Any]]:
    project = make_jira_client(connection).get_project(_normalize_project_key(project_key))
    issue_types = [
        _jira_issue_type_read(issue_type)
        for issue_type in _sequence(project.get("issueTypes"))
    ]
    return [issue_type for issue_type in issue_types if issue_type["id"] and issue_type["name"]]


def _jira_fields(
    connection: JiraConnection,
    project_key: str,
    issue_type: str,
) -> list[dict[str, Any]]:
    normalized_project_key = _normalize_project_key(project_key)
    requested_issue_type = _clean_required(issue_type, "Issue type")
    client = make_jira_client(connection)
    project = client.get_project(normalized_project_key)
    issue_types = [_jira_issue_type_read(item) for item in _sequence(project.get("issueTypes"))]
    issue_type_metadata = next(
        (
            item
            for item in issue_types
            if item["id"] == requested_issue_type or item["name"] == requested_issue_type
        ),
        None,
    )
    if issue_type_metadata is None:
        raise JiraClientError(
            f"Jira issue type {requested_issue_type!r} is not available in project {normalized_project_key}."
        )
    metadata = client.get_create_issue_fields(normalized_project_key, issue_type_metadata["id"])
    return _jira_field_reads(metadata)


def _jira_issue_type_read(issue_type: Any) -> dict[str, Any]:
    if not isinstance(issue_type, dict):
        return {"id": "", "name": "", "description": None, "subtask": False}
    return {
        "id": str(issue_type.get("id") or ""),
        "name": str(issue_type.get("name") or ""),
        "description": _optional_str(issue_type.get("description")),
        "subtask": bool(issue_type.get("subtask")),
    }


def _jira_field_reads(metadata: dict[str, Any]) -> list[dict[str, Any]]:
    fields = metadata.get("fields")
    if isinstance(fields, dict):
        raw_fields = [
            {**field, "fieldId": field.get("fieldId") or field_id}
            for field_id, field in fields.items()
            if isinstance(field, dict)
        ]
    elif isinstance(fields, list):
        raw_fields = [field for field in fields if isinstance(field, dict)]
    else:
        raw_fields = []

    return [
        {
            "field_id": str(field.get("fieldId") or field.get("id") or ""),
            "name": str(field.get("name") or field.get("fieldId") or field.get("id") or ""),
            "required": bool(field.get("required")),
            "schema_type": _optional_str(_mapping(field.get("schema")).get("type")),
            "custom": _optional_str(_mapping(field.get("schema")).get("custom")),
            "allowed_values": _jira_allowed_values(field.get("allowedValues")),
        }
        for field in raw_fields
        if field.get("fieldId") or field.get("id")
    ]


def _jira_allowed_values(raw_values: Any) -> list[dict[str, Any]]:
    return [
        {
            "id": _optional_str(value.get("id")),
            "key": _optional_str(value.get("key")),
            "name": _optional_str(value.get("name")),
            "value": _optional_str(value.get("value")),
        }
        for value in _sequence(raw_values)
        if isinstance(value, dict)
    ]


def _jira_connection_read(connection: JiraConnection) -> dict[str, Any]:
    return {
        **connection.model_dump(mode="json"),
        "credential_json": {},
        "field_mapping": connection.field_mapping_json,
        "status_mapping": connection.status_mapping_json,
    }


def _formula_review_request_read(request: FormulaReviewRequest) -> dict[str, Any]:
    return {
        **request.model_dump(mode="json"),
        "snapshot": request.snapshot_json,
    }


def _formula_review_artifact_read(artifact: FormulaReviewArtifact) -> dict[str, Any]:
    return artifact.model_dump(
        mode="json",
        exclude={"content"},
    )


def _existing_review_artifact(
    session: Session,
    tenant_id: uuid.UUID,
    review_id: uuid.UUID,
) -> FormulaReviewArtifact | None:
    return session.exec(
        select(FormulaReviewArtifact).where(
            FormulaReviewArtifact.tenant_id == tenant_id,
            FormulaReviewArtifact.review_request_id == review_id,
            FormulaReviewArtifact.artifact_type == JIRA_REVIEW_EXCEL_TYPE,
        )
    ).first()


def _ensure_review_excel_artifact(
    session: Session,
    tenant_id: uuid.UUID,
    review: FormulaReviewRequest,
) -> FormulaReviewArtifact:
    existing = _existing_review_artifact(session, tenant_id, review.id)
    if existing is not None:
        return existing
    return _create_review_excel_artifact(session, tenant_id, review)


def _create_review_excel_artifact(
    session: Session,
    tenant_id: uuid.UUID,
    review: FormulaReviewRequest,
) -> FormulaReviewArtifact:
    excel = build_jira_review_excel(review.snapshot_json, review.id)
    artifact = FormulaReviewArtifact(
        tenant_id=tenant_id,
        review_request_id=review.id,
        artifact_type=JIRA_REVIEW_EXCEL_TYPE,
        file_name=excel.file_name,
        content_type=excel.content_type,
        checksum_sha256=excel.checksum_sha256,
        size_bytes=excel.size_bytes,
        content=excel.content,
    )
    session.add(artifact)
    session.commit()
    session.refresh(artifact)
    return artifact


def _excel_from_artifact(artifact: FormulaReviewArtifact) -> JiraReviewExcel:
    return JiraReviewExcel(
        file_name=artifact.file_name,
        content_type=artifact.content_type,
        checksum_sha256=artifact.checksum_sha256,
        size_bytes=artifact.size_bytes,
        content=artifact.content,
    )


def _mark_review_jira_sent(
    review: FormulaReviewRequest,
    issue: JiraIssueResult,
    *,
    sent_at: datetime,
    sent_by_user_id: uuid.UUID,
    review_status: str,
    jira_status: str,
) -> None:
    review.jira_issue_key = issue.key
    review.jira_issue_url = issue.url
    review.jira_status = jira_status
    review.review_status = review_status
    review.sent_by_user_id = sent_by_user_id
    review.sent_at = sent_at
    review.last_sync_at = sent_at


def _formula_items(
    session: Session,
    tenant_id: uuid.UUID,
    formula_id: uuid.UUID,
) -> list[FormulaItem]:
    return session.exec(
        select(FormulaItem)
        .where(
            FormulaItem.tenant_id == tenant_id,
            FormulaItem.formula_id == formula_id,
        )
        .order_by(FormulaItem.order_index)
    ).all()


def _formula_jira_snapshot(
    session: Session,
    tenant_id: uuid.UUID,
    formula: Formula,
    items: list[FormulaItem],
    connection: JiraConnection,
    *,
    notes: str | None,
    design_project_id: uuid.UUID | None = None,
    iso_trial_number: int | None = None,
    iso_reason_comment: str | None = None,
) -> dict[str, Any]:
    materials_by_id = _materials_by_id(session, tenant_id, [item.raw_material_id for item in items])
    latest_calculation = _latest_calculation(session, tenant_id, formula.id)
    issue_summary = f"{formula.jira_issue_type.upper()} - {formula.jira_project_id or str(formula.id)[:8]} - {formula.name}"
    snapshot: dict[str, Any] = {
        "formula": {
            "id": str(formula.id),
            "name": formula.name,
            "version": formula.version,
            "status": formula.status,
            "objective": formula.objective,
            "jira_project_id": formula.jira_project_id,
            "jira_issue_type": formula.jira_issue_type,
            "jira_product_type": formula.jira_product_type,
            "total_price": formula.total_price,
            "currency": formula.currency,
        },
        "items": [
            _snapshot_item(item, materials_by_id.get(item.raw_material_id))
            for item in items
        ],
        "latest_calculation": latest_calculation.result_json if latest_calculation else None,
        "jira": {
            "connection_id": str(connection.id),
            "base_url": connection.base_url,
            "project_key": connection.default_project_key,
            "issue_type": formula.jira_issue_type or connection.default_issue_type,
            "assignee": connection.default_assignee,
            "issue_summary": issue_summary,
        },
        "notes": _clean_optional(notes),
        "snapshot_type": "jira_formula_review_v1",
    }
    if design_project_id is not None:
        snapshot["iso"] = {
            "design_project_id": str(design_project_id),
            "trial_number": iso_trial_number,
            "reason_comment": _clean_optional(iso_reason_comment),
            "trial_intent": "f10_02_trial",
        }
    return snapshot


def _materials_by_id(
    session: Session,
    tenant_id: uuid.UUID,
    material_ids: list[uuid.UUID],
) -> dict[uuid.UUID, RawMaterial]:
    if not material_ids:
        return {}
    materials = session.exec(
        select(RawMaterial).where(
            RawMaterial.tenant_id == tenant_id,
            RawMaterial.id.in_(material_ids),
        )
    ).all()
    return {material.id: material for material in materials}


def _latest_calculation(
    session: Session,
    tenant_id: uuid.UUID,
    formula_id: uuid.UUID,
) -> FormulaCalculationResult | None:
    return session.exec(
        select(FormulaCalculationResult)
        .where(
            FormulaCalculationResult.tenant_id == tenant_id,
            FormulaCalculationResult.formula_id == formula_id,
        )
        .order_by(FormulaCalculationResult.calculated_at.desc())
    ).first()


def _snapshot_item(item: FormulaItem, material: RawMaterial | None) -> dict[str, Any]:
    return {
        "raw_material_id": str(item.raw_material_id),
        "code": material.code if material else None,
        "name": material.name if material else "Unknown material",
        "percentage": item.percentage,
        "quantity": item.quantity,
        "unit": item.unit,
        "order_index": item.order_index,
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


def _optional_str(value: Any) -> str | None:
    if value is None:
        return None
    cleaned = str(value).strip()
    return cleaned or None


def _mapping(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def _sequence(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []


def _clean_mapping(mapping: dict[str, str]) -> dict[str, str]:
    return {
        key.strip(): value.strip()
        for key, value in mapping.items()
        if key.strip() and value.strip()
    }


def _jira_credential_json(token: str | None, *, auth_type: str) -> dict[str, str]:
    if auth_type != "api_token":
        return {}
    cleaned = _clean_optional(token)
    return {JIRA_API_TOKEN_CREDENTIAL_KEY: cleaned} if cleaned else {}


def _set_jira_api_token(connection: JiraConnection, token: str | None) -> None:
    cleaned = _clean_optional(token)
    credentials = dict(connection.credential_json or {})
    if cleaned:
        credentials[JIRA_API_TOKEN_CREDENTIAL_KEY] = cleaned
    else:
        credentials.pop(JIRA_API_TOKEN_CREDENTIAL_KEY, None)
    connection.credential_json = credentials


def _credential_status_from_token(
    token: str | None,
    current_status: str = "missing",
    auth_type: str = "api_token",
) -> str:
    if auth_type == "oauth":
        return "external"
    if token is None:
        return current_status
    return "configured" if token.strip() else "missing"
