from __future__ import annotations

import json
import os
import uuid
from collections import defaultdict
from contextlib import asynccontextmanager
from datetime import date
from difflib import SequenceMatcher
from typing import Any

from fastapi import Depends, FastAPI, File, Form, HTTPException, Query, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import Engine
from sqlmodel import Session, select

from formulia_core import (
    FormulaItem as CoreFormulaItem,
    ParameterValue as CoreParameterValue,
    RawMaterial as CoreRawMaterial,
    calculate_formula,
)

from .ai_audit import finish_ai_run, start_ai_run
from .ai_requirement_parser import (
    MissingOpenAIKeyError,
    OpenAIRequirementParserError,
    parse_requirements_deterministic,
    parse_requirements_with_openai,
    requirement_parser_model,
    requirement_parser_provider,
)
from .agents.deepagents_adapter import DeepAgentsUnavailableError
from .agents.supervisor import (
    AgentOrchestrationError,
    agent_orchestrator_model,
    agent_orchestrator_provider,
    plan_formulation_request,
)
from .database import create_db_engine, get_session, init_db
from .excel_import import (
    ExcelImportError,
    ParsedFormulaImport,
    ParsedFormulaRow,
    list_formula_xlsx_sheets,
    parse_formula_xlsx,
)
from .formula_excel_template import (
    FORMULA_ID_LAB_EXCEL_CONTENT_TYPE,
    FormulaExcelContext,
    FormulaExcelItem,
    FormulaExcelMetadata,
    FormulaExcelParameter,
    build_formula_id_lab_excel,
    formula_excel_download_file_name,
)
from .iso_design import register_iso_routes
from .jira_integration import register_jira_routes
from .local_env import load_local_env
from .models import (
    AiRun,
    AiToolCall,
    CompatibilityRule,
    Formula,
    FormulaCalculationResult,
    FormulaItem,
    Parameter,
    RawMaterial,
    RawMaterialAlias,
    RawMaterialImport,
    RawMaterialParameterValue,
    RawMaterialPrice,
    Tenant,
    TenantInvitation,
    TenantMember,
    User,
    utc_now,
)
from .parameter_order import parameter_sort_key, sort_parameters
from .raw_material_master import (
    clean_raw_material_payload,
    ensure_raw_material_identity_available,
    ensure_valid_raw_material_price,
    generate_raw_material_code,
    list_raw_material_prices,
    normalize_name as normalize_raw_material_name,
)
from .raw_material_import import (
    apply_sap_import,
    create_sap_import_preview,
    import_read,
    load_import_rows,
)
from .raw_material_snapshot import (
    active_parameter_value_map_by_material_id,
    current_prices_by_material_id,
)
from .schemas import (
    CalculationRead,
    CompatibilityRuleCreate,
    CompatibilityRuleRead,
    ExcelImportPreviewRead,
    ExcelImportSaveRequest,
    ExcelImportSheetsRead,
    FormulaCalculationHistoryRead,
    FormulaCalculateRequest,
    FormulaCreate,
    FormulaExcelExportRequest,
    FormulaRead,
    FormulaUpdate,
    ParameterCreate,
    ParameterRead,
    RawMaterialCreate,
    RawMaterialCatalogRead,
    RawMaterialAliasCreate,
    RawMaterialAliasRead,
    RawMaterialImportRead,
    RawMaterialParameterValueCreate,
    RawMaterialPriceCreate,
    RawMaterialPriceRead,
    RawMaterialRead,
    RawMaterialUpdate,
    AgentPlanRead,
    AgentPlanRequest,
    AiRunDetailRead,
    AiRunRead,
    RequirementParseRead,
    RequirementParseRequest,
    TenantCreate,
    TenantInvitationCreate,
    TenantInvitationRead,
    TenantRead,
)
from .tenant import (
    TenantContext,
    get_current_user,
    normalize_email,
    normalize_tenant_role,
    require_tenant_admin,
    require_tenant_context,
    send_supabase_invite_email,
)


FUZZY_SUGGESTION_THRESHOLD = 0.82


load_local_env()


def create_app(engine: Engine | None = None) -> FastAPI:
    @asynccontextmanager
    async def lifespan(app: FastAPI):
        init_db(app.state.engine)
        yield

    app = FastAPI(title="FormulIA API", version="0.1.0", lifespan=lifespan)
    app.state.engine = engine or create_db_engine()
    app.add_middleware(
        CORSMiddleware,
        allow_origins=_cors_origins(),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    register_routes(app)
    register_jira_routes(app)
    register_iso_routes(app)
    return app


def register_routes(app: FastAPI) -> None:
    @app.get("/health")
    @app.get("/api/v1/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/api/v1/me")
    def me(user: User = Depends(get_current_user)) -> dict[str, Any]:
        return {"id": user.id, "email": user.email, "name": user.name}

    @app.get("/api/v1/tenants", response_model=list[TenantRead])
    def list_tenants(
        session: Session = Depends(get_session),
        user: User = Depends(get_current_user),
    ) -> list[dict[str, Any]]:
        memberships = session.exec(
            select(TenantMember).where(
                TenantMember.user_id == user.id,
                TenantMember.status == "active",
            )
        ).all()
        roles_by_tenant_id = {
            membership.tenant_id: membership.role for membership in memberships
        }
        tenant_ids = list(roles_by_tenant_id)
        if not tenant_ids:
            return []
        tenants = session.exec(select(Tenant).where(Tenant.id.in_(tenant_ids))).all()
        return [
            _tenant_read(tenant, roles_by_tenant_id.get(tenant.id))
            for tenant in tenants
        ]

    @app.post("/api/v1/tenants", response_model=TenantRead, status_code=201)
    def create_tenant(
        payload: TenantCreate,
        session: Session = Depends(get_session),
        user: User = Depends(get_current_user),
    ) -> dict[str, Any]:
        tenant = Tenant(name=payload.name, slug=payload.slug)
        session.add(tenant)
        session.commit()
        session.refresh(tenant)
        session.add(
            TenantMember(
                tenant_id=tenant.id,
                user_id=user.id,
                role="owner",
                status="active",
            )
        )
        session.commit()
        return _tenant_read(tenant, "owner")

    @app.get("/api/v1/tenant-invitations", response_model=list[TenantInvitationRead])
    def list_tenant_invitations(
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> list[TenantInvitation]:
        require_tenant_admin(tenant)
        return session.exec(
            select(TenantInvitation).where(TenantInvitation.tenant_id == tenant.tenant_id)
        ).all()

    @app.post(
        "/api/v1/tenant-invitations",
        response_model=TenantInvitationRead,
        status_code=201,
    )
    def create_tenant_invitation(
        payload: TenantInvitationCreate,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        require_tenant_admin(tenant)
        email = normalize_email(payload.email)
        role = normalize_tenant_role(payload.role)
        if "@" not in email:
            raise HTTPException(status_code=400, detail="Invitation email is invalid.")
        invitation = session.exec(
            select(TenantInvitation).where(
                TenantInvitation.tenant_id == tenant.tenant_id,
                TenantInvitation.email == email,
            )
        ).first()
        if invitation is None:
            invitation = TenantInvitation(
                tenant_id=tenant.tenant_id,
                email=email,
                role=role,
                expires_at=payload.expires_at,
                invited_by=tenant.user_id,
            )
        else:
            invitation.role = role
            invitation.status = "pending"
            invitation.expires_at = payload.expires_at
            invitation.invited_by = tenant.user_id
            invitation.accepted_by = None
            invitation.accepted_at = None
        session.add(invitation)
        session.commit()
        session.refresh(invitation)
        email_delivery_status = None
        if payload.send_link:
            send_supabase_invite_email(email)
            email_delivery_status = "sent"
        return _tenant_invitation_read(invitation, email_delivery_status)

    @app.get("/api/v1/parameters", response_model=list[ParameterRead])
    def list_parameters(
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> list[Parameter]:
        parameters = session.exec(
            select(Parameter).where(Parameter.tenant_id == tenant.tenant_id)
        ).all()
        return sort_parameters(parameters, key=lambda parameter: parameter.code)

    @app.post("/api/v1/parameters", response_model=ParameterRead, status_code=201)
    def create_parameter(
        payload: ParameterCreate,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> Parameter:
        parameter = Parameter(tenant_id=tenant.tenant_id, **payload.model_dump())
        session.add(parameter)
        session.commit()
        session.refresh(parameter)
        _ensure_zero_values_for_parameter(session, tenant.tenant_id, parameter)
        return parameter

    @app.get("/api/v1/raw-materials", response_model=list[RawMaterialRead])
    def list_raw_materials(
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> Response:
        materials = session.exec(
            select(RawMaterial)
            .where(RawMaterial.tenant_id == tenant.tenant_id)
            .order_by(RawMaterial.name)
        ).all()
        payload = _raw_materials_read(session, tenant.tenant_id, materials)
        return Response(
            content=json.dumps(payload, default=str, separators=(",", ":")),
            media_type="application/json",
        )

    @app.get("/api/v1/raw-materials/catalog", response_model=RawMaterialCatalogRead)
    def list_raw_material_catalog(
        q: str | None = Query(default=None),
        family: str | None = Query(default=None),
        price_filter: str = Query(default="all"),
        price_min: float | None = Query(default=None),
        price_max: float | None = Query(default=None),
        parameter: str | None = Query(default=None),
        parameter_range: list[str] = Query(default_factory=list),
        only_positive: bool = Query(default=True),
        limit: int = Query(default=500, ge=1, le=1000),
        offset: int = Query(default=0, ge=0),
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        materials = session.exec(
            select(RawMaterial)
            .where(RawMaterial.tenant_id == tenant.tenant_id)
            .order_by(RawMaterial.name)
        ).all()
        return _raw_material_catalog_read(
            session,
            tenant.tenant_id,
            materials,
            q=q,
            family=family,
            price_filter=price_filter,
            price_min=price_min,
            price_max=price_max,
            parameter=parameter,
            parameter_range=parameter_range,
            only_positive=only_positive,
            limit=limit,
            offset=offset,
        )

    @app.post("/api/v1/raw-materials", response_model=RawMaterialRead, status_code=201)
    def create_raw_material(
        payload: RawMaterialCreate,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        values = clean_raw_material_payload(payload.model_dump())
        if not values.get("code"):
            values["code"] = generate_raw_material_code(session, tenant.tenant_id)
        normalized_name = normalize_raw_material_name(values["name"])
        ensure_raw_material_identity_available(
            session,
            tenant.tenant_id,
            code=values.get("code"),
            external_code=values.get("external_code"),
            normalized_name=normalized_name,
        )
        raw_material = RawMaterial(
            tenant_id=tenant.tenant_id,
            normalized_name=normalized_name,
            **values,
        )
        session.add(raw_material)
        session.commit()
        session.refresh(raw_material)
        _ensure_zero_values_for_raw_material(session, tenant.tenant_id, raw_material)
        return _raw_material_read(session, tenant.tenant_id, raw_material)

    @app.get("/api/v1/raw-materials/{raw_material_id}", response_model=RawMaterialRead)
    def get_raw_material(
        raw_material_id: uuid.UUID,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        return _raw_material_read(
            session,
            tenant.tenant_id,
            _get_raw_material(session, tenant.tenant_id, raw_material_id),
        )

    @app.patch("/api/v1/raw-materials/{raw_material_id}", response_model=RawMaterialRead)
    def update_raw_material(
        raw_material_id: uuid.UUID,
        payload: RawMaterialUpdate,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        raw_material = _get_raw_material(session, tenant.tenant_id, raw_material_id)
        updates = clean_raw_material_payload(payload.model_dump(exclude_unset=True))
        if "name" in updates and updates["name"] is not None:
            updates["normalized_name"] = normalize_raw_material_name(updates["name"])
        if updates.get("is_active", raw_material.is_active):
            ensure_raw_material_identity_available(
                session,
                tenant.tenant_id,
                code=updates.get("code", raw_material.code),
                external_code=updates.get("external_code", raw_material.external_code),
                normalized_name=updates.get("normalized_name", raw_material.normalized_name),
                exclude_raw_material_id=raw_material.id,
            )
        for key, value in updates.items():
            setattr(raw_material, key, value)
        raw_material.updated_at = utc_now()
        session.add(raw_material)
        session.commit()
        session.refresh(raw_material)
        return _raw_material_read(session, tenant.tenant_id, raw_material)

    @app.get(
        "/api/v1/raw-materials/{raw_material_id}/aliases",
        response_model=list[RawMaterialAliasRead],
    )
    def list_raw_material_aliases(
        raw_material_id: uuid.UUID,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> list[RawMaterialAlias]:
        _get_raw_material(session, tenant.tenant_id, raw_material_id)
        return session.exec(
            select(RawMaterialAlias).where(
                RawMaterialAlias.tenant_id == tenant.tenant_id,
                RawMaterialAlias.raw_material_id == raw_material_id,
            )
        ).all()

    @app.post(
        "/api/v1/raw-materials/{raw_material_id}/aliases",
        response_model=RawMaterialAliasRead,
        status_code=201,
    )
    def create_raw_material_alias(
        raw_material_id: uuid.UUID,
        payload: RawMaterialAliasCreate,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> RawMaterialAlias:
        _get_raw_material(session, tenant.tenant_id, raw_material_id)
        alias = payload.alias.strip()
        if not alias:
            raise HTTPException(status_code=400, detail="Alias cannot be empty.")
        raw_alias = RawMaterialAlias(
            tenant_id=tenant.tenant_id,
            raw_material_id=raw_material_id,
            alias=alias,
            normalized_alias=_normalize(alias),
            source=payload.source,
        )
        session.add(raw_alias)
        session.commit()
        session.refresh(raw_alias)
        return raw_alias

    @app.get(
        "/api/v1/raw-materials/{raw_material_id}/prices",
        response_model=list[RawMaterialPriceRead],
    )
    def list_raw_material_price_history(
        raw_material_id: uuid.UUID,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> list[RawMaterialPrice]:
        _get_raw_material(session, tenant.tenant_id, raw_material_id)
        return list_raw_material_prices(session, tenant.tenant_id, raw_material_id)

    @app.post("/api/v1/raw-materials/{raw_material_id}/prices", status_code=201)
    def add_raw_material_price(
        raw_material_id: uuid.UUID,
        payload: RawMaterialPriceCreate,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        _get_raw_material(session, tenant.tenant_id, raw_material_id)
        ensure_valid_raw_material_price(payload.price)
        price = RawMaterialPrice(
            tenant_id=tenant.tenant_id,
            raw_material_id=raw_material_id,
            valid_from=payload.valid_from or date.today(),
            **payload.model_dump(exclude={"valid_from"}),
        )
        session.add(price)
        session.commit()
        session.refresh(price)
        return _model_dict(price)

    @app.post("/api/v1/raw-materials/{raw_material_id}/parameter-values", status_code=201)
    def upsert_raw_material_parameter_value(
        raw_material_id: uuid.UUID,
        payload: RawMaterialParameterValueCreate,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        _get_raw_material(session, tenant.tenant_id, raw_material_id)
        parameter = _get_parameter(session, tenant.tenant_id, payload.parameter_id)
        existing = session.exec(
            select(RawMaterialParameterValue).where(
                RawMaterialParameterValue.tenant_id == tenant.tenant_id,
                RawMaterialParameterValue.raw_material_id == raw_material_id,
                RawMaterialParameterValue.parameter_id == parameter.id,
            )
        ).first()
        if existing is None:
            value = RawMaterialParameterValue(
                tenant_id=tenant.tenant_id,
                raw_material_id=raw_material_id,
                **payload.model_dump(),
            )
        else:
            value = existing
            value.value = payload.value
            value.source = payload.source
            value.confidence = payload.confidence
        session.add(value)
        session.commit()
        session.refresh(value)
        return _model_dict(value)

    @app.post(
        "/api/v1/raw-material-imports/sap/preview",
        response_model=RawMaterialImportRead,
        status_code=201,
    )
    async def preview_raw_material_sap_import(
        file: UploadFile = File(...),
        sheet_name: str | None = Form(default=None),
        source: str | None = Form(default=None),
        valid_from: date | None = Form(default=None),
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        if not file.filename:
            raise HTTPException(status_code=400, detail="Import file needs a filename.")
        import_record = create_sap_import_preview(
            session,
            tenant.tenant_id,
            file_name=file.filename,
            content=await file.read(),
            sheet_name=sheet_name,
            source=source,
            valid_from=valid_from or date.today(),
        )
        return import_read(
            import_record,
            load_import_rows(session, tenant.tenant_id, import_record.id),
        )

    @app.get(
        "/api/v1/raw-material-imports/{import_id}",
        response_model=RawMaterialImportRead,
    )
    def get_raw_material_import(
        import_id: uuid.UUID,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        import_record = _get_raw_material_import(session, tenant.tenant_id, import_id)
        return import_read(
            import_record,
            load_import_rows(session, tenant.tenant_id, import_id),
        )

    @app.post(
        "/api/v1/raw-material-imports/{import_id}/apply",
        response_model=RawMaterialImportRead,
    )
    def apply_raw_material_sap_import(
        import_id: uuid.UUID,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        import_record = _get_raw_material_import(session, tenant.tenant_id, import_id)
        import_record = apply_sap_import(session, tenant.tenant_id, import_record)
        return import_read(
            import_record,
            load_import_rows(session, tenant.tenant_id, import_id),
        )

    @app.get("/api/v1/compatibility-rules", response_model=list[CompatibilityRuleRead])
    def list_compatibility_rules(
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> list[CompatibilityRule]:
        return session.exec(
            select(CompatibilityRule)
            .where(CompatibilityRule.tenant_id == tenant.tenant_id)
            .order_by(CompatibilityRule.created_at.desc())
        ).all()

    @app.post(
        "/api/v1/compatibility-rules",
        response_model=CompatibilityRuleRead,
        status_code=201,
    )
    def create_compatibility_rule(
        payload: CompatibilityRuleCreate,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> CompatibilityRule:
        if payload.material_a_id == payload.material_b_id:
            raise HTTPException(
                status_code=400,
                detail="Compatibility rule needs two different raw materials.",
            )
        _get_raw_material(session, tenant.tenant_id, payload.material_a_id)
        _get_raw_material(session, tenant.tenant_id, payload.material_b_id)
        message = payload.message.strip()
        if not message:
            raise HTTPException(status_code=400, detail="Compatibility rule message is required.")
        rule = CompatibilityRule(
            tenant_id=tenant.tenant_id,
            rule_type=payload.rule_type,
            severity=payload.severity,
            condition_json={
                "raw_material_ids": sorted(
                    [str(payload.material_a_id), str(payload.material_b_id)]
                ),
                "recommended_action": payload.recommended_action,
            },
            message=message,
            source_type=payload.source_type,
            validated_by=tenant.user_id,
            validated_at=utc_now(),
        )
        session.add(rule)
        session.commit()
        session.refresh(rule)
        return rule

    @app.get("/api/v1/formulas", response_model=list[FormulaRead])
    def list_formulas(
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> list[dict[str, Any]]:
        formulas = session.exec(
            select(Formula).where(Formula.tenant_id == tenant.tenant_id)
        ).all()
        return [_formula_read(session, formula) for formula in formulas]

    @app.post("/api/v1/formulas", response_model=FormulaRead, status_code=201)
    def create_formula(
        payload: FormulaCreate,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        formula = Formula(
            tenant_id=tenant.tenant_id,
            name=payload.name,
            objective=payload.objective,
            jira_project_id=_formula_jira_project_id(payload.jira_project_id, payload.name),
            jira_issue_type=payload.jira_issue_type,
            jira_product_type=payload.jira_product_type,
            created_by=tenant.user_id,
        )
        session.add(formula)
        session.commit()
        session.refresh(formula)
        _replace_formula_items(session, tenant.tenant_id, formula.id, payload.items)
        return _formula_read(session, formula)

    @app.get("/api/v1/formulas/{formula_id}", response_model=FormulaRead)
    def get_formula(
        formula_id: uuid.UUID,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        return _formula_read(session, _get_formula(session, tenant.tenant_id, formula_id))

    @app.patch("/api/v1/formulas/{formula_id}", response_model=FormulaRead)
    def update_formula(
        formula_id: uuid.UUID,
        payload: FormulaUpdate,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        formula = _get_formula(session, tenant.tenant_id, formula_id)
        updates = payload.model_dump(exclude_unset=True, exclude={"items"})
        if "jira_project_id" in updates:
            updates["jira_project_id"] = _formula_jira_project_id(
                updates["jira_project_id"],
                updates.get("name") or formula.name,
            )
        for key, value in updates.items():
            setattr(formula, key, value)
        formula.updated_at = utc_now()
        session.add(formula)
        session.commit()
        session.refresh(formula)
        if payload.items is not None:
            _replace_formula_items(session, tenant.tenant_id, formula.id, payload.items)
        return _formula_read(session, formula)

    @app.post("/api/v1/formulas/{formula_id}/calculate", response_model=CalculationRead)
    def calculate_persisted_formula(
        formula_id: uuid.UUID,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        formula = _get_formula(session, tenant.tenant_id, formula_id)
        items = session.exec(
            select(FormulaItem).where(
                FormulaItem.tenant_id == tenant.tenant_id,
                FormulaItem.formula_id == formula.id,
            )
        ).all()
        required_parameter_codes = {
            parameter.code
            for parameter in session.exec(
                select(Parameter).where(
                    Parameter.tenant_id == tenant.tenant_id,
                    Parameter.is_active.is_(True),
                )
            ).all()
        }
        result = _calculate(
            session,
            tenant.tenant_id,
            items,
            required_parameter_codes=required_parameter_codes,
        )
        formula.total_price = result["price_total"]
        formula.currency = result["currency"]
        formula.updated_at = utc_now()
        session.add(formula)
        session.add(
            FormulaCalculationResult(
                tenant_id=tenant.tenant_id,
                formula_id=formula.id,
                price_total=result["price_total"],
                result_json=result,
            )
        )
        session.commit()
        return result

    @app.get(
        "/api/v1/formulas/{formula_id}/calculations",
        response_model=list[FormulaCalculationHistoryRead],
    )
    def list_formula_calculations(
        formula_id: uuid.UUID,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> list[dict[str, Any]]:
        _get_formula(session, tenant.tenant_id, formula_id)
        calculations = session.exec(
            select(FormulaCalculationResult)
            .where(
                FormulaCalculationResult.tenant_id == tenant.tenant_id,
                FormulaCalculationResult.formula_id == formula_id,
            )
            .order_by(FormulaCalculationResult.calculated_at.desc())
        ).all()
        return [_model_dict(calculation) for calculation in calculations]

    @app.post("/api/v1/formulas/calculate", response_model=CalculationRead)
    def calculate_ad_hoc_formula(
        payload: FormulaCalculateRequest,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        items = [
            FormulaItem(
                tenant_id=tenant.tenant_id,
                formula_id=uuid.uuid4(),
                raw_material_id=item.raw_material_id,
                percentage=item.percentage,
                order_index=item.order_index,
            )
            for item in payload.items
        ]
        return _calculate(
            session,
            tenant.tenant_id,
            items,
            required_parameter_codes=payload.required_parameter_codes,
        )

    @app.get("/api/v1/formulas/{formula_id}/exports/atlantica-id-lab.xlsx")
    def export_persisted_formula_id_lab_excel(
        formula_id: uuid.UUID,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> Response:
        formula = _get_formula(session, tenant.tenant_id, formula_id)
        items = session.exec(
            select(FormulaItem)
            .where(
                FormulaItem.tenant_id == tenant.tenant_id,
                FormulaItem.formula_id == formula.id,
            )
            .order_by(FormulaItem.order_index)
        ).all()
        context = _formula_excel_context(
            session,
            tenant.tenant_id,
            name=formula.name,
            items=items,
            version=formula.version,
        )
        excel = build_formula_id_lab_excel(context)
        return _excel_download_response(
            excel.content,
            formula_excel_download_file_name(formula.name),
        )

    @app.post("/api/v1/formulas/exports/atlantica-id-lab.xlsx")
    def export_ad_hoc_formula_id_lab_excel(
        payload: FormulaExcelExportRequest,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> Response:
        context = _formula_excel_context(
            session,
            tenant.tenant_id,
            name=payload.name,
            items=payload.items,
            version=1,
            metadata=FormulaExcelMetadata(
                sample_code=payload.metadata.sample_code,
                lab_date=payload.metadata.lab_date,
                experiment_date=payload.metadata.experiment_date,
                density=payload.metadata.density,
                ph=payload.metadata.ph,
                notes=payload.metadata.notes,
            ),
        )
        excel = build_formula_id_lab_excel(context)
        return _excel_download_response(
            excel.content,
            formula_excel_download_file_name(payload.name),
        )

    @app.post("/api/v1/ai/requirements/parse", response_model=RequirementParseRead)
    def parse_requirement(
        payload: RequirementParseRequest,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        active_parameters = _active_parameter_context(session, tenant.tenant_id)
        configured_provider = requirement_parser_provider()
        provider = "openai" if configured_provider in {"llm", "openai"} else configured_provider
        model = requirement_parser_model() if provider == "openai" else None
        run = start_ai_run(
            session,
            tenant,
            run_type="requirement_parser",
            provider=provider,
            model=model,
            input_json={
                "text": payload.text,
                "active_parameters": active_parameters,
                "configured_provider": configured_provider,
            },
        )

        try:
            if provider == "deterministic":
                parsed = parse_requirements_deterministic(payload.text, active_parameters)
                usage: dict[str, int | float | None] = {}
            elif provider == "openai":
                parsed, usage = parse_requirements_with_openai(
                    payload.text,
                    active_parameters,
                    model or requirement_parser_model(),
                )
            else:
                raise OpenAIRequirementParserError(
                    f"Unsupported requirement parser provider: {configured_provider}"
                )
        except MissingOpenAIKeyError as exc:
            finish_ai_run(session, run, status="error", error=str(exc))
            raise HTTPException(status_code=503, detail=str(exc)) from exc
        except OpenAIRequirementParserError as exc:
            finish_ai_run(session, run, status="error", error=str(exc))
            raise HTTPException(status_code=502, detail=str(exc)) from exc

        result = {**parsed, "run_id": run.id, "model": model}
        finish_ai_run(
            session,
            run,
            status="success",
            output_json=result,
            prompt_tokens=usage.get("prompt_tokens"),
            completion_tokens=usage.get("completion_tokens"),
            cost_estimate_usd=usage.get("cost_estimate_usd"),
        )
        return result

    @app.get("/api/v1/ai/runs", response_model=list[AiRunRead])
    def list_ai_runs(
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> list[dict[str, Any]]:
        runs = session.exec(
            select(AiRun)
            .where(AiRun.tenant_id == tenant.tenant_id)
            .order_by(AiRun.created_at.desc())
            .limit(20)
        ).all()
        return [_model_dict(run) for run in runs]

    @app.get("/api/v1/ai/runs/{run_id}", response_model=AiRunDetailRead)
    def get_ai_run(
        run_id: uuid.UUID,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        run = session.exec(
            select(AiRun).where(AiRun.id == run_id, AiRun.tenant_id == tenant.tenant_id)
        ).first()
        if run is None:
            raise HTTPException(status_code=404, detail="AI run not found.")
        tool_calls = session.exec(
            select(AiToolCall)
            .where(AiToolCall.ai_run_id == run.id, AiToolCall.tenant_id == tenant.tenant_id)
            .order_by(AiToolCall.started_at)
        ).all()
        return {**_model_dict(run), "tool_calls": [_model_dict(call) for call in tool_calls]}

    @app.post("/api/v1/ai/supervisor/plan", response_model=AgentPlanRead)
    def plan_with_supervisor(
        payload: AgentPlanRequest,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        active_parameters = _active_parameter_context(session, tenant.tenant_id)
        orchestrator = agent_orchestrator_provider()
        model = agent_orchestrator_model() if orchestrator == "deepagents" else None
        run = start_ai_run(
            session,
            tenant,
            run_type="formulation_supervisor",
            provider=orchestrator,
            model=model,
            input_json={
                "text": payload.text,
                "active_parameters": active_parameters,
            },
        )
        try:
            plan = plan_formulation_request(
                session=session,
                run=run,
                text=payload.text,
                active_parameters=active_parameters,
            )
        except MissingOpenAIKeyError as exc:
            finish_ai_run(session, run, status="error", error=str(exc))
            raise HTTPException(status_code=503, detail=str(exc)) from exc
        except DeepAgentsUnavailableError as exc:
            finish_ai_run(session, run, status="error", error=str(exc))
            raise HTTPException(status_code=501, detail=str(exc)) from exc
        except (AgentOrchestrationError, OpenAIRequirementParserError) as exc:
            finish_ai_run(session, run, status="error", error=str(exc))
            raise HTTPException(status_code=502, detail=str(exc)) from exc

        result = {**plan, "run_id": run.id}
        finish_ai_run(session, run, status="success", output_json=result)
        return result

    @app.post(
        "/api/v1/imports/formulas/excel/sheets",
        response_model=ExcelImportSheetsRead,
    )
    async def list_formula_excel_import_sheets(
        file: UploadFile = File(...),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        _ensure_xlsx_file(file)
        try:
            sheets = list_formula_xlsx_sheets(await file.read())
        except ExcelImportError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        if not sheets:
            raise HTTPException(status_code=400, detail="XLSX file has no worksheets.")
        return {"sheets": sheets, "default_sheet": sheets[0]}

    @app.post(
        "/api/v1/imports/formulas/excel/preview",
        response_model=ExcelImportPreviewRead,
    )
    async def preview_formula_excel_import(
        file: UploadFile = File(...),
        sheet_name: str | None = Form(None),
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        _ensure_xlsx_file(file)
        try:
            parsed = parse_formula_xlsx(await file.read(), sheet_name=sheet_name)
        except ExcelImportError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        return _excel_preview(session, tenant.tenant_id, parsed)

    @app.post("/api/v1/imports/formulas/excel/save", response_model=FormulaRead, status_code=201)
    def save_formula_excel_import(
        payload: ExcelImportSaveRequest,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        if not payload.rows:
            raise HTTPException(status_code=400, detail="Import rows are required.")
        formula = Formula(
            tenant_id=tenant.tenant_id,
            name=payload.name,
            jira_project_id=_formula_jira_project_id(payload.jira_project_id, payload.name),
            jira_issue_type=payload.jira_issue_type,
            jira_product_type=payload.jira_product_type,
            created_by=tenant.user_id,
        )
        session.add(formula)
        session.commit()
        session.refresh(formula)
        _replace_formula_items(session, tenant.tenant_id, formula.id, payload.rows)
        return _formula_read(session, formula)


def _active_parameter_context(
    session: Session,
    tenant_id: uuid.UUID,
) -> list[dict[str, str]]:
    parameters = sort_parameters(
        session.exec(
            select(Parameter)
            .where(Parameter.tenant_id == tenant_id, Parameter.is_active.is_(True))
            .order_by(Parameter.code)
        ).all(),
        key=lambda parameter: parameter.code,
    )
    return [
        {"code": parameter.code, "name": parameter.name, "unit": parameter.unit}
        for parameter in parameters
    ]


def _ensure_xlsx_file(file: UploadFile) -> None:
    if not file.filename or not file.filename.lower().endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Only .xlsx files are supported.")


def _get_raw_material(
    session: Session,
    tenant_id: uuid.UUID,
    raw_material_id: uuid.UUID,
) -> RawMaterial:
    raw_material = session.exec(
        select(RawMaterial).where(
            RawMaterial.id == raw_material_id,
            RawMaterial.tenant_id == tenant_id,
        )
    ).first()
    if raw_material is None:
        raise HTTPException(status_code=404, detail="Raw material not found.")
    return raw_material


def _get_raw_material_import(
    session: Session,
    tenant_id: uuid.UUID,
    import_id: uuid.UUID,
) -> RawMaterialImport:
    import_record = session.exec(
        select(RawMaterialImport).where(
            RawMaterialImport.id == import_id,
            RawMaterialImport.tenant_id == tenant_id,
        )
    ).first()
    if import_record is None:
        raise HTTPException(status_code=404, detail="Raw material import not found.")
    return import_record


def _get_parameter(session: Session, tenant_id: uuid.UUID, parameter_id: uuid.UUID) -> Parameter:
    parameter = session.exec(
        select(Parameter).where(Parameter.id == parameter_id, Parameter.tenant_id == tenant_id)
    ).first()
    if parameter is None:
        raise HTTPException(status_code=404, detail="Parameter not found.")
    return parameter


def _raw_material_read(
    session: Session,
    tenant_id: uuid.UUID,
    material: RawMaterial,
) -> dict[str, Any]:
    price = session.exec(
        select(RawMaterialPrice)
        .where(
            RawMaterialPrice.tenant_id == tenant_id,
            RawMaterialPrice.raw_material_id == material.id,
        )
        .order_by(RawMaterialPrice.valid_from.desc(), RawMaterialPrice.created_at.desc())
    ).first()
    values = session.exec(
        select(RawMaterialParameterValue, Parameter)
        .join(Parameter, RawMaterialParameterValue.parameter_id == Parameter.id)
        .where(
            RawMaterialParameterValue.tenant_id == tenant_id,
            RawMaterialParameterValue.raw_material_id == material.id,
            Parameter.tenant_id == tenant_id,
        )
        .order_by(Parameter.code)
    ).all()
    active_parameters = session.exec(
        select(Parameter)
        .where(Parameter.tenant_id == tenant_id, Parameter.is_active.is_(True))
        .order_by(Parameter.code)
    ).all()
    aliases = session.exec(
        select(RawMaterialAlias)
        .where(
            RawMaterialAlias.tenant_id == tenant_id,
            RawMaterialAlias.raw_material_id == material.id,
        )
        .order_by(RawMaterialAlias.alias)
    ).all()
    return _raw_material_read_from_parts(material, price, values, aliases, active_parameters)


def _raw_materials_read(
    session: Session,
    tenant_id: uuid.UUID,
    materials: list[RawMaterial],
) -> list[dict[str, Any]]:
    material_ids = [material.id for material in materials]
    if not material_ids:
        return []

    prices_by_material: dict[uuid.UUID, RawMaterialPrice] = {}
    prices = session.exec(
        select(RawMaterialPrice)
        .where(
            RawMaterialPrice.tenant_id == tenant_id,
            RawMaterialPrice.raw_material_id.in_(material_ids),
        )
        .order_by(
            RawMaterialPrice.raw_material_id,
            RawMaterialPrice.valid_from.desc(),
            RawMaterialPrice.created_at.desc(),
        )
    ).all()
    for price in prices:
        prices_by_material.setdefault(price.raw_material_id, price)

    values_by_material: dict[uuid.UUID, list[tuple[RawMaterialParameterValue, Parameter]]] = (
        defaultdict(list)
    )
    values = session.exec(
        select(RawMaterialParameterValue, Parameter)
        .join(Parameter, RawMaterialParameterValue.parameter_id == Parameter.id)
        .where(
            RawMaterialParameterValue.tenant_id == tenant_id,
            RawMaterialParameterValue.raw_material_id.in_(material_ids),
            Parameter.tenant_id == tenant_id,
        )
        .order_by(RawMaterialParameterValue.raw_material_id, Parameter.code)
    ).all()
    for value, parameter in values:
        values_by_material[value.raw_material_id].append((value, parameter))

    active_parameters = session.exec(
        select(Parameter)
        .where(Parameter.tenant_id == tenant_id, Parameter.is_active.is_(True))
        .order_by(Parameter.code)
    ).all()

    aliases_by_material: dict[uuid.UUID, list[RawMaterialAlias]] = defaultdict(list)
    aliases = session.exec(
        select(RawMaterialAlias)
        .where(
            RawMaterialAlias.tenant_id == tenant_id,
            RawMaterialAlias.raw_material_id.in_(material_ids),
        )
        .order_by(RawMaterialAlias.raw_material_id, RawMaterialAlias.alias)
    ).all()
    for alias in aliases:
        aliases_by_material[alias.raw_material_id].append(alias)

    return [
        _raw_material_read_from_parts(
            material,
            prices_by_material.get(material.id),
            values_by_material[material.id],
            aliases_by_material[material.id],
            active_parameters,
        )
        for material in materials
    ]


def _raw_material_read_from_parts(
    material: RawMaterial,
    price: RawMaterialPrice | None,
    values: list[tuple[RawMaterialParameterValue, Parameter]],
    aliases: list[RawMaterialAlias],
    active_parameters: list[Parameter],
) -> dict[str, Any]:
    return {
        **_model_dict(material),
        "current_price": _model_dict(price) if price else None,
        "parameters": _raw_material_parameter_values_read(values, active_parameters),
        "aliases": [alias.alias for alias in aliases],
    }


def _raw_material_parameter_values_read(
    values: list[tuple[RawMaterialParameterValue, Parameter]],
    active_parameters: list[Parameter],
) -> list[dict[str, Any]]:
    rows_by_parameter_id = {
        value.parameter_id: {
            "parameter_id": value.parameter_id,
            "code": parameter.code,
            "name": parameter.name,
            "value": value.value,
            "unit": parameter.unit,
            "source": value.source,
            "confidence": value.confidence,
        }
        for value, parameter in values
    }
    for parameter in active_parameters:
        rows_by_parameter_id.setdefault(
            parameter.id,
            {
                "parameter_id": parameter.id,
                "code": parameter.code,
                "name": parameter.name,
                "value": 0,
                "unit": parameter.unit,
                "source": "default_zero",
                "confidence": None,
            },
        )
    return sorted(
        rows_by_parameter_id.values(),
        key=lambda row: parameter_sort_key(str(row["code"])),
    )


def _ensure_zero_values_for_raw_material(
    session: Session,
    tenant_id: uuid.UUID,
    material: RawMaterial,
) -> None:
    parameters = session.exec(
        select(Parameter).where(
            Parameter.tenant_id == tenant_id,
            Parameter.is_active.is_(True),
        )
    ).all()
    if not parameters:
        return

    existing_parameter_ids = {
        value.parameter_id
        for value in session.exec(
            select(RawMaterialParameterValue).where(
                RawMaterialParameterValue.tenant_id == tenant_id,
                RawMaterialParameterValue.raw_material_id == material.id,
            )
        ).all()
    }
    for parameter in parameters:
        if parameter.id in existing_parameter_ids:
            continue
        session.add(
            RawMaterialParameterValue(
                tenant_id=tenant_id,
                raw_material_id=material.id,
                parameter_id=parameter.id,
                value=0,
                source="default_zero",
            )
        )
    session.commit()


def _ensure_zero_values_for_parameter(
    session: Session,
    tenant_id: uuid.UUID,
    parameter: Parameter,
) -> None:
    materials = session.exec(
        select(RawMaterial).where(RawMaterial.tenant_id == tenant_id)
    ).all()
    if not materials:
        return

    existing_material_ids = {
        value.raw_material_id
        for value in session.exec(
            select(RawMaterialParameterValue).where(
                RawMaterialParameterValue.tenant_id == tenant_id,
                RawMaterialParameterValue.parameter_id == parameter.id,
            )
        ).all()
    }
    for material in materials:
        if material.id in existing_material_ids:
            continue
        session.add(
            RawMaterialParameterValue(
                tenant_id=tenant_id,
                raw_material_id=material.id,
                parameter_id=parameter.id,
                value=0,
                source="default_zero",
            )
        )
    session.commit()


def _raw_material_catalog_read(
    session: Session,
    tenant_id: uuid.UUID,
    materials: list[RawMaterial],
    *,
    q: str | None,
    family: str | None,
    price_filter: str,
    price_min: float | None,
    price_max: float | None,
    parameter: str | None,
    parameter_range: list[str],
    only_positive: bool,
    limit: int,
    offset: int,
) -> dict[str, Any]:
    material_ids = [material.id for material in materials]
    if not material_ids:
        return {"items": [], "total": 0, "limit": limit, "offset": offset, "families": []}

    prices_by_material: dict[uuid.UUID, RawMaterialPrice] = {}
    prices = session.exec(
        select(RawMaterialPrice)
        .where(
            RawMaterialPrice.tenant_id == tenant_id,
            RawMaterialPrice.raw_material_id.in_(material_ids),
        )
        .order_by(
            RawMaterialPrice.raw_material_id,
            RawMaterialPrice.valid_from.desc(),
            RawMaterialPrice.created_at.desc(),
        )
    ).all()
    for price in prices:
        prices_by_material.setdefault(price.raw_material_id, price)

    aliases_by_material: dict[uuid.UUID, list[RawMaterialAlias]] = defaultdict(list)
    aliases = session.exec(
        select(RawMaterialAlias)
        .where(
            RawMaterialAlias.tenant_id == tenant_id,
            RawMaterialAlias.raw_material_id.in_(material_ids),
        )
        .order_by(RawMaterialAlias.raw_material_id, RawMaterialAlias.alias)
    ).all()
    for alias in aliases:
        aliases_by_material[alias.raw_material_id].append(alias)

    active_parameters = session.exec(
        select(Parameter).where(
            Parameter.tenant_id == tenant_id,
            Parameter.is_active.is_(True),
        )
    ).all()
    active_parameter_keys = {_match_key(parameter.code) for parameter in active_parameters}
    active_parameter_count = len(active_parameter_keys)

    parameter_stats_by_material: dict[uuid.UUID, dict[str, Any]] = defaultdict(
        lambda: {
            "count": active_parameter_count,
            "positive_count": 0,
            "codes": set(active_parameter_keys),
            "positive_codes": set(),
            "values": {},
        }
    )
    values = session.exec(
        select(RawMaterialParameterValue, Parameter)
        .join(Parameter, RawMaterialParameterValue.parameter_id == Parameter.id)
        .where(
            RawMaterialParameterValue.tenant_id == tenant_id,
            RawMaterialParameterValue.raw_material_id.in_(material_ids),
            Parameter.tenant_id == tenant_id,
        )
    ).all()
    for value, value_parameter in values:
        stats = parameter_stats_by_material[value.raw_material_id]
        code_key = _match_key(value_parameter.code)
        stats["codes"].add(code_key)
        stats["values"][code_key] = value.value
        if abs(value.value) > 0.0001:
            stats["positive_codes"].add(code_key)
    for stats in parameter_stats_by_material.values():
        stats["count"] = max(int(stats["count"]), len(stats["codes"]))
        stats["positive_count"] = len(stats["positive_codes"])

    query = _normalize(q or "")
    family_filter = (family or "all").strip()
    parameter_filter = _match_key(parameter)
    range_filters = _parse_catalog_parameter_ranges(parameter_range)
    normalized_price_filter = price_filter.strip().casefold()

    filtered = []
    for material in materials:
        price = prices_by_material.get(material.id)
        aliases_for_material = aliases_by_material[material.id]
        stats = parameter_stats_by_material[material.id]

        if family_filter and family_filter != "all" and material.family != family_filter:
            continue
        if normalized_price_filter == "with_price" and price is None:
            continue
        if normalized_price_filter == "missing_price" and price is not None:
            continue
        if price_min is not None and (price is None or price.price < price_min):
            continue
        if price_max is not None and (price is None or price.price > price_max):
            continue
        if parameter_filter:
            if parameter_filter in active_parameter_keys:
                value = stats["values"].get(parameter_filter, 0)
                if only_positive and abs(value) <= 0.0001:
                    continue
            else:
                parameter_codes = stats["positive_codes"] if only_positive else stats["codes"]
                if parameter_filter not in parameter_codes:
                    continue
        if not _catalog_parameter_ranges_match(stats["values"], range_filters):
            continue
        if query:
            candidates = [
                material.name,
                material.normalized_name,
                material.code or "",
                material.external_code or "",
                material.family or "",
                material.subfamily or "",
                *(alias.alias for alias in aliases_for_material),
            ]
            if not any(query in _normalize(candidate) for candidate in candidates):
                continue

        filtered.append(
            {
                **_model_dict(material),
                "current_price": _model_dict(price) if price else None,
                "parameter_count": int(stats["count"]),
                "positive_parameter_count": int(stats["positive_count"]),
                "aliases": [alias.alias for alias in aliases_for_material],
            }
        )

    total = len(filtered)
    return {
        "items": filtered[offset : offset + limit],
        "total": total,
        "limit": limit,
        "offset": offset,
        "families": sorted(
            {material.family for material in materials if material.family},
            key=lambda value: value.casefold(),
        ),
    }


def _parse_catalog_parameter_ranges(
    raw_ranges: list[str],
) -> list[tuple[str, float | None, float | None]]:
    ranges: list[tuple[str, float | None, float | None]] = []
    for raw_range in raw_ranges:
        parts = raw_range.split("|")
        if not parts:
            continue
        code = _match_key(parts[0])
        if not code:
            continue
        min_value = _parse_float_filter(parts[1]) if len(parts) > 1 else None
        max_value = _parse_float_filter(parts[2]) if len(parts) > 2 else None
        ranges.append((code, min_value, max_value))
    return ranges


def _parse_float_filter(value: str | None) -> float | None:
    if value is None or value.strip() == "":
        return None
    try:
        return float(value)
    except ValueError:
        return None


def _catalog_parameter_ranges_match(
    values: dict[str, float],
    range_filters: list[tuple[str, float | None, float | None]],
) -> bool:
    for code, min_value, max_value in range_filters:
        value = values.get(code, 0)
        if min_value is not None and value < min_value:
            return False
        if max_value is not None and value > max_value:
            return False
    return True


def _get_formula(session: Session, tenant_id: uuid.UUID, formula_id: uuid.UUID) -> Formula:
    formula = session.exec(
        select(Formula).where(Formula.id == formula_id, Formula.tenant_id == tenant_id)
    ).first()
    if formula is None:
        raise HTTPException(status_code=404, detail="Formula not found.")
    return formula


def _replace_formula_items(
    session: Session,
    tenant_id: uuid.UUID,
    formula_id: uuid.UUID,
    items: list[Any],
) -> None:
    for existing in session.exec(
        select(FormulaItem).where(
            FormulaItem.tenant_id == tenant_id,
            FormulaItem.formula_id == formula_id,
        )
    ).all():
        session.delete(existing)
    session.commit()

    for index, item in enumerate(items):
        _get_raw_material(session, tenant_id, item.raw_material_id)
        session.add(
            FormulaItem(
                tenant_id=tenant_id,
                formula_id=formula_id,
                raw_material_id=item.raw_material_id,
                percentage=item.percentage,
                order_index=getattr(item, "order_index", index) or index,
            )
        )
    session.commit()


def _formula_read(session: Session, formula: Formula) -> dict[str, Any]:
    items = session.exec(
        select(FormulaItem)
        .where(FormulaItem.tenant_id == formula.tenant_id, FormulaItem.formula_id == formula.id)
        .order_by(FormulaItem.order_index)
    ).all()
    return {
        **_model_dict(formula),
        "items": [_model_dict(item) for item in items],
    }


def _formula_jira_project_id(value: str | None, formula_name: str) -> str:
    cleaned = (value or "").strip()
    if cleaned:
        return cleaned.upper()
    name_parts = formula_name.split()
    first_token = "".join(
        character for character in (name_parts[0] if name_parts else "").upper() if character.isalnum()
    )
    return first_token or "FORMULA"


def _calculate(
    session: Session,
    tenant_id: uuid.UUID,
    items: list[FormulaItem],
    required_parameter_codes: set[str] | None = None,
) -> dict[str, Any]:
    material_ids = [item.raw_material_id for item in items]
    materials = session.exec(
        select(RawMaterial).where(
            RawMaterial.tenant_id == tenant_id,
            RawMaterial.id.in_(material_ids),
        )
    ).all()
    core_materials = [
        _core_raw_material(session, tenant_id, material)
        for material in materials
    ]
    calculation = calculate_formula(
        items=[
            CoreFormulaItem(raw_material_id=str(item.raw_material_id), percentage=item.percentage)
            for item in items
        ],
        raw_materials=core_materials,
        required_parameter_codes=required_parameter_codes,
    )
    compatibility_warnings = _compatibility_warnings(session, tenant_id, items)
    return {
        "total_percentage": calculation.total_percentage,
        "price_total": calculation.price_total,
        "currency": calculation.currency,
        "parameters": [
            {"code": parameter.code, "value": parameter.value, "unit": parameter.unit}
            for parameter in sort_parameters(
                calculation.parameters.values(),
                key=lambda parameter: parameter.code,
            )
        ],
        "warnings": [
            {
                "code": warning.code,
                "message": warning.message,
                "raw_material_id": warning.raw_material_id,
                "parameter_code": warning.parameter_code,
            }
            for warning in calculation.warnings
        ]
        + compatibility_warnings,
    }


def _formula_excel_context(
    session: Session,
    tenant_id: uuid.UUID,
    *,
    name: str,
    items: list[Any],
    version: int,
    metadata: FormulaExcelMetadata | None = None,
) -> FormulaExcelContext:
    material_ids = [item.raw_material_id for item in items]
    materials = session.exec(
        select(RawMaterial).where(
            RawMaterial.tenant_id == tenant_id,
            RawMaterial.id.in_(material_ids),
        )
    ).all()
    materials_by_id = {material.id: material for material in materials}
    missing_material_ids = [
        str(material_id) for material_id in material_ids if material_id not in materials_by_id
    ]
    if missing_material_ids:
        raise HTTPException(
            status_code=404,
            detail=f"Raw material not found: {', '.join(missing_material_ids)}",
        )

    parameters = sort_parameters(
        session.exec(
            select(Parameter)
            .where(Parameter.tenant_id == tenant_id, Parameter.is_active.is_(True))
            .order_by(Parameter.code)
        ).all(),
        key=lambda parameter: parameter.code,
    )
    prices_by_material_id = current_prices_by_material_id(session, tenant_id, material_ids)
    values_by_material_id = active_parameter_value_map_by_material_id(
        session,
        tenant_id,
        material_ids,
    )

    excel_items = [
        FormulaExcelItem(
            name=materials_by_id[item.raw_material_id].name,
            code=materials_by_id[item.raw_material_id].code,
            percentage=item.percentage,
            order_index=getattr(item, "order_index", 0) or 0,
            price=(
                prices_by_material_id[item.raw_material_id].price
                if item.raw_material_id in prices_by_material_id
                else None
            ),
            parameters=values_by_material_id.get(item.raw_material_id, {}),
        )
        for item in items
    ]
    excel_parameters = [
        FormulaExcelParameter(
            code=parameter.code,
            label=parameter.code,
            unit=parameter.unit,
            decimals=parameter.decimals,
        )
        for parameter in parameters
    ]
    return FormulaExcelContext(
        name=name,
        version=version,
        items=excel_items,
        parameters=excel_parameters,
        metadata=metadata or FormulaExcelMetadata(),
    )


def _excel_download_response(content: bytes, file_name: str) -> Response:
    return Response(
        content=content,
        media_type=FORMULA_ID_LAB_EXCEL_CONTENT_TYPE,
        headers={"Content-Disposition": f'attachment; filename="{file_name}"'},
    )


def _compatibility_warnings(
    session: Session,
    tenant_id: uuid.UUID,
    items: list[FormulaItem],
) -> list[dict[str, Any]]:
    selected_ids = {str(item.raw_material_id) for item in items}
    if len(selected_ids) < 2:
        return []

    rules = session.exec(
        select(CompatibilityRule).where(
            CompatibilityRule.tenant_id == tenant_id,
            CompatibilityRule.active.is_(True),
            CompatibilityRule.rule_type == "material_pair",
        )
    ).all()
    warnings: list[dict[str, Any]] = []
    for rule in rules:
        rule_material_ids = set(rule.condition_json.get("raw_material_ids", []))
        if rule_material_ids and rule_material_ids.issubset(selected_ids):
            recommended_action = rule.condition_json.get("recommended_action")
            warnings.append(
                {
                    "code": f"compatibility_{rule.severity}",
                    "severity": rule.severity,
                    "rule_id": str(rule.id),
                    "message": rule.message,
                    "recommended_action": recommended_action,
                    "raw_material_id": None,
                    "parameter_code": None,
                }
            )
    return warnings


def _excel_preview(
    session: Session,
    tenant_id: uuid.UUID,
    parsed: ParsedFormulaImport,
) -> dict[str, Any]:
    materials = session.exec(
        select(RawMaterial).where(RawMaterial.tenant_id == tenant_id)
    ).all()
    by_code = {
        _match_key(material.code): material
        for material in materials
        if material.code
    }
    by_name = {material.normalized_name: material for material in materials}
    by_alias = _raw_materials_by_alias(session, tenant_id)
    rows = [
        _excel_preview_row(
            row,
            by_code=by_code,
            by_name=by_name,
            by_alias=by_alias,
            materials=materials,
        )
        for row in parsed.rows
    ]
    resolved_rows = sum(1 for row in rows if row["raw_material_id"] is not None)
    pending_rows = sum(1 for row in rows if row["status"] != "matched_exact")
    return {
        "sheet_name": parsed.sheet_name,
        "available_sheets": parsed.available_sheets,
        "parser": parsed.parser,
        "formula_name": parsed.formula_name,
        "parameter_headers": parsed.parameter_headers,
        "warnings": parsed.warnings,
        "columns": {
            "material_name": parsed.columns.material_name,
            "material_code": parsed.columns.material_code,
            "percentage": parsed.columns.percentage,
        },
        "rows": rows,
        "total_percentage": parsed.total_percentage,
        "resolved_rows": resolved_rows,
        "pending_rows": pending_rows,
    }


def _excel_preview_row(
    row: ParsedFormulaRow,
    *,
    by_code: dict[str, RawMaterial],
    by_name: dict[str, RawMaterial],
    by_alias: dict[str, RawMaterial],
    materials: list[RawMaterial],
) -> dict[str, Any]:
    if row.status == "invalid_percentage":
        return {
            **_parsed_row_dict(row),
            "raw_material_id": None,
            "matched_by": None,
        }
    if row.material_code and (material := by_code.get(_match_key(row.material_code))):
        return _matched_excel_preview_row(row, material, matched_by="code")
    if row.material_name and (material := by_name.get(_normalize(row.material_name))):
        return _matched_excel_preview_row(row, material, matched_by="name")
    if row.material_name and (material := by_alias.get(_normalize(row.material_name))):
        return _matched_excel_preview_row(row, material, matched_by="alias")
    if row.material_code and (material := by_alias.get(_normalize(row.material_code))):
        return _matched_excel_preview_row(row, material, matched_by="alias")
    suggestion = _fuzzy_material_suggestion(row, materials)
    suggested_fields = (
        {
            "suggested_raw_material_id": suggestion[0].id,
            "suggested_material_name": suggestion[0].name,
            "suggested_match_score": suggestion[1],
        }
        if suggestion
        else {}
    )
    return {
        **_parsed_row_dict(row),
        **suggested_fields,
        "raw_material_id": None,
        "matched_by": None,
        "status": "needs_review",
        "message": "No exact raw material match was found.",
    }


def _matched_excel_preview_row(
    row: ParsedFormulaRow,
    material: RawMaterial,
    *,
    matched_by: str,
) -> dict[str, Any]:
    return {
        **_parsed_row_dict(row),
        "raw_material_id": material.id,
        "resolved_material_code": material.code,
        "resolved_material_name": material.name,
        "matched_by": matched_by,
        "status": "matched_exact",
        "message": None,
    }


def _fuzzy_material_suggestion(
    row: ParsedFormulaRow,
    materials: list[RawMaterial],
) -> tuple[RawMaterial, float] | None:
    query = _normalize(row.material_name or row.material_code or "")
    if not query:
        return None

    best_material: RawMaterial | None = None
    best_score = 0.0
    for material in materials:
        candidates = [material.normalized_name]
        if material.code:
            candidates.append(_normalize(material.code))
        score = max(SequenceMatcher(None, query, candidate).ratio() for candidate in candidates)
        if score > best_score:
            best_material = material
            best_score = score

    if best_material is None or best_score < FUZZY_SUGGESTION_THRESHOLD:
        return None
    return best_material, round(best_score, 2)


def _raw_materials_by_alias(
    session: Session,
    tenant_id: uuid.UUID,
) -> dict[str, RawMaterial]:
    rows = session.exec(
        select(RawMaterialAlias, RawMaterial)
        .join(RawMaterial, RawMaterialAlias.raw_material_id == RawMaterial.id)
        .where(
            RawMaterialAlias.tenant_id == tenant_id,
            RawMaterial.tenant_id == tenant_id,
        )
    ).all()
    return {alias.normalized_alias: material for alias, material in rows}


def _parsed_row_dict(row: ParsedFormulaRow) -> dict[str, Any]:
    return {
        "row_number": row.row_number,
        "material_code": row.material_code,
        "material_name": row.material_name,
        "percentage": row.percentage,
        "imported_price": row.price,
        "imported_parameters": row.parameters,
        "lab_material_name": row.lab_material_name,
        "lab_observation": row.lab_observation,
        "status": row.status,
        "message": row.message,
    }


def _core_raw_material(
    session: Session,
    tenant_id: uuid.UUID,
    material: RawMaterial,
) -> CoreRawMaterial:
    price = session.exec(
        select(RawMaterialPrice)
        .where(
            RawMaterialPrice.tenant_id == tenant_id,
            RawMaterialPrice.raw_material_id == material.id,
        )
        .order_by(RawMaterialPrice.valid_from.desc(), RawMaterialPrice.created_at.desc())
    ).first()
    active_parameters = session.exec(
        select(Parameter).where(
            Parameter.tenant_id == tenant_id,
            Parameter.is_active.is_(True),
        )
    ).all()
    values = session.exec(
        select(RawMaterialParameterValue, Parameter)
        .join(Parameter, RawMaterialParameterValue.parameter_id == Parameter.id)
        .where(
            RawMaterialParameterValue.tenant_id == tenant_id,
            RawMaterialParameterValue.raw_material_id == material.id,
            Parameter.tenant_id == tenant_id,
        )
    ).all()
    parameters = {
        parameter.code: CoreParameterValue(
            code=parameter.code,
            value=value.value,
            unit=parameter.unit,
        )
        for value, parameter in values
    }
    for parameter in active_parameters:
        parameters.setdefault(
            parameter.code,
            CoreParameterValue(code=parameter.code, value=0, unit=parameter.unit),
        )
    return CoreRawMaterial(
        id=str(material.id),
        name=material.name,
        price=price.price if price else None,
        currency=price.currency if price else "EUR",
        parameters=parameters,
    )


def _model_dict(model: Any) -> dict[str, Any]:
    return model.model_dump(mode="json")


def _tenant_read(tenant: Tenant, role: str | None) -> dict[str, Any]:
    return {
        "id": tenant.id,
        "name": tenant.name,
        "slug": tenant.slug,
        "status": tenant.status,
        "role": role,
    }


def _tenant_invitation_read(
    invitation: TenantInvitation,
    email_delivery_status: str | None = None,
) -> dict[str, Any]:
    return {
        "id": invitation.id,
        "tenant_id": invitation.tenant_id,
        "email": invitation.email,
        "role": invitation.role,
        "status": invitation.status,
        "invited_by": invitation.invited_by,
        "accepted_by": invitation.accepted_by,
        "expires_at": invitation.expires_at,
        "created_at": invitation.created_at,
        "accepted_at": invitation.accepted_at,
        "email_delivery_status": email_delivery_status,
    }


def _normalize(value: str) -> str:
    return " ".join(value.strip().lower().split())


def _match_key(value: str | None) -> str:
    return "" if value is None else value.strip().casefold()


def _cors_origins() -> list[str]:
    raw_origins = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    )
    return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]


app = create_app()
