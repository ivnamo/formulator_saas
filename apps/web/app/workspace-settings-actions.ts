import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { CompatibilityRuleForm } from "./compatibility-panel";
import { request } from "./workspace-api";
import { getSupabaseBrowserClient } from "./supabase-client";
import { isTenantAdminRole } from "./tenant-roles";
import {
  emptyJiraConnectionForm,
  emptyWorkspace,
  normalizeCode,
  slugify,
  type AiRun,
  type AgentPlan,
  type CalculationResult,
  type CompatibilityRuleRead,
  type FormulaCalculationHistory,
  type FormulaReviewArtifact,
  type FormulaRead,
  type FormulaReviewRequest,
  type JiraConnection,
  type JiraConnectionForm,
  type JiraMetadataState,
  type ParameterRead,
  type RequirementParse,
  type Status,
  type TenantInvitationRead,
  type TenantRead,
  type WorkspaceState,
} from "./workspace-model";
import type { DraftReviewState } from "./workspace-comparison";
import type { ComparisonConstraintField } from "./saved-formula-comparison-state";

type InvitationForm = {
  email: string;
  role: string;
};

type ParameterForm = {
  code: string;
  name: string;
  unit: string;
};

type WorkspaceSettingsActionsOptions = {
  workspace: WorkspaceState;
  workspaceName: string;
  invitationForm: InvitationForm;
  parameterForm: ParameterForm;
  authHeaders: HeadersInit;
  headers: HeadersInit;
  setWorkspace: Dispatch<SetStateAction<WorkspaceState>>;
  setWorkspaceName: Dispatch<SetStateAction<string>>;
  setSelectedMaterialId: Dispatch<SetStateAction<string | null>>;
  setComparisonMaterialIds: Dispatch<SetStateAction<string[]>>;
  setDetailedMaterialIds: Dispatch<SetStateAction<string[]>>;
  setResult: Dispatch<SetStateAction<CalculationResult | null>>;
  setFormulas: Dispatch<SetStateAction<FormulaRead[]>>;
  setCalculationHistory: Dispatch<SetStateAction<FormulaCalculationHistory[]>>;
  setFormulaReviewRequests: Dispatch<SetStateAction<FormulaReviewRequest[]>>;
  setFormulaReviewArtifacts: Dispatch<SetStateAction<Record<string, FormulaReviewArtifact[]>>>;
  setCompatibilityRules: Dispatch<SetStateAction<CompatibilityRuleRead[]>>;
  setCompatibilityRuleForm: Dispatch<SetStateAction<CompatibilityRuleForm>>;
  setJiraConnections: Dispatch<SetStateAction<JiraConnection[]>>;
  setTenantInvitations: Dispatch<SetStateAction<TenantInvitationRead[]>>;
  setJiraConnectionForm: Dispatch<SetStateAction<JiraConnectionForm>>;
  setJiraMetadata: Dispatch<SetStateAction<JiraMetadataState | null>>;
  setRequirementParse: Dispatch<SetStateAction<RequirementParse | null>>;
  setAgentPlan: Dispatch<SetStateAction<AgentPlan | null>>;
  setDraftReview: Dispatch<SetStateAction<DraftReviewState | null>>;
  setAiRuns: Dispatch<SetStateAction<AiRun[]>>;
  setStatus: Dispatch<SetStateAction<Status>>;
  setInvitationForm: Dispatch<SetStateAction<InvitationForm>>;
  resetSavedFormulaComparisonState: () => void;
  resetImportState: () => void;
  updateComparisonConstraint: (field: ComparisonConstraintField, value: string) => void;
  refreshCatalog: () => void;
  runAction: (label: string, action: () => Promise<void>) => Promise<void>;
  setError: (message: string) => void;
  setMessage: (message: string) => void;
};

function mergeParameters(
  parameters: WorkspaceState["parameters"],
  parameter: ParameterRead,
): WorkspaceState["parameters"] {
  const next = new Map<string, WorkspaceState["parameters"][number]>(
    parameters.map((item) => [item.id, item]),
  );
  next.set(parameter.id, parameter);
  return Array.from(next.values()).sort((left, right) => left.code.localeCompare(right.code));
}

function emptyCompatibilityRuleForm(): CompatibilityRuleForm {
  return {
    materialAId: "",
    materialBId: "",
    severity: "warning",
    message: "",
    recommendedAction: "",
  };
}

export function useWorkspaceSettingsActions({
  workspace,
  workspaceName,
  invitationForm,
  parameterForm,
  authHeaders,
  headers,
  setWorkspace,
  setWorkspaceName,
  setSelectedMaterialId,
  setComparisonMaterialIds,
  setDetailedMaterialIds,
  setResult,
  setFormulas,
  setCalculationHistory,
  setFormulaReviewRequests,
  setFormulaReviewArtifacts,
  setCompatibilityRules,
  setCompatibilityRuleForm,
  setJiraConnections,
  setTenantInvitations,
  setJiraConnectionForm,
  setJiraMetadata,
  setRequirementParse,
  setAgentPlan,
  setDraftReview,
  setAiRuns,
  setStatus,
  setInvitationForm,
  resetSavedFormulaComparisonState,
  resetImportState,
  updateComparisonConstraint,
  refreshCatalog,
  runAction,
  setError,
  setMessage,
}: WorkspaceSettingsActionsOptions) {
  const signOut = useCallback(async () => {
    await getSupabaseBrowserClient().auth.signOut();
    window.location.href = "/login";
  }, []);

  const createWorkspace = useCallback(async () => {
    await runAction("Creating workspace", async () => {
      const name = workspaceName.trim() || "Workspace Lab";
      const tenant = await request<TenantRead>("/api/v1/tenants", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          name,
          slug: `${slugify(name)}-${Date.now()}`,
        }),
      });
      setWorkspace({
        ...emptyWorkspace,
        tenant,
        formulaName: `${name} Formula`,
      });
      setResult(null);
      setFormulas([]);
      setCalculationHistory([]);
      setFormulaReviewRequests([]);
      setFormulaReviewArtifacts({});
      setCompatibilityRules([]);
      setCompatibilityRuleForm(emptyCompatibilityRuleForm());
      setJiraConnections([]);
      setTenantInvitations([]);
      setJiraConnectionForm(emptyJiraConnectionForm);
      setJiraMetadata(null);
      setRequirementParse(null);
      setAgentPlan(null);
      setDraftReview(null);
      resetSavedFormulaComparisonState();
      setAiRuns([]);
      resetImportState();
      setMessage("Workspace ready");
    });
  }, [
    authHeaders,
    resetImportState,
    resetSavedFormulaComparisonState,
    runAction,
    setAgentPlan,
    setAiRuns,
    setCalculationHistory,
    setCompatibilityRuleForm,
    setCompatibilityRules,
    setDraftReview,
    setFormulaReviewArtifacts,
    setFormulaReviewRequests,
    setFormulas,
    setJiraConnectionForm,
    setJiraConnections,
    setJiraMetadata,
    setMessage,
    setRequirementParse,
    setResult,
    setTenantInvitations,
    setWorkspace,
    workspaceName,
  ]);

  const loadAuthenticatedWorkspace = useCallback(
    async (accessToken: string) => {
      setStatus("working");
      setMessage("Loading tenant");
      const baseHeaders = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      };
      try {
        const tenants = await request<TenantRead[]>("/api/v1/tenants", {
          method: "GET",
          headers: baseHeaders,
        });
        const tenant =
          tenants.find((candidate) => candidate.slug === "atlantica-agricola") ?? tenants[0];
        if (!tenant) {
          setStatus("error");
          setMessage("No tenant invitation is active for this user.");
          return;
        }
        const tenantHeaders = { ...baseHeaders, "X-Tenant-Id": tenant.id };
        const [parameters, invitations] = await Promise.all([
          request<ParameterRead[]>("/api/v1/parameters", {
            method: "GET",
            headers: tenantHeaders,
          }),
          isTenantAdminRole(tenant.role)
            ? request<TenantInvitationRead[]>("/api/v1/tenant-invitations", {
                method: "GET",
                headers: tenantHeaders,
              })
            : Promise.resolve([]),
        ]);

        const activeParameter = parameters[0] ?? null;
        setWorkspace({
          ...emptyWorkspace,
          tenant,
          parameter: activeParameter,
          parameters,
          rawMaterials: [],
          formulaName: `${tenant.name} Formula`,
        });
        setSelectedMaterialId(null);
        setComparisonMaterialIds([]);
        setDetailedMaterialIds([]);
        setWorkspaceName(tenant.name);
        setResult(null);
        setFormulas([]);
        setCalculationHistory([]);
        setFormulaReviewRequests([]);
        setFormulaReviewArtifacts({});
        setCompatibilityRules([]);
        setJiraConnections([]);
        setTenantInvitations(invitations);
        setJiraMetadata(null);
        setRequirementParse(null);
        setAgentPlan(null);
        setDraftReview(null);
        setAiRuns([]);
        resetImportState();
        setStatus("idle");
        setMessage(`${tenant.name} loaded`);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Could not load tenant");
      }
    },
    [
      resetImportState,
      setAgentPlan,
      setAiRuns,
      setCalculationHistory,
      setCompatibilityRules,
      setComparisonMaterialIds,
      setDetailedMaterialIds,
      setDraftReview,
      setError,
      setFormulaReviewArtifacts,
      setFormulaReviewRequests,
      setFormulas,
      setJiraConnections,
      setJiraMetadata,
      setMessage,
      setRequirementParse,
      setResult,
      setSelectedMaterialId,
      setStatus,
      setTenantInvitations,
      setWorkspace,
      setWorkspaceName,
    ],
  );

  const createTenantInvitation = useCallback(async () => {
    if (!workspace.tenant) {
      setError("Create a workspace first");
      return;
    }
    if (!isTenantAdminRole(workspace.tenant.role)) {
      setError("Only tenant admins can send invitation links");
      return;
    }
    const email = invitationForm.email.trim().toLowerCase();
    if (!email.includes("@")) {
      setError("Invitation email is invalid");
      return;
    }

    await runAction("Sending invitation link", async () => {
      const invitation = await request<TenantInvitationRead>("/api/v1/tenant-invitations", {
        method: "POST",
        headers,
        body: JSON.stringify({
          email,
          role: invitationForm.role,
          send_link: true,
        }),
      });
      setTenantInvitations((current) => {
        const rest = current.filter((item) => item.id !== invitation.id);
        return [invitation, ...rest];
      });
      setInvitationForm((current) => ({ ...current, email: "" }));
      setMessage(`Invitation link sent to ${invitation.email}`);
    });
  }, [
    headers,
    invitationForm.email,
    invitationForm.role,
    runAction,
    setError,
    setInvitationForm,
    setMessage,
    setTenantInvitations,
    workspace.tenant,
  ]);

  const createParameter = useCallback(async () => {
    if (!workspace.tenant) {
      setError("Create a workspace first");
      return;
    }
    if (!parameterForm.code.trim() || !parameterForm.name.trim() || !parameterForm.unit.trim()) {
      setError("Parameter code, name and unit are required");
      return;
    }

    await runAction("Creating parameter", async () => {
      const parameter = await request<ParameterRead>("/api/v1/parameters", {
        method: "POST",
        headers,
        body: JSON.stringify({
          code: normalizeCode(parameterForm.code),
          name: parameterForm.name.trim(),
          unit: parameterForm.unit.trim(),
        }),
      });
      setWorkspace((current) => ({
        ...current,
        parameter,
        parameters: mergeParameters(current.parameters, parameter),
      }));
      updateComparisonConstraint("parameterCode", parameter.code);
      refreshCatalog();
      setResult(null);
      setMessage("Parameter ready");
    });
  }, [
    headers,
    parameterForm.code,
    parameterForm.name,
    parameterForm.unit,
    refreshCatalog,
    runAction,
    setError,
    setMessage,
    setResult,
    setWorkspace,
    updateComparisonConstraint,
    workspace.tenant,
  ]);

  return {
    createWorkspace,
    loadAuthenticatedWorkspace,
    signOut,
    createTenantInvitation,
    createParameter,
  };
}
