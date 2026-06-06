from __future__ import annotations

import uuid
from datetime import date, datetime, timezone
from typing import Any

from sqlalchemy import Column
from sqlalchemy.types import JSON
from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(index=True, unique=True)
    name: str | None = None
    created_at: datetime = Field(default_factory=utc_now)


class Tenant(SQLModel, table=True):
    __tablename__ = "tenants"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str
    slug: str = Field(index=True, unique=True)
    status: str = "active"
    created_at: datetime = Field(default_factory=utc_now)


class TenantMember(SQLModel, table=True):
    __tablename__ = "tenant_members"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    tenant_id: uuid.UUID = Field(index=True, foreign_key="tenants.id")
    user_id: uuid.UUID = Field(index=True, foreign_key="users.id")
    role: str
    status: str = "active"
    created_at: datetime = Field(default_factory=utc_now)


class Parameter(SQLModel, table=True):
    __tablename__ = "parameters"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    tenant_id: uuid.UUID = Field(index=True, foreign_key="tenants.id")
    code: str = Field(index=True)
    name: str
    unit: str
    family: str | None = None
    decimals: int = 2
    is_active: bool = True


class RawMaterial(SQLModel, table=True):
    __tablename__ = "raw_materials"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    tenant_id: uuid.UUID = Field(index=True, foreign_key="tenants.id")
    code: str | None = Field(default=None, index=True)
    external_code: str | None = None
    name: str
    normalized_name: str = Field(index=True)
    family: str | None = None
    subfamily: str | None = None
    physical_state: str | None = None
    density: float | None = None
    ph_min: float | None = None
    ph_max: float | None = None
    solubility: str | None = None
    is_active: bool = True
    is_obsolete: bool = False
    notes: str | None = None
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class RawMaterialParameterValue(SQLModel, table=True):
    __tablename__ = "raw_material_parameter_values"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    tenant_id: uuid.UUID = Field(index=True, foreign_key="tenants.id")
    raw_material_id: uuid.UUID = Field(index=True, foreign_key="raw_materials.id")
    parameter_id: uuid.UUID = Field(index=True, foreign_key="parameters.id")
    value: float
    source: str | None = None
    confidence: float | None = None


class RawMaterialPrice(SQLModel, table=True):
    __tablename__ = "raw_material_prices"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    tenant_id: uuid.UUID = Field(index=True, foreign_key="tenants.id")
    raw_material_id: uuid.UUID = Field(index=True, foreign_key="raw_materials.id")
    price: float
    currency: str = "EUR"
    unit: str = "kg"
    supplier: str | None = None
    source: str = "manual"
    valid_from: date = Field(default_factory=date.today)
    valid_to: date | None = None
    created_at: datetime = Field(default_factory=utc_now)


class Formula(SQLModel, table=True):
    __tablename__ = "formulas"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    tenant_id: uuid.UUID = Field(index=True, foreign_key="tenants.id")
    name: str
    version: int = 1
    status: str = "draft"
    objective: str | None = None
    total_price: float | None = None
    currency: str = "EUR"
    created_by: uuid.UUID | None = None
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class FormulaItem(SQLModel, table=True):
    __tablename__ = "formula_items"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    tenant_id: uuid.UUID = Field(index=True, foreign_key="tenants.id")
    formula_id: uuid.UUID = Field(index=True, foreign_key="formulas.id")
    raw_material_id: uuid.UUID = Field(index=True, foreign_key="raw_materials.id")
    percentage: float
    quantity: float | None = None
    unit: str | None = None
    order_index: int = 0


class FormulaCalculationResult(SQLModel, table=True):
    __tablename__ = "formula_calculation_results"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    tenant_id: uuid.UUID = Field(index=True, foreign_key="tenants.id")
    formula_id: uuid.UUID = Field(index=True, foreign_key="formulas.id")
    price_total: float | None = None
    result_json: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    calculated_at: datetime = Field(default_factory=utc_now)
