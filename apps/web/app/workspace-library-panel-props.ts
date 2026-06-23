import type { WorkspaceHomePanels } from "./workspace-home-view";

type LibraryPanelProps = WorkspaceHomePanels["library"];

type BuildWorkspaceLibraryPanelPropsArgs = {
  formulas: LibraryPanelProps["formulas"];
  calculationHistory: LibraryPanelProps["calculationHistory"];
  formulaCompareSelection: LibraryPanelProps["formulaCompareSelection"];
  comparisonConstraintForm: LibraryPanelProps["comparisonConstraintForm"];
  comparisonMaterialOptions: LibraryPanelProps["comparisonMaterialOptions"];
  canEditTenantData: LibraryPanelProps["canEditTenantData"];
  canExportFormulas: LibraryPanelProps["canExportFormulas"];
  canUseFormulaComparison: LibraryPanelProps["canUseFormulaComparison"];
  canCompareSavedFormulas: LibraryPanelProps["canCompareSavedFormulas"];
  isBusy: LibraryPanelProps["isBusy"];
  savedFormulaComparison: LibraryPanelProps["savedFormulaComparison"];
  comparisonComplianceSummary: LibraryPanelProps["comparisonComplianceSummary"];
  comparisonConstraintEvaluations: LibraryPanelProps["comparisonConstraintEvaluations"];
  comparisonConstraintIssueCount: LibraryPanelProps["comparisonConstraintIssueCount"];
  visibleComparisonConstraintEvaluations: LibraryPanelProps["visibleComparisonConstraintEvaluations"];
  showOnlyConstraintIssues: LibraryPanelProps["showOnlyConstraintIssues"];
  selectFormulaForComparison: LibraryPanelProps["onSelectFormula"];
  refreshFormulaLibrary: LibraryPanelProps["onRefreshLibrary"];
  compareSavedFormulas: LibraryPanelProps["onCompareSavedFormulas"];
  exportSavedFormulaIdLabExcel: LibraryPanelProps["onExportFormula"];
  openFormula: LibraryPanelProps["onOpenFormula"];
  updateComparisonConstraint: LibraryPanelProps["onUpdateConstraint"];
  setShowOnlyConstraintIssues: LibraryPanelProps["onShowOnlyConstraintIssuesChange"];
};

export function buildWorkspaceLibraryPanelProps(
  args: BuildWorkspaceLibraryPanelPropsArgs,
): LibraryPanelProps {
  return {
    formulas: args.formulas,
    calculationHistory: args.calculationHistory,
    formulaCompareSelection: args.formulaCompareSelection,
    comparisonConstraintForm: args.comparisonConstraintForm,
    comparisonMaterialOptions: args.comparisonMaterialOptions,
    canEditTenantData: args.canEditTenantData,
    canExportFormulas: args.canExportFormulas,
    canUseFormulaComparison: args.canUseFormulaComparison,
    canCompareSavedFormulas: args.canCompareSavedFormulas,
    isBusy: args.isBusy,
    savedFormulaComparison: args.savedFormulaComparison,
    comparisonComplianceSummary: args.comparisonComplianceSummary,
    comparisonConstraintEvaluations: args.comparisonConstraintEvaluations,
    comparisonConstraintIssueCount: args.comparisonConstraintIssueCount,
    visibleComparisonConstraintEvaluations: args.visibleComparisonConstraintEvaluations,
    showOnlyConstraintIssues: args.showOnlyConstraintIssues,
    onSelectFormula: args.selectFormulaForComparison,
    onRefreshLibrary: args.refreshFormulaLibrary,
    onCompareSavedFormulas: args.compareSavedFormulas,
    onExportFormula: args.exportSavedFormulaIdLabExcel,
    onOpenFormula: args.openFormula,
    onUpdateConstraint: args.updateComparisonConstraint,
    onShowOnlyConstraintIssuesChange: args.setShowOnlyConstraintIssues,
  };
}
