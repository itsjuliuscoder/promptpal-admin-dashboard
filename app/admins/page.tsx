"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import FilterBar from "@/components/shared/FilterBar";
import Pagination from "@/components/shared/Pagination";
import StatusBadge from "@/components/shared/StatusBadge";
import ErrorState from "@/components/shared/ErrorState";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import { adminService } from "@/lib/services/adminService";
import { useAdminAuth } from "@/lib/auth/AdminAuthProvider";
import { FiUserPlus, FiMail, FiX, FiRefreshCw } from "react-icons/fi";

interface Admin {
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

export default function AdminsPage() {
  const router = useRouter();
  const { admin } = useAdminAuth();
  const isSuperAdmin = admin?.role === "super_admin";

  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [resending, setResending] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadAdmins = async (page: number = currentPage) => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getAllAdmins({
        page,
        limit: itemsPerPage,
        search: search || undefined,
        role: selectedRole || undefined,
        status: selectedStatus || undefined,
      });

      if (response.success && response.data) {
        setAdmins(response.data);
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages || 1);
          setTotal(response.pagination.total || 0);
        }
      } else {
        throw new Error(response.error || "Failed to load admins");
      }
    } catch (err: any) {
      console.error("Failed to load admins", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to load admins. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      loadAdmins(1);
      setCurrentPage(1);
    }
  }, [search, selectedRole, selectedStatus]);

  useEffect(() => {
    if (isSuperAdmin) {
      loadAdmins(currentPage);
    }
  }, [currentPage]);

  const handleResendInvitation = async (adminId: string) => {
    if (!confirm("Are you sure you want to resend the invitation email?")) {
      return;
    }

    setResending(adminId);
    try {
      await adminService.resendInvitation(adminId);
      setNotification({ type: "success", message: "Invitation resent successfully!" });
      loadAdmins(currentPage);
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      console.error("Failed to resend invitation", err);
      setNotification({
        type: "error",
        message:
          err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to resend invitation",
      });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setResending(null);
    }
  };

  const handleCancelInvitation = async (adminId: string) => {
    if (
      !confirm(
        "Are you sure you want to cancel this invitation? This will delete the admin record."
      )
    ) {
      return;
    }

    setCancelling(adminId);
    try {
      await adminService.cancelInvitation(adminId);
      setNotification({ type: "success", message: "Invitation cancelled successfully!" });
      loadAdmins(currentPage);
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      console.error("Failed to cancel invitation", err);
      setNotification({
        type: "error",
        message:
          err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to cancel invitation",
      });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setCancelling(null);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader title="Admins" description="Manage admin accounts" />
        <ErrorState
          title="Access Denied"
          message="Only super admins can view and manage admin accounts."
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Admins" description="Manage admin accounts and invitations" />
        <Link
          href="/admins/create"
          className="flex items-center gap-2 px-4 py-2 bg-[#A84C34] text-white rounded-lg hover:bg-[#92361a] transition-colors"
        >
          <FiUserPlus size={18} />
          Invite Admin
        </Link>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-lg border ${
            notification.type === "success"
              ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800"
          }`}
        >
          {notification.message}
        </div>
      )}

      <FilterBar>
        <input
          className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-200"
          placeholder="Search by username or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={selectedRole}
          onChange={(e) => {
            setSelectedRole(e.target.value);
            setCurrentPage(1);
          }}
          className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-200"
        >
          <option value="">All Roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="admin">Admin</option>
          <option value="support">Support</option>
          <option value="analyst">Analyst</option>
        </select>
        <select
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value);
            setCurrentPage(1);
          }}
          className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-200"
        >
          <option value="">All Status</option>
          <option value="pending">Pending Invitations</option>
          <option value="active">Active Admins</option>
        </select>
      </FilterBar>

      {loading ? (
        <LoadingSkeleton />
      ) : error && admins.length === 0 ? (
        <ErrorState title="Error" message={error} />
      ) : (
        <>
          <DataTable
            rows={admins}
            columns={[
              {
                key: "username",
                label: "Username",
                render: (value, row) => (
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{value}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{row.email}</div>
                  </div>
                ),
              },
              {
                key: "role",
                label: "Role",
                render: (value) => (
                  <span className="capitalize">{String(value).replace("_", " ")}</span>
                ),
              },
              {
                key: "invitationStatus",
                label: "Status",
                render: (value, row) => {
                  if (value === "pending") {
                    return <StatusBadge label="Pending Invitation" variant="warning" />;
                  }
                  if (value === "accepted") {
                    return <StatusBadge label="Active" variant="success" />;
                  }
                  if (value === "expired") {
                    return <StatusBadge label="Expired" variant="error" />;
                  }
                  return <StatusBadge label="Active" variant="success" />;
                },
              },
              {
                key: "invitedBy",
                label: "Invited By",
                render: (value) => {
                  if (!value) return <span className="text-gray-400">-</span>;
                  return (
                    <div>
                      <div className="text-sm">{value.username}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{value.email}</div>
                    </div>
                  );
                },
              },
              {
                key: "createdAt",
                label: "Created",
                render: (value) => {
                  if (!value) return "-";
                  return new Date(value).toLocaleDateString();
                },
              },
              {
                key: "_id",
                label: "Actions",
                render: (value, row) => {
                  if (row.invitationStatus === "pending") {
                    return (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleResendInvitation(value)}
                          disabled={resending === value || cancelling === value}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50"
                          title="Resend invitation"
                        >
                          {resending === value ? (
                            <FiRefreshCw size={16} className="animate-spin" />
                          ) : (
                            <FiMail size={16} />
                          )}
                        </button>
                        <button
                          onClick={() => handleCancelInvitation(value)}
                          disabled={resending === value || cancelling === value}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                          title="Cancel invitation"
                        >
                          {cancelling === value ? (
                            <FiRefreshCw size={16} className="animate-spin" />
                          ) : (
                            <FiX size={16} />
                          )}
                        </button>
                      </div>
                    );
                  }
                  return <span className="text-gray-400 text-sm">-</span>;
                },
              },
            ]}
          />
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={total}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
}
