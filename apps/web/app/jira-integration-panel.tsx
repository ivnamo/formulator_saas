import type { Dispatch, SetStateAction } from "react";
import { JiraConnectionSettings } from "./jira-connection-settings";
import { JiraMetadataPanel } from "./jira-metadata-panel";
import type {
  JiraConnection,
  JiraConnectionForm,
  JiraFieldMetadata,
  JiraMetadataState,
} from "./jira-connection-model";

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
      <JiraConnectionSettings
        activeJiraConnection={activeJiraConnection}
        jiraConnectionForm={jiraConnectionForm}
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
      />
      {jiraMetadata ? (
        <JiraMetadataPanel
          jiraMetadata={jiraMetadata}
          jiraMappingKey={jiraMappingKey}
          canEditTenantData={canEditTenantData}
          onJiraMappingKeyChange={onJiraMappingKeyChange}
          onMapJiraField={onMapJiraField}
        />
      ) : null}
    </section>
  );
}
