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
  priceHistory: RawMaterialPriceRead[];
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
  values: {
    price?: number | null;
    priceHistory?: RawMaterialPriceRead[];
    parameterValue?: number | null;
  } = {},
): RawMaterial {
  const priceHistory = values.priceHistory ?? [];
  return {
    id: material.id,
    code: material.code,
    name: material.name,
    price: values.price ?? priceHistory[0]?.price ?? null,
    priceHistory,
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

export type RawMaterialPriceRead = {
  id: string;
  tenant_id: string;
  raw_material_id: string;
  price: number;
  currency: string;
  unit: string;
  supplier: string | null;
  source: string;
  valid_from: string;
  created_at: string;
};

export function withRawMaterialPrice(
  rawMaterials: RawMaterial[],
  rawMaterialId: string,
  price: RawMaterialPriceRead,
): RawMaterial[] {
  return rawMaterials.map((material) => {
    if (material.id !== rawMaterialId) {
      return material;
    }
    const priceHistory = [price, ...material.priceHistory.filter((item) => item.id !== price.id)]
      .sort(comparePriceHistory);
    return {
      ...material,
      price: priceHistory[0]?.price ?? null,
      priceHistory,
    };
  });
}

function comparePriceHistory(left: RawMaterialPriceRead, right: RawMaterialPriceRead): number {
  return (
    right.valid_from.localeCompare(left.valid_from) ||
    right.created_at.localeCompare(left.created_at)
  );
}

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

export type FormulaComparison = {
  left: FormulaComparisonFormula;
  right: FormulaComparisonFormula;
  delta: {
    total_percentage: number;
    price_total: number | null;
    parameters: Array<{
      code: string;
      left_value: number | null;
      right_value: number | null;
      delta: number | null;
      unit: string | null;
    }>;
  };
};

export type FormulaComparisonFormula = {
  id: string;
  name: string;
  total_percentage: number;
  price_total: number | null;
  currency: string;
  parameters: CalculationResult["parameters"];
  warnings: CalculationResult["warnings"];
  line_count: number;
};

export type OptimizationRunResult = {
  status: "success" | "infeasible" | "invalid";
  objective: "minimize_price";
  items: Array<{
    raw_material_id: string;
    percentage: number;
  }>;
  calculation: CalculationResult | null;
  messages: string[];
  issues: Array<{
    code: string;
    target: string;
    message: string;
  }>;
};

export type OptimizationRun = OptimizationRunResult & {
  id: string;
  created_at: string;
};

export type OptimizationRunHistory = {
  id: string;
  tenant_id: string;
  user_id: string | null;
  formula_id: string | null;
  status: OptimizationRunResult["status"];
  objective: "minimize_price";
  request_json: {
    objective: "minimize_price";
    candidate_raw_material_ids: string[];
    raw_material_bounds: Array<{
      raw_material_id: string;
      min_percentage: number | null;
      max_percentage: number | null;
    }>;
    parameter_bounds: Array<{
      code: string;
      min_value: number | null;
      max_value: number | null;
    }>;
  };
  result_json: OptimizationRunResult;
  created_at: string;
};

export type OptimizerCandidateConfig = {
  enabled: boolean;
  minPercentage: string;
  maxPercentage: string;
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

export type ExcelImportColumns = {
  sheet_name: string;
  available_sheets: string[];
  header_row: number;
  columns: string[];
  detected_material_name: string | null;
  detected_material_code: string | null;
  detected_percentage: string | null;
};

export type ExcelColumnMapping = {
  materialNameColumn: string;
  materialCodeColumn: string;
  percentageColumn: string;
};

export const emptyExcelColumnMapping: ExcelColumnMapping = {
  materialNameColumn: "",
  materialCodeColumn: "",
  percentageColumn: "",
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
