from __future__ import annotations

import uuid
import os
from contextlib import asynccontextmanager
from datetime import date
from difflib import SequenceMatcher
from typing import Any

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from sqlalchemy import Engine
from sqlmodel import Session, select

from formulia_core import (
    FormulaItem as CoreFormulaItem,
    ParameterValue as CoreParameterValue,
    RawMaterial as CoreRawMaterial,
    calculate_formula,
)

from .database import create_db_engine, get_session, init_db
from .excel_import import (
    ColumnMapping,
    ExcelImportError,
    ParsedFormulaImport,
    ParsedFormulaRow,
    list_formula_xlsx_columns,
    list_formula_xlsx_sheets,
    parse_formula_xlsx,
)
from .formula_export import FormulaExportLine, FormulaExportSummary, build_formula_xlsx
from .models import (
    Formula,
    FormulaCalculationResult,
    FormulaItem,
    Parameter,
    RawMaterial,
    RawMaterialAlias,
    RawMaterialParameterValue,
    RawMaterialPrice,
    Tenant,
    TenantMember,
    User,
    utc_now,
)
from .schemas import (
    CalculationRead,
    ExcelImportColumnsRead,
    ExcelImportPreviewRead,
    ExcelImportSaveRequest,
    ExcelImportSheetsRead,
    FormulaCalculationHistoryRead,
    FormulaCalculateRequest,
    FormulaCompareRequest,
    FormulaComparisonRead,
    FormulaCreate,
    FormulaRead,
    FormulaUpdate,
    OptimizationValidateRequest,
    OptimizationValidationRead,
    ParameterCreate,
    ParameterRead,
    RawMaterialCreate,
    RawMaterialAliasCreate,
    RawMaterialAliasRead,
    RawMaterialParameterValueCreate,
    RawMaterialPriceCreate,
    RawMaterialPriceRead,
    RawMaterialRead,
    RawMaterialUpdate,
    TenantCreate,
    TenantRead,
)
from .tenant import TenantContext, get_current_user, require_tenant_context


FUZZY_SUGGESTION_THRESHOLD = 0.82


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
    ) -> list[Tenant]:
        memberships = session.exec(
            select(TenantMember).where(
                TenantMember.user_id == user.id,
                TenantMember.status == "active",
            )
        ).all()
        tenant_ids = [membership.tenant_id for membership in memberships]
        if not tenant_ids:
            return []
        return session.exec(select(Tenant).where(Tenant.id.in_(tenant_ids))).all()

    @app.post("/api/v1/tenants", response_model=TenantRead, status_code=201)
    def create_tenant(
        payload: TenantCreate,
        session: Session = Depends(get_session),
        user: User = Depends(get_current_user),
    ) -> Tenant:
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
        return tenant

    @app.get("/api/v1/parameters", response_model=list[ParameterRead])
    def list_parameters(
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> list[Parameter]:
        return session.exec(
            select(Parameter).where(Parameter.tenant_id == tenant.tenant_id)
        ).all()

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
        return parameter

    @app.get("/api/v1/raw-materials", response_model=list[RawMaterialRead])
    def list_raw_materials(
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> list[RawMaterial]:
        return session.exec(
            select(RawMaterial).where(RawMaterial.tenant_id == tenant.tenant_id)
        ).all()

    @app.post("/api/v1/raw-materials", response_model=RawMaterialRead, status_code=201)
    def create_raw_material(
        payload: RawMaterialCreate,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> RawMaterial:
        raw_material = RawMaterial(
            tenant_id=tenant.tenant_id,
            normalized_name=_normalize(payload.name),
            **payload.model_dump(),
        )
        session.add(raw_material)
        session.commit()
        session.refresh(raw_material)
        return raw_material

    @app.get("/api/v1/raw-materials/{raw_material_id}", response_model=RawMaterialRead)
    def get_raw_material(
        raw_material_id: uuid.UUID,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> RawMaterial:
        return _get_raw_material(session, tenant.tenant_id, raw_material_id)

    @app.patch("/api/v1/raw-materials/{raw_material_id}", response_model=RawMaterialRead)
    def update_raw_material(
        raw_material_id: uuid.UUID,
        payload: RawMaterialUpdate,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> RawMaterial:
        raw_material = _get_raw_material(session, tenant.tenant_id, raw_material_id)
        updates = payload.model_dump(exclude_unset=True)
        if "name" in updates and updates["name"] is not None:
            updates["normalized_name"] = _normalize(updates["name"])
        for key, value in updates.items():
            setattr(raw_material, key, value)
        raw_material.updated_at = utc_now()
        session.add(raw_material)
        session.commit()
        session.refresh(raw_material)
        return raw_material

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
    def list_raw_material_prices(
        raw_material_id: uuid.UUID,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> list[dict[str, Any]]:
        _get_raw_material(session, tenant.tenant_id, raw_material_id)
        prices = session.exec(
            select(RawMaterialPrice)
            .where(
                RawMaterialPrice.tenant_id == tenant.tenant_id,
                RawMaterialPrice.raw_material_id == raw_material_id,
            )
            .order_by(RawMaterialPrice.valid_from.desc(), RawMaterialPrice.created_at.desc())
        ).all()
        return [_model_dict(price) for price in prices]

    @app.post("/api/v1/raw-materials/{raw_material_id}/prices", status_code=201)
    def add_raw_material_price(
        raw_material_id: uuid.UUID,
        payload: RawMaterialPriceCreate,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        _get_raw_material(session, tenant.tenant_id, raw_material_id)
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
            created_by=tenant.user_id,
        )
        session.add(formula)
        session.commit()
        session.refresh(formula)
        _replace_formula_items(session, tenant.tenant_id, formula.id, payload.items)
        return _formula_read(session, formula)

    @app.post("/api/v1/formulas/compare", response_model=FormulaComparisonRead)
    def compare_formulas(
        payload: FormulaCompareRequest,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        left = _formula_comparison_side(session, tenant.tenant_id, payload.left_formula_id)
        right = _formula_comparison_side(session, tenant.tenant_id, payload.right_formula_id)
        return {
            "left": left,
            "right": right,
            "delta": _formula_comparison_delta(left, right),
        }

    @app.post("/api/v1/optimizations/validate", response_model=OptimizationValidationRead)
    def validate_optimization(
        payload: OptimizationValidateRequest,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        issues = _optimization_validation_issues(session, tenant.tenant_id, payload)
        return {
            "status": "invalid" if issues else "valid",
            "objective": payload.objective,
            "candidate_count": len(set(payload.candidate_raw_material_ids)),
            "raw_material_bound_count": len(payload.raw_material_bounds),
            "parameter_bound_count": len(payload.parameter_bounds),
            "issues": issues,
        }

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
        items = _formula_items(session, tenant.tenant_id, formula.id)
        required_parameter_codes = _active_parameter_codes(session, tenant.tenant_id)
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

    @app.get("/api/v1/formulas/{formula_id}/export/excel")
    def export_formula_excel(
        formula_id: uuid.UUID,
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> Response:
        formula = _get_formula(session, tenant.tenant_id, formula_id)
        items = _formula_items(session, tenant.tenant_id, formula.id)
        calculation = _calculate(
            session,
            tenant.tenant_id,
            items,
            required_parameter_codes=_active_parameter_codes(session, tenant.tenant_id),
        )
        content = build_formula_xlsx(
            FormulaExportSummary(
                id=str(formula.id),
                name=formula.name,
                version=formula.version,
                status=formula.status,
            ),
            _formula_export_lines(session, tenant.tenant_id, items),
            calculation,
        )
        filename = f"{_safe_filename(formula.name)}.xlsx"
        return Response(
            content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

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
        "/api/v1/imports/formulas/excel/columns",
        response_model=ExcelImportColumnsRead,
    )
    async def list_formula_excel_import_columns(
        file: UploadFile = File(...),
        sheet_name: str | None = Form(None),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        _ensure_xlsx_file(file)
        try:
            columns = list_formula_xlsx_columns(await file.read(), sheet_name=sheet_name)
        except ExcelImportError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        return {
            "sheet_name": columns.sheet_name,
            "available_sheets": columns.available_sheets,
            "header_row": columns.header_row,
            "columns": columns.columns,
            "detected_material_name": columns.detected_material_name,
            "detected_material_code": columns.detected_material_code,
            "detected_percentage": columns.detected_percentage,
        }

    @app.post(
        "/api/v1/imports/formulas/excel/preview",
        response_model=ExcelImportPreviewRead,
    )
    async def preview_formula_excel_import(
        file: UploadFile = File(...),
        sheet_name: str | None = Form(None),
        material_name_column: str | None = Form(None),
        material_code_column: str | None = Form(None),
        percentage_column: str | None = Form(None),
        session: Session = Depends(get_session),
        tenant: TenantContext = Depends(require_tenant_context),
    ) -> dict[str, Any]:
        _ensure_xlsx_file(file)
        try:
            parsed = parse_formula_xlsx(
                await file.read(),
                sheet_name=sheet_name,
                column_mapping=ColumnMapping(
                    material_name=material_name_column,
                    material_code=material_code_column,
                    percentage=percentage_column,
                ),
            )
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
            created_by=tenant.user_id,
        )
        session.add(formula)
        session.commit()
        session.refresh(formula)
        _replace_formula_items(session, tenant.tenant_id, formula.id, payload.rows)
        return _formula_read(session, formula)


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


def _get_parameter(session: Session, tenant_id: uuid.UUID, parameter_id: uuid.UUID) -> Parameter:
    parameter = session.exec(
        select(Parameter).where(Parameter.id == parameter_id, Parameter.tenant_id == tenant_id)
    ).first()
    if parameter is None:
        raise HTTPException(status_code=404, detail="Parameter not found.")
    return parameter


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
    tenant_id = formula.tenant_id
    formula_id = formula.id
    return {
        **_model_dict(formula),
        "items": [
            _model_dict(item)
            for item in _formula_items(session, tenant_id, formula_id)
        ],
    }


def _formula_items(
    session: Session,
    tenant_id: uuid.UUID,
    formula_id: uuid.UUID,
) -> list[FormulaItem]:
    return session.exec(
        select(FormulaItem)
        .where(FormulaItem.tenant_id == tenant_id, FormulaItem.formula_id == formula_id)
        .order_by(FormulaItem.order_index)
    ).all()


def _active_parameter_codes(session: Session, tenant_id: uuid.UUID) -> set[str]:
    return {
        parameter.code
        for parameter in session.exec(
            select(Parameter).where(
                Parameter.tenant_id == tenant_id,
                Parameter.is_active.is_(True),
            )
        ).all()
    }


def _formula_comparison_side(
    session: Session,
    tenant_id: uuid.UUID,
    formula_id: uuid.UUID,
) -> dict[str, Any]:
    formula = _get_formula(session, tenant_id, formula_id)
    items = _formula_items(session, tenant_id, formula.id)
    calculation = _calculate(
        session,
        tenant_id,
        items,
        required_parameter_codes=_active_parameter_codes(session, tenant_id),
    )
    return {
        "id": formula.id,
        "name": formula.name,
        "total_percentage": calculation["total_percentage"],
        "price_total": calculation["price_total"],
        "currency": calculation["currency"],
        "parameters": calculation["parameters"],
        "warnings": calculation["warnings"],
        "line_count": len(items),
    }


def _formula_comparison_delta(
    left: dict[str, Any],
    right: dict[str, Any],
) -> dict[str, Any]:
    left_price = left["price_total"]
    right_price = right["price_total"]
    return {
        "total_percentage": right["total_percentage"] - left["total_percentage"],
        "price_total": (
            None
            if left_price is None or right_price is None
            else right_price - left_price
        ),
        "parameters": _parameter_deltas(left["parameters"], right["parameters"]),
    }


def _parameter_deltas(
    left_parameters: list[dict[str, Any]],
    right_parameters: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    left_by_code = {parameter["code"]: parameter for parameter in left_parameters}
    right_by_code = {parameter["code"]: parameter for parameter in right_parameters}
    deltas = []
    for code in sorted(left_by_code.keys() | right_by_code.keys()):
        left = left_by_code.get(code)
        right = right_by_code.get(code)
        left_value = left["value"] if left else None
        right_value = right["value"] if right else None
        deltas.append(
            {
                "code": code,
                "left_value": left_value,
                "right_value": right_value,
                "delta": (
                    None
                    if left_value is None or right_value is None
                    else right_value - left_value
                ),
                "unit": (right or left or {}).get("unit"),
            }
        )
    return deltas


def _optimization_validation_issues(
    session: Session,
    tenant_id: uuid.UUID,
    payload: OptimizationValidateRequest,
) -> list[dict[str, str]]:
    issues: list[dict[str, str]] = []
    candidate_ids = set(payload.candidate_raw_material_ids)
    bound_material_ids = {
        bound.raw_material_id for bound in payload.raw_material_bounds
    }
    tenant_material_ids = _tenant_raw_material_ids(
        session,
        tenant_id,
        candidate_ids | bound_material_ids,
    )
    active_parameter_codes = _active_parameter_codes(session, tenant_id)

    for raw_material_id in sorted(candidate_ids - tenant_material_ids):
        issues.append(
            _validation_issue(
                "candidate_not_found",
                str(raw_material_id),
                "Candidate raw material was not found for the active tenant",
            )
        )

    for bound in payload.raw_material_bounds:
        raw_material_id = str(bound.raw_material_id)
        if bound.raw_material_id not in tenant_material_ids:
            issues.append(
                _validation_issue(
                    "raw_material_bound_not_found",
                    raw_material_id,
                    "Raw material bound references a material outside the active tenant",
                )
            )
        if _is_invalid_range(bound.min_percentage, bound.max_percentage):
            issues.append(
                _validation_issue(
                    "raw_material_range_invalid",
                    raw_material_id,
                    "Raw material minimum percentage cannot exceed maximum percentage",
                )
            )

    for bound in payload.parameter_bounds:
        if bound.code not in active_parameter_codes:
            issues.append(
                _validation_issue(
                    "parameter_not_found",
                    bound.code,
                    "Parameter bound references an inactive or unknown parameter",
                )
            )
        if _is_invalid_range(bound.min_value, bound.max_value):
            issues.append(
                _validation_issue(
                    "parameter_range_invalid",
                    bound.code,
                    "Parameter minimum value cannot exceed maximum value",
                )
            )

    return issues


def _tenant_raw_material_ids(
    session: Session,
    tenant_id: uuid.UUID,
    raw_material_ids: set[uuid.UUID],
) -> set[uuid.UUID]:
    if not raw_material_ids:
        return set()
    return set(
        session.exec(
            select(RawMaterial.id).where(
                RawMaterial.tenant_id == tenant_id,
                RawMaterial.id.in_(raw_material_ids),
            )
        ).all()
    )


def _is_invalid_range(
    minimum: float | None,
    maximum: float | None,
) -> bool:
    return minimum is not None and maximum is not None and minimum > maximum


def _validation_issue(code: str, target: str, message: str) -> dict[str, str]:
    return {
        "code": code,
        "target": target,
        "message": message,
    }


def _formula_export_lines(
    session: Session,
    tenant_id: uuid.UUID,
    items: list[FormulaItem],
) -> list[FormulaExportLine]:
    if not items:
        return []
    material_ids = [item.raw_material_id for item in items]
    materials = session.exec(
        select(RawMaterial).where(
            RawMaterial.tenant_id == tenant_id,
            RawMaterial.id.in_(material_ids),
        )
    ).all()
    materials_by_id = {material.id: material for material in materials}
    lines: list[FormulaExportLine] = []
    for item in items:
        material = materials_by_id.get(item.raw_material_id)
        if material is None:
            continue
        core_material = _core_raw_material(session, tenant_id, material)
        weighted_cost = (
            None
            if core_material.price is None
            else core_material.price * item.percentage / 100
        )
        lines.append(
            FormulaExportLine(
                order_index=item.order_index,
                material_code=material.code,
                material_name=material.name,
                percentage=item.percentage,
                price=core_material.price,
                currency=core_material.currency,
                weighted_cost=weighted_cost,
            )
        )
    return lines


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
    return {
        "total_percentage": calculation.total_percentage,
        "price_total": calculation.price_total,
        "currency": calculation.currency,
        "parameters": [
            {"code": parameter.code, "value": parameter.value, "unit": parameter.unit}
            for parameter in calculation.parameters.values()
        ],
        "warnings": [
            {
                "code": warning.code,
                "message": warning.message,
                "raw_material_id": warning.raw_material_id,
                "parameter_code": warning.parameter_code,
            }
            for warning in calculation.warnings
        ],
    }


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
        return {
            **_parsed_row_dict(row),
            "raw_material_id": material.id,
            "matched_by": "code",
            "status": "matched_exact",
        }
    if row.material_name and (material := by_name.get(_normalize(row.material_name))):
        return {
            **_parsed_row_dict(row),
            "raw_material_id": material.id,
            "matched_by": "name",
            "status": "matched_exact",
        }
    if row.material_name and (material := by_alias.get(_normalize(row.material_name))):
        return {
            **_parsed_row_dict(row),
            "raw_material_id": material.id,
            "matched_by": "alias",
            "status": "matched_exact",
        }
    if row.material_code and (material := by_alias.get(_normalize(row.material_code))):
        return {
            **_parsed_row_dict(row),
            "raw_material_id": material.id,
            "matched_by": "alias",
            "status": "matched_exact",
        }
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
    return CoreRawMaterial(
        id=str(material.id),
        name=material.name,
        price=price.price if price else None,
        currency=price.currency if price else "EUR",
        parameters=parameters,
    )


def _model_dict(model: Any) -> dict[str, Any]:
    return model.model_dump(mode="json")


def _normalize(value: str) -> str:
    return " ".join(value.strip().lower().split())


def _match_key(value: str | None) -> str:
    return "" if value is None else value.strip().casefold()


def _safe_filename(value: str) -> str:
    normalized = "".join(
        character if character.isalnum() or character in ("-", "_") else "_"
        for character in value.strip()
    ).strip("_")
    return normalized or "formula"


def _cors_origins() -> list[str]:
    raw_origins = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    )
    return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]


app = create_app()
