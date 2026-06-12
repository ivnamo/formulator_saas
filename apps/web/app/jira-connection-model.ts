export type JiraConnection = {
  id: string;
  tenant_id: string;
  base_url: string;
  auth_type: "api_token" | "oauth" | string;
  auth_email: string | null;
  credential_status: string;
  default_project_key: string;
  default_issue_type: string;
  default_assignee: string | null;
  field_mapping: Record<string, string>;
  status_mapping: Record<string, string>;
  is_active: boolean;
  last_test_status: string | null;
  last_test_message: string | null;
  last_tested_at: string | null;
  created_at: string;
  updated_at: string;
};

export type JiraConnectionTest = {
  connection_id: string;
  status: string;
  message: string;
  checked_at: string;
};

export type JiraProjectMetadata = {
  id: string | null;
  key: string;
  name: string;
  project_type_key: string | null;
  simplified: boolean | null;
};

export type JiraIssueTypeMetadata = {
  id: string;
  name: string;
  description: string | null;
  subtask: boolean;
};

export type JiraFieldMetadata = {
  field_id: string;
  name: string;
  required: boolean;
  schema_type: string | null;
  custom: string | null;
  allowed_values: Array<{
    id: string | null;
    key: string | null;
    name: string | null;
    value: string | null;
  }>;
};

export type JiraMetadataState = {
  projectKey: string;
  issueType: string;
  projects: JiraProjectMetadata[];
  issueTypes: JiraIssueTypeMetadata[];
  fields: JiraFieldMetadata[];
};

export type JiraOAuthAuthorize = {
  authorization_url: string;
  state: string;
};

export type JiraOAuthCallbackResult = {
  status: string;
  cloud_id: string;
  site_url: string;
  expires_at: number;
  scope: string | null;
};

export type JiraConnectionForm = {
  authType: "api_token" | "oauth";
  baseUrl: string;
  authEmail: string;
  apiToken: string;
  defaultProjectKey: string;
  defaultIssueType: string;
  defaultAssignee: string;
  fieldMappingJson: string;
};

export const emptyJiraConnectionForm: JiraConnectionForm = {
  authType: "oauth",
  baseUrl: "https://example.atlassian.net",
  authEmail: "",
  apiToken: "",
  defaultProjectKey: "PROJ",
  defaultIssueType: "Task",
  defaultAssignee: "",
  fieldMappingJson: "{}",
};

export function parseJiraJsonObject(
  value: string,
  label: string,
): Record<string, string> {
  const trimmed = value.trim();
  if (!trimmed) {
    return {};
  }
  const parsed = JSON.parse(trimmed) as unknown;
  if (
    parsed === null ||
    Array.isArray(parsed) ||
    typeof parsed !== "object" ||
    Object.values(parsed).some((item) => typeof item !== "string")
  ) {
    throw new Error(`${label} must be a JSON object with string values`);
  }
  return parsed as Record<string, string>;
}

export function jiraConnectionFormFromRead(
  connection: JiraConnection,
): JiraConnectionForm {
  return {
    authType: connection.auth_type === "oauth" ? "oauth" : "api_token",
    baseUrl: connection.base_url,
    authEmail: connection.auth_email ?? "",
    apiToken: "",
    defaultProjectKey: connection.default_project_key,
    defaultIssueType: connection.default_issue_type,
    defaultAssignee: connection.default_assignee ?? "",
    fieldMappingJson: JSON.stringify(connection.field_mapping, null, 2),
  };
}

export function buildJiraConnectionPayload(form: JiraConnectionForm) {
  const fieldMapping = parseJiraJsonObject(form.fieldMappingJson, "Jira field mapping");
  const payload: Record<string, unknown> = {
    base_url: form.baseUrl.trim(),
    auth_type: form.authType,
    auth_email: form.authEmail.trim() || null,
    default_project_key: form.defaultProjectKey.trim(),
    default_issue_type: form.defaultIssueType.trim(),
    default_assignee: form.defaultAssignee.trim() || null,
    field_mapping: fieldMapping,
    is_active: true,
  };
  if (form.authType === "api_token" && form.apiToken.trim()) {
    payload.api_token = form.apiToken.trim();
  }
  return payload;
}
