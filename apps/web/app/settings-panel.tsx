import type { Dispatch, SetStateAction } from "react";
import type {
  JiraConnection,
  JiraConnectionForm,
  JiraFieldMetadata,
  JiraMetadataState,
} from "./jira-connection-model";
import type { TenantInvitationRead } from "./workspace-base-model";
import type { InvitationForm, ParameterForm } from "./workspace-core-state";
import type { WorkspaceState } from "./workspace-state-model";
import { JiraIntegrationPanel } from "./jira-integration-panel";
import {
  AccountSettingsSection,
  ProductObservabilitySection,
  ParameterSettingsSection,
  TenantInvitationsSection,
  WorkspaceSettingsSection,
} from "./settings-panel-sections";
import type { ProductEventSummary } from "./product-observability-api";

type SettingsPanelProps = {
  active: boolean;
  workspace: WorkspaceState;
  workspaceName: string;
  sessionEmail: string | null | undefined;
  invitationForm: InvitationForm;
  tenantInvitations: TenantInvitationRead[];
  parameterForm: ParameterForm;
  activeJiraConnection: JiraConnection | null;
  jiraConnectionForm: JiraConnectionForm;
  jiraMetadata: JiraMetadataState | null;
  jiraMappingKey: string;
  isBusy: boolean;
  canEditTenantData: boolean;
  canManageTenantUsers: boolean;
  canSaveJiraConnection: boolean;
  canTestJiraConnection: boolean;
  canLoadJiraMetadata: boolean;
  canAuthorizeJiraOAuth: boolean;
  showInvitationAdminPanel: boolean;
  canViewObservability: boolean;
  productEventSummary: ProductEventSummary | null;
  onWorkspaceNameChange: (value: string) => void;
  onCreateWorkspace: () => void | Promise<void>;
  onInvitationFormChange: Dispatch<SetStateAction<InvitationForm>>;
  onCreateTenantInvitation: () => void | Promise<void>;
  onParameterFormChange: Dispatch<SetStateAction<ParameterForm>>;
  onCreateParameter: () => void | Promise<void>;
  onJiraConnectionFormChange: Dispatch<SetStateAction<JiraConnectionForm>>;
  onSaveJiraConnection: () => void | Promise<void>;
  onRefreshJiraConnections: () => void | Promise<void>;
  onTestJiraConnection: () => void | Promise<void>;
  onLoadJiraMetadata: () => void | Promise<void>;
  onAuthorizeJiraOAuth: () => void | Promise<void>;
  onJiraMappingKeyChange: (value: string) => void;
  onMapJiraField: (field: JiraFieldMetadata) => void;
  onRefreshProductEvents: () => void | Promise<void>;
};

export function SettingsPanel({
  active,
  workspace,
  workspaceName,
  sessionEmail,
  invitationForm,
  tenantInvitations,
  parameterForm,
  activeJiraConnection,
  jiraConnectionForm,
  jiraMetadata,
  jiraMappingKey,
  isBusy,
  canEditTenantData,
  canManageTenantUsers,
  canSaveJiraConnection,
  canTestJiraConnection,
  canLoadJiraMetadata,
  canAuthorizeJiraOAuth,
  showInvitationAdminPanel,
  canViewObservability,
  productEventSummary,
  onWorkspaceNameChange,
  onCreateWorkspace,
  onInvitationFormChange,
  onCreateTenantInvitation,
  onParameterFormChange,
  onCreateParameter,
  onJiraConnectionFormChange,
  onSaveJiraConnection,
  onRefreshJiraConnections,
  onTestJiraConnection,
  onLoadJiraMetadata,
  onAuthorizeJiraOAuth,
  onJiraMappingKeyChange,
  onMapJiraField,
  onRefreshProductEvents,
}: SettingsPanelProps) {
  return (
    <>
      <WorkspaceSettingsSection
        active={active}
        hasTenant={Boolean(workspace.tenant)}
        workspaceName={workspaceName}
        isBusy={isBusy}
        onWorkspaceNameChange={onWorkspaceNameChange}
        onCreateWorkspace={onCreateWorkspace}
      />

      <AccountSettingsSection active={active} sessionEmail={sessionEmail} />

      {showInvitationAdminPanel ? (
        <TenantInvitationsSection
          active={active}
          invitationForm={invitationForm}
          tenantInvitations={tenantInvitations}
          canManageTenantUsers={canManageTenantUsers}
          onInvitationFormChange={onInvitationFormChange}
          onCreateTenantInvitation={onCreateTenantInvitation}
        />
      ) : null}

      <ParameterSettingsSection
        active={active}
        parameterCode={workspace.parameter?.code ?? null}
        parameterForm={parameterForm}
        canEditTenantData={canEditTenantData}
        onParameterFormChange={onParameterFormChange}
        onCreateParameter={onCreateParameter}
      />

      <JiraIntegrationPanel
        active={active}
        activeJiraConnection={activeJiraConnection}
        jiraConnectionForm={jiraConnectionForm}
        jiraMetadata={jiraMetadata}
        jiraMappingKey={jiraMappingKey}
        canEditTenantData={canEditTenantData}
        canSaveJiraConnection={canSaveJiraConnection}
        canTestJiraConnection={canTestJiraConnection}
        canLoadJiraMetadata={canLoadJiraMetadata}
        canAuthorizeJiraOAuth={canAuthorizeJiraOAuth}
        onJiraConnectionFormChange={onJiraConnectionFormChange}
        onSaveJiraConnection={onSaveJiraConnection}
        onRefreshJiraConnections={onRefreshJiraConnections}
        onTestJiraConnection={onTestJiraConnection}
        onLoadJiraMetadata={onLoadJiraMetadata}
        onAuthorizeJiraOAuth={onAuthorizeJiraOAuth}
        onJiraMappingKeyChange={onJiraMappingKeyChange}
        onMapJiraField={onMapJiraField}
      />

      {canViewObservability ? (
        <ProductObservabilitySection
          active={active}
          summary={productEventSummary}
          isBusy={isBusy}
          onRefresh={onRefreshProductEvents}
        />
      ) : null}
    </>
  );
}
