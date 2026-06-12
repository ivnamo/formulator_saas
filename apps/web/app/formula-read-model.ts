import {
  emptyWorkspace,
  makeLocalId,
  type FormulaRead,
  type WorkspaceState,
} from "./workspace-model";

export type EditableFormulaMetadata = Pick<
  WorkspaceState,
  | "formulaId"
  | "formulaName"
  | "formulaJiraProjectId"
  | "formulaJiraIssueType"
  | "formulaJiraProductType"
>;

export type EditableFormulaState = EditableFormulaMetadata &
  Pick<WorkspaceState, "formulaLines">;

function textOrDefault(value: string | null | undefined, fallback: string): string {
  return value && value.trim().length ? value : fallback;
}

export function toEditableFormulaMetadata(
  formula: FormulaRead,
): EditableFormulaMetadata {
  return {
    formulaId: formula.id,
    formulaName: formula.name,
    formulaJiraProjectId: formula.jira_project_id ?? "",
    formulaJiraIssueType: textOrDefault(
      formula.jira_issue_type,
      emptyWorkspace.formulaJiraIssueType,
    ),
    formulaJiraProductType: textOrDefault(
      formula.jira_product_type,
      emptyWorkspace.formulaJiraProductType,
    ),
  };
}

export function toEditableFormulaState(formula: FormulaRead): EditableFormulaState {
  return {
    ...toEditableFormulaMetadata(formula),
    formulaLines: formula.items.map((item) => ({
      localId: makeLocalId(),
      rawMaterialId: item.raw_material_id,
      percentage: item.percentage,
    })),
  };
}
