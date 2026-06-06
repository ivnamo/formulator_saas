from __future__ import annotations

import uuid
from datetime import date
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class TenantCreate(BaseModel):
    name: str
    slug: str


class TenantRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    status: str


class ParameterCreate(BaseModel):
    code: str
    name: str
    unit: str
    family: str | None = None
    decimals: int = 2


class ParameterRead(ParameterCreate):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    is_active: bool


class RawMaterialCreate(BaseModel):
    code: str | None = None
    external_code: str | None = None
    name: str
    family: str | None = None
    subfamily: str | None = None
    physical_state: str | None = None
    density: float | None = None
    ph_min: float | None = None
    ph_max: float | None = None
    solubility: str | None = None
    notes: str | None = None


class RawMaterialUpdate(BaseModel):
    code: str | None = None
    external_code: str | None = None
    name: str | None = None
    family: str | None = None
    subfamily: str | None = None
    physical_state: str | None = None
    density: float | None = None
    ph_min: float | None = None
    ph_max: float | None = None
    solubility: str | None = None
    is_active: bool | None = None
    is_obsolete: bool | None = None
    notes: str | None = None


class RawMaterialRead(RawMaterialCreate):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    normalized_name: str
    is_active: bool
    is_obsolete: bool


class RawMaterialPriceCreate(BaseModel):
    price: float
    currency: str = "EUR"
    unit: str = "kg"
    supplier: str | None = None
    source: str = "manual"
    valid_from: date | None = None


class RawMaterialParameterValueCreate(BaseModel):
    parameter_id: uuid.UUID
    value: float
    source: str | None = None
    confidence: float | None = None


class FormulaItemCreate(BaseModel):
    raw_material_id: uuid.UUID
    percentage: float
    order_index: int = 0


class FormulaCreate(BaseModel):
    name: str
    objective: str | None = None
    items: list[FormulaItemCreate] = []


class FormulaUpdate(BaseModel):
    name: str | None = None
    status: str | None = None
    objective: str | None = None
    items: list[FormulaItemCreate] | None = None


class FormulaRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    name: str
    version: int
    status: str
    objective: str | None
    total_price: float | None
    currency: str
    items: list[dict[str, Any]]


class FormulaCalculateRequest(BaseModel):
    items: list[FormulaItemCreate]
    required_parameter_codes: set[str] = Field(default_factory=set)


class CalculationRead(BaseModel):
    total_percentage: float
    price_total: float | None
    currency: str
    parameters: list[dict[str, Any]]
    warnings: list[dict[str, Any]]


class ExcelImportPreviewRowRead(BaseModel):
    row_number: int
    material_code: str | None
    material_name: str | None
    percentage: float | None
    raw_material_id: uuid.UUID | None
    matched_by: str | None
    status: str
    message: str | None = None


class ExcelImportPreviewRead(BaseModel):
    sheet_name: str
    columns: dict[str, str | None]
    rows: list[ExcelImportPreviewRowRead]
    total_percentage: float
    resolved_rows: int
    pending_rows: int


class ExcelImportSaveRow(BaseModel):
    raw_material_id: uuid.UUID
    percentage: float = Field(ge=0)


class ExcelImportSaveRequest(BaseModel):
    name: str
    rows: list[ExcelImportSaveRow]
