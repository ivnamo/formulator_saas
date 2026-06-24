import type { CompatibilityRuleForm } from "./compatibility-state";
import type { ExcelImportPreview } from "./excel-import-model";
import type { JiraConnection, JiraConnectionForm } from "./jira-connection-model";
import type { FormulaCompareSelection } from "./saved-formula-comparison-state";
import { hasTenantPermission, isTenantAdminRole } from "./tenant-roles";
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
  importFormulaName: string;
  importFormulaDescription: string;
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
  canExportFormulas: boolean;
  canArchiveEntities: boolean;
  canUseFormulaComparison: boolean;
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
  canViewObservability: boolean;
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
  importFormulaName,
  importFormulaDescription,
  requirementText,
  compatibilityRuleForm,
  jiraConnections,
  jiraConnectionForm,
}: WorkspaceCapabilitiesOptions): WorkspaceCapabilities {
  const isBusy = status === "working";
  const tenantRole = workspace.tenant?.role;
  const canEditRawMaterials = hasTenantPermission(tenantRole, "edit_raw_materials");
  const canEditFormulas = hasTenantPermission(tenantRole, "edit_formulas");
  const canImportFormulas = hasTenantPermission(tenantRole, "import_formulas");
  const canExportFormulas =
    Boolean(workspace.tenant) && hasTenantPermission(tenantRole, "export_formulas") && !isBusy;
  const canArchiveEntities =
    Boolean(workspace.tenant) && hasTenantPermission(tenantRole, "archive_entities") && !isBusy;
  const canSendToJira = hasTenantPermission(tenantRole, "send_to_jira");
  const canCompare = hasTenantPermission(tenantRole, "compare");
  const canUseAi = hasTenantPermission(tenantRole, "use_ai");
  const canCreateCompatibility = hasTenantPermission(tenantRole, "create_compatibility");
  const canManageIntegrations = hasTenantPermission(tenantRole, "manage_integrations");
  const canViewObservability = hasTenantPermission(tenantRole, "view_observability");
  const canEditTenantData = Boolean(workspace.tenant) && canEditRawMaterials && !isBusy;
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
    canEditFormulas &&
    workspace.formulaLines.length > 0 &&
    !hasPendingDraftReview &&
    !isBusy;
  const hasFormulaName = workspace.formulaName.trim().length > 0;
  const hasFormulaDescription = workspace.formulaJiraDescription.trim().length > 0;
  const canSaveFormula =
    canEditFormulas && canCalculate && isFormulaBalanced && hasFormulaName && hasFormulaDescription;
  const canUseFormulaComparison = Boolean(workspace.tenant) && canCompare && !isBusy;
  const canCompareSavedFormulas =
    canUseFormulaComparison &&
    Boolean(formulaCompareSelection.baselineId) &&
    Boolean(formulaCompareSelection.candidateId) &&
    formulaCompareSelection.baselineId !== formulaCompareSelection.candidateId;
  const canSelectImportSheet =
    canImportFormulas && availableImportSheets.length > 1 && Boolean(importFile) && !isBusy;
  const canSaveImport =
    canImportFormulas &&
    Boolean(importPreview) &&
    importPreview?.rows.length !== 0 &&
    importPreview?.pending_rows === 0 &&
    importFormulaName.trim().length > 0 &&
    importFormulaDescription.trim().length > 0 &&
    !isBusy;
  const canParseRequirements =
    Boolean(workspace.tenant) && canUseAi && requirementText.trim().length >= 3 && !isBusy;
  const canPlanRequirements = canParseRequirements;
  const selectableRawMaterialIds = new Set(
    workspace.rawMaterials.filter(isSelectableRawMaterial).map((material) => material.id),
  );
  const canCreateCompatibilityRule =
    Boolean(workspace.tenant) &&
    canCreateCompatibility &&
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
    canManageIntegrations &&
    jiraConnectionForm.baseUrl.trim().length > 0 &&
    jiraConnectionForm.defaultProjectKey.trim().length > 0 &&
    jiraConnectionForm.defaultIssueType.trim().length > 0 &&
    !isBusy;
  const canTestJiraConnection = canManageIntegrations && Boolean(activeJiraConnection) && !isBusy;
  const canLoadJiraMetadata = canManageIntegrations && Boolean(activeJiraConnection) && !isBusy;
  const canAuthorizeJiraOAuth =
    Boolean(workspace.tenant) &&
    canManageIntegrations &&
    jiraConnectionForm.authType === "oauth" &&
    !isBusy;
  const isQualityJiraIssueType =
    workspace.formulaJiraIssueType.trim().toLowerCase() === "calidad";
  const canPrepareJiraReview =
    Boolean(workspace.tenant) &&
    canSendToJira &&
    workspace.formulaLines.length > 0 &&
    isFormulaBalanced &&
    hasFormulaDescription &&
    !hasPendingDraftReview &&
    (!isQualityJiraIssueType || workspace.formulaJiraProjectId.trim().length > 0) &&
    Boolean(activeJiraConnection) &&
    !isBusy;
  const canSearchCatalog = Boolean(workspace.tenant) && canEditFormulas && !isBusy;

  return {
    isBusy,
    canEditTenantData,
    canManageTenantUsers,
    showInvitationAdminPanel,
    hasPendingDraftReview,
    canConfirmDraftReview,
    canCalculate,
    canSaveFormula,
    canExportFormulas,
    canArchiveEntities,
    canUseFormulaComparison,
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
    canViewObservability,
  };
}
