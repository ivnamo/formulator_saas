import { KeyRound, Plus, Save, Send } from "lucide-react";
import type {
  Dispatch,
  SetStateAction,
} from "react";
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
}: SettingsPanelProps) {
  return (
    <>
      <section className="panel setupPanel" hidden={!active}>
        <div className="panelHeader">
          <h2>Workspace</h2>
          <span>{workspace.tenant ? "Active" : "New"}</span>
        </div>
        <div className="formGrid">
          <label>
            <span>Name</span>
            <input
              value={workspaceName}
              onChange={(event) => onWorkspaceNameChange(event.target.value)}
              disabled={isBusy}
            />
          </label>
          <button
            className="secondaryButton"
            type="button"
            onClick={() => void onCreateWorkspace()}
            disabled={isBusy}
          >
            <Plus size={17} />
            Create workspace
          </button>
        </div>
      </section>

      <section className="panel setupPanel" hidden={!active}>
        <div className="panelHeader">
          <h2>Mi cuenta</h2>
          <span>{sessionEmail ?? "Sesion activa"}</span>
        </div>
        <div className="accountActions">
          <a className="secondaryButton" href="/update-password">
            <KeyRound size={17} />
            Cambiar contrasena
          </a>
        </div>
      </section>

      {showInvitationAdminPanel ? (
        <section className="panel setupPanel" hidden={!active}>
          <div className="panelHeader">
            <h2>Invitaciones</h2>
            <span>Admin only</span>
          </div>
          <div className="formGrid inviteFormGrid">
            <label>
              <span>Email</span>
              <input
                autoComplete="email"
                inputMode="email"
                value={invitationForm.email}
                onChange={(event) =>
                  onInvitationFormChange((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                disabled={!canManageTenantUsers}
              />
            </label>
            <label>
              <span>Rol</span>
              <select
                value={invitationForm.role}
                onChange={(event) =>
                  onInvitationFormChange((current) => ({
                    ...current,
                    role: event.target.value,
                  }))
                }
                disabled={!canManageTenantUsers}
              >
                <option value="formulator">Formulator</option>
                <option value="viewer">Viewer</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <button
              className="secondaryButton"
              type="button"
              onClick={() => void onCreateTenantInvitation()}
              disabled={!canManageTenantUsers || !invitationForm.email.trim()}
            >
              <Send size={17} />
              Enviar enlace
            </button>
          </div>
          <div className="invitationList">
            {tenantInvitations.length === 0 ? (
              <div className="empty">No tenant invitations yet.</div>
            ) : (
              tenantInvitations.map((invitation) => (
                <div className="invitationRow" key={invitation.id}>
                  <span>
                    <strong>{invitation.email}</strong>
                    {invitation.role}
                  </span>
                  <code>{invitation.status}</code>
                </div>
              ))
            )}
          </div>
        </section>
      ) : null}

      <section id="parameters" className="panel setupPanel" hidden={!active}>
        <div className="panelHeader">
          <h2>Parameter</h2>
          <span>{workspace.parameter ? workspace.parameter.code : "None"}</span>
        </div>
        <div className="formGrid threeColumns">
          <label>
            <span>Code</span>
            <input
              value={parameterForm.code}
              onChange={(event) =>
                onParameterFormChange((current) => ({ ...current, code: event.target.value }))
              }
              disabled={!canEditTenantData}
            />
          </label>
          <label>
            <span>Name</span>
            <input
              value={parameterForm.name}
              onChange={(event) =>
                onParameterFormChange((current) => ({ ...current, name: event.target.value }))
              }
              disabled={!canEditTenantData}
            />
          </label>
          <label>
            <span>Unit</span>
            <input
              value={parameterForm.unit}
              onChange={(event) =>
                onParameterFormChange((current) => ({ ...current, unit: event.target.value }))
              }
              disabled={!canEditTenantData}
            />
          </label>
          <button
            className="secondaryButton"
            type="button"
            onClick={() => void onCreateParameter()}
            disabled={!canEditTenantData}
          >
            <Save size={17} />
            Save parameter
          </button>
        </div>
      </section>

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
    </>
  );
}
