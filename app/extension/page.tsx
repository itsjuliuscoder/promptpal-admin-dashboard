"use client";

import React, { useEffect, useState } from "react";
import SectionCard from "@/components/shared/SectionCard";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSkeleton, { CardSkeleton } from "@/components/shared/LoadingSkeleton";
import ErrorState from "@/components/shared/ErrorState";
import EmptyState from "@/components/shared/EmptyState";
import KpiCard from "@/components/admin/overview/KpiCard";
import DataTable from "@/components/shared/DataTable";
import { adminService } from "@/lib/services/adminService";

export default function AdminExtensionPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await adminService.getExtensionMetrics();
        setMetrics(response.data || response);
      } catch (err) {
        console.error("Failed to load extension metrics", err);
        setError("Failed to load extension metrics. Please try again.");
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
          title="Chrome Extension"
          description="Monitor extension metrics, versions, and health"
        />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader
          title="Chrome Extension"
          description="Monitor extension metrics, versions, and health"
        />
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader
          title="Chrome Extension"
          description="Monitor extension metrics, versions, and health"
        />
        <EmptyState message="No extension metrics available" />
      </div>
    );
  }

  const versionDistribution = Array.isArray(metrics.versionDistribution)
    ? metrics.versionDistribution
    : metrics.versionDistribution
    ? Object.entries(metrics.versionDistribution).map(([version, count]) => ({
        version,
        count,
      }))
    : [];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Chrome Extension"
        description="Monitor extension metrics, versions, and health"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics.totalInstalls !== undefined && (
          <KpiCard label="Total Installs" value={metrics.totalInstalls} />
        )}
        {metrics.dailyActiveUsers !== undefined && (
          <KpiCard label="Daily Active Users" value={metrics.dailyActiveUsers} />
        )}
        {metrics.authSuccessRate !== undefined && (
          <KpiCard label="Auth Success Rate" value={`${metrics.authSuccessRate}%`} />
        )}
        {metrics.lastReportedAt && (
          <KpiCard
            label="Last Reported"
            value={new Date(metrics.lastReportedAt).toLocaleDateString()}
          />
        )}
      </div>

      <SectionCard title="Version Distribution">
        {versionDistribution.length > 0 ? (
          <DataTable
            rows={versionDistribution}
            columns={[
              {
                key: "version",
                label: "Version",
                render: (value) => (
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {String(value || "Unknown")}
                  </span>
                ),
              },
              {
                key: "count",
                label: "Users",
                render: (value) => (
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {String(value || 0)}
                  </span>
                ),
              },
            ]}
            emptyMessage="No version distribution data available"
          />
        ) : (
          <EmptyState message="No version distribution data available" />
        )}
      </SectionCard>
    </div>
  );
}
