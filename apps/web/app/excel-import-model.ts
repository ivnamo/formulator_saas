import type { RawMaterial } from "./raw-material-model";

export const ATLANTICA_ID_LAB_PARSER = "atlantica_id_lab";
export const COMPACT_LAB_TRIAL_PARSER = "compact_lab_trial";
export const PASTED_ROWS_PARSER = "pasted_rows";

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

type ParsedPastedRow = {
  rowNumber: number;
  materialName: string;
  percentage: number | null;
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

export function buildPastedRowsImportPreview(
  text: string,
  rawMaterials: RawMaterial[],
): ExcelImportPreview {
  const rows = text
    .split(/\r?\n/)
    .map(parsePastedRow)
    .filter((row): row is ParsedPastedRow => row !== null)
    .map((row) => pastedRowToImportRow(row, rawMaterials));

  return {
    parser: PASTED_ROWS_PARSER,
    formula_name: null,
    sheet_name: "Pasted rows",
    available_sheets: [],
    parameter_headers: [],
    warnings: [],
    columns: {
      material_name: "Material",
      material_code: null,
      percentage: "Percentage",
    },
    rows,
    total_percentage: rows.reduce((sum, row) => sum + (row.percentage ?? 0), 0),
    resolved_rows: rows.filter((row) => row.raw_material_id !== null).length,
    pending_rows: rows.filter((row) => row.status !== "matched_exact").length,
  };
}

function parsePastedRow(line: string, index: number): ParsedPastedRow | null {
  const trimmed = line.trim();
  if (!trimmed) {
    return null;
  }

  const separated = trimmed.split(/[\t;|]/).map((part) => part.trim());
  if (separated.length >= 2 && separated[0]) {
    return {
      rowNumber: index + 1,
      materialName: separated[0],
      percentage: parsePastedPercentage(separated[1]),
    };
  }

  const fallbackMatch = /^(.*\S)\s+(-?\d+(?:[.,]\d+)?)\s*%?\s*$/.exec(trimmed);
  if (!fallbackMatch?.[1]) {
    return {
      rowNumber: index + 1,
      materialName: trimmed,
      percentage: null,
    };
  }

  return {
    rowNumber: index + 1,
    materialName: fallbackMatch[1].trim(),
    percentage: parsePastedPercentage(fallbackMatch[2]),
  };
}

function parsePastedPercentage(value: string): number | null {
  const match = /^\s*(-?\d+(?:[.,]\d+)?)/.exec(value);
  if (!match?.[1]) {
    return null;
  }
  const parsed = Number(match[1].replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function pastedRowToImportRow(
  row: ParsedPastedRow,
  rawMaterials: RawMaterial[],
): ExcelImportPreviewRow {
  const match = findPastedMaterialMatch(row.materialName, rawMaterials);
  const suggestion = match ? null : findPastedMaterialSuggestion(row.materialName, rawMaterials);
  const status =
    row.percentage === null ? "invalid_percentage" : match ? "matched_exact" : "needs_review";

  return {
    row_number: row.rowNumber,
    material_code: null,
    material_name: row.materialName,
    resolved_material_code: match?.material.code ?? null,
    resolved_material_name: match?.material.name ?? null,
    percentage: row.percentage,
    raw_material_id: match?.material.id ?? null,
    matched_by: match?.matchedBy ?? null,
    status,
    message:
      status === "invalid_percentage"
        ? "Percentage could not be parsed."
        : status === "needs_review"
          ? "No exact raw material match was found."
          : null,
    suggested_raw_material_id: suggestion?.material.id ?? null,
    suggested_material_name: suggestion?.material.name ?? null,
    suggested_match_score: suggestion?.score ?? null,
    imported_price: null,
    imported_parameters: {},
    lab_material_name: null,
    lab_observation: null,
  };
}

function findPastedMaterialMatch(
  materialName: string,
  rawMaterials: RawMaterial[],
): { material: RawMaterial; matchedBy: string } | null {
  const normalized = normalizePastedMaterialSearch(materialName);
  for (const material of rawMaterials) {
    if (material.code && normalizePastedMaterialSearch(material.code) === normalized) {
      return { material, matchedBy: "code" };
    }
  }
  for (const material of rawMaterials) {
    if (normalizePastedMaterialSearch(material.name) === normalized) {
      return { material, matchedBy: "name" };
    }
  }
  for (const material of rawMaterials) {
    if (
      material.aliases.some(
        (alias) => normalizePastedMaterialSearch(alias) === normalized,
      )
    ) {
      return { material, matchedBy: "alias" };
    }
  }
  return null;
}

function findPastedMaterialSuggestion(
  materialName: string,
  rawMaterials: RawMaterial[],
): { material: RawMaterial; score: number } | null {
  const normalized = normalizePastedMaterialSearch(materialName);
  let bestMaterial: RawMaterial | null = null;
  let bestScore = 0;

  for (const material of rawMaterials) {
    const candidates = [material.name, material.code, ...material.aliases].filter(
      (value): value is string => Boolean(value),
    );
    const score = Math.max(
      ...candidates.map((candidate) =>
        similarityScore(normalized, normalizePastedMaterialSearch(candidate)),
      ),
    );
    if (score > bestScore) {
      bestMaterial = material;
      bestScore = score;
    }
  }

  return bestMaterial && bestScore >= 0.78
    ? { material: bestMaterial, score: Math.round(bestScore * 100) / 100 }
    : null;
}

function similarityScore(left: string, right: string): number {
  if (!left || !right) {
    return 0;
  }
  if (left === right) {
    return 1;
  }
  if (left.includes(right) || right.includes(left)) {
    return Math.min(left.length, right.length) / Math.max(left.length, right.length);
  }

  const distance = levenshteinDistance(left, right);
  return 1 - distance / Math.max(left.length, right.length);
}

function levenshteinDistance(left: string, right: string): number {
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 0; leftIndex < left.length; leftIndex += 1) {
    const current = [leftIndex + 1];
    for (let rightIndex = 0; rightIndex < right.length; rightIndex += 1) {
      const substitutionCost = left[leftIndex] === right[rightIndex] ? 0 : 1;
      current.push(
        Math.min(
          current[rightIndex] + 1,
          previous[rightIndex + 1] + 1,
          previous[rightIndex] + substitutionCost,
        ),
      );
    }
    previous = current;
  }
  return previous[right.length];
}

function normalizePastedMaterialSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
