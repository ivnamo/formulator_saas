export type Tenant = {
  id: string;
  name: string;
  slug: string;
  role?: string | null;
};

export type Parameter = {
  id: string;
  code: string;
  name: string;
  unit: string;
};

export type FormulaLine = {
  localId: string;
  rawMaterialId: string;
  percentage: number;
};

export type TenantRead = Tenant & {
  status: string;
};

export type TenantInvitationRead = {
  id: string;
  tenant_id: string;
  email: string;
  role: string;
  status: string;
  invited_by: string | null;
  accepted_by: string | null;
  expires_at: string | null;
  created_at: string;
  accepted_at: string | null;
  email_delivery_status?: string | null;
};

export type ParameterRead = Parameter & {
  tenant_id: string;
  is_active: boolean;
};

export type Status = "idle" | "working" | "error";
