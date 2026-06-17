export const ATLANTICA_ID_LAB_PARSER = "atlantica_id_lab";
export const COMPACT_LAB_TRIAL_PARSER = "compact_lab_trial";

export type ExcelImportWarning = {
  code?: string | null;
  message?: string | null;
} | string;

export type ExcelImportPreviewRow = {
  row_number: number;
  material_code: string | null;
  material_name: string | null;
  resolved_material_code: string | null;
  resolved_material_name: string | null;
  percentage: number | null;
  raw_material_id: string | null;
  matched_by: string | null;
  status: string;
  message: string | null;
  suggested_raw_material_id: string | null;
  suggested_material_name: string | null;
  suggested_match_score: number | null;
  imported_price: number | null;
  imported_parameters: Record<string, number>;
  lab_material_name: string | null;
  lab_observation: string | null;
};

export type ExcelImportPreview = {
  parser: string;
  formula_name: string | null;
  sheet_name: string;
  available_sheets: string[];
  parameter_headers: string[];
  warnings: ExcelImportWarning[];
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
          resolved_material_code: null,
          resolved_material_name: null,
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
