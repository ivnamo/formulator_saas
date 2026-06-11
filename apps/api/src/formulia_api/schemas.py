from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Any, Literal

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
    jira_project_id: str | None = None
    jira_issue_type: str = "Calidad"
    jira_product_type: str = "Nuevo"
    items: list[FormulaItemCreate] = []


class FormulaUpdate(BaseModel):
    name: str | None = None
    status: str | None = None
    objective: str | None = None
    jira_project_id: str | None = None
    jira_issue_type: str | None = None
    jira_product_type: str | None = None
    items: list[FormulaItemCreate] | None = None


class FormulaRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    name: str
    version: int
    status: str
    objective: str | None
    jira_project_id: str | None
    jira_issue_type: str
    jira_product_type: str
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


class CompatibilityRuleCreate(BaseModel):
    rule_type: Literal["material_pair"] = "material_pair"
    severity: Literal["blocker", "warning", "info"] = "warning"
    material_a_id: uuid.UUID
    material_b_id: uuid.UUID
    message: str = Field(min_length=1)
    recommended_action: str | None = None
    source_type: Literal["manual"] = "manual"


class CompatibilityRuleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    rule_type: str
    severity: str
    condition_json: dict[str, Any]
    message: str
    source_type: str
    active: bool
    created_at: datetime


def default_jira_status_mapping() -> dict[str, str]:
    return {
        "Pendiente de revision": "sent_to_jira",
        "En revision laboratorio": "in_lab_review",
        "Cambios solicitados": "changes_requested",
        "Aprobada": "approved",
        "Rechazada": "rejected",
        "En pruebas": "in_testing",
        "Validada": "validated",
        "Cerrada": "closed",
    }


class JiraConnectionCreate(BaseModel):
    base_url: str = Field(min_length=1)
    auth_type: Literal["api_token", "oauth"] = "api_token"
    auth_email: str | None = None
    api_token: str | None = None
    default_project_key: str = Field(min_length=1)
    default_issue_type: str = Field(min_length=1)
    default_assignee: str | None = None
    field_mapping: dict[str, str] = Field(default_factory=dict)
    status_mapping: dict[str, str] = Field(default_factory=default_jira_status_mapping)
    is_active: bool = True


class JiraConnectionUpdate(BaseModel):
    base_url: str | None = None
    auth_type: Literal["api_token", "oauth"] | None = None
    auth_email: str | None = None
    api_token: str | None = None
    default_project_key: str | None = None
    default_issue_type: str | None = None
    default_assignee: str | None = None
    field_mapping: dict[str, str] | None = None
    status_mapping: dict[str, str] | None = None
    is_active: bool | None = None


class JiraConnectionRead(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    base_url: str
    auth_type: str
    auth_email: str | None
    credential_status: str
    default_project_key: str
    default_issue_type: str
    default_assignee: str | None
    field_mapping: dict[str, str]
    status_mapping: dict[str, str]
    is_active: bool
    last_test_status: str | None
    last_test_message: str | None
    last_tested_at: datetime | None
    created_at: datetime
    updated_at: datetime


class JiraConnectionTestRead(BaseModel):
    connection_id: uuid.UUID
    status: str
    message: str
    checked_at: datetime


class JiraOAuthAuthorizeRead(BaseModel):
    authorization_url: str
    state: str


class JiraOAuthCallbackCreate(BaseModel):
    code: str = Field(min_length=1)
    state: str = Field(min_length=1)


class JiraOAuthCallbackRead(BaseModel):
    status: str
    cloud_id: str
    site_url: str
    expires_at: int
    scope: str | None = None


class FormulaJiraReviewCreate(BaseModel):
    notes: str | None = None


class FormulaReviewRequestRead(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    formula_id: uuid.UUID
    formula_version: int
    jira_connection_id: uuid.UUID
    review_status: str
    jira_issue_key: str | None
    jira_issue_url: str | None
    jira_status: str | None
    sent_by_user_id: uuid.UUID | None
    sent_at: datetime | None
    last_sync_at: datetime | None
    snapshot: dict[str, Any]
    created_at: datetime


class FormulaReviewArtifactRead(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    review_request_id: uuid.UUID
    artifact_type: str
    file_name: str
    content_type: str
    checksum_sha256: str
    size_bytes: int
    created_at: datetime


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


class ExcelImportSaveRow(BaseModel):
    raw_material_id: uuid.UUID
    percentage: float = Field(ge=0)


class ExcelImportSaveRequest(BaseModel):
    name: str
    jira_project_id: str | None = None
    jira_issue_type: str = "Calidad"
    jira_product_type: str = "Nuevo"
    rows: list[ExcelImportSaveRow]


class RequirementConstraintRead(BaseModel):
    kind: str
    target: str
    operator: str
    value: float | None = None
    unit: str | None = None
    raw_text: str | None = None


class RequirementPreferencesRead(BaseModel):
    only_active_materials: bool | None = None
    avoid_incompatibilities: bool | None = None
    notes: list[str] = Field(default_factory=list)


class RequirementParseRequest(BaseModel):
    text: str = Field(min_length=3, max_length=4000)


class RequirementParseRead(BaseModel):
    run_id: uuid.UUID
    source: str
    model: str | None = None
    product_type: str | None = None
    objectives: list[str] = Field(default_factory=list)
    technical_constraints: list[RequirementConstraintRead] = Field(default_factory=list)
    economic_constraints: list[RequirementConstraintRead] = Field(default_factory=list)
    mandatory_raw_materials: list[str] = Field(default_factory=list)
    excluded_raw_materials: list[str] = Field(default_factory=list)
    preferences: RequirementPreferencesRead = Field(default_factory=RequirementPreferencesRead)
    alternatives: int | None = None
    uncertainties: list[str] = Field(default_factory=list)


class AgentPlanRequest(BaseModel):
    text: str = Field(min_length=3, max_length=4000)


class AgentPlanStepRead(BaseModel):
    tool: str
    status: str
    summary: str


class AgentPlanRead(BaseModel):
    run_id: uuid.UUID
    orchestrator: str
    model: str | None = None
    parsed_requirements: dict[str, Any] | None = None
    candidate_research: dict[str, Any] | None = None
    optimization_plan: dict[str, Any] | None = None
    steps: list[AgentPlanStepRead]
    human_review_required: bool
    notes: list[str] = Field(default_factory=list)


class AiRunRead(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    user_id: uuid.UUID
    run_type: str
    provider: str
    model: str | None
    status: str
    prompt_tokens: int | None
    completion_tokens: int | None
    cost_estimate_usd: float | None
    created_at: datetime
    completed_at: datetime | None
    error: str | None


class AiToolCallRead(BaseModel):
    id: uuid.UUID
    ai_run_id: uuid.UUID
    tenant_id: uuid.UUID
    tool_name: str
    status: str
    input_json: dict[str, Any]
    output_json: dict[str, Any] | None
    error: str | None
    started_at: datetime
    completed_at: datetime | None


class AiRunDetailRead(AiRunRead):
    input_json: dict[str, Any]
    output_json: dict[str, Any] | None
    tool_calls: list[AiToolCallRead]
