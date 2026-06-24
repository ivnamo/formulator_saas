import type { WorkspaceHomePanels } from "./workspace-home-view";

type SettingsPanelProps = WorkspaceHomePanels["settings"];

type BuildWorkspaceSettingsPanelPropsArgs = {
  workspace: SettingsPanelProps["workspace"];
  workspaceName: SettingsPanelProps["workspaceName"];
  sessionEmail: SettingsPanelProps["sessionEmail"];
  invitationForm: SettingsPanelProps["invitationForm"];
  tenantInvitations: SettingsPanelProps["tenantInvitations"];
  parameterForm: SettingsPanelProps["parameterForm"];
  activeJiraConnection: SettingsPanelProps["activeJiraConnection"];
  jiraConnectionForm: SettingsPanelProps["jiraConnectionForm"];
  jiraMetadata: SettingsPanelProps["jiraMetadata"];
  jiraMappingKey: SettingsPanelProps["jiraMappingKey"];
  isBusy: SettingsPanelProps["isBusy"];
  canEditTenantData: SettingsPanelProps["canEditTenantData"];
  canManageTenantUsers: SettingsPanelProps["canManageTenantUsers"];
  canSaveJiraConnection: SettingsPanelProps["canSaveJiraConnection"];
  canTestJiraConnection: SettingsPanelProps["canTestJiraConnection"];
  canLoadJiraMetadata: SettingsPanelProps["canLoadJiraMetadata"];
  canAuthorizeJiraOAuth: SettingsPanelProps["canAuthorizeJiraOAuth"];
  showInvitationAdminPanel: SettingsPanelProps["showInvitationAdminPanel"];
  canViewObservability: SettingsPanelProps["canViewObservability"];
  productEventSummary: SettingsPanelProps["productEventSummary"];
  setWorkspaceName: SettingsPanelProps["onWorkspaceNameChange"];
  createWorkspace: SettingsPanelProps["onCreateWorkspace"];
  setInvitationForm: SettingsPanelProps["onInvitationFormChange"];
  createTenantInvitation: SettingsPanelProps["onCreateTenantInvitation"];
  setParameterForm: SettingsPanelProps["onParameterFormChange"];
  createParameter: SettingsPanelProps["onCreateParameter"];
  setJiraConnectionForm: SettingsPanelProps["onJiraConnectionFormChange"];
  saveJiraConnection: SettingsPanelProps["onSaveJiraConnection"];
  refreshJiraConnections: SettingsPanelProps["onRefreshJiraConnections"];
  testJiraConnection: SettingsPanelProps["onTestJiraConnection"];
  loadJiraMetadata: SettingsPanelProps["onLoadJiraMetadata"];
  authorizeJiraOAuth: SettingsPanelProps["onAuthorizeJiraOAuth"];
  setJiraMappingKey: SettingsPanelProps["onJiraMappingKeyChange"];
  mapJiraField: SettingsPanelProps["onMapJiraField"];
  refreshProductEventSummary: SettingsPanelProps["onRefreshProductEvents"];
};

export function buildWorkspaceSettingsPanelProps(
  args: BuildWorkspaceSettingsPanelPropsArgs,
): SettingsPanelProps {
  return {
    workspace: args.workspace,
    workspaceName: args.workspaceName,
    sessionEmail: args.sessionEmail,
    invitationForm: args.invitationForm,
    tenantInvitations: args.tenantInvitations,
    parameterForm: args.parameterForm,
    activeJiraConnection: args.activeJiraConnection,
    jiraConnectionForm: args.jiraConnectionForm,
    jiraMetadata: args.jiraMetadata,
    jiraMappingKey: args.jiraMappingKey,
    isBusy: args.isBusy,
    canEditTenantData: args.canEditTenantData,
    canManageTenantUsers: args.canManageTenantUsers,
    canSaveJiraConnection: args.canSaveJiraConnection,
    canTestJiraConnection: args.canTestJiraConnection,
    canLoadJiraMetadata: args.canLoadJiraMetadata,
    canAuthorizeJiraOAuth: args.canAuthorizeJiraOAuth,
    showInvitationAdminPanel: args.showInvitationAdminPanel,
    canViewObservability: args.canViewObservability,
    productEventSummary: args.productEventSummary,
    onWorkspaceNameChange: args.setWorkspaceName,
    onCreateWorkspace: args.createWorkspace,
    onInvitationFormChange: args.setInvitationForm,
    onCreateTenantInvitation: args.createTenantInvitation,
    onParameterFormChange: args.setParameterForm,
    onCreateParameter: args.createParameter,
    onJiraConnectionFormChange: args.setJiraConnectionForm,
    onSaveJiraConnection: args.saveJiraConnection,
    onRefreshJiraConnections: args.refreshJiraConnections,
    onTestJiraConnection: args.testJiraConnection,
    onLoadJiraMetadata: args.loadJiraMetadata,
    onAuthorizeJiraOAuth: args.authorizeJiraOAuth,
    onJiraMappingKeyChange: args.setJiraMappingKey,
    onMapJiraField: args.mapJiraField,
    onRefreshProductEvents: args.refreshProductEventSummary,
  };
}
