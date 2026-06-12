import { Check, ExternalLink, ListChecks, RefreshCw, Save } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type { JiraConnection, JiraConnectionForm } from "./workspace-model";

type JiraConnectionSettingsProps = {
  activeJiraConnection: JiraConnection | null;
  jiraConnectionForm: JiraConnectionForm;
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
};

export function JiraConnectionSettings({
  activeJiraConnection,
  jiraConnectionForm,
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
}: JiraConnectionSettingsProps) {
  return (
    <>
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
    </>
  );
}
