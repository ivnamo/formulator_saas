import { useCallback, type Dispatch, type SetStateAction } from "react";
import { request } from "./workspace-api";
import type {
  JiraConnection,
  JiraConnectionForm,
  JiraConnectionTest,
  JiraFieldMetadata,
  JiraMetadataState,
  JiraOAuthAuthorize,
  Status,
  WorkspaceState,
} from "./workspace-model";

type JiraConnectionActionsOptions = {
  workspace: WorkspaceState;
  activeJiraConnection: JiraConnection | null;
  jiraConnectionForm: JiraConnectionForm;
  jiraMappingKey: string;
  headers: HeadersInit;
  canSaveJiraConnection: boolean;
  setJiraConnections: Dispatch<SetStateAction<JiraConnection[]>>;
  setJiraConnectionForm: Dispatch<SetStateAction<JiraConnectionForm>>;
  setJiraMetadata: Dispatch<SetStateAction<JiraMetadataState | null>>;
  setStatus: Dispatch<SetStateAction<Status>>;
  runAction: (label: string, action: () => Promise<void>) => Promise<void>;
  setError: (message: string) => void;
  setMessage: (message: string) => void;
};

function parseJsonObject(value: string, label: string): Record<string, string> {
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

function jiraConnectionFormFromRead(connection: JiraConnection): JiraConnectionForm {
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

function buildJiraConnectionPayload(form: JiraConnectionForm) {
  const fieldMapping = parseJsonObject(form.fieldMappingJson, "Jira field mapping");
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

export function useJiraConnectionActions({
  workspace,
  activeJiraConnection,
  jiraConnectionForm,
  jiraMappingKey,
  headers,
  canSaveJiraConnection,
  setJiraConnections,
  setJiraConnectionForm,
  setJiraMetadata,
  setStatus,
  runAction,
  setError,
  setMessage,
}: JiraConnectionActionsOptions) {
  const refreshJiraConnections = useCallback(
    async (options: { silent?: boolean } = {}) => {
      if (!workspace.tenant) {
        setError("Create a workspace first");
        return;
      }
      const loadConnections = async () => {
        const connections = await request<JiraConnection[]>("/api/v1/integrations/jira", {
          method: "GET",
          headers,
        });
        setJiraConnections(connections);
        const preferredConnection =
          connections.find((connection) => connection.is_active) ?? connections[0] ?? null;
        if (preferredConnection) {
          setJiraConnectionForm(jiraConnectionFormFromRead(preferredConnection));
        } else {
          setJiraMetadata(null);
        }
        return connections;
      };
      if (options.silent) {
        await loadConnections();
        return;
      }
      await runAction("Refreshing integrations", async () => {
        await loadConnections();
        setMessage("Integrations refreshed");
      });
    },
    [
      headers,
      runAction,
      setError,
      setJiraConnectionForm,
      setJiraConnections,
      setJiraMetadata,
      setMessage,
      workspace.tenant,
    ],
  );

  const saveJiraConnection = useCallback(async () => {
    if (!workspace.tenant) {
      setError("Create a workspace first");
      return;
    }
    if (!canSaveJiraConnection) {
      setError("Jira URL, project key and issue type are required");
      return;
    }

    await runAction("Saving Jira connection", async () => {
      const payload = buildJiraConnectionPayload(jiraConnectionForm);
      const connection = activeJiraConnection
        ? await request<JiraConnection>(`/api/v1/integrations/jira/${activeJiraConnection.id}`, {
            method: "PATCH",
            headers,
            body: JSON.stringify(payload),
          })
        : await request<JiraConnection>("/api/v1/integrations/jira", {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
          });
      setJiraConnections((current) => [
        connection,
        ...current.filter((item) => item.id !== connection.id),
      ]);
      setJiraConnectionForm(jiraConnectionFormFromRead(connection));
      setJiraMetadata(null);
      setMessage("Jira connection saved");
    });
  }, [
    activeJiraConnection,
    canSaveJiraConnection,
    headers,
    jiraConnectionForm,
    runAction,
    setError,
    setJiraConnectionForm,
    setJiraConnections,
    setJiraMetadata,
    setMessage,
    workspace.tenant,
  ]);

  const testJiraConnection = useCallback(async () => {
    if (!activeJiraConnection) {
      setError("Save Jira connection first");
      return;
    }

    await runAction("Testing Jira configuration", async () => {
      const result = await request<JiraConnectionTest>(
        `/api/v1/integrations/jira/${activeJiraConnection.id}/test`,
        {
          method: "POST",
          headers,
        },
      );
      await refreshJiraConnections({ silent: true });
      setMessage(`${result.status}: ${result.message}`);
    });
  }, [activeJiraConnection, headers, refreshJiraConnections, runAction, setError, setMessage]);

  const loadJiraMetadata = useCallback(async () => {
    if (!activeJiraConnection) {
      setError("Save Jira connection first");
      return;
    }
    const projectKey =
      jiraConnectionForm.defaultProjectKey.trim() || activeJiraConnection.default_project_key;
    const issueType =
      jiraConnectionForm.defaultIssueType.trim() || activeJiraConnection.default_issue_type;
    const query = new URLSearchParams({
      project_key: projectKey,
      issue_type: issueType,
    });

    await runAction("Loading Jira metadata", async () => {
      const [projects, issueTypes, fields] = await Promise.all([
        request<JiraMetadataState["projects"]>(
          `/api/v1/integrations/jira/${activeJiraConnection.id}/projects`,
          { method: "GET", headers },
        ),
        request<JiraMetadataState["issueTypes"]>(
          `/api/v1/integrations/jira/${activeJiraConnection.id}/issue-types?${query.toString()}`,
          { method: "GET", headers },
        ),
        request<JiraMetadataState["fields"]>(
          `/api/v1/integrations/jira/${activeJiraConnection.id}/fields?${query.toString()}`,
          { method: "GET", headers },
        ),
      ]);
      setJiraMetadata({ projectKey, issueType, projects, issueTypes, fields });
      setMessage(`Jira metadata loaded: ${fields.length} fields`);
    });
  }, [
    activeJiraConnection,
    headers,
    jiraConnectionForm.defaultIssueType,
    jiraConnectionForm.defaultProjectKey,
    runAction,
    setError,
    setJiraMetadata,
    setMessage,
  ]);

  const mapJiraField = useCallback(
    (field: JiraFieldMetadata) => {
      try {
        const currentMapping = parseJsonObject(
          jiraConnectionForm.fieldMappingJson,
          "Jira field mapping",
        );
        const nextMapping = { ...currentMapping, [jiraMappingKey]: field.field_id };
        setJiraConnectionForm((current) => ({
          ...current,
          fieldMappingJson: JSON.stringify(nextMapping, null, 2),
        }));
        setStatus("idle");
        setMessage(`Mapped ${jiraMappingKey} to ${field.field_id}`);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Invalid Jira field mapping JSON");
      }
    },
    [
      jiraConnectionForm.fieldMappingJson,
      jiraMappingKey,
      setError,
      setJiraConnectionForm,
      setMessage,
      setStatus,
    ],
  );

  const authorizeJiraOAuth = useCallback(async () => {
    if (!workspace.tenant) {
      setError("Create a workspace first");
      return;
    }
    if (jiraConnectionForm.authType !== "oauth") {
      setError("Switch Jira authentication to OAuth first");
      return;
    }

    await runAction("Opening Jira authorization", async () => {
      const authorization = await request<JiraOAuthAuthorize>(
        "/api/v1/integrations/jira/oauth/authorize-url",
        {
          method: "GET",
          headers,
        },
      );
      window.location.href = authorization.authorization_url;
    });
  }, [
    headers,
    jiraConnectionForm.authType,
    runAction,
    setError,
    workspace.tenant,
  ]);

  return {
    refreshJiraConnections,
    saveJiraConnection,
    testJiraConnection,
    loadJiraMetadata,
    mapJiraField,
    authorizeJiraOAuth,
  };
}
