import { Check, ExternalLink, KeyRound, ListChecks, Plus, RefreshCw, Save, Send } from "lucide-react";
import type {
  Dispatch,
  SetStateAction,
} from "react";
import type {
  JiraConnection,
  JiraConnectionForm,
  JiraFieldMetadata,
  JiraMetadataState,
  TenantInvitationRead,
  WorkspaceState,
} from "./workspace-model";

const JIRA_MAPPING_KEYS = [
  "formula_id",
  "formula_short_id",
  "formula_name",
  "formula_version",
  "formula_status",
  "jira_project_id",
  "jira_issue_type",
  "jira_product_type",
  "jira_product_type_option",
  "estimated_cost",
  "notes",
] as const;

type InvitationForm = {
  email: string;
  role: string;
};

type ParameterForm = {
  code: string;
  name: string;
  unit: string;
};

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

      <section id="integrations" className="panel integrationPanel" hidden={!active}>
        <div className="panelHeader">
          <h2>Integrations</h2>
          <span>
            {activeJiraConnection ? activeJiraConnection.credential_status : "Jira pending"}
          </span>
        </div>
        <div className="jiraForm">
          <label>
            <span>Auth</span>
            <select
              value={jiraConnectionForm.authType}
              onChange={(event) =>
                onJiraConnectionFormChange((current) => ({
                  ...current,
                  authType: event.target.value === "api_token" ? "api_token" : "oauth",
                }))
              }
              disabled={!canEditTenantData}
            >
              <option value="oauth">OAuth 3LO</option>
              <option value="api_token">API token</option>
            </select>
          </label>
          <label>
            <span>Jira URL</span>
            <input
              value={jiraConnectionForm.baseUrl}
              onChange={(event) =>
                onJiraConnectionFormChange((current) => ({
                  ...current,
                  baseUrl: event.target.value,
                }))
              }
              disabled={!canEditTenantData}
            />
          </label>
          <label>
            <span>Project key</span>
            <input
              value={jiraConnectionForm.defaultProjectKey}
              onChange={(event) =>
                onJiraConnectionFormChange((current) => ({
                  ...current,
                  defaultProjectKey: event.target.value,
                }))
              }
              disabled={!canEditTenantData}
            />
          </label>
          <label>
            <span>Issue type</span>
            <input
              value={jiraConnectionForm.defaultIssueType}
              onChange={(event) =>
                onJiraConnectionFormChange((current) => ({
                  ...current,
                  defaultIssueType: event.target.value,
                }))
              }
              disabled={!canEditTenantData}
            />
          </label>
          <label>
            <span>Auth email</span>
            <input
              value={jiraConnectionForm.authEmail}
              onChange={(event) =>
                onJiraConnectionFormChange((current) => ({
                  ...current,
                  authEmail: event.target.value,
                }))
              }
              disabled={!canEditTenantData}
            />
          </label>
          <label>
            <span>API token</span>
            <input
              type="password"
              value={jiraConnectionForm.apiToken}
              onChange={(event) =>
                onJiraConnectionFormChange((current) => ({
                  ...current,
                  apiToken: event.target.value,
                }))
              }
              disabled={!canEditTenantData || jiraConnectionForm.authType === "oauth"}
            />
          </label>
          <label>
            <span>Assignee</span>
            <input
              value={jiraConnectionForm.defaultAssignee}
              onChange={(event) =>
                onJiraConnectionFormChange((current) => ({
                  ...current,
                  defaultAssignee: event.target.value,
                }))
              }
              disabled={!canEditTenantData}
            />
          </label>
          <label className="jiraFieldMappingLabel">
            <span>Field mapping JSON</span>
            <textarea
              value={jiraConnectionForm.fieldMappingJson}
              onChange={(event) =>
                onJiraConnectionFormChange((current) => ({
                  ...current,
                  fieldMappingJson: event.target.value,
                }))
              }
              disabled={!canEditTenantData}
              rows={5}
            />
          </label>
          <div className="integrationActions">
            <button
              className="secondaryButton"
              type="button"
              onClick={() => void onSaveJiraConnection()}
              disabled={!canSaveJiraConnection}
            >
              <Save size={17} />
              Save Jira
            </button>
            <button
              className="secondaryButton"
              type="button"
              onClick={() => void onRefreshJiraConnections()}
              disabled={!canEditTenantData}
            >
              <RefreshCw size={17} />
              Refresh
            </button>
            <button
              className="secondaryButton"
              type="button"
              onClick={() => void onTestJiraConnection()}
              disabled={!canTestJiraConnection}
            >
              <Check size={17} />
              Test
            </button>
            <button
              className="secondaryButton"
              type="button"
              onClick={() => void onLoadJiraMetadata()}
              disabled={!canLoadJiraMetadata}
            >
              <ListChecks size={17} />
              Metadata
            </button>
            <button
              className="secondaryButton"
              type="button"
              onClick={() => void onAuthorizeJiraOAuth()}
              disabled={!canAuthorizeJiraOAuth}
            >
              <ExternalLink size={17} />
              Authorize OAuth
            </button>
          </div>
        </div>
        {activeJiraConnection ? (
          <div className="jiraConnectionSummary">
            <div>
              <span>Base URL</span>
              <strong>{activeJiraConnection.base_url}</strong>
            </div>
            <div>
              <span>Project</span>
              <strong>{activeJiraConnection.default_project_key}</strong>
            </div>
            <div>
              <span>Issue</span>
              <strong>{activeJiraConnection.default_issue_type}</strong>
            </div>
            <div>
              <span>Last test</span>
              <strong>{activeJiraConnection.last_test_status ?? "Pending"}</strong>
            </div>
            <div className="wide">
              <span>Message</span>
              <strong>{activeJiraConnection.last_test_message ?? "-"}</strong>
            </div>
          </div>
        ) : (
          <div className="empty">No Jira connection saved.</div>
        )}
        {jiraMetadata ? (
          <div className="jiraMetadataPanel">
            <div className="jiraMetadataHeader">
              <div>
                <span>Metadata</span>
                <strong>
                  {jiraMetadata.projectKey} / {jiraMetadata.issueType}
                </strong>
              </div>
              <label>
                <span>FormulIA field</span>
                <select
                  value={jiraMappingKey}
                  onChange={(event) => onJiraMappingKeyChange(event.target.value)}
                  disabled={!canEditTenantData}
                >
                  {JIRA_MAPPING_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="jiraMetadataColumns">
              <div>
                <span>Projects</span>
                <div className="jiraMetadataList">
                  {jiraMetadata.projects.map((project) => (
                    <div className="jiraMetadataRow" key={project.key}>
                      <code>{project.key}</code>
                      <strong>{project.name}</strong>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <span>Issue types</span>
                <div className="jiraMetadataList">
                  {jiraMetadata.issueTypes.map((issueType) => (
                    <div className="jiraMetadataRow" key={issueType.id}>
                      <code>{issueType.id}</code>
                      <strong>{issueType.name}</strong>
                    </div>
                  ))}
                </div>
              </div>
              <div className="jiraMetadataFields">
                <span>Fields</span>
                <div className="jiraMetadataList">
                  {jiraMetadata.fields.map((field) => (
                    <div className="jiraMetadataRow" key={field.field_id}>
                      <code>{field.field_id}</code>
                      <strong>{field.name}</strong>
                      <small>
                        {field.required ? "Required" : "Optional"}
                        {field.schema_type ? ` - ${field.schema_type}` : ""}
                        {field.allowed_values.length > 0
                          ? ` - ${field.allowed_values
                              .map((value) => value.value ?? value.name ?? value.key ?? value.id)
                              .filter(Boolean)
                              .slice(0, 4)
                              .join(", ")}`
                          : ""}
                      </small>
                      <button
                        className="iconButton"
                        type="button"
                        onClick={() => onMapJiraField(field)}
                        disabled={!canEditTenantData}
                        title={`Map ${jiraMappingKey}`}
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </>
  );
}
