import type { CompatibilityRuleForm } from "./compatibility-state";
import type { ExcelImportPreview } from "./excel-import-model";
import type { JiraConnection, JiraConnectionForm } from "./jira-connection-model";
import type { FormulaCompareSelection } from "./saved-formula-comparison-state";
import { isTenantAdminRole } from "./tenant-roles";
import type { Status } from "./workspace-base-model";
import type { DraftReviewState } from "./workspace-comparison";
import type { WorkspaceState } from "./workspace-state-model";
import { isSelectableRawMaterial } from "./raw-material-model";

export type WorkspaceCapabilitiesOptions = {
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
};

export type WorkspaceCapabilities = {
  isBusy: boolean;
  canEditTenantData: boolean;
  canManageTenantUsers: boolean;
  showInvitationAdminPanel: boolean;
  hasPendingDraftReview: boolean;
  canConfirmDraftReview: boolean;
  canCalculate: boolean;
  canSaveFormula: boolean;
  canCompareSavedFormulas: boolean;
  canSelectImportSheet: boolean;
  canSaveImport: boolean;
  canParseRequirements: boolean;
  canPlanRequirements: boolean;
  canCreateCompatibilityRule: boolean;
  activeJiraConnection: JiraConnection | null;
  canSaveJiraConnection: boolean;
  canTestJiraConnection: boolean;
  canLoadJiraMetadata: boolean;
  canAuthorizeJiraOAuth: boolean;
  canPrepareJiraReview: boolean;
  canSearchCatalog: boolean;
};

export function getActiveJiraConnection(
  jiraConnections: JiraConnection[],
): JiraConnection | null {
  return jiraConnections.find((connection) => connection.is_active) ?? jiraConnections[0] ?? null;
}

export function buildWorkspaceCapabilities({
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
}: WorkspaceCapabilitiesOptions): WorkspaceCapabilities {
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
  const selectableRawMaterialIds = new Set(
    workspace.rawMaterials.filter(isSelectableRawMaterial).map((material) => material.id),
  );
  const canCreateCompatibilityRule =
    Boolean(workspace.tenant) &&
    Boolean(compatibilityRuleForm.materialAId) &&
    Boolean(compatibilityRuleForm.materialBId) &&
    selectableRawMaterialIds.has(compatibilityRuleForm.materialAId) &&
    selectableRawMaterialIds.has(compatibilityRuleForm.materialBId) &&
    compatibilityRuleForm.materialAId !== compatibilityRuleForm.materialBId &&
    compatibilityRuleForm.message.trim().length > 0 &&
    !isBusy;
  const activeJiraConnection = getActiveJiraConnection(jiraConnections);
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
  const isQualityJiraIssueType =
    workspace.formulaJiraIssueType.trim().toLowerCase() === "calidad";
  const canPrepareJiraReview =
    Boolean(workspace.tenant) &&
    workspace.formulaLines.length > 0 &&
    isFormulaBalanced &&
    !hasPendingDraftReview &&
    (!isQualityJiraIssueType || workspace.formulaJiraProjectId.trim().length > 0) &&
    Boolean(activeJiraConnection) &&
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
