import { Check, ExternalLink, ListChecks, Plus, RefreshCw, Save } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type {
  JiraConnection,
  JiraConnectionForm,
  JiraFieldMetadata,
  JiraMetadataState,
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

type JiraIntegrationPanelProps = {
  active: boolean;
  activeJiraConnection: JiraConnection | null;
  jiraConnectionForm: JiraConnectionForm;
  jiraMetadata: JiraMetadataState | null;
  jiraMappingKey: string;
  canEditTenantData: boolean;
  canSaveJiraConnection: boolean;
  canTestJiraConnection: boolean;
  canLoadJiraMetadata: boolean;
  canAuthorizeJiraOAuth: boolean;
  onJiraConnectionFormChange: Dispatch<SetStateAction<JiraConnectionForm>>;
  onSaveJiraConnection: () => void | Promise<void>;
  onRefreshJiraConnections: () => void | Promise<void>;
  onTestJiraConnection: () => void | Promise<void>;
  onLoadJiraMetadata: () => void | Promise<void>;
  onAuthorizeJiraOAuth: () => void | Promise<void>;
  onJiraMappingKeyChange: (value: string) => void;
  onMapJiraField: (field: JiraFieldMetadata) => void;
};

export function JiraIntegrationPanel({
  active,
  activeJiraConnection,
  jiraConnectionForm,
  jiraMetadata,
  jiraMappingKey,
  canEditTenantData,
  canSaveJiraConnection,
  canTestJiraConnection,
  canLoadJiraMetadata,
  canAuthorizeJiraOAuth,
  onJiraConnectionFormChange,
  onSaveJiraConnection,
  onRefreshJiraConnections,
  onTestJiraConnection,
  onLoadJiraMetadata,
  onAuthorizeJiraOAuth,
  onJiraMappingKeyChange,
  onMapJiraField,
}: JiraIntegrationPanelProps) {
  return (
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
  );
}
