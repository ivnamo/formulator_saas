import {
  buildJiraConnectionPayload,
  type JiraConnection,
  type JiraConnectionForm,
  type JiraConnectionTest,
  type JiraMetadataState,
  type JiraOAuthAuthorize,
} from "./jira-connection-model";
import { request } from "./workspace-api";

export function listJiraConnections(headers: HeadersInit): Promise<JiraConnection[]> {
  return request<JiraConnection[]>("/api/v1/integrations/jira", {
    method: "GET",
    headers,
  });
}

export function saveJiraConnectionConfig(
  headers: HeadersInit,
  connectionId: string | null,
  form: JiraConnectionForm,
): Promise<JiraConnection> {
  const payload = buildJiraConnectionPayload(form);
  if (connectionId) {
    return request<JiraConnection>(`/api/v1/integrations/jira/${connectionId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(payload),
    });
  }
  return request<JiraConnection>("/api/v1/integrations/jira", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}

export function testJiraConnectionConfig(
  headers: HeadersInit,
  connectionId: string,
): Promise<JiraConnectionTest> {
  return request<JiraConnectionTest>(
    `/api/v1/integrations/jira/${connectionId}/test`,
    {
      method: "POST",
      headers,
    },
  );
}

export async function fetchJiraMetadata(
  headers: HeadersInit,
  connectionId: string,
  projectKey: string,
  issueType: string,
): Promise<Pick<JiraMetadataState, "projects" | "issueTypes" | "fields">> {
  const query = new URLSearchParams({
    project_key: projectKey,
    issue_type: issueType,
  });
  const [projects, issueTypes, fields] = await Promise.all([
    request<JiraMetadataState["projects"]>(
      `/api/v1/integrations/jira/${connectionId}/projects`,
      { method: "GET", headers },
    ),
    request<JiraMetadataState["issueTypes"]>(
      `/api/v1/integrations/jira/${connectionId}/issue-types?${query.toString()}`,
      { method: "GET", headers },
    ),
    request<JiraMetadataState["fields"]>(
      `/api/v1/integrations/jira/${connectionId}/fields?${query.toString()}`,
      { method: "GET", headers },
    ),
  ]);
  return { projects, issueTypes, fields };
}

export function fetchJiraOAuthAuthorizeUrl(
  headers: HeadersInit,
): Promise<JiraOAuthAuthorize> {
  return request<JiraOAuthAuthorize>("/api/v1/integrations/jira/oauth/authorize-url", {
    method: "GET",
    headers,
  });
}
