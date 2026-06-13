from __future__ import annotations

import hashlib
import json
import re
import uuid
from copy import deepcopy
from datetime import date, datetime
from io import BytesIO
from typing import Any
from zipfile import ZIP_DEFLATED, ZipFile

from fastapi import Depends, FastAPI, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from .database import get_session
from .iso_excel import (
    ISO_ZIP_CONTENT_TYPE,
    IsoGeneratedArtifact,
    build_f10_01_excel,
    build_f10_02_excel,
    build_f10_03_excel,
    build_iso_metadata_json,
    generated_binary_artifact,
)
from .iso_legacy_import import (
    IsoLegacyImport,
    IsoLegacyImportError,
    IsoLegacyImportRow,
    parse_iso_legacy_xlsx,
)
from .models import (
    FormulaReviewRequest,
    IsoDesignProject,
    IsoDesignTrial,
    IsoProductValidation,
    IsoRecordArtifact,
    IsoTenantSettings,
    utc_now,
)
from .schemas import (
    IsoDesignProjectCreate,
    IsoDesignProjectRead,
    IsoDesignProjectUpdate,
    IsoDesignTrialCreate,
    IsoDesignTrialFromReviewCreate,
    IsoDesignTrialRead,
    IsoLegacyImportApplyRead,
    IsoLegacyImportPreviewRead,
    IsoProductValidationCreate,
    IsoProductValidationRead,
    IsoProductValidationUpdate,
    IsoRecordArtifactRead,
    IsoValidationChecksUpdate,
    IsoTenantSettingsRead,
    IsoTenantSettingsUpdate,
)
from .tenant import TenantContext, require_tenant_context


def default_iso_config() -> dict[str, Any]:
    return {
        "module_version": 1,
        "formats": {
            "f10_01": {"enabled": True, "label": "F10-01"},
            "f10_02": {"enabled": True, "label": "F10-02"},
            "f10_03": {"enabled": True, "label": "F10-03"},
        },
        "jira": {
            "enabled": True,
            "project_key": "ID",
            "issue_types": {
                "prototype": "Prototipo",
                "proof_of_concept": "PoC",
                "quality": "Calidad",
                "sample": "Muestra",
            },
            "allow_poc_without_project": False,
            "allow_sample_for_validation": False,
            "technical_result_mapping": {
                "Liberado": "LIBERADO",
                "OK No Liberado": "OK_NO_LIBERADO",
                "NOK tecnico": "NOK",
                "NOK técnico": "NOK",
                "Iterado": "ITERADO",
                "Abandonado": "ABANDONADO",
                "Cancelado administrativo": "CANCELADO",
            },
        },
        "technical_results": [
            "LIBERADO",
            "OK_NO_LIBERADO",
            "NOK",
            "ITERADO",
            "ABANDONADO",
            "CANCELADO",
            "pending_result",
            "pending_mapping",
        ],
        "f10_03": {
            "allow_ok_not_released_draft": False,
            "validation_matrix": [
                {
                    "area": "I+D+i",
                    "aspect": "Formula / Funcionalidad",
                    "required": True,
                },
                {
                    "area": "Tecnico",
                    "aspect": "Validacion agronomica",
                    "required": True,
                },
                {
                    "area": "Registros",
                    "aspect": "Cumplimiento legislativo",
                    "required": True,
                },
                {
                    "area": "Produccion",
                    "aspect": "Viabilidad productiva",
                    "required": True,
                },
                {
                    "area": "Calidad",
                    "aspect": "Cumplimiento legislativo",
                    "required": True,
                },
                {
                    "area": "Calidad",
                    "aspect": "Composicion declarada",
                    "required": True,
                },
                {
                    "area": "Calidad",
                    "aspect": "Estabilidad quimica",
                    "required": True,
                },
                {
                    "area": "Marketing y/o Direccion",
                    "aspect": "Precio Tarifa",
                    "required": True,
                },
                {
                    "area": "Marketing y/o Direccion",
                    "aspect": "Lanzamiento",
                    "required": True,
                },
            ],
        },
    }


def register_iso_routes(app: FastAPI) -> None:
    @app.get("/api/v1/iso/settings", response_model=IsoTenantSettingsRead)
    def get_iso_settings(
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        settings = _ensure_iso_settings(session, tenant.tenant_id)
        return _iso_settings_read(settings)

    @app.patch("/api/v1/iso/settings", response_model=IsoTenantSettingsRead)
    def update_iso_settings(
        payload: IsoTenantSettingsUpdate,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        _require_iso_admin(tenant)
        settings = _ensure_iso_settings(session, tenant.tenant_id)
        if payload.enabled is not None:
            settings.enabled = payload.enabled
        if payload.config is not None:
            settings.config_json = _merge_iso_config(default_iso_config(), payload.config)
        if payload.config_patch is not None:
            settings.config_json = _merge_iso_config(
                _effective_iso_config(settings),
                payload.config_patch,
            )
        settings.updated_by = tenant.user_id
        settings.updated_at = utc_now()
        session.add(settings)
        session.commit()
        session.refresh(settings)
        return _iso_settings_read(settings)

    @app.get(
        "/api/v1/iso/design-projects",
        response_model=list[IsoDesignProjectRead],
    )
    def list_iso_design_projects(
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> list[dict[str, Any]]:
        _require_iso_enabled(session, tenant)
        projects = session.exec(
            select(IsoDesignProject)
            .where(IsoDesignProject.tenant_id == tenant.tenant_id)
            .order_by(IsoDesignProject.year.desc(), IsoDesignProject.iso_request_number)
        ).all()
        return [_iso_project_read(session, project) for project in projects]

    @app.post(
        "/api/v1/iso/design-projects",
        response_model=IsoDesignProjectRead,
        status_code=201,
    )
    def create_iso_design_project(
        payload: IsoDesignProjectCreate,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        _require_iso_enabled(session, tenant)
        _validate_project_state(payload.accepted_status, payload.rejection_reason)
        iso_request_number = _clean_required(payload.iso_request_number, "No Solicitud")
        year = payload.year or _derive_project_year(payload.iso_request_number)
        project_code = _clean_optional(payload.project_code)
        _ensure_no_duplicate_iso_project(
            session,
            tenant.tenant_id,
            year=year,
            iso_request_number=iso_request_number,
            project_code=project_code,
        )
        project = IsoDesignProject(
            tenant_id=tenant.tenant_id,
            iso_request_number=iso_request_number,
            year=year,
            project_code=project_code,
            requester=_clean_optional(payload.requester),
            responsible_user_id=payload.responsible_user_id,
            product_name=_clean_required(payload.product_name, "Producto"),
            commercial_name=_clean_optional(payload.commercial_name),
            need=_clean_optional(payload.need),
            product_type=_clean_optional(payload.product_type),
            destination_country=_clean_optional(payload.destination_country),
            packaging=_clean_optional(payload.packaging),
            accepted_status=_clean_status(payload.accepted_status),
            lifecycle_status=_clean_status(payload.lifecycle_status),
            rejection_reason=_clean_optional(payload.rejection_reason),
            estimated_days=payload.estimated_days,
            planned_finish_at=payload.planned_finish_at,
            finished_at=payload.finished_at,
            rd_hours=payload.rd_hours,
            quality_hours=payload.quality_hours,
            problems=_clean_optional(payload.problems),
            comments=_clean_optional(payload.comments),
            source_type=_clean_status(payload.source_type),
            source_ref=_clean_optional(payload.source_ref),
            created_by=tenant.user_id,
        )
        session.add(project)
        try:
            session.commit()
        except IntegrityError as exc:
            session.rollback()
            raise HTTPException(
                status_code=409,
                detail="An ISO design project already exists for this request and year.",
            ) from exc
        session.refresh(project)
        return _iso_project_read(session, project)

    @app.get(
        "/api/v1/iso/design-projects/{project_id}",
        response_model=IsoDesignProjectRead,
    )
    def get_iso_design_project(
        project_id: uuid.UUID,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        _require_iso_enabled(session, tenant)
        return _iso_project_read(session, _get_iso_project(session, tenant.tenant_id, project_id))

    @app.patch(
        "/api/v1/iso/design-projects/{project_id}",
        response_model=IsoDesignProjectRead,
    )
    def update_iso_design_project(
        project_id: uuid.UUID,
        payload: IsoDesignProjectUpdate,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        _require_iso_enabled(session, tenant)
        project = _get_iso_project(session, tenant.tenant_id, project_id)
        updates = payload.model_dump(exclude_unset=True)
        next_accepted_status = updates.get("accepted_status", project.accepted_status)
        next_rejection_reason = updates.get("rejection_reason", project.rejection_reason)
        _validate_project_state(next_accepted_status, next_rejection_reason)
        if "iso_request_number" in updates and updates["iso_request_number"] is not None:
            updates["iso_request_number"] = _clean_required(
                updates["iso_request_number"],
                "No Solicitud",
            )
            if "year" not in updates or updates["year"] is None:
                updates["year"] = _derive_project_year(updates["iso_request_number"])
        _ensure_no_duplicate_iso_project(
            session,
            tenant.tenant_id,
            year=updates.get("year", project.year),
            iso_request_number=updates.get("iso_request_number", project.iso_request_number),
            project_code=_clean_optional(updates.get("project_code", project.project_code)),
            exclude_project_id=project.id,
        )
        for key, value in updates.items():
            if isinstance(value, str):
                value = _clean_optional(value)
            if key in {"accepted_status", "lifecycle_status", "source_type"} and value:
                value = _clean_status(value)
            setattr(project, key, value)
        project.updated_at = utc_now()
        session.add(project)
        try:
            session.commit()
        except IntegrityError as exc:
            session.rollback()
            raise HTTPException(
                status_code=409,
                detail="An ISO design project already exists for this request and year.",
            ) from exc
        session.refresh(project)
        return _iso_project_read(session, project)

    @app.get(
        "/api/v1/iso/design-projects/{project_id}/trials",
        response_model=list[IsoDesignTrialRead],
    )
    def list_iso_design_trials(
        project_id: uuid.UUID,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> list[dict[str, Any]]:
        _require_iso_enabled(session, tenant)
        _get_iso_project(session, tenant.tenant_id, project_id)
        trials = session.exec(
            select(IsoDesignTrial)
            .where(
                IsoDesignTrial.tenant_id == tenant.tenant_id,
                IsoDesignTrial.design_project_id == project_id,
            )
            .order_by(IsoDesignTrial.trial_at, IsoDesignTrial.created_at)
        ).all()
        return [_iso_trial_read(trial) for trial in trials]

    @app.post(
        "/api/v1/iso/design-projects/{project_id}/trials",
        response_model=IsoDesignTrialRead,
        status_code=201,
    )
    def create_iso_design_trial(
        project_id: uuid.UUID,
        payload: IsoDesignTrialCreate,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        settings = _require_iso_enabled(session, tenant)
        _get_iso_project(session, tenant.tenant_id, project_id)
        technical_result = _validate_technical_result(
            payload.technical_result,
            _effective_iso_config(settings),
        )
        snapshot = payload.snapshot or {}
        trial = IsoDesignTrial(
            tenant_id=tenant.tenant_id,
            design_project_id=project_id,
            formula_id=payload.formula_id,
            formula_version=payload.formula_version,
            review_request_id=payload.review_request_id,
            jira_issue_key=_clean_optional(payload.jira_issue_key),
            jira_issue_url=_clean_optional(payload.jira_issue_url),
            trial_code=_clean_optional(payload.trial_code),
            trial_name=_clean_optional(payload.trial_name),
            trial_number=payload.trial_number,
            trial_at=payload.trial_at,
            technical_result=technical_result,
            raw_result_label=_clean_optional(payload.raw_result_label),
            raw_status_label=_clean_optional(payload.raw_status_label),
            result_source=_clean_status(payload.result_source),
            reason_comment=_clean_optional(payload.reason_comment),
            snapshot_json=snapshot,
            snapshot_checksum=_snapshot_checksum(snapshot),
        )
        session.add(trial)
        try:
            session.commit()
        except IntegrityError as exc:
            session.rollback()
            raise HTTPException(
                status_code=409,
                detail="An ISO trial already exists for this Jira review.",
            ) from exc
        session.refresh(trial)
        return _iso_trial_read(trial)

    @app.post(
        "/api/v1/iso/design-projects/{project_id}/trials/from-jira-review",
        response_model=IsoDesignTrialRead,
        status_code=201,
    )
    def create_iso_design_trial_from_jira_review(
        project_id: uuid.UUID,
        payload: IsoDesignTrialFromReviewCreate,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        review = _get_formula_review_request(session, tenant.tenant_id, payload.review_id)
        trial = upsert_iso_design_trial_from_review(
            session,
            tenant,
            design_project_id=project_id,
            review=review,
            trial_number=payload.trial_number,
            reason_comment=payload.reason_comment,
        )
        session.commit()
        session.refresh(trial)
        return _iso_trial_read(trial)

    @app.get(
        "/api/v1/iso/design-projects/{project_id}/validation",
        response_model=IsoProductValidationRead | None,
    )
    def get_iso_product_validation(
        project_id: uuid.UUID,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any] | None:
        _require_iso_enabled(session, tenant)
        _get_iso_project(session, tenant.tenant_id, project_id)
        validation = session.exec(
            select(IsoProductValidation).where(
                IsoProductValidation.tenant_id == tenant.tenant_id,
                IsoProductValidation.design_project_id == project_id,
            )
        ).first()
        return _iso_validation_read(validation) if validation is not None else None

    @app.post(
        "/api/v1/iso/design-projects/{project_id}/validation",
        response_model=IsoProductValidationRead,
        status_code=201,
    )
    def create_iso_product_validation(
        project_id: uuid.UUID,
        payload: IsoProductValidationCreate,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        settings = _require_iso_enabled(session, tenant)
        project = _get_iso_project(session, tenant.tenant_id, project_id)
        trial = _get_iso_trial(
            session,
            tenant.tenant_id,
            project_id,
            payload.released_trial_id,
        )
        _require_released_trial_for_validation(trial)
        existing = session.exec(
            select(IsoProductValidation).where(
                IsoProductValidation.tenant_id == tenant.tenant_id,
                IsoProductValidation.design_project_id == project_id,
            )
        ).first()
        if existing is not None:
            raise HTTPException(
                status_code=409,
                detail="An F10-03 validation already exists for this ISO project.",
            )
        validation = IsoProductValidation(
            tenant_id=tenant.tenant_id,
            design_project_id=project_id,
            released_trial_id=trial.id,
            formula_id=trial.formula_id,
            formula_version=trial.formula_version,
            product_name=_clean_optional(payload.product_name) or project.product_name,
            formula_ok=_clean_optional(payload.formula_ok) or trial.trial_name or trial.trial_code,
            specification_json=payload.specification or {},
            validation_checks_json=_initial_validation_checks(_effective_iso_config(settings)),
            comments=_clean_optional(payload.comments),
            created_by=tenant.user_id,
        )
        session.add(validation)
        session.commit()
        session.refresh(validation)
        return _iso_validation_read(validation)

    @app.patch(
        "/api/v1/iso/product-validations/{validation_id}",
        response_model=IsoProductValidationRead,
    )
    def update_iso_product_validation(
        validation_id: uuid.UUID,
        payload: IsoProductValidationUpdate,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        _require_iso_enabled(session, tenant)
        validation = _get_iso_validation(session, tenant.tenant_id, validation_id)
        updates = payload.model_dump(exclude_unset=True)
        if "product_name" in updates and updates["product_name"] is not None:
            validation.product_name = _clean_required(updates["product_name"], "Producto")
        if "formula_ok" in updates:
            validation.formula_ok = _clean_optional(updates["formula_ok"])
        if "specification" in updates and updates["specification"] is not None:
            validation.specification_json = updates["specification"]
        if "comments" in updates:
            validation.comments = _clean_optional(updates["comments"])
        if "validation_at" in updates:
            validation.validation_at = updates["validation_at"]
        validation.updated_at = utc_now()
        session.add(validation)
        session.commit()
        session.refresh(validation)
        return _iso_validation_read(validation)

    @app.put(
        "/api/v1/iso/product-validations/{validation_id}/checks",
        response_model=IsoProductValidationRead,
    )
    def update_iso_product_validation_checks(
        validation_id: uuid.UUID,
        payload: IsoValidationChecksUpdate,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        _require_iso_enabled(session, tenant)
        validation = _get_iso_validation(session, tenant.tenant_id, validation_id)
        validation.validation_checks_json = [
            _validation_check_payload(check.model_dump()) for check in payload.checks
        ]
        validation.updated_at = utc_now()
        session.add(validation)
        session.commit()
        session.refresh(validation)
        return _iso_validation_read(validation)

    @app.post(
        "/api/v1/iso/product-validations/{validation_id}/publish",
        response_model=IsoProductValidationRead,
    )
    def publish_iso_product_validation(
        validation_id: uuid.UUID,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        _require_iso_enabled(session, tenant)
        validation = _get_iso_validation(session, tenant.tenant_id, validation_id)
        trial = _get_iso_trial(
            session,
            tenant.tenant_id,
            validation.design_project_id,
            validation.released_trial_id,
        )
        _require_released_trial_for_validation(trial)
        _validate_publishable_checks(validation.validation_checks_json)
        published_at = utc_now()
        validation.status = "published"
        validation.validation_at = validation.validation_at or published_at
        validation.published_at = published_at
        validation.updated_at = published_at
        project = _get_iso_project(session, tenant.tenant_id, validation.design_project_id)
        project.lifecycle_status = "validated"
        project.finished_at = project.finished_at or published_at.date()
        project.updated_at = published_at
        session.add(project)
        session.add(validation)
        session.commit()
        session.refresh(validation)
        return _iso_validation_read(validation)

    @app.post(
        "/api/v1/iso/imports/f10-01/preview",
        response_model=IsoLegacyImportPreviewRead,
    )
    async def preview_iso_f10_01_import(
        file: UploadFile = File(...),
        sheet_name: str | None = Form(None),
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        _require_iso_enabled(session, tenant)
        parsed = await _parse_iso_legacy_upload(file, "f10_01", sheet_name)
        return _iso_legacy_import_preview_read(parsed)

    @app.post(
        "/api/v1/iso/imports/f10-01/apply",
        response_model=IsoLegacyImportApplyRead,
    )
    async def apply_iso_f10_01_import(
        file: UploadFile = File(...),
        sheet_name: str | None = Form(None),
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        _require_iso_enabled(session, tenant)
        parsed = await _parse_iso_legacy_upload(file, "f10_01", sheet_name)
        return _apply_iso_legacy_import(session, tenant, parsed)

    @app.post(
        "/api/v1/iso/imports/f10-02/preview",
        response_model=IsoLegacyImportPreviewRead,
    )
    async def preview_iso_f10_02_import(
        file: UploadFile = File(...),
        sheet_name: str | None = Form(None),
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        _require_iso_enabled(session, tenant)
        parsed = await _parse_iso_legacy_upload(file, "f10_02", sheet_name)
        return _iso_legacy_import_preview_read(parsed)

    @app.post(
        "/api/v1/iso/imports/f10-02/apply",
        response_model=IsoLegacyImportApplyRead,
    )
    async def apply_iso_f10_02_import(
        file: UploadFile = File(...),
        sheet_name: str | None = Form(None),
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        _require_iso_enabled(session, tenant)
        parsed = await _parse_iso_legacy_upload(file, "f10_02", sheet_name)
        return _apply_iso_legacy_import(session, tenant, parsed)

    @app.post(
        "/api/v1/iso/imports/f10-03/preview",
        response_model=IsoLegacyImportPreviewRead,
    )
    async def preview_iso_f10_03_import(
        file: UploadFile = File(...),
        sheet_name: str | None = Form(None),
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        _require_iso_enabled(session, tenant)
        parsed = await _parse_iso_legacy_upload(file, "f10_03", sheet_name)
        return _iso_legacy_import_preview_read(parsed)

    @app.post(
        "/api/v1/iso/imports/f10-03/apply",
        response_model=IsoLegacyImportApplyRead,
    )
    async def apply_iso_f10_03_import(
        file: UploadFile = File(...),
        sheet_name: str | None = Form(None),
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        _require_iso_enabled(session, tenant)
        parsed = await _parse_iso_legacy_upload(file, "f10_03", sheet_name)
        return _apply_iso_legacy_import(session, tenant, parsed)

    @app.post(
        "/api/v1/iso/exports/f10-01",
        response_model=IsoRecordArtifactRead,
    )
    def create_iso_f10_01_export(
        year: int | None = Query(default=None),
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        _require_iso_enabled(session, tenant)
        statement = select(IsoDesignProject).where(
            IsoDesignProject.tenant_id == tenant.tenant_id
        )
        if year is not None:
            statement = statement.where(IsoDesignProject.year == year)
        projects = session.exec(
            statement.order_by(IsoDesignProject.year.desc(), IsoDesignProject.iso_request_number)
        ).all()
        generated = build_f10_01_excel(projects, year=year)
        artifact = _persist_iso_artifact(session, tenant, generated)
        return _iso_artifact_read(artifact)

    @app.post(
        "/api/v1/iso/design-projects/{project_id}/exports/f10-02",
        response_model=IsoRecordArtifactRead,
    )
    def create_iso_f10_02_export(
        project_id: uuid.UUID,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        _require_iso_enabled(session, tenant)
        project = _get_iso_project(session, tenant.tenant_id, project_id)
        trials = _list_project_trials(session, tenant.tenant_id, project_id)
        generated = build_f10_02_excel(project, trials)
        artifact = _persist_iso_artifact(
            session,
            tenant,
            generated,
            design_project_id=project.id,
        )
        return _iso_artifact_read(artifact)

    @app.post(
        "/api/v1/iso/design-projects/{project_id}/exports/f10-03",
        response_model=IsoRecordArtifactRead,
    )
    def create_iso_f10_03_export(
        project_id: uuid.UUID,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        _require_iso_enabled(session, tenant)
        project = _get_iso_project(session, tenant.tenant_id, project_id)
        validation = _get_project_validation(session, tenant.tenant_id, project_id)
        released_trial = _get_iso_trial(
            session,
            tenant.tenant_id,
            project_id,
            validation.released_trial_id,
        )
        generated = build_f10_03_excel(project, validation, released_trial)
        artifact = _persist_iso_artifact(
            session,
            tenant,
            generated,
            design_project_id=project.id,
        )
        return _iso_artifact_read(artifact)

    @app.post(
        "/api/v1/iso/design-projects/{project_id}/dossier",
        response_model=IsoRecordArtifactRead,
    )
    def create_iso_project_dossier(
        project_id: uuid.UUID,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        _require_iso_enabled(session, tenant)
        project = _get_iso_project(session, tenant.tenant_id, project_id)
        trials = _list_project_trials(session, tenant.tenant_id, project_id)
        validation = _find_project_validation(session, tenant.tenant_id, project_id)
        released_trial = (
            _get_iso_trial(session, tenant.tenant_id, project_id, validation.released_trial_id)
            if validation is not None
            else None
        )
        generated = _build_iso_project_dossier(project, trials, validation, released_trial)
        artifact = _persist_iso_artifact(
            session,
            tenant,
            generated,
            design_project_id=project.id,
        )
        return _iso_artifact_read(artifact)

    @app.get("/api/v1/iso/artifacts/{artifact_id}/download")
    def download_iso_artifact(
        artifact_id: uuid.UUID,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> StreamingResponse:
        _require_iso_enabled(session, tenant)
        artifact = _get_iso_artifact(session, tenant.tenant_id, artifact_id)
        return StreamingResponse(
            BytesIO(artifact.content),
            media_type=artifact.content_type,
            headers={"Content-Disposition": f'attachment; filename="{artifact.file_name}"'},
        )


def upsert_iso_design_trial_from_review(
    session: Session,
    tenant: TenantContext,
    *,
    design_project_id: uuid.UUID,
    review: FormulaReviewRequest,
    trial_number: int | None = None,
    reason_comment: str | None = None,
) -> IsoDesignTrial:
    settings = _require_iso_enabled(session, tenant)
    _get_iso_project(session, tenant.tenant_id, design_project_id)
    return _upsert_trial_from_review(
        session,
        tenant.tenant_id,
        design_project_id,
        review,
        config=_effective_iso_config(settings),
        trial_number=trial_number,
        reason_comment=reason_comment,
    )


def _ensure_iso_settings(session: Session, tenant_id: uuid.UUID) -> IsoTenantSettings:
    settings = session.exec(
        select(IsoTenantSettings).where(IsoTenantSettings.tenant_id == tenant_id)
    ).first()
    if settings is not None:
        return settings
    settings = IsoTenantSettings(
        tenant_id=tenant_id,
        enabled=False,
        config_json=default_iso_config(),
    )
    session.add(settings)
    session.commit()
    session.refresh(settings)
    return settings


def _require_iso_enabled(session: Session, tenant: TenantContext) -> IsoTenantSettings:
    settings = _ensure_iso_settings(session, tenant.tenant_id)
    if not settings.enabled:
        raise HTTPException(status_code=403, detail="ISO 9001 module is not enabled.")
    return settings


def _require_iso_admin(tenant: TenantContext) -> None:
    if tenant.role not in {"owner", "admin"}:
        raise HTTPException(status_code=403, detail="Tenant admin role is required.")


def _iso_settings_read(settings: IsoTenantSettings) -> dict[str, Any]:
    return {
        **settings.model_dump(mode="json"),
        "config": _effective_iso_config(settings),
    }


def _effective_iso_config(settings: IsoTenantSettings) -> dict[str, Any]:
    return _merge_iso_config(default_iso_config(), settings.config_json or {})


def _merge_iso_config(base: dict[str, Any], patch: dict[str, Any]) -> dict[str, Any]:
    merged = deepcopy(base)
    for key, value in patch.items():
        if isinstance(value, dict) and isinstance(merged.get(key), dict):
            merged[key] = _merge_iso_config(merged[key], value)
        else:
            merged[key] = value
    return merged


def _get_iso_project(
    session: Session,
    tenant_id: uuid.UUID,
    project_id: uuid.UUID,
) -> IsoDesignProject:
    project = session.exec(
        select(IsoDesignProject).where(
            IsoDesignProject.id == project_id,
            IsoDesignProject.tenant_id == tenant_id,
        )
    ).first()
    if project is None:
        raise HTTPException(status_code=404, detail="ISO design project not found.")
    return project


def _ensure_no_duplicate_iso_project(
    session: Session,
    tenant_id: uuid.UUID,
    *,
    year: int,
    iso_request_number: str,
    project_code: str | None,
    exclude_project_id: uuid.UUID | None = None,
) -> None:
    statement = select(IsoDesignProject).where(
        IsoDesignProject.tenant_id == tenant_id,
        IsoDesignProject.year == year,
        IsoDesignProject.iso_request_number == iso_request_number,
    )
    if exclude_project_id is not None:
        statement = statement.where(IsoDesignProject.id != exclude_project_id)
    candidates = session.exec(statement).all()
    normalized_code = (project_code or "").strip().casefold()
    for candidate in candidates:
        candidate_code = (candidate.project_code or "").strip().casefold()
        if candidate_code == normalized_code:
            raise HTTPException(
                status_code=409,
                detail="An ISO design project already exists for this request, year and project code.",
            )


def _get_iso_trial(
    session: Session,
    tenant_id: uuid.UUID,
    project_id: uuid.UUID,
    trial_id: uuid.UUID,
) -> IsoDesignTrial:
    trial = session.exec(
        select(IsoDesignTrial).where(
            IsoDesignTrial.id == trial_id,
            IsoDesignTrial.tenant_id == tenant_id,
            IsoDesignTrial.design_project_id == project_id,
        )
    ).first()
    if trial is None:
        raise HTTPException(status_code=404, detail="ISO design trial not found.")
    return trial


def _get_iso_validation(
    session: Session,
    tenant_id: uuid.UUID,
    validation_id: uuid.UUID,
) -> IsoProductValidation:
    validation = session.exec(
        select(IsoProductValidation).where(
            IsoProductValidation.id == validation_id,
            IsoProductValidation.tenant_id == tenant_id,
        )
    ).first()
    if validation is None:
        raise HTTPException(status_code=404, detail="ISO product validation not found.")
    return validation


def _find_project_validation(
    session: Session,
    tenant_id: uuid.UUID,
    project_id: uuid.UUID,
) -> IsoProductValidation | None:
    return session.exec(
        select(IsoProductValidation).where(
            IsoProductValidation.tenant_id == tenant_id,
            IsoProductValidation.design_project_id == project_id,
        )
    ).first()


def _get_project_validation(
    session: Session,
    tenant_id: uuid.UUID,
    project_id: uuid.UUID,
) -> IsoProductValidation:
    validation = _find_project_validation(session, tenant_id, project_id)
    if validation is None:
        raise HTTPException(status_code=404, detail="ISO F10-03 validation not found.")
    return validation


def _list_project_trials(
    session: Session,
    tenant_id: uuid.UUID,
    project_id: uuid.UUID,
) -> list[IsoDesignTrial]:
    return session.exec(
        select(IsoDesignTrial)
        .where(
            IsoDesignTrial.tenant_id == tenant_id,
            IsoDesignTrial.design_project_id == project_id,
        )
        .order_by(IsoDesignTrial.trial_at, IsoDesignTrial.created_at)
    ).all()


def _get_iso_artifact(
    session: Session,
    tenant_id: uuid.UUID,
    artifact_id: uuid.UUID,
) -> IsoRecordArtifact:
    artifact = session.exec(
        select(IsoRecordArtifact).where(
            IsoRecordArtifact.id == artifact_id,
            IsoRecordArtifact.tenant_id == tenant_id,
        )
    ).first()
    if artifact is None:
        raise HTTPException(status_code=404, detail="ISO artifact not found.")
    return artifact


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


def _upsert_trial_from_review(
    session: Session,
    tenant_id: uuid.UUID,
    project_id: uuid.UUID,
    review: FormulaReviewRequest,
    *,
    config: dict[str, Any],
    trial_number: int | None,
    reason_comment: str | None,
) -> IsoDesignTrial:
    snapshot = review.snapshot_json or {}
    formula = _mapping(snapshot.get("formula"))
    jira = _mapping(snapshot.get("jira"))
    raw_result = _clean_optional(jira.get("technical_result_raw"))
    technical_result = _clean_optional(jira.get("technical_result"))
    if not technical_result:
        technical_result = _normalize_technical_result(raw_result, config)
    technical_result = _validate_technical_result(technical_result, config)
    existing = session.exec(
        select(IsoDesignTrial).where(
            IsoDesignTrial.tenant_id == tenant_id,
            IsoDesignTrial.review_request_id == review.id,
        )
    ).first()
    if existing is not None and existing.design_project_id != project_id:
        raise HTTPException(
            status_code=409,
            detail="This Jira review is already linked to another ISO design project.",
        )
    trial = existing or IsoDesignTrial(
        tenant_id=tenant_id,
        design_project_id=project_id,
        review_request_id=review.id,
    )
    trial.formula_id = review.formula_id
    trial.formula_version = review.formula_version
    trial.jira_issue_key = review.jira_issue_key
    trial.jira_issue_url = review.jira_issue_url
    trial.trial_code = review.jira_issue_key or str(review.id)[:8]
    trial.trial_name = _clean_optional(jira.get("issue_summary")) or _clean_optional(
        formula.get("name")
    )
    trial.trial_number = trial_number if trial_number is not None else trial.trial_number
    trial.trial_at = review.sent_at or review.created_at
    trial.technical_result = technical_result
    trial.raw_result_label = raw_result
    trial.raw_status_label = review.jira_status
    trial.result_source = "jira" if raw_result or review.jira_status else "formulia_review"
    trial.reason_comment = _clean_optional(reason_comment)
    trial.snapshot_json = snapshot
    trial.snapshot_checksum = _snapshot_checksum(snapshot)
    trial.updated_at = utc_now()
    session.add(trial)
    return trial


def _iso_project_read(session: Session, project: IsoDesignProject) -> dict[str, Any]:
    trials = session.exec(
        select(IsoDesignTrial).where(
            IsoDesignTrial.tenant_id == project.tenant_id,
            IsoDesignTrial.design_project_id == project.id,
        )
    ).all()
    return {**project.model_dump(mode="json"), "trial_count": len(trials)}


def _iso_trial_read(trial: IsoDesignTrial) -> dict[str, Any]:
    return {
        **trial.model_dump(mode="json"),
        "snapshot": trial.snapshot_json,
    }


def _iso_validation_read(validation: IsoProductValidation) -> dict[str, Any]:
    return {
        **validation.model_dump(mode="json"),
        "specification": validation.specification_json,
        "validation_checks": validation.validation_checks_json,
    }


def _iso_artifact_read(artifact: IsoRecordArtifact) -> dict[str, Any]:
    return artifact.model_dump(mode="json", exclude={"content"})


def _persist_iso_artifact(
    session: Session,
    tenant: TenantContext,
    generated: IsoGeneratedArtifact,
    *,
    design_project_id: uuid.UUID | None = None,
) -> IsoRecordArtifact:
    artifact = IsoRecordArtifact(
        tenant_id=tenant.tenant_id,
        design_project_id=design_project_id,
        artifact_type=generated.artifact_type,
        file_name=generated.file_name,
        content_type=generated.content_type,
        checksum_sha256=generated.checksum_sha256,
        size_bytes=generated.size_bytes,
        content=generated.content,
        created_by=tenant.user_id,
    )
    session.add(artifact)
    session.commit()
    session.refresh(artifact)
    return artifact


def _build_iso_project_dossier(
    project: IsoDesignProject,
    trials: list[IsoDesignTrial],
    validation: IsoProductValidation | None,
    released_trial: IsoDesignTrial | None,
) -> IsoGeneratedArtifact:
    generated_files = [
        build_f10_01_excel([project], year=project.year),
        build_f10_02_excel(project, trials),
    ]
    if validation is not None:
        generated_files.append(build_f10_03_excel(project, validation, released_trial))
    metadata = build_iso_metadata_json(project, generated_files)
    stream = BytesIO()
    with ZipFile(stream, "w", ZIP_DEFLATED) as archive:
        for generated in generated_files:
            archive.writestr(generated.file_name, generated.content)
        archive.writestr("metadata.json", metadata)
    return generated_binary_artifact(
        artifact_type="iso_dossier_zip",
        file_name=f"formulia_iso_dossier_{_safe_file_part(project.project_code or project.iso_request_number)}.zip",
        content_type=ISO_ZIP_CONTENT_TYPE,
        content=stream.getvalue(),
    )


async def _parse_iso_legacy_upload(
    file: UploadFile,
    format_key: str,
    sheet_name: str | None,
) -> IsoLegacyImport:
    _ensure_xlsx_file(file)
    try:
        return parse_iso_legacy_xlsx(format_key, await file.read(), sheet_name=sheet_name)
    except IsoLegacyImportError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


def _iso_legacy_import_preview_read(parsed: IsoLegacyImport) -> dict[str, Any]:
    rows = [_iso_legacy_row_read(row) for row in parsed.rows]
    return {
        "format_key": parsed.format_key,
        "available_sheets": parsed.available_sheets,
        "total_rows": len(rows),
        "ready_rows": sum(1 for row in parsed.rows if row.status == "ready"),
        "ambiguous_rows": sum(1 for row in parsed.rows if row.status == "ambiguous"),
        "rows": rows,
    }


def _iso_legacy_row_read(row: IsoLegacyImportRow) -> dict[str, Any]:
    return {
        "format_key": row.format_key,
        "sheet_name": row.sheet_name,
        "row_number": row.row_number,
        "record_key": row.record_key,
        "action": row.action,
        "status": row.status,
        "message": row.message,
        "payload": row.payload,
    }


def _apply_iso_legacy_import(
    session: Session,
    tenant: TenantContext,
    parsed: IsoLegacyImport,
) -> dict[str, Any]:
    counters = {
        "created_projects": 0,
        "updated_projects": 0,
        "created_trials": 0,
        "updated_trials": 0,
        "created_validations": 0,
        "updated_validations": 0,
        "skipped_rows": 0,
    }
    rows: list[dict[str, Any]] = []
    config = _effective_iso_config(_ensure_iso_settings(session, tenant.tenant_id))
    for row in parsed.rows:
        if row.status != "ready":
            counters["skipped_rows"] += 1
            rows.append(_iso_legacy_row_read(row))
            continue
        applied_row, row_counters = _apply_iso_legacy_row(session, tenant, row, config)
        for key, value in row_counters.items():
            counters[key] += value
        rows.append(_iso_legacy_row_read(applied_row))
    session.commit()
    preview = _iso_legacy_import_preview_read(parsed)
    return {
        **preview,
        **counters,
        "rows": rows,
    }


def _apply_iso_legacy_row(
    session: Session,
    tenant: TenantContext,
    row: IsoLegacyImportRow,
    config: dict[str, Any],
) -> tuple[IsoLegacyImportRow, dict[str, int]]:
    counters = {
        "created_projects": 0,
        "updated_projects": 0,
        "created_trials": 0,
        "updated_trials": 0,
        "created_validations": 0,
        "updated_validations": 0,
        "skipped_rows": 0,
    }
    if row.format_key == "f10_01":
        project, created = _upsert_legacy_project(session, tenant, row.payload["project"])
        counters["created_projects" if created else "updated_projects"] += 1
        return _applied_legacy_row(row, project.id), counters
    if row.format_key == "f10_02":
        project, project_created = _upsert_legacy_project(session, tenant, row.payload["project"])
        counters["created_projects" if project_created else "updated_projects"] += 1
        trial, trial_created = _upsert_legacy_trial(
            session,
            tenant,
            project,
            row.payload["trial"],
            config,
        )
        counters["created_trials" if trial_created else "updated_trials"] += 1
        return _applied_legacy_row(row, trial.id), counters
    if row.format_key == "f10_03":
        project, project_created = _upsert_legacy_project(session, tenant, row.payload["project"])
        counters["created_projects" if project_created else "updated_projects"] += 1
        validation, validation_created, trial_created = _upsert_legacy_validation(
            session,
            tenant,
            project,
            row.payload["validation"],
        )
        if trial_created:
            counters["created_trials"] += 1
        counters["created_validations" if validation_created else "updated_validations"] += 1
        return _applied_legacy_row(row, validation.id), counters
    counters["skipped_rows"] += 1
    return row, counters


def _applied_legacy_row(row: IsoLegacyImportRow, entity_id: uuid.UUID) -> IsoLegacyImportRow:
    payload = {**row.payload, "entity_id": str(entity_id)}
    return IsoLegacyImportRow(
        format_key=row.format_key,
        sheet_name=row.sheet_name,
        row_number=row.row_number,
        record_key=row.record_key,
        action=row.action,
        status="applied",
        message=None,
        payload=payload,
    )


def _upsert_legacy_project(
    session: Session,
    tenant: TenantContext,
    payload: dict[str, Any],
) -> tuple[IsoDesignProject, bool]:
    iso_request_number = _clean_required(str(payload.get("iso_request_number") or ""), "No Solicitud")
    year = int(payload.get("year") or _derive_project_year(iso_request_number))
    product_name = _clean_required(str(payload.get("product_name") or ""), "Producto")
    project_code = _clean_optional(payload.get("project_code"))
    project = _find_legacy_project(
        session,
        tenant.tenant_id,
        year=year,
        iso_request_number=iso_request_number,
        project_code=project_code,
        product_name=product_name,
    )
    created = project is None
    if project is None:
        project = IsoDesignProject(
            tenant_id=tenant.tenant_id,
            iso_request_number=iso_request_number,
            year=year,
            product_name=product_name,
            created_by=tenant.user_id,
        )
    project.project_code = project_code or project.project_code
    project.requester = _clean_optional(payload.get("requester")) or project.requester
    project.product_name = product_name
    project.commercial_name = _clean_optional(payload.get("commercial_name")) or project.commercial_name
    project.need = _clean_optional(payload.get("need")) or project.need
    project.product_type = _clean_optional(payload.get("product_type")) or project.product_type
    project.destination_country = (
        _clean_optional(payload.get("destination_country")) or project.destination_country
    )
    project.packaging = _clean_optional(payload.get("packaging")) or project.packaging
    project.accepted_status = _clean_status(payload.get("accepted_status") or project.accepted_status)
    project.lifecycle_status = _clean_status(payload.get("lifecycle_status") or project.lifecycle_status)
    project.rejection_reason = (
        _clean_optional(payload.get("rejection_reason")) or project.rejection_reason
    )
    project.planned_finish_at = _parse_date(payload.get("planned_finish_at")) or project.planned_finish_at
    project.finished_at = _parse_date(payload.get("finished_at")) or project.finished_at
    project.source_type = _clean_status(payload.get("source_type") or project.source_type)
    project.source_ref = _clean_optional(payload.get("source_ref")) or project.source_ref
    project.updated_at = utc_now()
    session.add(project)
    session.flush()
    return project, created


def _find_legacy_project(
    session: Session,
    tenant_id: uuid.UUID,
    *,
    year: int,
    iso_request_number: str,
    project_code: str | None,
    product_name: str,
) -> IsoDesignProject | None:
    candidates = session.exec(
        select(IsoDesignProject).where(
            IsoDesignProject.tenant_id == tenant_id,
            IsoDesignProject.year == year,
            IsoDesignProject.iso_request_number == iso_request_number,
        )
    ).all()
    if project_code:
        for project in candidates:
            if project.project_code == project_code:
                return project
    normalized_product = product_name.strip().casefold()
    for project in candidates:
        if project.product_name.strip().casefold() == normalized_product:
            return project
    return candidates[0] if len(candidates) == 1 else None


def _upsert_legacy_trial(
    session: Session,
    tenant: TenantContext,
    project: IsoDesignProject,
    payload: dict[str, Any],
    config: dict[str, Any],
) -> tuple[IsoDesignTrial, bool]:
    trial_code = _clean_optional(payload.get("trial_code"))
    trial_name = _clean_optional(payload.get("trial_name"))
    trial = _find_legacy_trial(session, tenant.tenant_id, project.id, trial_code, trial_name)
    created = trial is None
    if trial is None:
        trial = IsoDesignTrial(tenant_id=tenant.tenant_id, design_project_id=project.id)
    technical_result = _validate_technical_result(payload.get("technical_result"), config)
    snapshot = _mapping(payload.get("snapshot"))
    trial.trial_number = _optional_int(payload.get("trial_number")) or trial.trial_number
    trial.trial_code = trial_code or trial.trial_code
    trial.trial_name = trial_name or trial.trial_name
    trial.trial_at = _parse_datetime(payload.get("trial_at_raw")) or trial.trial_at
    trial.technical_result = technical_result
    trial.raw_result_label = _clean_optional(payload.get("raw_result_label"))
    trial.result_source = "legacy_import"
    trial.reason_comment = _clean_optional(payload.get("reason_comment"))
    trial.snapshot_json = snapshot
    trial.snapshot_checksum = _snapshot_checksum(snapshot)
    trial.updated_at = utc_now()
    session.add(trial)
    session.flush()
    return trial, created


def _find_legacy_trial(
    session: Session,
    tenant_id: uuid.UUID,
    project_id: uuid.UUID,
    trial_code: str | None,
    trial_name: str | None,
) -> IsoDesignTrial | None:
    statement = select(IsoDesignTrial).where(
        IsoDesignTrial.tenant_id == tenant_id,
        IsoDesignTrial.design_project_id == project_id,
    )
    trials = session.exec(statement).all()
    if trial_code:
        for trial in trials:
            if trial.trial_code == trial_code:
                return trial
    if trial_name:
        normalized = trial_name.strip().casefold()
        for trial in trials:
            if (trial.trial_name or "").strip().casefold() == normalized:
                return trial
    return None


def _upsert_legacy_validation(
    session: Session,
    tenant: TenantContext,
    project: IsoDesignProject,
    payload: dict[str, Any],
) -> tuple[IsoProductValidation, bool, bool]:
    formula_ok = _clean_required(str(payload.get("formula_ok") or ""), "Formula OK")
    trial, trial_created = _ensure_legacy_released_trial(session, tenant, project, formula_ok)
    validation = _find_project_validation(session, tenant.tenant_id, project.id)
    created = validation is None
    if validation is None:
        validation = IsoProductValidation(
            tenant_id=tenant.tenant_id,
            design_project_id=project.id,
            released_trial_id=trial.id,
            product_name=project.product_name,
            created_by=tenant.user_id,
        )
    checks = [
        _validation_check_payload(check)
        for check in _sequence(payload.get("validation_checks"))
        if isinstance(check, dict)
    ]
    validation.released_trial_id = trial.id
    validation.formula_id = trial.formula_id
    validation.formula_version = trial.formula_version
    validation.product_name = project.product_name
    validation.formula_ok = formula_ok
    validation.specification_json = _mapping(payload.get("specification"))
    validation.validation_checks_json = checks
    validation.status = "published" if checks and _checks_are_publishable(checks) else "draft"
    validation.validation_at = _parse_datetime(payload.get("validation_at_raw"))
    validation.published_at = validation.validation_at if validation.status == "published" else None
    validation.comments = _clean_optional(payload.get("comments"))
    validation.updated_at = utc_now()
    session.add(validation)
    if validation.status == "published":
        project.lifecycle_status = "validated"
        project.finished_at = project.finished_at or (
            validation.validation_at.date() if validation.validation_at else date.today()
        )
        project.updated_at = utc_now()
        session.add(project)
    session.flush()
    return validation, created, trial_created


def _ensure_legacy_released_trial(
    session: Session,
    tenant: TenantContext,
    project: IsoDesignProject,
    formula_ok: str,
) -> tuple[IsoDesignTrial, bool]:
    trial_code = _formula_ok_code(formula_ok)
    existing = _find_legacy_trial(session, tenant.tenant_id, project.id, trial_code, formula_ok)
    if existing is not None:
        existing.technical_result = "LIBERADO"
        existing.raw_result_label = existing.raw_result_label or "LIBERADO"
        session.add(existing)
        session.flush()
        return existing, False
    trial = IsoDesignTrial(
        tenant_id=tenant.tenant_id,
        design_project_id=project.id,
        trial_code=trial_code,
        trial_name=formula_ok,
        technical_result="LIBERADO",
        raw_result_label="LIBERADO",
        result_source="legacy_import",
        snapshot_json={"source": "legacy_f10_03", "formula_ok": formula_ok},
        snapshot_checksum=_snapshot_checksum({"source": "legacy_f10_03", "formula_ok": formula_ok}),
    )
    session.add(trial)
    session.flush()
    return trial, True


def _formula_ok_code(value: str) -> str | None:
    first = value.split("||", 1)[0].strip()
    return first or None


def _checks_are_publishable(checks: list[dict[str, Any]]) -> bool:
    return all(
        not bool(check.get("required", True)) or _clean_validation_result(check.get("result")) == "ok"
        for check in checks
    )


def _require_released_trial_for_validation(trial: IsoDesignTrial) -> None:
    if trial.technical_result != "LIBERADO":
        raise HTTPException(
            status_code=400,
            detail="F10-03 validation requires a LIBERADO trial.",
        )


def _initial_validation_checks(config: dict[str, Any]) -> list[dict[str, Any]]:
    matrix = _sequence(_mapping(config.get("f10_03")).get("validation_matrix"))
    return [_validation_check_payload(item) for item in matrix if isinstance(item, dict)]


def _validation_check_payload(value: dict[str, Any]) -> dict[str, Any]:
    area = _clean_required(str(value.get("area") or ""), "Area")
    aspect = _clean_required(str(value.get("aspect") or ""), "Aspecto")
    return {
        "area": area,
        "aspect": aspect,
        "required": bool(value.get("required", True)),
        "result": _clean_validation_result(value.get("result")),
        "comments": _clean_optional(value.get("comments")),
    }


def _clean_validation_result(value: Any) -> str:
    result = _clean_status(str(value or "pending"))
    if result not in {"pending", "ok", "nok", "not_applicable"}:
        raise HTTPException(
            status_code=400,
            detail="Validation check result must be pending, ok, nok or not_applicable.",
        )
    return result


def _validate_publishable_checks(checks: list[dict[str, Any]]) -> None:
    missing = [
        f"{check.get('area', '-')}: {check.get('aspect', '-')}"
        for check in checks
        if bool(check.get("required", True)) and _clean_validation_result(check.get("result")) != "ok"
    ]
    if missing:
        raise HTTPException(
            status_code=400,
            detail="Required validation checks must be OK before publishing F10-03: "
            + "; ".join(missing),
        )


def _validate_project_state(accepted_status: str | None, rejection_reason: str | None) -> None:
    if _clean_status(accepted_status or "") in {"rejected", "denied", "denegado"}:
        if not _clean_optional(rejection_reason):
            raise HTTPException(
                status_code=400,
                detail="Rejection reason is required when an ISO project is rejected.",
            )


def _validate_technical_result(value: str | None, config: dict[str, Any]) -> str:
    result = _clean_optional(value) or "pending_result"
    allowed = set(_sequence(config.get("technical_results")))
    allowed.update({"pending_result", "pending_mapping"})
    if result not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Technical result {result!r} is not allowed for this tenant.",
        )
    return result


def _normalize_technical_result(raw_result: str | None, config: dict[str, Any]) -> str:
    if not raw_result:
        return "pending_result"
    mapping = _mapping(_mapping(config.get("jira")).get("technical_result_mapping"))
    normalized = raw_result.strip().casefold()
    for raw_value, technical_result in mapping.items():
        if str(raw_value).strip().casefold() == normalized:
            return str(technical_result)
    return "pending_mapping"


def _snapshot_checksum(snapshot: dict[str, Any]) -> str:
    encoded = json.dumps(
        snapshot,
        sort_keys=True,
        default=str,
        ensure_ascii=True,
        separators=(",", ":"),
    ).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def _derive_project_year(value: str) -> int:
    matches = re.findall(r"(20\d{2})", value)
    if matches:
        return int(matches[-1])
    return date.today().year


def _clean_required(value: str, field_name: str) -> str:
    cleaned = value.strip()
    if not cleaned:
        raise HTTPException(status_code=400, detail=f"{field_name} is required.")
    return cleaned


def _clean_optional(value: Any) -> str | None:
    if value is None:
        return None
    cleaned = str(value).strip()
    return cleaned or None


def _clean_status(value: str | None) -> str:
    return (value or "").strip().casefold().replace(" ", "_") or "pending"


def _optional_int(value: Any) -> int | None:
    if value is None:
        return None
    try:
        return int(str(value).strip())
    except (TypeError, ValueError):
        return None


def _parse_date(value: Any) -> date | None:
    parsed = _parse_datetime(value)
    return parsed.date() if parsed is not None else None


def _parse_datetime(value: Any) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, date):
        return datetime.combine(value, datetime.min.time())
    cleaned = str(value).strip()
    if not cleaned:
        return None
    for fmt in (
        "%Y-%m-%d",
        "%d/%m/%Y",
        "%d/%m/%y",
        "%d/%b/%y %I:%M %p",
        "%d/%b/%Y %I:%M %p",
    ):
        try:
            return datetime.strptime(cleaned, fmt)
        except ValueError:
            continue
    return None


def _ensure_xlsx_file(file: UploadFile) -> None:
    if not file.filename or not file.filename.lower().endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Only .xlsx files are supported.")


def _safe_file_part(value: str) -> str:
    normalized = re.sub(r"[^A-Za-z0-9._-]+", "_", value.strip())
    return normalized.strip("._-")[:48] or "iso"


def _mapping(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def _sequence(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []
