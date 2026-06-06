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

export type ExcelImportPreviewRow = {
  row_number: number;
  material_code: string | null;
  material_name: string | null;
  percentage: number | null;
  raw_material_id: string | null;
  matched_by: string | null;
  status: string;
  message: string | null;
};

export type ExcelImportPreview = {
  sheet_name: string;
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
