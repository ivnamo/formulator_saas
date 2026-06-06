from __future__ import annotations

import uuid
import os
from contextlib import asynccontextmanager
from datetime import date
from typing import Any

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import Engine
from sqlmodel import Session, select

from formulia_core import (
    FormulaItem as CoreFormulaItem,
    ParameterValue as CoreParameterValue,
    RawMaterial as CoreRawMaterial,
    calculate_formula,
)

from .database import create_db_engine, get_session, init_db
from .models import (
    Formula,
    FormulaCalculationResult,
    FormulaItem,
    Parameter,
    RawMaterial,
    RawMaterialParameterValue,
    RawMaterialPrice,
    Tenant,
    TenantMember,
    User,
    utc_now,
)
from .schemas import (
    CalculationRead,
    FormulaCalculateRequest,
    FormulaCreate,
    FormulaRead,
    FormulaUpdate,
    ParameterCreate,
    ParameterRead,
    RawMaterialCreate,
    RawMaterialParameterValueCreate,
    RawMaterialPriceCreate,
    RawMaterialRead,
    RawMaterialUpdate,
    TenantCreate,
    TenantRead,
)
from .tenant import TenantContext, get_current_user, require_tenant_context


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
                    Parameter.is_active == True,  # noqa: E712
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
                order_index=item.order_index or index,
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


def _cors_origins() -> list[str]:
    raw_origins = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    )
    return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]


app = create_app()
