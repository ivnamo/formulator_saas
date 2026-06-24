import type {
  ParameterRead,
  TenantInvitationRead,
  TenantMemberRead,
  TenantRead,
} from "./workspace-base-model";
import {
  buildParameterCreatePayload,
  buildTenantInvitationPayload,
  buildWorkspaceCreatePayload,
  type InvitationForm,
  type ParameterForm,
} from "./workspace-settings-model";
import { request } from "./workspace-api";

export function createTenantWorkspace(
  authHeaders: HeadersInit,
  name: string,
): Promise<TenantRead> {
  return request<TenantRead>("/api/v1/tenants", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify(buildWorkspaceCreatePayload(name)),
  });
}

export function listTenantWorkspaces(headers: HeadersInit): Promise<TenantRead[]> {
  return request<TenantRead[]>("/api/v1/tenants", {
    method: "GET",
    headers,
  });
}

export function listWorkspaceParameters(headers: HeadersInit): Promise<ParameterRead[]> {
  return request<ParameterRead[]>("/api/v1/parameters", {
    method: "GET",
    headers,
  });
}

export function listTenantInvitations(
  headers: HeadersInit,
): Promise<TenantInvitationRead[]> {
  return request<TenantInvitationRead[]>("/api/v1/tenant-invitations", {
    method: "GET",
    headers,
  });
}

export function listTenantMembers(headers: HeadersInit): Promise<TenantMemberRead[]> {
  return request<TenantMemberRead[]>("/api/v1/tenant-members", {
    method: "GET",
    headers,
  });
}

export function updateTenantMemberRole(
  headers: HeadersInit,
  memberId: string,
  role: string,
): Promise<TenantMemberRead> {
  return request<TenantMemberRead>(`/api/v1/tenant-members/${memberId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ role }),
  });
}

export function createTenantInvitationLink(
  headers: HeadersInit,
  invitationForm: InvitationForm,
): Promise<TenantInvitationRead> {
  return request<TenantInvitationRead>("/api/v1/tenant-invitations", {
    method: "POST",
    headers,
    body: JSON.stringify(buildTenantInvitationPayload(invitationForm)),
  });
}

export function createWorkspaceParameter(
  headers: HeadersInit,
  parameterForm: ParameterForm,
): Promise<ParameterRead> {
  return request<ParameterRead>("/api/v1/parameters", {
    method: "POST",
    headers,
    body: JSON.stringify(buildParameterCreatePayload(parameterForm)),
  });
}
