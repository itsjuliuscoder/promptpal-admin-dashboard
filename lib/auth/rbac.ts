export type AdminRole = "super_admin" | "admin" | "support" | "analyst";

const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  super_admin: ["billing:write", "users:write", "prompts:write", "settings:write"],
  admin: ["users:write", "prompts:write", "settings:write"],
  support: ["users:read", "prompts:read", "settings:read"],
  analyst: ["analytics:read"],
};

export const getRolePermissions = (role?: string) => {
  const normalized = (role || "admin") as AdminRole;
  return ROLE_PERMISSIONS[normalized] || [];
};

/**
 * Check if an admin has a specific permission
 * Checks both role-based permissions and custom permissions
 * Custom permissions override/extend role permissions
 */
export const hasPermission = (
  role: string | undefined,
  permission: string,
  customPermissions?: string[]
) => {
  // Get role-based permissions
  const rolePermissions = getRolePermissions(role);
  
  // Merge with custom permissions (custom permissions take precedence)
  const allPermissions = customPermissions
    ? [...new Set([...rolePermissions, ...customPermissions])]
    : rolePermissions;
  
  return allPermissions.includes(permission);
};
