from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


def _clean_required_formula_objective(value: str) -> str:
    cleaned = value.strip()
    if not cleaned:
        raise ValueError("Formula description is required.")
    return cleaned


def _clean_optional_formula_objective(value: str | None) -> str | None:
    if value is None:
        return None
    return _clean_required_formula_objective(value)


def _clean_required_formula_name(value: str) -> str:
    cleaned = value.strip()
    if not cleaned:
        raise ValueError("Formula name is required.")
    return cleaned


def _clean_optional_formula_name(value: str | None) -> str | None:
    if value is None:
        return None
    return _clean_required_formula_name(value)


class TenantCreate(BaseModel):
    name: str
    slug: str


class TenantRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    status: str
    role: str | None = None


class TenantInvitationCreate(BaseModel):
    email: str = Field(min_length=3)
    role: Literal["owner", "admin", "formulator", "formulador", "viewer"] = "formulator"
    expires_at: datetime | None = None
    send_link: bool = False


class TenantInvitationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    email: str
    role: str
    status: str
    invited_by: uuid.UUID | None
    accepted_by: uuid.UUID | None
    expires_at: datetime | None
    created_at: datetime
    accepted_at: datetime | None
    email_delivery_status: str | None = None


class TenantMemberRead(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    user_id: uuid.UUID
    email: str
    name: str | None
    role: str
    status: str
    created_at: datetime


class TenantMemberUpdate(BaseModel):
    role: Literal["owner", "admin", "formulator", "formulador", "viewer"]


class ProductEventCreate(BaseModel):
    event_type: str = Field(min_length=1, max_length=80)
    surface: str = Field(min_length=1, max_length=80)
    element: str | None = Field(default=None, max_length=120)
    metadata: dict[str, Any] = Field(default_factory=dict)

    @field_validator("event_type", "surface", "element")
    @classmethod
    def text_is_clean(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Event text fields cannot be blank.")
        return cleaned


class ProductEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    user_id: uuid.UUID
    user_role: str
    event_type: str
    surface: str
    element: str | None
    metadata_json: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class ProductEventCountRead(BaseModel):
    key: str
    count: int


class ProductEventSummaryRead(BaseModel):
    total: int
    by_event_type: list[ProductEventCountRead]
    by_surface: list[ProductEventCountRead]
    recent: list[ProductEventRead]


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
    current_price: dict[str, Any] | None = None
    parameters: list[dict[str, Any]] = Field(default_factory=list)
    aliases: list[str] = Field(default_factory=list)


class RawMaterialCatalogItemRead(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    code: str | None
    external_code: str | None
    name: str
    family: str | None
    subfamily: str | None
    physical_state: str | None
    is_active: bool
    is_obsolete: bool
    current_price: dict[str, Any] | None = None
    parameter_count: int
    positive_parameter_count: int
    aliases: list[str] = Field(default_factory=list)


class RawMaterialCatalogRead(BaseModel):
    items: list[RawMaterialCatalogItemRead]
    total: int
    limit: int
    offset: int
    families: list[str] = Field(default_factory=list)


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
    valid_to: date | None
    created_at: datetime


class RawMaterialParameterValueCreate(BaseModel):
    parameter_id: uuid.UUID
    value: float
    source: str | None = None
    confidence: float | None = None


class RawMaterialImportRowRead(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    import_id: uuid.UUID
    row_number: int
    raw_material_id: uuid.UUID | None
    raw_name: str | None
    action: str
    status: str
    raw_row_json: dict[str, Any] = Field(default_factory=dict)
    message: str | None = None


class RawMaterialImportRead(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    file_name: str
    source: str
    source_hash: str
    status: str
    summary_json: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    rows: list[RawMaterialImportRowRead] = Field(default_factory=list)


class FormulaItemCreate(BaseModel):
    raw_material_id: uuid.UUID
    percentage: float = Field(ge=0)
    order_index: int = 0


class FormulaCreate(BaseModel):
    name: str = Field(min_length=1)
    objective: str = Field(min_length=1)
    source_formula_id: uuid.UUID | None = None
    jira_project_id: str | None = None
    jira_issue_type: str = "Calidad"
    jira_product_type: str = "Nuevo"
    items: list[FormulaItemCreate] = []

    @field_validator("name")
    @classmethod
    def name_is_required(cls, value: str) -> str:
        return _clean_required_formula_name(value)

    @field_validator("objective")
    @classmethod
    def objective_is_required(cls, value: str) -> str:
        return _clean_required_formula_objective(value)


class FormulaUpdate(BaseModel):
    name: str | None = None
    objective: str | None = None
    jira_project_id: str | None = None
    jira_issue_type: str | None = None
    jira_product_type: str | None = None
    items: list[FormulaItemCreate] | None = None

    @field_validator("name")
    @classmethod
    def name_is_not_blank(cls, value: str | None) -> str | None:
        return _clean_optional_formula_name(value)

    @field_validator("objective")
    @classmethod
    def objective_is_not_blank(cls, value: str | None) -> str | None:
        return _clean_optional_formula_objective(value)


class FormulaRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    source_formula_id: uuid.UUID | None
    name: str
    version: int
    status: str
    objective: str | None
    jira_project_id: str | None
    jira_issue_type: str
    jira_product_type: str
    total_price: float | None
    currency: str
    total_price_source: str
    total_price_updated_at: date | None
    items: list[dict[str, Any]]


class FormulaCalculateRequest(BaseModel):
    items: list[FormulaItemCreate]
    required_parameter_codes: set[str] = Field(default_factory=set)


class FormulaExcelMetadataCreate(BaseModel):
    sample_code: str | None = None
    lab_date: date | None = None
    experiment_date: date | None = None
    density: float | None = None
    ph: float | None = None
    notes: str | None = None


class FormulaExcelExportRequest(BaseModel):
    name: str = Field(min_length=1)
    objective: str = Field(min_length=1)
    items: list[FormulaItemCreate]
    jira_project_id: str | None = None
    jira_issue_type: str = "Calidad"
    jira_product_type: str = "Nuevo"
    metadata: FormulaExcelMetadataCreate = Field(default_factory=FormulaExcelMetadataCreate)

    @field_validator("name")
    @classmethod
    def name_is_required(cls, value: str) -> str:
        return _clean_required_formula_name(value)

    @field_validator("objective")
    @classmethod
    def objective_is_required(cls, value: str) -> str:
        return _clean_required_formula_objective(value)


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
        "Pendiente": "sent_to_jira",
        "Pendiente de revision": "sent_to_jira",
        "Pre-calidad": "in_lab_review",
        "LABORATORIO": "in_lab_review",
        "Calidad": "in_lab_review",
        "En revision laboratorio": "in_lab_review",
        "Cambios solicitados": "changes_requested",
        "OK": "approved",
        "OK NO LIBERADO": "approved",
        "Aprobada": "approved",
        "NOK": "rejected",
        "Rechazada": "rejected",
        "En pruebas": "in_testing",
        "Validada": "validated",
        "LIBERADO": "closed",
        "CANCELADO": "closed",
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


class JiraProjectMetadataRead(BaseModel):
    id: str | None
    key: str
    name: str
    project_type_key: str | None = None
    simplified: bool | None = None


class JiraIssueTypeMetadataRead(BaseModel):
    id: str
    name: str
    description: str | None = None
    subtask: bool = False


class JiraFieldAllowedValueRead(BaseModel):
    id: str | None = None
    key: str | None = None
    name: str | None = None
    value: str | None = None


class JiraFieldMetadataRead(BaseModel):
    field_id: str
    name: str
    required: bool
    schema_type: str | None = None
    custom: str | None = None
    allowed_values: list[JiraFieldAllowedValueRead] = Field(default_factory=list)


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
    description: str | None = None
    design_project_id: uuid.UUID | None = None
    iso_trial_number: int | None = None
    iso_reason_comment: str | None = None


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


class IsoTenantSettingsUpdate(BaseModel):
    enabled: bool | None = None
    config: dict[str, Any] | None = None
    config_patch: dict[str, Any] | None = None


class IsoTenantSettingsRead(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    enabled: bool
    config: dict[str, Any]
    updated_by: uuid.UUID | None
    created_at: datetime
    updated_at: datetime


class IsoDesignProjectCreate(BaseModel):
    iso_request_number: str = Field(min_length=1)
    year: int | None = None
    project_code: str | None = None
    requester: str | None = None
    responsible_user_id: uuid.UUID | None = None
    product_name: str = Field(min_length=1)
    commercial_name: str | None = None
    need: str | None = None
    product_type: str | None = None
    destination_country: str | None = None
    packaging: str | None = None
    accepted_status: str = "pending"
    lifecycle_status: str = "intake"
    rejection_reason: str | None = None
    estimated_days: int | None = None
    planned_finish_at: date | None = None
    finished_at: date | None = None
    rd_hours: float | None = None
    quality_hours: float | None = None
    problems: str | None = None
    comments: str | None = None
    source_type: str = "manual"
    source_ref: str | None = None


class IsoDesignProjectUpdate(BaseModel):
    iso_request_number: str | None = None
    year: int | None = None
    project_code: str | None = None
    requester: str | None = None
    responsible_user_id: uuid.UUID | None = None
    product_name: str | None = None
    commercial_name: str | None = None
    need: str | None = None
    product_type: str | None = None
    destination_country: str | None = None
    packaging: str | None = None
    accepted_status: str | None = None
    lifecycle_status: str | None = None
    rejection_reason: str | None = None
    estimated_days: int | None = None
    planned_finish_at: date | None = None
    finished_at: date | None = None
    rd_hours: float | None = None
    quality_hours: float | None = None
    problems: str | None = None
    comments: str | None = None
    source_type: str | None = None
    source_ref: str | None = None


class IsoDesignProjectRead(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    iso_request_number: str
    year: int
    project_code: str | None
    requester: str | None
    responsible_user_id: uuid.UUID | None
    product_name: str
    commercial_name: str | None
    need: str | None
    product_type: str | None
    destination_country: str | None
    packaging: str | None
    accepted_status: str
    lifecycle_status: str
    rejection_reason: str | None
    estimated_days: int | None
    planned_finish_at: date | None
    finished_at: date | None
    rd_hours: float | None
    quality_hours: float | None
    problems: str | None
    comments: str | None
    source_type: str
    source_ref: str | None
    created_by: uuid.UUID | None
    created_at: datetime
    updated_at: datetime
    trial_count: int = 0


class IsoDesignTrialCreate(BaseModel):
    formula_id: uuid.UUID | None = None
    formula_version: int | None = None
    review_request_id: uuid.UUID | None = None
    jira_issue_key: str | None = None
    jira_issue_url: str | None = None
    trial_code: str | None = None
    trial_name: str | None = None
    trial_number: int | None = None
    trial_at: datetime | None = None
    technical_result: str = "pending_result"
    raw_result_label: str | None = None
    raw_status_label: str | None = None
    result_source: str = "manual"
    reason_comment: str | None = None
    snapshot: dict[str, Any] = Field(default_factory=dict)


class IsoDesignTrialFromReviewCreate(BaseModel):
    review_id: uuid.UUID
    trial_number: int | None = None
    reason_comment: str | None = None


class IsoDesignTrialRead(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    design_project_id: uuid.UUID
    formula_id: uuid.UUID | None
    formula_version: int | None
    review_request_id: uuid.UUID | None
    jira_issue_key: str | None
    jira_issue_url: str | None
    trial_code: str | None
    trial_name: str | None
    trial_number: int | None
    trial_at: datetime | None
    technical_result: str
    raw_result_label: str | None
    raw_status_label: str | None
    result_source: str
    reason_comment: str | None
    snapshot: dict[str, Any]
    snapshot_checksum: str | None
    created_at: datetime
    updated_at: datetime


class IsoProductValidationCreate(BaseModel):
    released_trial_id: uuid.UUID
    product_name: str | None = None
    formula_ok: str | None = None
    specification: dict[str, Any] = Field(default_factory=dict)
    comments: str | None = None


class IsoProductValidationUpdate(BaseModel):
    product_name: str | None = None
    formula_ok: str | None = None
    specification: dict[str, Any] | None = None
    comments: str | None = None
    validation_at: datetime | None = None


class IsoValidationCheckUpdate(BaseModel):
    area: str
    aspect: str
    required: bool = True
    result: str = "pending"
    comments: str | None = None


class IsoValidationChecksUpdate(BaseModel):
    checks: list[IsoValidationCheckUpdate]


class IsoProductValidationRead(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    design_project_id: uuid.UUID
    released_trial_id: uuid.UUID
    formula_id: uuid.UUID | None
    formula_version: int | None
    product_name: str
    formula_ok: str | None
    specification: dict[str, Any]
    validation_checks: list[dict[str, Any]]
    status: str
    validation_at: datetime | None
    published_at: datetime | None
    comments: str | None
    created_by: uuid.UUID | None
    created_at: datetime
    updated_at: datetime


class IsoRecordArtifactRead(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    design_project_id: uuid.UUID | None
    artifact_type: str
    file_name: str
    content_type: str
    checksum_sha256: str
    size_bytes: int
    created_by: uuid.UUID | None
    created_at: datetime


class IsoLegacyImportRowRead(BaseModel):
    format_key: str
    sheet_name: str
    row_number: int
    record_key: str | None
    action: str
    status: str
    message: str | None
    payload: dict[str, Any]


class IsoLegacyImportPreviewRead(BaseModel):
    format_key: str
    available_sheets: list[str]
    total_rows: int
    ready_rows: int
    ambiguous_rows: int
    rows: list[IsoLegacyImportRowRead]


class IsoLegacyImportApplyRead(IsoLegacyImportPreviewRead):
    created_projects: int
    updated_projects: int
    created_trials: int
    updated_trials: int
    created_validations: int
    updated_validations: int
    skipped_rows: int


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
    resolved_material_code: str | None = None
    resolved_material_name: str | None = None
    percentage: float | None
    imported_price: float | None = None
    imported_parameters: dict[str, float] = Field(default_factory=dict)
    lab_material_name: str | None = None
    lab_observation: str | None = None
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
    parser: str = "generic_table"
    formula_name: str | None = None
    parameter_headers: list[str] = Field(default_factory=list)
    warnings: list[dict[str, Any]] = Field(default_factory=list)
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
    name: str = Field(min_length=1)
    objective: str = Field(min_length=1)
    jira_project_id: str | None = None
    jira_issue_type: str = "Calidad"
    jira_product_type: str = "Nuevo"
    rows: list[ExcelImportSaveRow]

    @field_validator("name")
    @classmethod
    def name_is_required(cls, value: str) -> str:
        return _clean_required_formula_name(value)

    @field_validator("objective")
    @classmethod
    def objective_is_required(cls, value: str) -> str:
        return _clean_required_formula_objective(value)


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
