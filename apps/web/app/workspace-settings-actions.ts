import { useCallback, type Dispatch, type SetStateAction } from "react";
import { getSupabaseBrowserClient } from "./supabase-client";
import { isTenantAdminRole } from "./tenant-roles";
import type { CalculationResult } from "./formula-model";
import type {
  Status,
  TenantInvitationRead,
} from "./workspace-base-model";
import { emptyWorkspace, type WorkspaceState } from "./workspace-state-model";
import type { ComparisonConstraintField } from "./saved-formula-comparison-state";
import {
  mergeParameters,
  type InvitationForm,
  type ParameterForm,
} from "./workspace-settings-model";
import {
  createTenantInvitationLink,
  createTenantWorkspace,
  createWorkspaceParameter,
  listTenantInvitations,
  listTenantWorkspaces,
  listWorkspaceParameters,
} from "./workspace-settings-api";
import { listRawMaterials } from "./raw-material-api";
import { toWorkspaceRawMaterial } from "./raw-material-model";

type WorkspaceSettingsActionsOptions = {
  workspace: WorkspaceState;
  workspaceName: string;
  invitationForm: InvitationForm;
  parameterForm: ParameterForm;
  authHeaders: HeadersInit;
  headers: HeadersInit;
  setWorkspace: Dispatch<SetStateAction<WorkspaceState>>;
  setWorkspaceName: Dispatch<SetStateAction<string>>;
  setResult: Dispatch<SetStateAction<CalculationResult | null>>;
  setTenantInvitations: Dispatch<SetStateAction<TenantInvitationRead[]>>;
  setStatus: Dispatch<SetStateAction<Status>>;
  setInvitationForm: Dispatch<SetStateAction<InvitationForm>>;
  resetFormulaBuilderSelection: () => void;
  resetRawMaterialWorkspaceState: () => void;
  resetFormulaWorkspaceState: () => void;
  resetCompatibilityState: () => void;
  resetJiraConnectionState: () => void;
  resetIsoDesignState: () => void;
  resetAiWorkflowState: () => void;
  resetSavedFormulaComparisonState: () => void;
  resetImportState: () => void;
  updateComparisonConstraint: (field: ComparisonConstraintField, value: string) => void;
  refreshCatalog: () => void;
  runAction: (label: string, action: () => Promise<void>) => Promise<void>;
  setError: (message: string) => void;
  setMessage: (message: string) => void;
};

export function useWorkspaceSettingsActions({
  workspace,
  workspaceName,
  invitationForm,
  parameterForm,
  authHeaders,
  headers,
  setWorkspace,
  setWorkspaceName,
  setResult,
  setTenantInvitations,
  setStatus,
  setInvitationForm,
  resetFormulaBuilderSelection,
  resetRawMaterialWorkspaceState,
  resetFormulaWorkspaceState,
  resetCompatibilityState,
  resetJiraConnectionState,
  resetIsoDesignState,
  resetAiWorkflowState,
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
      const tenant = await createTenantWorkspace(authHeaders, name);
      setWorkspace({
        ...emptyWorkspace,
        tenant,
      });
      resetFormulaBuilderSelection();
      resetRawMaterialWorkspaceState();
      resetFormulaWorkspaceState();
      resetCompatibilityState();
      resetJiraConnectionState();
      resetIsoDesignState();
      setTenantInvitations([]);
      resetAiWorkflowState();
      resetSavedFormulaComparisonState();
      resetImportState();
      setMessage("Workspace ready");
    });
  }, [
    authHeaders,
    resetAiWorkflowState,
    resetCompatibilityState,
    resetFormulaBuilderSelection,
    resetFormulaWorkspaceState,
    resetImportState,
    resetIsoDesignState,
    resetJiraConnectionState,
    resetRawMaterialWorkspaceState,
    resetSavedFormulaComparisonState,
    runAction,
    setMessage,
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
        const tenants = await listTenantWorkspaces(baseHeaders);
        const tenant =
          tenants.find((candidate) => candidate.slug === "atlantica-agricola") ?? tenants[0];
        if (!tenant) {
          setStatus("error");
          setMessage("No tenant invitation is active for this user.");
          return;
        }
        const tenantHeaders = { ...baseHeaders, "X-Tenant-Id": tenant.id };
        setWorkspace({
          ...emptyWorkspace,
          tenant,
          rawMaterials: [],
        });
        resetFormulaBuilderSelection();
        resetRawMaterialWorkspaceState();
        setWorkspaceName(tenant.name);
        resetFormulaWorkspaceState();
        resetCompatibilityState();
        resetJiraConnectionState();
        resetIsoDesignState();
        setTenantInvitations([]);
        resetAiWorkflowState();
        resetSavedFormulaComparisonState();
        resetImportState();
        setStatus("idle");
        setMessage(`${tenant.name} loaded`);
        void (async () => {
          try {
            const [parameters, rawMaterials, invitations] = await Promise.all([
              listWorkspaceParameters(tenantHeaders),
              listRawMaterials(tenantHeaders),
              isTenantAdminRole(tenant.role)
                ? listTenantInvitations(tenantHeaders)
                : Promise.resolve([]),
            ]);
            const activeParameter = parameters[0] ?? null;
            setWorkspace((current) =>
              current.tenant?.id === tenant.id
                ? {
                    ...current,
                    parameter: activeParameter,
                    parameters,
                    rawMaterials: rawMaterials.map((material) =>
                      toWorkspaceRawMaterial(material, {}, parameters),
                    ),
                  }
                : current,
            );
            setTenantInvitations(invitations);
          } catch (error) {
            setError(error instanceof Error ? error.message : "Could not load tenant metadata");
          }
        })();
      } catch (error) {
        setError(error instanceof Error ? error.message : "Could not load tenant");
      }
    },
    [
      resetAiWorkflowState,
      resetCompatibilityState,
      resetFormulaBuilderSelection,
      resetFormulaWorkspaceState,
      resetImportState,
      resetIsoDesignState,
      resetJiraConnectionState,
      resetRawMaterialWorkspaceState,
      resetSavedFormulaComparisonState,
      setError,
      setMessage,
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
      const invitation = await createTenantInvitationLink(headers, invitationForm);
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
      const parameter = await createWorkspaceParameter(headers, parameterForm);
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
