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


class RawMaterialAlias(SQLModel, table=True):
    __tablename__ = "raw_material_aliases"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    tenant_id: uuid.UUID = Field(index=True, foreign_key="tenants.id")
    raw_material_id: uuid.UUID = Field(index=True, foreign_key="raw_materials.id")
    alias: str
    normalized_alias: str = Field(index=True)
    source: str = "manual"
    created_at: datetime = Field(default_factory=utc_now)


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


class CompatibilityRule(SQLModel, table=True):
    __tablename__ = "compatibility_rules"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    tenant_id: uuid.UUID = Field(index=True, foreign_key="tenants.id")
    rule_type: str = Field(index=True)
    severity: str = Field(index=True)
    condition_json: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    message: str
    source_type: str = "manual"
    validated_by: uuid.UUID | None = None
    validated_at: datetime | None = None
    active: bool = True
    created_at: datetime = Field(default_factory=utc_now)


class JiraConnection(SQLModel, table=True):
    __tablename__ = "jira_connections"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    tenant_id: uuid.UUID = Field(index=True, foreign_key="tenants.id")
    base_url: str
    auth_type: str = "api_token"
    auth_email: str | None = None
    credential_status: str = "missing"
    default_project_key: str
    default_issue_type: str
    default_assignee: str | None = None
    field_mapping_json: dict[str, str] = Field(default_factory=dict, sa_column=Column(JSON))
    status_mapping_json: dict[str, str] = Field(default_factory=dict, sa_column=Column(JSON))
    is_active: bool = True
    last_test_status: str | None = None
    last_test_message: str | None = None
    last_tested_at: datetime | None = None
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class FormulaReviewRequest(SQLModel, table=True):
    __tablename__ = "formula_review_requests"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    tenant_id: uuid.UUID = Field(index=True, foreign_key="tenants.id")
    formula_id: uuid.UUID = Field(index=True, foreign_key="formulas.id")
    formula_version: int
    jira_connection_id: uuid.UUID = Field(index=True, foreign_key="jira_connections.id")
    review_status: str = Field(default="ready_for_jira", index=True)
    jira_issue_key: str | None = None
    jira_issue_url: str | None = None
    jira_status: str | None = None
    sent_by_user_id: uuid.UUID | None = None
    sent_at: datetime | None = None
    last_sync_at: datetime | None = None
    snapshot_json: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=utc_now)


class AiRun(SQLModel, table=True):
    __tablename__ = "ai_runs"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    tenant_id: uuid.UUID = Field(index=True, foreign_key="tenants.id")
    user_id: uuid.UUID = Field(index=True, foreign_key="users.id")
    run_type: str = Field(index=True)
    provider: str
    model: str | None = None
    status: str = Field(default="success", index=True)
    input_json: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    output_json: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))
    error: str | None = None
    prompt_tokens: int | None = None
    completion_tokens: int | None = None
    cost_estimate_usd: float | None = None
    created_at: datetime = Field(default_factory=utc_now)
    completed_at: datetime | None = None


class AiToolCall(SQLModel, table=True):
    __tablename__ = "ai_tool_calls"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    ai_run_id: uuid.UUID = Field(index=True, foreign_key="ai_runs.id")
    tenant_id: uuid.UUID = Field(index=True, foreign_key="tenants.id")
    tool_name: str
    status: str = Field(default="success", index=True)
    input_json: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    output_json: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))
    error: str | None = None
    started_at: datetime = Field(default_factory=utc_now)
    completed_at: datetime | None = None
