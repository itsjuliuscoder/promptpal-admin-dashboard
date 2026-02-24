"use client";

import React, { useEffect, useState } from "react";
import SectionCard from "@/components/shared/SectionCard";
import DataTable from "@/components/shared/DataTable";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSkeleton, { CardSkeleton } from "@/components/shared/LoadingSkeleton";
import ErrorState from "@/components/shared/ErrorState";
import StatusBadge from "@/components/shared/StatusBadge";
import { FiCheckCircle, FiXCircle, FiShield, FiUsers, FiUserPlus } from "react-icons/fi";
import Link from "next/link";
import { useAdminAuth } from "@/lib/auth/AdminAuthProvider";
import { adminService } from "@/lib/services/adminService";

export default function AdminSystemPage() {
  const { admin } = useAdminAuth();
  const isSuperAdmin = admin?.role === "super_admin";
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [roles, setRoles] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [failedLogins, setFailedLogins] = useState<any[]>([]);
  const [aiHealth, setAiHealth] = useState<any>(null);
  const [suspiciousActivity, setSuspiciousActivity] = useState<any[]>([]);
  const [abuseSignals, setAbuseSignals] = useState<any[]>([]);
  const [injectionAttempts, setInjectionAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [authRes, rolesRes, logsRes, failedRes, aiRes, suspiciousRes, abuseRes, injectionRes] =
          await Promise.all([
            adminService.getSystemAuthStatus(),
            adminService.getRolesAndPermissions(),
            adminService.getAuditLogs({ page: 1, limit: 20 }),
            adminService.getFailedLogins().catch(() => ({ data: [] })),
            adminService.getAIHealth().catch(() => ({ data: null })),
            adminService.getSuspiciousActivity().catch(() => ({ data: [] })),
            adminService.getAbuseSignals().catch(() => ({ data: [] })),
            adminService.getInjectionAttempts().catch(() => ({ data: [] })),
          ]);
        setAuthStatus(authRes.data ?? authRes);
        setRoles(rolesRes.data ?? rolesRes);
        setAuditLogs(Array.isArray(logsRes.data) ? logsRes.data : []);
        setFailedLogins(Array.isArray(failedRes?.data) ? failedRes.data : []);
        setAiHealth(aiRes?.data ?? aiRes ?? null);
        setSuspiciousActivity(Array.isArray(suspiciousRes?.data) ? suspiciousRes.data : []);
        setAbuseSignals(Array.isArray(abuseRes?.data) ? abuseRes.data : []);
        setInjectionAttempts(Array.isArray(injectionRes?.data) ? injectionRes.data : []);
      } catch (err) {
        console.error("Failed to load system data", err);
        setError("Failed to load system data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader
          title="System & Security"
          description="Monitor system health, authentication, and audit logs"
        />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader
          title="System & Security"
          description="Monitor system health, authentication, and audit logs"
        />
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="System & Security"
        description="Monitor system health, authentication, and audit logs"
        actions={
          isSuperAdmin ? (
            <Link
              href="/admins/create"
              className="flex items-center gap-2 px-4 py-2 bg-[#A84C34] text-white rounded-lg hover:bg-[#92361a] transition-colors text-sm font-medium"
            >
              <FiUserPlus size={18} />
              Create Admin
            </Link>
          ) : null
        }
      />

      <SectionCard title="Authentication Status">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex-shrink-0">
              {authStatus?.googleOAuth ? (
                <FiCheckCircle className="text-green-500" size={24} />
              ) : (
                <FiXCircle className="text-red-500" size={24} />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Google OAuth</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {authStatus?.googleOAuth ? "Enabled" : "Disabled"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex-shrink-0">
              {authStatus?.emailAuth ? (
                <FiCheckCircle className="text-green-500" size={24} />
              ) : (
                <FiXCircle className="text-red-500" size={24} />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Email Auth</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {authStatus?.emailAuth ? "Enabled" : "Disabled"}
              </p>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Roles & Permissions">
        <div className="space-y-4">
          {roles &&
            Object.entries(roles).map(([roleName, permissions]: [string, any]) => (
              <div
                key={roleName}
                className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-2 mb-2">
                  <FiUsers className="text-gray-500 dark:text-gray-400" size={18} />
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                    {roleName.replace(/_/g, " ")}
                  </h4>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {Array.isArray(permissions) &&
                    permissions.map((permission: string) => (
                      <span
                        key={permission}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded"
                      >
                        {permission}
                      </span>
                    ))}
                </div>
              </div>
            ))}
        </div>
      </SectionCard>

      <SectionCard title="Failed Logins">
        <DataTable
          rows={failedLogins}
          columns={[
            { key: "email", label: "Email" },
            { key: "ip", label: "IP" },
            {
              key: "createdAt",
              label: "Time",
              render: (value) => (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {value ? new Date(value).toLocaleString() : "N/A"}
                </span>
              ),
            },
          ]}
          emptyMessage="No failed login attempts"
        />
      </SectionCard>

      <SectionCard title="AI Health">
        {aiHealth != null && typeof aiHealth === "object" ? (
          <div className="space-y-2 text-sm">
            {Array.isArray(aiHealth) ? (
              <pre className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg overflow-auto max-h-48">
                {JSON.stringify(aiHealth, null, 2)}
              </pre>
            ) : (
              <ul className="space-y-1">
                {Object.entries(aiHealth).map(([key, val]) => (
                  <li key={key} className="flex justify-between gap-2">
                    <span className="text-gray-600 dark:text-gray-400 capitalize">
                      {String(key).replace(/([A-Z])/g, " $1").trim()}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {typeof val === "object" ? JSON.stringify(val) : String(val)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">No AI health data available.</p>
        )}
      </SectionCard>

      <SectionCard title="Security">
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Suspicious Activity
            </h4>
            <DataTable
              rows={suspiciousActivity}
              columns={[
                { key: "type", label: "Type" },
                { key: "userId", label: "User" },
                {
                  key: "createdAt",
                  label: "Time",
                  render: (value) => (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {value ? new Date(value).toLocaleString() : "N/A"}
                    </span>
                  ),
                },
              ]}
              emptyMessage="No suspicious activity"
            />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Abuse Signals</h4>
            <DataTable
              rows={abuseSignals}
              columns={[
                { key: "signal", label: "Signal" },
                { key: "userId", label: "User" },
                {
                  key: "createdAt",
                  label: "Time",
                  render: (value) => (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {value ? new Date(value).toLocaleString() : "N/A"}
                    </span>
                  ),
                },
              ]}
              emptyMessage="No abuse signals"
            />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Injection Attempts
            </h4>
            <DataTable
              rows={injectionAttempts}
              columns={[
                { key: "type", label: "Type" },
                { key: "source", label: "Source" },
                {
                  key: "createdAt",
                  label: "Time",
                  render: (value) => (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {value ? new Date(value).toLocaleString() : "N/A"}
                    </span>
                  ),
                },
              ]}
              emptyMessage="No injection attempts"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Recent Audit Logs">
        <DataTable
          rows={auditLogs}
          columns={[
            { key: "action", label: "Action" },
            {
              key: "actorRole",
              label: "Role",
              render: (value) => (
                <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {String(value || "unknown").replace(/_/g, " ")}
                </span>
              ),
            },
            {
              key: "createdAt",
              label: "Timestamp",
              render: (value) => (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {value ? new Date(value).toLocaleString() : "N/A"}
                </span>
              ),
            },
          ]}
          emptyMessage="No audit logs found"
        />
      </SectionCard>
    </div>
  );
}
