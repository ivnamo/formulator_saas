import {
  normalizeCode,
  slugify,
} from "./workspace-utils";
import type { ParameterRead } from "./workspace-base-model";
import type { WorkspaceState } from "./workspace-state-model";
import { sortByParameterCode } from "./parameter-order";

export type InvitationForm = {
  email: string;
  role: string;
};

export type ParameterForm = {
  code: string;
  name: string;
  unit: string;
};

export const defaultParameterForm: ParameterForm = {
  code: "active_content",
  name: "Active content",
  unit: "% p/p",
};

export const defaultInvitationForm: InvitationForm = {
  email: "",
  role: "formulator",
};

export function buildWorkspaceCreatePayload(name: string) {
  return {
    name,
    slug: `${slugify(name)}-${Date.now()}`,
  };
}

export function buildTenantInvitationPayload(form: InvitationForm) {
  return {
    email: form.email.trim().toLowerCase(),
    role: form.role,
    send_link: true,
  };
}

export function buildParameterCreatePayload(form: ParameterForm) {
  return {
    code: normalizeCode(form.code),
    name: form.name.trim(),
    unit: form.unit.trim(),
  };
}

export function mergeParameters(
  parameters: WorkspaceState["parameters"],
  parameter: ParameterRead,
): WorkspaceState["parameters"] {
  const next = new Map<string, WorkspaceState["parameters"][number]>(
    parameters.map((item) => [item.id, item]),
  );
  next.set(parameter.id, parameter);
  return sortByParameterCode(Array.from(next.values()), (parameter) => parameter.code);
}
