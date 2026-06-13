import type { Dispatch, SetStateAction } from "react";
import type { JiraConnection, JiraConnectionForm } from "./jira-connection-model";
import {
  JiraConnectionActionButtons,
  JiraConnectionFormFields,
  JiraConnectionSummary,
} from "./jira-connection-settings-sections";

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
        <JiraConnectionFormFields
          jiraConnectionForm={jiraConnectionForm}
          canEditTenantData={canEditTenantData}
          onJiraConnectionFormChange={onJiraConnectionFormChange}
        />
        <JiraConnectionActionButtons
          canEditTenantData={canEditTenantData}
          canSaveJiraConnection={canSaveJiraConnection}
          canTestJiraConnection={canTestJiraConnection}
          canLoadJiraMetadata={canLoadJiraMetadata}
          canAuthorizeJiraOAuth={canAuthorizeJiraOAuth}
          onSaveJiraConnection={onSaveJiraConnection}
          onRefreshJiraConnections={onRefreshJiraConnections}
          onTestJiraConnection={onTestJiraConnection}
          onLoadJiraMetadata={onLoadJiraMetadata}
          onAuthorizeJiraOAuth={onAuthorizeJiraOAuth}
        />
      </div>
      <JiraConnectionSummary activeJiraConnection={activeJiraConnection} />
    </>
  );
}
