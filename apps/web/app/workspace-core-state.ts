import { useState } from "react";
import type { TenantInvitationRead } from "./workspace-base-model";
import { emptyWorkspace, type WorkspaceState } from "./workspace-state-model";
import {
  defaultInvitationForm,
  defaultParameterForm,
  type InvitationForm,
  type ParameterForm,
} from "./workspace-settings-model";

export type { InvitationForm, ParameterForm } from "./workspace-settings-model";

export function useWorkspaceCoreState() {
  const [workspace, setWorkspace] = useState<WorkspaceState>(emptyWorkspace);
  const [workspaceName, setWorkspaceName] = useState("Workspace Lab");
  const [parameterForm, setParameterForm] = useState<ParameterForm>(defaultParameterForm);
  const [tenantInvitations, setTenantInvitations] = useState<TenantInvitationRead[]>([]);
  const [invitationForm, setInvitationForm] = useState<InvitationForm>(defaultInvitationForm);

  return {
    workspace,
    setWorkspace,
    workspaceName,
    setWorkspaceName,
    parameterForm,
    setParameterForm,
    tenantInvitations,
    setTenantInvitations,
    invitationForm,
    setInvitationForm,
  };
}
