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
