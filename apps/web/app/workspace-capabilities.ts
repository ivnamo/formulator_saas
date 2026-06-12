import { useMemo } from "react";
import type { CompatibilityRuleForm } from "./compatibility-state";
import type { DraftReviewState } from "./workspace-comparison";
import { isTenantAdminRole } from "./tenant-roles";
import type { FormulaCompareSelection } from "./saved-formula-comparison-state";
import type {
  CalculationResult,
  ExcelImportPreview,
  JiraConnection,
  JiraConnectionForm,
  Status,
  WorkspaceState,
} from "./workspace-model";

type WorkspaceCapabilitiesOptions = {
  workspace: WorkspaceState;
  status: Status;
  draftReview: DraftReviewState | null;
  isFormulaBalanced: boolean;
  formulaCompareSelection: FormulaCompareSelection;
  availableImportSheets: string[];
  importFile: File | null;
  importPreview: ExcelImportPreview | null;
  requirementText: string;
  compatibilityRuleForm: CompatibilityRuleForm;
  jiraConnections: JiraConnection[];
  jiraConnectionForm: JiraConnectionForm;
  result: CalculationResult | null;
};

export function useWorkspaceCapabilities({
  workspace,
  status,
  draftReview,
  isFormulaBalanced,
  formulaCompareSelection,
  availableImportSheets,
  importFile,
  importPreview,
  requirementText,
  compatibilityRuleForm,
  jiraConnections,
  jiraConnectionForm,
  result,
}: WorkspaceCapabilitiesOptions) {
  const isBusy = status === "working";
  const canEditTenantData = Boolean(workspace.tenant) && !isBusy;
  const showInvitationAdminPanel = isTenantAdminRole(workspace.tenant?.role);
  const canManageTenantUsers = showInvitationAdminPanel && !isBusy;
  const hasPendingDraftReview = draftReview !== null && draftReview.status !== "confirmed";
  const canConfirmDraftReview =
    draftReview !== null &&
    draftReview.status !== "confirmed" &&
    draftReview.notes.trim().length >= 3 &&
    !isBusy;
  const canCalculate =
    Boolean(workspace.tenant) &&
    workspace.formulaLines.length > 0 &&
    !hasPendingDraftReview &&
    !isBusy;
  const canSaveFormula = canCalculate && isFormulaBalanced;
  const canCompareSavedFormulas =
    Boolean(workspace.tenant) &&
    Boolean(formulaCompareSelection.baselineId) &&
    Boolean(formulaCompareSelection.candidateId) &&
    formulaCompareSelection.baselineId !== formulaCompareSelection.candidateId &&
    !isBusy;
  const canSelectImportSheet = availableImportSheets.length > 1 && Boolean(importFile) && !isBusy;
  const canSaveImport =
    Boolean(importPreview) &&
    importPreview?.rows.length !== 0 &&
    importPreview?.pending_rows === 0 &&
    !isBusy;
  const canParseRequirements =
    Boolean(workspace.tenant) && requirementText.trim().length >= 3 && !isBusy;
  const canPlanRequirements = canParseRequirements;
  const canCreateCompatibilityRule =
    Boolean(workspace.tenant) &&
    Boolean(compatibilityRuleForm.materialAId) &&
    Boolean(compatibilityRuleForm.materialBId) &&
    compatibilityRuleForm.materialAId !== compatibilityRuleForm.materialBId &&
    compatibilityRuleForm.message.trim().length > 0 &&
    !isBusy;
  const activeJiraConnection = useMemo(
    () => jiraConnections.find((connection) => connection.is_active) ?? jiraConnections[0] ?? null,
    [jiraConnections],
  );
  const canSaveJiraConnection =
    Boolean(workspace.tenant) &&
    jiraConnectionForm.baseUrl.trim().length > 0 &&
    jiraConnectionForm.defaultProjectKey.trim().length > 0 &&
    jiraConnectionForm.defaultIssueType.trim().length > 0 &&
    !isBusy;
  const canTestJiraConnection = Boolean(activeJiraConnection) && !isBusy;
  const canLoadJiraMetadata = Boolean(activeJiraConnection) && canEditTenantData;
  const canAuthorizeJiraOAuth =
    Boolean(workspace.tenant) && jiraConnectionForm.authType === "oauth" && !isBusy;
  const canPrepareJiraReview =
    Boolean(workspace.tenant) &&
    Boolean(workspace.formulaId) &&
    workspace.formulaJiraProjectId.trim().length > 0 &&
    Boolean(activeJiraConnection) &&
    result !== null &&
    !isBusy;
  const canSearchCatalog = Boolean(workspace.tenant) && !isBusy;

  return {
    isBusy,
    canEditTenantData,
    canManageTenantUsers,
    showInvitationAdminPanel,
    hasPendingDraftReview,
    canConfirmDraftReview,
    canCalculate,
    canSaveFormula,
    canCompareSavedFormulas,
    canSelectImportSheet,
    canSaveImport,
    canParseRequirements,
    canPlanRequirements,
    canCreateCompatibilityRule,
    activeJiraConnection,
    canSaveJiraConnection,
    canTestJiraConnection,
    canLoadJiraMetadata,
    canAuthorizeJiraOAuth,
    canPrepareJiraReview,
    canSearchCatalog,
  };
}
