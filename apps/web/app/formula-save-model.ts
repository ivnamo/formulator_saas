import {
  formulaLinePercentageValue,
  type FormulaBuilderMode,
} from "./formula-builder-model";

type FormulaSaveLine = {
  rawMaterialId: string;
  percentage: number;
};

type FormulaSaveMetadata = {
  formulaId: string | null;
  formulaBuilderMode: FormulaBuilderMode;
  formulaName: string;
  formulaJiraProjectId: string;
  formulaJiraIssueType: string;
  formulaJiraProductType: string;
  formulaJiraDescription: string;
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
    objective: metadata.formulaJiraDescription.trim(),
    source_formula_id:
      metadata.formulaBuilderMode === "version" ? metadata.formulaId : null,
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
  _tenantName: string | null | undefined,
  metadata: Omit<FormulaSaveMetadata, "formulaName" | "formulaId" | "formulaBuilderMode">,
  rows: FormulaImportRow[],
  formulaName?: string | null,
) {
  return {
    name: formulaName?.trim() ?? "",
    objective: metadata.formulaJiraDescription.trim(),
    jira_project_id: metadata.formulaJiraProjectId.trim() || null,
    jira_issue_type: metadata.formulaJiraIssueType,
    jira_product_type: metadata.formulaJiraProductType,
    rows: rows.map((row) => ({
      raw_material_id: row.raw_material_id,
      percentage: row.percentage,
    })),
  };
}
