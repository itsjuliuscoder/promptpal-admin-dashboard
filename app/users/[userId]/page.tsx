"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import SectionCard from "@/components/shared/SectionCard";
import DataTable from "@/components/shared/DataTable";
import { adminService } from "@/lib/services/adminService";

export default function AdminUserProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const [profile, setProfile] = useState<any>(null);
  const [activityMetrics, setActivityMetrics] = useState<any>(null);
  const [prompts, setPrompts] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [billing, setBilling] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [userRes, promptsRes, sessionsRes, billingRes, activityRes] =
          await Promise.allSettled([
            adminService.getUserById(userId),
            adminService.getUserPrompts(userId, { page: 1, limit: 5 }),
            adminService.getUserSessions(userId, { page: 1, limit: 5 }),
            adminService.getUserBilling(userId),
            adminService.getUserActivity(userId, { page: 1, limit: 10 }),
          ]);

        // Handle user data (required)
        if (userRes.status === "fulfilled") {
          const userData = userRes.value;
          setProfile(userData.user || userData);
          setActivityMetrics(userData.activityMetrics || null);
        } else {
          const errorMessage = userRes.reason?.response?.status === 404
            ? "User not found"
            : "Failed to load user profile";
          setError(errorMessage);
          setLoading(false);
          return;
        }

        // Handle optional data (gracefully handle failures)
        if (promptsRes.status === "fulfilled") {
          setPrompts(promptsRes.value.data || []);
        }
        if (sessionsRes.status === "fulfilled") {
          setSessions(sessionsRes.value.data || []);
        }
        if (billingRes.status === "fulfilled") {
          setBilling(billingRes.value.data || billingRes.value);
        }
        if (activityRes.status === "fulfilled") {
          setActivity(activityRes.value.data?.usageLogs || []);
        }
      } catch (error: any) {
        console.error("Failed to load user profile", error);
        const errorMessage = error?.response?.status === 404
          ? "User not found"
          : error?.message || "Failed to load user profile. Please try again.";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    if (userId) {
      load();
    }
  }, [userId]);

  if (loading) {
    return <div className="p-6 text-gray-500">Loading user profile...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Error</h2>
          <p className="text-red-600 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <div className="p-6 text-gray-500">No user data available.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <SectionCard title="User Identity">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-400">
          <p><strong>Name:</strong> {profile.name}</p>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Signup Provider:</strong> {profile.authProvider || "local"}</p>
          <p><strong>Plan:</strong> {profile.subscriptionStatus || "free"}</p>
          <p><strong>Account Status:</strong> {profile.accountStatus || (profile.blocked ? "suspended" : "active")}</p>
          <p><strong>Last Login:</strong> {profile.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString() : "Never"}</p>
          <p><strong>Plan Start:</strong> {profile.planStartDate ? new Date(profile.planStartDate).toLocaleDateString() : "N/A"}</p>
          <p><strong>Plan End:</strong> {profile.planEndDate ? new Date(profile.planEndDate).toLocaleDateString() : "N/A"}</p>
        </div>
      </SectionCard>

      {activityMetrics && (
        <SectionCard title="Activity Metrics">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Prompts</p>
              <p className="text-2xl font-bold">{activityMetrics.totalPrompts || 0}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">Templates</p>
              <p className="text-2xl font-bold">{activityMetrics.totalTemplates || 0}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">Collections</p>
              <p className="text-2xl font-bold">{activityMetrics.totalCollections || 0}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">Workspaces</p>
              <p className="text-2xl font-bold">{activityMetrics.totalWorkspaces || 0}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-semibold mb-2">Prompts by Status</p>
              <div className="space-y-1 text-sm">
                <p>Draft: {activityMetrics.promptsByStatus?.draft || 0}</p>
                <p>In Review: {activityMetrics.promptsByStatus?.in_review || 0}</p>
                <p>Approved: {activityMetrics.promptsByStatus?.approved || 0}</p>
                <p>Archived: {activityMetrics.promptsByStatus?.archived || 0}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">Prompt Velocity</p>
              <div className="space-y-1 text-sm">
                <p>Last 7 Days: {activityMetrics.promptVelocity?.last7Days || 0}</p>
                <p>Last 30 Days: {activityMetrics.promptVelocity?.last30Days || 0}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Last Activity: {activityMetrics.lastPromptActivityAt 
                    ? new Date(activityMetrics.lastPromptActivityAt).toLocaleString() 
                    : "Never"}
                </p>
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      <SectionCard title="Prompts">
        <DataTable
          rows={prompts}
          columns={[
            { key: "title", label: "Title" },
            { key: "visibility", label: "Visibility" },
            { key: "updatedAt", label: "Updated" },
          ]}
        />
      </SectionCard>

      <SectionCard title="Sessions">
        <DataTable
          rows={sessions}
          columns={[
            { key: "sessionId", label: "Session ID" },
            { key: "provider", label: "Provider" },
            { key: "createdAt", label: "Created" },
          ]}
        />
      </SectionCard>

      <SectionCard title="Billing">
        <pre className="text-xs text-gray-600 dark:text-gray-300 overflow-auto">
          {JSON.stringify(billing, null, 2)}
        </pre>
      </SectionCard>

      <SectionCard title="Activity Logs">
        <DataTable
          rows={activity}
          columns={[
            { key: "action", label: "Action" },
            { key: "createdAt", label: "Timestamp" },
            {
              key: "metadata",
              label: "Metadata",
              render: (value) => (value ? JSON.stringify(value) : ""),
            },
          ]}
        />
      </SectionCard>
    </div>
  );
}
