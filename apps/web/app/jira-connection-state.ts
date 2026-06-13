import { useCallback, useState } from "react";
import {
  emptyJiraConnectionForm,
  type JiraConnection,
  type JiraConnectionForm,
  type JiraMetadataState,
} from "./jira-connection-model";

export function useJiraConnectionState() {
  const [jiraConnections, setJiraConnections] = useState<JiraConnection[]>([]);
  const [jiraConnectionForm, setJiraConnectionForm] =
    useState<JiraConnectionForm>(emptyJiraConnectionForm);
  const [jiraMetadata, setJiraMetadata] = useState<JiraMetadataState | null>(null);
  const [jiraMappingKey, setJiraMappingKey] = useState("jira_project_id");
  const resetJiraConnectionState = useCallback(() => {
    setJiraConnections([]);
    setJiraConnectionForm(emptyJiraConnectionForm);
    setJiraMetadata(null);
    setJiraMappingKey("jira_project_id");
  }, []);

  return {
    jiraConnections,
    setJiraConnections,
    jiraConnectionForm,
    setJiraConnectionForm,
    jiraMetadata,
    setJiraMetadata,
    jiraMappingKey,
    setJiraMappingKey,
    resetJiraConnectionState,
  };
}
