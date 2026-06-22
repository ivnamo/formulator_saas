import { formulaLinePercentageValue } from "./formula-builder-model";

type FormulaSaveLine = {
  rawMaterialId: string;
  percentage: number;
};

type FormulaSaveMetadata = {
  formulaName: string;
  formulaJiraProjectId: string;
  formulaJiraIssueType: string;
  formulaJiraProductType: string;
};

type FormulaImportRow = {
  raw_material_id: string | null;
  percentage: number | null;
};

export function buildManualFormulaSavePayload(
  metadata: FormulaSaveMetadata,
  formulaLines: FormulaSaveLine[],
) {
  return {
    name: metadata.formulaName.trim(),
    jira_project_id: metadata.formulaJiraProjectId.trim() || null,
    jira_issue_type: metadata.formulaJiraIssueType,
    jira_product_type: metadata.formulaJiraProductType,
    items: formulaLines.map((line, index) => ({
      raw_material_id: line.rawMaterialId,
      percentage: formulaLinePercentageValue(line.percentage),
      order_index: index,
    })),
  };
}

export function buildImportedFormulaSavePayload(
  tenantName: string | null | undefined,
  metadata: Omit<FormulaSaveMetadata, "formulaName">,
  rows: FormulaImportRow[],
  formulaName?: string | null,
) {
  const fallbackName = `${tenantName ?? "Imported"} Excel Formula`;

  return {
    name: formulaName?.trim() || fallbackName,
    jira_project_id: metadata.formulaJiraProjectId.trim() || null,
    jira_issue_type: metadata.formulaJiraIssueType,
    jira_product_type: metadata.formulaJiraProductType,
    rows: rows.map((row) => ({
      raw_material_id: row.raw_material_id,
      percentage: row.percentage,
    })),
  };
}
