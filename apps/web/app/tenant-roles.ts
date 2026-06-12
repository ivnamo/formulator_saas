export function isTenantAdminRole(role?: string | null) {
  return role === "owner" || role === "admin";
}
