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

export const hasPermission = (role: string | undefined, permission: string) => {
  return getRolePermissions(role).includes(permission);
};
