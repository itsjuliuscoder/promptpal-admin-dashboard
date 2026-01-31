"use client";

import React, { useEffect, useState } from "react";
import KpiCard from "@/components/admin/overview/KpiCard";
import PlatformStatusPanel from "@/components/admin/overview/PlatformStatusPanel";
import ActivityFeed from "@/components/admin/overview/ActivityFeed";
import PageHeader from "@/components/shared/PageHeader";
import ErrorState from "@/components/shared/ErrorState";
import { adminService } from "@/lib/services/adminService";

interface AdminOverviewData {
  kpis: Array<{ key: string; label: string; value: number; unit?: string }>;
  platformStatus: {
    authStatus: { googleOAuth: boolean; emailAuth: boolean };
    apiUptimeSeconds: number;
    backgroundJobs: { status: string; note?: string };
    extensionVersionHealth: { currentVersion?: string | null; lastReportedAt?: string | null };
  };
  activityFeed: Array<{ type: string; label: string; createdAt: string }>;
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await adminService.getOverview();
        setData(response);
      } catch (error) {
        console.error("Failed to load admin overview", error);
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
          title="Overview"
          description="Platform metrics, status, and recent activity"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-20 mb-3"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-16"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-32 mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-32 mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader
          title="Overview"
          description="Platform metrics, status, and recent activity"
        />
        <ErrorState
          title="Failed to load overview"
          message="Unable to load overview data. Please try again."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Overview"
        description="Platform metrics, status, and recent activity"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {data.kpis.map((kpi) => (
          <KpiCard key={kpi.key} label={kpi.label} value={kpi.value} unit={kpi.unit} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <PlatformStatusPanel status={data.platformStatus} />
        </div>
        <ActivityFeed events={data.activityFeed} />
      </div>
    </div>
  );
}
