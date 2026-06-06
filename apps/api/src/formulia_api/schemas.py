from __future__ import annotations

import uuid
from datetime import date, datetime
from enum import Enum
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


class RawMaterialAliasCreate(BaseModel):
    alias: str = Field(min_length=1)
    source: str = "manual"


class RawMaterialAliasRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    raw_material_id: uuid.UUID
    alias: str
    normalized_alias: str
    source: str


class RawMaterialPriceCreate(BaseModel):
    price: float
    currency: str = "EUR"
    unit: str = "kg"
    supplier: str | None = None
    source: str = "manual"
    valid_from: date | None = None


class RawMaterialPriceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    raw_material_id: uuid.UUID
    price: float
    currency: str
    unit: str
    supplier: str | None
    source: str
    valid_from: date
    created_at: datetime


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
    optimization_run_id: uuid.UUID | None = None
    items: list[FormulaItemCreate] = []


class FormulaUpdate(BaseModel):
    name: str | None = None
    status: str | None = None
    objective: str | None = None
    optimization_run_id: uuid.UUID | None = None
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


class FormulaCompareRequest(BaseModel):
    left_formula_id: uuid.UUID
    right_formula_id: uuid.UUID


class CalculationRead(BaseModel):
    total_percentage: float
    price_total: float | None
    currency: str
    parameters: list[dict[str, Any]]
    warnings: list[dict[str, Any]]


class OptimizationObjective(str, Enum):
    minimize_price = "minimize_price"


class OptimizationRawMaterialBound(BaseModel):
    raw_material_id: uuid.UUID
    min_percentage: float | None = Field(default=None, ge=0, le=100)
    max_percentage: float | None = Field(default=None, ge=0, le=100)


class OptimizationParameterBound(BaseModel):
    code: str = Field(min_length=1)
    min_value: float | None = None
    max_value: float | None = None


class OptimizationValidateRequest(BaseModel):
    objective: OptimizationObjective = OptimizationObjective.minimize_price
    candidate_raw_material_ids: list[uuid.UUID] = Field(min_length=1)
    raw_material_bounds: list[OptimizationRawMaterialBound] = Field(default_factory=list)
    parameter_bounds: list[OptimizationParameterBound] = Field(default_factory=list)


class OptimizationValidationIssueRead(BaseModel):
    code: str
    target: str
    message: str


class OptimizationValidationRead(BaseModel):
    status: str
    objective: OptimizationObjective
    candidate_count: int
    raw_material_bound_count: int
    parameter_bound_count: int
    issues: list[OptimizationValidationIssueRead]


class OptimizationFormulaItemRead(BaseModel):
    raw_material_id: uuid.UUID
    percentage: float


class OptimizationRunRead(BaseModel):
    id: uuid.UUID
    created_at: datetime
    status: str
    objective: OptimizationObjective
    items: list[OptimizationFormulaItemRead]
    calculation: CalculationRead | None
    messages: list[str]
    issues: list[OptimizationValidationIssueRead]


class OptimizationRunHistoryRead(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    user_id: uuid.UUID | None
    formula_id: uuid.UUID | None
    status: str
    objective: OptimizationObjective
    request_json: dict[str, Any]
    result_json: dict[str, Any]
    created_at: datetime


class FormulaComparisonFormulaRead(BaseModel):
    id: uuid.UUID
    name: str
    total_percentage: float
    price_total: float | None
    currency: str
    parameters: list[dict[str, Any]]
    warnings: list[dict[str, Any]]
    line_count: int


class FormulaComparisonParameterDeltaRead(BaseModel):
    code: str
    left_value: float | None
    right_value: float | None
    delta: float | None
    unit: str | None


class FormulaComparisonDeltaRead(BaseModel):
    total_percentage: float
    price_total: float | None
    parameters: list[FormulaComparisonParameterDeltaRead]


class FormulaComparisonRead(BaseModel):
    left: FormulaComparisonFormulaRead
    right: FormulaComparisonFormulaRead
    delta: FormulaComparisonDeltaRead


class RequirementParseRequest(BaseModel):
    text: str = Field(min_length=1, max_length=2000)
    active_parameter_code: str = Field(default="active_content", min_length=1)
    active_parameter_name: str | None = None


class RequirementObjectiveRead(BaseModel):
    type: str
    target: str


class RequirementParameterBoundRead(BaseModel):
    code: str
    min_value: float | None
    max_value: float | None
    source_text: str


class RequirementPriceConstraintRead(BaseModel):
    max_price: float
    currency: str
    unit: str
    source_text: str


class RequirementParseRead(BaseModel):
    tenant_id: uuid.UUID
    user_id: uuid.UUID
    source: str
    text: str
    objectives: list[RequirementObjectiveRead]
    parameter_bounds: list[RequirementParameterBoundRead]
    price_constraint: RequirementPriceConstraintRead | None
    alternatives: int | None
    mandatory_raw_materials: list[str]
    excluded_raw_materials: list[str]
    uncertainties: list[str]


class FormulaCalculationHistoryRead(BaseModel):
    id: uuid.UUID
    formula_id: uuid.UUID
    price_total: float | None
    result_json: dict[str, Any]
    calculated_at: str


class ExcelImportPreviewRowRead(BaseModel):
    row_number: int
    material_code: str | None
    material_name: str | None
    percentage: float | None
    raw_material_id: uuid.UUID | None
    matched_by: str | None
    status: str
    message: str | None = None
    suggested_raw_material_id: uuid.UUID | None = None
    suggested_material_name: str | None = None
    suggested_match_score: float | None = None


class ExcelImportPreviewRead(BaseModel):
    sheet_name: str
    available_sheets: list[str]
    columns: dict[str, str | None]
    rows: list[ExcelImportPreviewRowRead]
    total_percentage: float
    resolved_rows: int
    pending_rows: int


class ExcelImportSheetsRead(BaseModel):
    sheets: list[str]
    default_sheet: str


class ExcelImportColumnsRead(BaseModel):
    sheet_name: str
    available_sheets: list[str]
    header_row: int
    columns: list[str]
    detected_material_name: str | None = None
    detected_material_code: str | None = None
    detected_percentage: str | None = None


class ExcelImportSaveRow(BaseModel):
    raw_material_id: uuid.UUID
    percentage: float = Field(ge=0)


class ExcelImportSaveRequest(BaseModel):
    name: str
    rows: list[ExcelImportSaveRow]
