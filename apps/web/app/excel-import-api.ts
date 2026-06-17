import type {
  ExcelImportPreview,
  ExcelImportPreviewRow,
  ExcelImportSheets,
} from "./excel-import-model";
import type { FormulaRead } from "./formula-model";
import { buildImportedFormulaSavePayload } from "./formula-save-model";
import type { RawMaterialAliasRead, RawMaterialRead } from "./raw-material-model";
import { request } from "./workspace-api";

type ImportedFormulaMetadata = Parameters<typeof buildImportedFormulaSavePayload>[1];

export function fetchExcelImportSheets(
  uploadHeaders: HeadersInit,
  file: File,
): Promise<ExcelImportSheets> {
  const formData = new FormData();
  formData.append("file", file);
  return request<ExcelImportSheets>("/api/v1/imports/formulas/excel/sheets", {
    method: "POST",
    headers: uploadHeaders,
    body: formData,
  });
}

export function fetchExcelImportPreview(
  uploadHeaders: HeadersInit,
  file: File,
  sheetName: string,
): Promise<ExcelImportPreview> {
  const formData = new FormData();
  formData.append("file", file);
  if (sheetName) {
    formData.append("sheet_name", sheetName);
  }
  return request<ExcelImportPreview>("/api/v1/imports/formulas/excel/preview", {
    method: "POST",
    headers: uploadHeaders,
    body: formData,
  });
}

export function saveExcelImportedFormula(
  headers: HeadersInit,
  tenantName: string | null | undefined,
  metadata: ImportedFormulaMetadata,
  formulaName: string | null | undefined,
  rows: ExcelImportPreviewRow[],
): Promise<FormulaRead> {
  return request<FormulaRead>("/api/v1/imports/formulas/excel/save", {
    method: "POST",
    headers,
    body: JSON.stringify(
      buildImportedFormulaSavePayload(tenantName, metadata, rows, formulaName),
    ),
  });
}

export function createImportRawMaterial(
  headers: HeadersInit,
  materialCode: string,
  name: string,
): Promise<RawMaterialRead> {
  return request<RawMaterialRead>("/api/v1/raw-materials", {
    method: "POST",
    headers,
    body: JSON.stringify({
      code: materialCode || null,
      name,
    }),
  });
}

export function createImportRawMaterialAlias(
  headers: HeadersInit,
  rawMaterialId: string,
  alias: string,
): Promise<RawMaterialAliasRead> {
  return request<RawMaterialAliasRead>(
    `/api/v1/raw-materials/${rawMaterialId}/aliases`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ alias, source: "excel_import" }),
    },
  );
}
