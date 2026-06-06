export type Tenant = {
  id: string;
  name: string;
  slug: string;
};

export type Parameter = {
  id: string;
  code: string;
  name: string;
  unit: string;
};

export type RawMaterial = {
  id: string;
  code: string | null;
  name: string;
  price: number | null;
  parameterValue: number | null;
  aliases: string[];
};

export type FormulaLine = {
  localId: string;
  rawMaterialId: string;
  percentage: number;
};

export type WorkspaceState = {
  tenant: Tenant | null;
  parameter: Parameter | null;
  rawMaterials: RawMaterial[];
  formulaId: string | null;
  formulaName: string;
  formulaLines: FormulaLine[];
};

export type TenantRead = Tenant & {
  status: string;
};

export type ParameterRead = Parameter & {
  tenant_id: string;
  is_active: boolean;
};

export type RawMaterialRead = {
  id: string;
  tenant_id: string;
  code: string | null;
  name: string;
  normalized_name: string;
  is_active: boolean;
  is_obsolete: boolean;
};

export function toWorkspaceRawMaterial(
  material: RawMaterialRead,
  values: { price?: number | null; parameterValue?: number | null } = {},
): RawMaterial {
  return {
    id: material.id,
    code: material.code,
    name: material.name,
    price: values.price ?? null,
    parameterValue: values.parameterValue ?? null,
    aliases: [],
  };
}

export function withRawMaterialAlias(
  rawMaterials: RawMaterial[],
  rawMaterialId: string,
  alias: string,
): RawMaterial[] {
  return rawMaterials.map((material) =>
    material.id === rawMaterialId && !material.aliases.includes(alias)
      ? { ...material, aliases: [...material.aliases, alias] }
      : material,
  );
}

export type RawMaterialAliasRead = {
  id: string;
  tenant_id: string;
  raw_material_id: string;
  alias: string;
  normalized_alias: string;
  source: string;
};

export type FormulaRead = {
  id: string;
  tenant_id: string;
  name: string;
  version: number;
  status: string;
  objective: string | null;
  total_price: number | null;
  currency: string;
  items: Array<{
    raw_material_id: string;
    percentage: number;
    order_index: number;
  }>;
};

export type CalculationResult = {
  total_percentage: number;
  price_total: number | null;
  currency: string;
  parameters: Array<{ code: string; value: number; unit: string | null }>;
  warnings: Array<{
    code: string;
    message: string;
    raw_material_id?: string | null;
    parameter_code?: string | null;
  }>;
};

export type FormulaCalculationHistory = {
  id: string;
  formula_id: string;
  price_total: number | null;
  result_json: CalculationResult;
  calculated_at: string;
};

export type ExcelImportPreviewRow = {
  row_number: number;
  material_code: string | null;
  material_name: string | null;
  percentage: number | null;
  raw_material_id: string | null;
  matched_by: string | null;
  status: string;
  message: string | null;
  suggested_raw_material_id: string | null;
  suggested_material_name: string | null;
  suggested_match_score: number | null;
};

export type ExcelImportPreview = {
  sheet_name: string;
  available_sheets: string[];
  columns: {
    material_name: string | null;
    material_code: string | null;
    percentage: string | null;
  };
  rows: ExcelImportPreviewRow[];
  total_percentage: number;
  resolved_rows: number;
  pending_rows: number;
};

export type ExcelImportSheets = {
  sheets: string[];
  default_sheet: string;
};

export type RequirementConstraint = {
  kind: string;
  target: string;
  operator: string;
  value: number | null;
  unit: string | null;
  raw_text: string | null;
};

export type RequirementParse = {
  run_id: string;
  source: "deterministic" | "llm";
  model: string | null;
  product_type: string | null;
  objectives: string[];
  technical_constraints: RequirementConstraint[];
  economic_constraints: RequirementConstraint[];
  mandatory_raw_materials: string[];
  excluded_raw_materials: string[];
  preferences: {
    only_active_materials: boolean | null;
    avoid_incompatibilities: boolean | null;
    notes: string[];
  };
  alternatives: number | null;
  uncertainties: string[];
};

export type AiRun = {
  id: string;
  tenant_id: string;
  user_id: string;
  run_type: string;
  provider: string;
  model: string | null;
  status: string;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  cost_estimate_usd: number | null;
  created_at: string;
  completed_at: string | null;
  error: string | null;
};

export type AgentPlanStep = {
  tool: string;
  status: string;
  summary: string;
};

export type AgentCandidate = {
  raw_material_id: string;
  code: string | null;
  name: string;
  price_eur_per_kg: number | null;
  parameters: Record<string, { name: string; value: number; unit: string | null }>;
  matched_constraints: string[];
  warnings: string[];
  score: number;
};

export type AgentCandidateResearch = {
  candidate_count: number;
  total_available: number;
  filters: Record<string, unknown>;
  candidates: AgentCandidate[];
  warnings: string[];
};

export type AgentOptimizationPlan = {
  status: string;
  objective: { type: string; target: string };
  candidate_raw_material_ids: string[];
  constraints: Array<Record<string, unknown>>;
  blocking_reasons: string[];
  warnings: string[];
  solver: string;
  formula_candidates: AgentFormulaCandidate[];
};

export type AgentFormulaCandidate = {
  name: string;
  status: string;
  total_percentage: number;
  price_total: number | null;
  currency: string;
  items: Array<{
    raw_material_id: string;
    name: string;
    percentage: number;
  }>;
  parameters: Array<{ code: string; value: number; unit: string | null }>;
  warnings: Array<Record<string, unknown>>;
  constraints_status: Array<Record<string, unknown>>;
};

export type AgentPlan = {
  run_id: string;
  orchestrator: "deterministic" | "deepagents";
  model: string | null;
  parsed_requirements: Record<string, unknown> | null;
  candidate_research: AgentCandidateResearch | null;
  optimization_plan: AgentOptimizationPlan | null;
  steps: AgentPlanStep[];
  human_review_required: boolean;
  notes: string[];
};

export function withResolvedImportRow(
  preview: ExcelImportPreview,
  rowNumber: number,
  rawMaterialId: string,
): ExcelImportPreview {
  const rows = preview.rows.map((row) =>
    row.row_number === rowNumber
      ? {
          ...row,
          raw_material_id: rawMaterialId,
          matched_by: "manual",
          status: "matched_exact",
          message: null,
        }
      : row,
  );
  return {
    ...preview,
    rows,
    resolved_rows: rows.filter((row) => row.raw_material_id !== null).length,
    pending_rows: rows.filter((row) => row.status !== "matched_exact").length,
  };
}

export function aliasFromImportRow(row: ExcelImportPreviewRow): string | null {
  return row.material_name?.trim() || row.material_code?.trim() || null;
}

export type Status = "idle" | "working" | "error";

export type MaterialForm = {
  code: string;
  name: string;
  price: string;
  parameterValue: string;
};

export const emptyWorkspace: WorkspaceState = {
  tenant: null,
  parameter: null,
  rawMaterials: [],
  formulaId: null,
  formulaName: "Manual Formula",
  formulaLines: [],
};

export function parseOptionalNumber(value: string): number | null {
  if (!value.trim()) {
    return null;
  }
  const normalized = Number(value.replace(",", "."));
  return Number.isFinite(normalized) ? normalized : null;
}

export function normalizeCode(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

export function slugify(value: string): string {
  return normalizeCode(value).replace(/_/g, "-").replace(/[^a-z0-9-]/g, "");
}

export function makeLocalId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
