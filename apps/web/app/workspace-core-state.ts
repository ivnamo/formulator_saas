import { useState } from "react";
import {
  emptyWorkspace,
  type TenantInvitationRead,
  type WorkspaceState,
} from "./workspace-model";

export type InvitationForm = {
  email: string;
  role: string;
};

export type ParameterForm = {
  code: string;
  name: string;
  unit: string;
};

export function useWorkspaceCoreState() {
  const [workspace, setWorkspace] = useState<WorkspaceState>(emptyWorkspace);
  const [workspaceName, setWorkspaceName] = useState("Workspace Lab");
  const [parameterForm, setParameterForm] = useState<ParameterForm>({
    code: "active_content",
    name: "Active content",
    unit: "% p/p",
  });
  const [tenantInvitations, setTenantInvitations] = useState<TenantInvitationRead[]>([]);
  const [invitationForm, setInvitationForm] = useState<InvitationForm>({
    email: "",
    role: "formulator",
  });

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
