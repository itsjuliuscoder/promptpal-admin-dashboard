"use client";

import React from "react";
import { useAdminAuth } from "@/lib/auth/AdminAuthProvider";
import { hasPermission } from "@/lib/auth/rbac";

export default function RoleGate({
  permission,
  children,
}: {
  permission: string;
  children: React.ReactNode;
}) {
  const { admin } = useAdminAuth();
  if (!admin || !hasPermission(admin.role, permission)) {
    return null;
  }
  return <>{children}</>;
}
