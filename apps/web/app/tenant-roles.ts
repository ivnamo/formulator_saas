export type TenantRole = "owner" | "admin" | "formulator" | "viewer";

export type TenantPermission =
  | "manage_users"
  | "manage_settings"
  | "manage_integrations"
  | "manage_iso"
  | "edit_raw_materials"
  | "edit_formulas"
  | "import_formulas"
  | "export_formulas"
  | "send_to_jira"
  | "compare"
  | "use_ai"
  | "create_compatibility"
  | "view_observability";

const rolePermissions: Record<TenantRole, ReadonlySet<TenantPermission>> = {
  owner: new Set([
    "manage_users",
    "manage_settings",
    "manage_integrations",
    "manage_iso",
    "edit_raw_materials",
    "edit_formulas",
    "import_formulas",
    "export_formulas",
    "send_to_jira",
    "compare",
    "use_ai",
    "create_compatibility",
    "view_observability",
  ]),
  admin: new Set([
    "manage_users",
    "manage_settings",
    "manage_integrations",
    "manage_iso",
    "edit_raw_materials",
    "edit_formulas",
    "import_formulas",
    "export_formulas",
    "send_to_jira",
    "compare",
    "use_ai",
    "create_compatibility",
    "view_observability",
  ]),
  formulator: new Set([
    "edit_raw_materials",
    "edit_formulas",
    "import_formulas",
    "export_formulas",
    "send_to_jira",
    "compare",
    "use_ai",
    "create_compatibility",
  ]),
  viewer: new Set(["compare"]),
};

export function normalizeTenantRole(role?: string | null): TenantRole | null {
  const normalized = role?.trim().toLowerCase();
  if (normalized === "formulador") {
    return "formulator";
  }
  if (
    normalized === "owner" ||
    normalized === "admin" ||
    normalized === "formulator" ||
    normalized === "viewer"
  ) {
    return normalized;
  }
  return null;
}

export function isTenantAdminRole(role?: string | null) {
  const normalized = normalizeTenantRole(role);
  return normalized === "owner" || normalized === "admin";
}

export function hasTenantPermission(
  role: string | null | undefined,
  permission: TenantPermission,
) {
  const normalized = normalizeTenantRole(role);
  return normalized ? rolePermissions[normalized].has(permission) : false;
}
