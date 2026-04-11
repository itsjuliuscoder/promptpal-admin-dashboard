"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FiCheck,
  FiClock,
  FiFileText,
  FiMail,
  FiRefreshCw,
  FiShield,
  FiUserPlus,
  FiUsers,
  FiX,
} from "react-icons/fi";
import PageHeader from "@/components/shared/PageHeader";
import ErrorState from "@/components/shared/ErrorState";
import LoadingSkeleton, { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import DataTable from "@/components/shared/DataTable";
import Pagination from "@/components/shared/Pagination";
import StatusBadge from "@/components/shared/StatusBadge";
import SectionCard from "@/components/shared/SectionCard";
import SectionWorkspace, { WorkspaceSectionItem } from "@/components/shared/SectionWorkspace";
import { PreviewNotice } from "@/components/shared/AdminWidgets";
import { useSectionQueryState } from "@/lib/hooks/useSectionQueryState";
import { adminService } from "@/lib/services/adminService";
import { useAdminAuth } from "@/lib/auth/AdminAuthProvider";

interface AdminRow {
  _id: string;
  username: string;
  email: string;
  role: string;
  invitationStatus?: "pending" | "accepted" | "expired" | null;
  invitedBy?: {
    username: string;
    email: string;
  } | null;
  invitedAt?: string;
  createdAt: string;
}

interface AuditLogRow {
  _id?: string;
  action?: string;
  actorRole?: string;
  targetType?: string;
  source?: string;
  createdAt?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

const SECTION_ITEMS: WorkspaceSectionItem[] = [
  { id: "all", label: "All admins", icon: <FiUsers size={18} /> },
  { id: "roles", label: "Roles & permissions", icon: <FiShield size={18} /> },
  { id: "activity", label: "Admin activity log", icon: <FiFileText size={18} /> },
];

function formatDate(value?: string) {
  if (!value) return "Unknown";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatRole(value?: string) {
  return String(value || "admin").replace(/_/g, " ");
}

function formatAction(action?: string) {
  return String(action || "unknown action").replace(/_/g, " ");
}

function formatLogDescription(log: AuditLogRow) {
  const base = formatAction(log.action);
  const target = log.targetType ? ` on ${String(log.targetType).replace(/_/g, " ")}` : "";
  const metadataStatus =
    typeof log.metadata?.status === "string"
      ? ` (${log.metadata.status})`
      : typeof log.metadata?.result === "string"
        ? ` (${log.metadata.result})`
        : "";

  return `${base}${target}${metadataStatus}`;
}

function getLogStatus(log: AuditLogRow) {
  const status = String(log.metadata?.status || log.metadata?.result || "").toLowerCase();
  if (!status) return null;
  if (status.includes("success") || status === "ok") return { label: status, variant: "success" as const };
  if (status.includes("warn") || status.includes("pending")) return { label: status, variant: "warning" as const };
  return { label: status, variant: "error" as const };
}

export default function AdminsPage() {
  const { admin } = useAdminAuth();
  const isSuperAdmin = admin?.role === "super_admin";
  const sectionIds = useMemo(() => SECTION_ITEMS.map((item) => item.id), []);
  const { activeSection, setActiveSection } = useSectionQueryState(sectionIds, "all");

  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [roles, setRoles] = useState<Record<string, string[]>>({});
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);

  const [adminsLoading, setAdminsLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [adminsError, setAdminsError] = useState<string | null>(null);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [logsError, setLogsError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAdmins, setTotalAdmins] = useState(0);
  const [resending, setResending] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  const loadAdmins = async (page = currentPage) => {
    setAdminsLoading(true);
    setAdminsError(null);
    try {
      const response = await adminService.getAllAdmins({
        page,
        limit: itemsPerPage,
        search: search || undefined,
        role: selectedRole || undefined,
        status: selectedStatus || undefined,
      });

      if (!response?.success) {
        throw new Error(response?.error || "Failed to load admins");
      }

      setAdmins(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalAdmins(response.pagination?.total || 0);
    } catch (error: any) {
      console.error("Failed to load admins", error);
      setAdminsError(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Failed to load admins."
      );
    } finally {
      setAdminsLoading(false);
    }
  };

  const loadRoles = async () => {
    setRolesLoading(true);
    setRolesError(null);
    try {
      const response = await adminService.getRolesAndPermissions();
      setRoles(response?.data || response || {});
    } catch (error) {
      console.error("Failed to load roles", error);
      setRolesError("Failed to load roles and permissions.");
    } finally {
      setRolesLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    setLogsLoading(true);
    setLogsError(null);
    try {
      const response = await adminService.getAuditLogs({ page: 1, limit: 12 });
      setAuditLogs(response?.data || []);
    } catch (error) {
      console.error("Failed to load audit logs", error);
      setLogsError("Failed to load admin activity.");
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (!isSuperAdmin) return;
    loadRoles();
    loadAuditLogs();
  }, [isSuperAdmin]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    loadAdmins(currentPage);
  }, [isSuperAdmin, currentPage, search, selectedRole, selectedStatus]);

  const refreshActiveSection = () => {
    setBanner(null);
    if (activeSection === "all") {
      loadAdmins(currentPage);
      return;
    }
    if (activeSection === "roles") {
      loadRoles();
      return;
    }
    loadAuditLogs();
  };

  const handleResendInvitation = async (adminId: string) => {
    setResending(adminId);
    setBanner(null);
    try {
      await adminService.resendInvitation(adminId);
      setBanner({ type: "success", message: "Invitation resent successfully." });
      loadAdmins(currentPage);
    } catch (error: any) {
      console.error("Failed to resend invitation", error);
      setBanner({
        type: "error",
        message:
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Failed to resend invitation.",
      });
    } finally {
      setResending(null);
    }
  };

  const handleCancelInvitation = async (adminId: string) => {
    setCancelling(adminId);
    setBanner(null);
    try {
      await adminService.cancelInvitation(adminId);
      setBanner({ type: "success", message: "Invitation cancelled successfully." });
      loadAdmins(currentPage);
    } catch (error: any) {
      console.error("Failed to cancel invitation", error);
      setBanner({
        type: "error",
        message:
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Failed to cancel invitation.",
      });
    } finally {
      setCancelling(null);
    }
  };

  const pendingInvites = admins.filter((row) => row.invitationStatus === "pending").length;
  const roleNames = Object.keys(roles);
  const permissionCategories = Array.from(
    new Set(
      roleNames.flatMap((role) =>
        (roles[role] || []).map((permission) => permission.split(":")[0])
      )
    )
  );

  const roleMatrixRows = roleNames.map((roleName) => {
    const permissions = roles[roleName] || [];
    const values = permissionCategories.reduce<Record<string, string>>((acc, category) => {
      const match = permissions.find((permission) => permission.startsWith(`${category}:`));
      acc[category] = match ? match.split(":")[1] : "";
      return acc;
    }, {});

    return {
      role: roleName,
      ...values,
    };
  });

  if (!isSuperAdmin) {
    return (
      <div className="admin-page space-y-6">
        <PageHeader
          eyebrow="Operations"
          title="Admins"
          description="Manage who can access the admin workspace."
        />
        <ErrorState
          title="Access denied"
          message="Only super admins can view and manage admin accounts."
        />
      </div>
    );
  }

  return (
    <div className="admin-page space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Admins"
        description="Manage admin access, role coverage, and recent administrative activity."
        metadata={<span className="admin-stat-pill">{totalAdmins || admins.length} admin records</span>}
        actions={
          <>
            <button type="button" className="admin-button admin-button-secondary" onClick={refreshActiveSection}>
              <FiRefreshCw size={16} />
              Refresh
            </button>
            <Link href="/admins/create" className="admin-button admin-button-primary">
              <FiUserPlus size={16} />
              Invite admin
            </Link>
          </>
        }
      />

      {banner ? (
        <div
          className={`rounded-[1rem] border px-4 py-3 text-sm ${
            banner.type === "success"
              ? "border-[color:var(--admin-success)]/30 bg-[color:var(--admin-success-soft)] text-[color:var(--admin-success)]"
              : "border-[color:var(--admin-danger)]/30 bg-[color:var(--admin-danger-soft)] text-[color:var(--admin-danger)]"
          }`}
        >
          {banner.message}
        </div>
      ) : null}

      <SectionWorkspace
        sections={SECTION_ITEMS}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        sectionLabel="Admin sections"
      >
        {activeSection === "all" ? (
          <div className="space-y-6">
            <section className="admin-summary-strip">
              <div className="admin-summary-item">
                <p className="admin-summary-label">Total admins</p>
                <p className="admin-summary-value">{totalAdmins || admins.length}</p>
                <p className="admin-summary-hint">Across active accounts and invitations</p>
              </div>
              <div className="admin-summary-item">
                <p className="admin-summary-label">Pending invites</p>
                <p className="admin-summary-value">{pendingInvites}</p>
                <p className="admin-summary-hint">Visible on the current result page</p>
              </div>
              <div className="admin-summary-item">
                <p className="admin-summary-label">Role types</p>
                <p className="admin-summary-value">{roleNames.length || 4}</p>
                <p className="admin-summary-hint">Current backend-defined admin roles</p>
              </div>
              <div className="admin-summary-item">
                <p className="admin-summary-label">Filters</p>
                <p className="admin-summary-value">{[search, selectedRole, selectedStatus].filter(Boolean).length}</p>
                <p className="admin-summary-hint">Search and status filters currently applied</p>
              </div>
            </section>

            <SectionCard
              title="All admins"
              description="Manage who has access to the admin panel and handle outstanding invitations."
              actions={
                <Link href="/admins/create" className="admin-button admin-button-primary">
                  <FiUserPlus size={16} />
                  Invite admin
                </Link>
              }
            >
              <div className="space-y-5">
                <div className="admin-toolbar">
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(0,0.8fr))]">
                    <input
                      className="admin-input"
                      placeholder="Search name or email"
                      value={search}
                      onChange={(event) => {
                        setCurrentPage(1);
                        setSearch(event.target.value);
                      }}
                    />
                    <select
                      className="admin-select"
                      value={selectedRole}
                      onChange={(event) => {
                        setCurrentPage(1);
                        setSelectedRole(event.target.value);
                      }}
                    >
                      <option value="">All roles</option>
                      <option value="super_admin">Super admin</option>
                      <option value="admin">Admin</option>
                      <option value="support">Support</option>
                      <option value="analyst">Analyst</option>
                    </select>
                    <select
                      className="admin-select"
                      value={selectedStatus}
                      onChange={(event) => {
                        setCurrentPage(1);
                        setSelectedStatus(event.target.value);
                      }}
                    >
                      <option value="">All statuses</option>
                      <option value="pending">Pending invitation</option>
                      <option value="active">Active admin</option>
                    </select>
                  </div>
                </div>

                {adminsLoading ? (
                  <TableSkeleton rows={8} columns={5} />
                ) : adminsError ? (
                  <ErrorState message={adminsError} onRetry={() => loadAdmins(currentPage)} />
                ) : (
                  <>
                    <DataTable
                      rows={admins}
                      rowKey={(row) => row._id}
                      mobileCardTitle={(row) => row.username}
                      mobileCardMeta={(row) => row.email}
                      mobileCardFooter={(row) => (
                        <StatusBadge
                          label={row.invitationStatus === "pending" ? "Pending" : "Active"}
                          variant={row.invitationStatus === "pending" ? "warning" : "success"}
                          size="sm"
                        />
                      )}
                      columns={[
                        {
                          key: "username",
                          label: "Name",
                          emphasize: true,
                          width: "28%",
                          render: (value, row) => (
                            <div className="space-y-1">
                              <div className="font-semibold text-[color:var(--admin-text)]">{value}</div>
                              <div className="text-xs text-[color:var(--admin-text-faint)]">{row.email}</div>
                            </div>
                          ),
                        },
                        {
                          key: "role",
                          label: "Role",
                          width: "15%",
                          render: (value) => (
                            <StatusBadge label={formatRole(value)} variant="info" />
                          ),
                        },
                        {
                          key: "invitationStatus",
                          label: "Status",
                          width: "16%",
                          render: (value) => {
                            if (value === "pending") {
                              return <StatusBadge label="Pending invite" variant="warning" />;
                            }
                            if (value === "expired") {
                              return <StatusBadge label="Expired" variant="error" />;
                            }
                            return <StatusBadge label="Active" variant="success" />;
                          },
                        },
                        {
                          key: "invitedBy",
                          label: "Invited by",
                          width: "21%",
                          render: (value) =>
                            value ? (
                              <div>
                                <div className="text-[color:var(--admin-text)]">{value.username}</div>
                                <div className="text-xs text-[color:var(--admin-text-faint)]">{value.email}</div>
                              </div>
                            ) : (
                              <span className="text-[color:var(--admin-text-faint)]">-</span>
                            ),
                        },
                        {
                          key: "createdAt",
                          label: "Created",
                          width: "12%",
                          render: (value) => formatDate(value),
                        },
                        {
                          key: "_id",
                          label: "Actions",
                          width: "8%",
                          align: "right",
                          render: (value, row) =>
                            row.invitationStatus === "pending" ? (
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  className="admin-button admin-button-secondary min-h-[38px] px-3 py-2"
                                  disabled={resending === value || cancelling === value}
                                  onClick={() => handleResendInvitation(value)}
                                >
                                  {resending === value ? <FiRefreshCw className="animate-spin" size={14} /> : <FiMail size={14} />}
                                </button>
                                <button
                                  type="button"
                                  className="admin-button admin-button-ghost min-h-[38px] px-3 py-2 text-[color:var(--admin-danger)]"
                                  disabled={resending === value || cancelling === value}
                                  onClick={() => handleCancelInvitation(value)}
                                >
                                  {cancelling === value ? <FiRefreshCw className="animate-spin" size={14} /> : <FiX size={14} />}
                                </button>
                              </div>
                            ) : (
                              <span className="text-[color:var(--admin-text-faint)]">-</span>
                            ),
                        },
                      ]}
                    />

                    {totalPages > 1 ? (
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={totalAdmins}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                      />
                    ) : null}
                  </>
                )}
              </div>
            </SectionCard>
          </div>
        ) : null}

        {activeSection === "roles" ? (
          <SectionCard
            title="Roles & permissions"
            description="Define what each admin role can access and modify."
            actions={
              <button type="button" className="admin-button admin-button-secondary opacity-60" disabled>
                <FiUserPlus size={16} />
                Create custom role
              </button>
            }
          >
            <div className="space-y-5">
              <PreviewNotice message="The backend currently exposes a fixed role matrix only. Custom role creation is shown in the design but remains unavailable in this pass." />

              {rolesLoading ? (
                <TableSkeleton rows={4} columns={permissionCategories.length + 1} />
              ) : rolesError ? (
                <ErrorState message={rolesError} onRetry={loadRoles} />
              ) : (
                <DataTable
                  rows={roleMatrixRows}
                  rowKey={(row) => row.role}
                  columns={[
                    {
                      key: "role",
                      label: "Role",
                      emphasize: true,
                      render: (value) => (
                        <StatusBadge label={String(value).replace(/_/g, " ")} variant="info" />
                      ),
                    },
                    ...permissionCategories.map((category) => ({
                      key: category,
                      label: category,
                      align: "center" as const,
                      render: (value: string) => {
                        if (value === "write") {
                          return <FiCheck className="mx-auto text-[color:var(--admin-success)]" size={18} />;
                        }
                        if (value === "read") {
                          return <span className="text-xs font-medium text-[color:var(--admin-text-soft)]">read-only</span>;
                        }
                        return <span className="text-[color:var(--admin-text-faint)]">—</span>;
                      },
                    })),
                  ]}
                />
              )}
            </div>
          </SectionCard>
        ) : null}

        {activeSection === "activity" ? (
          <SectionCard
            title="Admin activity log"
            description="Append-only record of recent admin actions across the platform."
          >
            <div className="space-y-4">
              {logsLoading ? (
                <LoadingSkeleton rows={8} showHeader={false} />
              ) : logsError ? (
                <ErrorState message={logsError} onRetry={loadAuditLogs} />
              ) : auditLogs.length === 0 ? (
                <PreviewNotice title="No activity yet" message="No recent admin audit entries were returned by the backend." />
              ) : (
                auditLogs.map((log, index) => {
                  const status = getLogStatus(log);
                  return (
                    <div
                      key={log._id || `${log.action}-${index}`}
                      className="admin-list-card flex flex-col gap-3 md:flex-row md:items-start md:justify-between"
                    >
                      <div className="grid gap-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-sm font-semibold text-[color:var(--admin-text)]">
                            {formatDate(log.createdAt)}
                          </span>
                          <span className="text-sm font-semibold text-[color:var(--admin-accent-strong)]">
                            {admin?.username || "Admin"}
                          </span>
                          {status ? (
                            <StatusBadge label={status.label} variant={status.variant} size="sm" />
                          ) : null}
                        </div>
                        <p className="text-base font-medium text-[color:var(--admin-text)]">
                          {formatLogDescription(log)}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-[color:var(--admin-text-faint)]">
                          {log.source ? <span>Source: {log.source}</span> : null}
                          {log.actorRole ? <span>Role: {formatRole(log.actorRole)}</span> : null}
                          {log.ipAddress ? <span>IP: {log.ipAddress}</span> : null}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </SectionCard>
        ) : null}
      </SectionWorkspace>
    </div>
  );
}
