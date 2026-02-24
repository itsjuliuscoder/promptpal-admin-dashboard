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
  const [bannerMessage, setBannerMessage] = useState("");
  const [bannerEnabled, setBannerEnabled] = useState(false);
  const [bannerLevel, setBannerLevel] = useState("info");
  const [bannerSaving, setBannerSaving] = useState(false);
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [maintenanceSaving, setMaintenanceSaving] = useState(false);
  const [forceUpdateEnabled, setForceUpdateEnabled] = useState(false);
  const [forceUpdateMinVersion, setForceUpdateMinVersion] = useState("");
  const [forceUpdateMessage, setForceUpdateMessage] = useState("");
  const [forceUpdateSaving, setForceUpdateSaving] = useState(false);

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
    ? metrics.versionDistribution.map((item: any, index: number) => ({
        id: item.version || `version-${index}`,
        version: item.version,
        count: item.count,
      }))
    : metrics.versionDistribution
    ? Object.entries(metrics.versionDistribution).map(([version, count], index) => ({
        id: version || `version-${index}`,
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

      <SectionCard title="Extension Banner">
        <div className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Message
            </label>
            <input
              type="text"
              value={bannerMessage}
              onChange={(e) => setBannerMessage(e.target.value)}
              placeholder="Banner text shown in extension"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Level
            </label>
            <select
              value={bannerLevel}
              onChange={(e) => setBannerLevel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            >
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="banner-enabled"
              checked={bannerEnabled}
              onChange={(e) => setBannerEnabled(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            <label htmlFor="banner-enabled" className="text-sm text-gray-700 dark:text-gray-300">
              Show banner
            </label>
          </div>
          <button
            type="button"
            disabled={bannerSaving}
            onClick={async () => {
              setBannerSaving(true);
              try {
                await adminService.setExtensionBanner({
                  message: bannerMessage,
                  enabled: bannerEnabled,
                  level: bannerLevel,
                });
              } finally {
                setBannerSaving(false);
              }
            }}
            className="px-4 py-2 bg-[#A84C34] text-white rounded-lg hover:bg-[#92361a] disabled:opacity-50 text-sm font-medium"
          >
            {bannerSaving ? "Saving…" : "Save banner"}
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Maintenance Mode">
        <div className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Message (optional)
            </label>
            <input
              type="text"
              value={maintenanceMessage}
              onChange={(e) => setMaintenanceMessage(e.target.value)}
              placeholder="Message shown during maintenance"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="maintenance-enabled"
              checked={maintenanceEnabled}
              onChange={(e) => setMaintenanceEnabled(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            <label htmlFor="maintenance-enabled" className="text-sm text-gray-700 dark:text-gray-300">
              Enable maintenance mode
            </label>
          </div>
          <button
            type="button"
            disabled={maintenanceSaving}
            onClick={async () => {
              setMaintenanceSaving(true);
              try {
                await adminService.setExtensionMaintenance({
                  enabled: maintenanceEnabled,
                  message: maintenanceMessage || undefined,
                });
              } finally {
                setMaintenanceSaving(false);
              }
            }}
            className="px-4 py-2 bg-[#A84C34] text-white rounded-lg hover:bg-[#92361a] disabled:opacity-50 text-sm font-medium"
          >
            {maintenanceSaving ? "Saving…" : "Save maintenance"}
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Force Update">
        <div className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Minimum version
            </label>
            <input
              type="text"
              value={forceUpdateMinVersion}
              onChange={(e) => setForceUpdateMinVersion(e.target.value)}
              placeholder="e.g. 1.2.0"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Message (optional)
            </label>
            <input
              type="text"
              value={forceUpdateMessage}
              onChange={(e) => setForceUpdateMessage(e.target.value)}
              placeholder="Message shown when update required"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="force-update-enabled"
              checked={forceUpdateEnabled}
              onChange={(e) => setForceUpdateEnabled(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            <label htmlFor="force-update-enabled" className="text-sm text-gray-700 dark:text-gray-300">
              Require update (users below min version will be prompted)
            </label>
          </div>
          <button
            type="button"
            disabled={forceUpdateSaving}
            onClick={async () => {
              setForceUpdateSaving(true);
              try {
                await adminService.setExtensionForceUpdate({
                  enabled: forceUpdateEnabled,
                  minVersion: forceUpdateMinVersion || undefined,
                  message: forceUpdateMessage || undefined,
                });
              } finally {
                setForceUpdateSaving(false);
              }
            }}
            className="px-4 py-2 bg-[#A84C34] text-white rounded-lg hover:bg-[#92361a] disabled:opacity-50 text-sm font-medium"
          >
            {forceUpdateSaving ? "Saving…" : "Save force update"}
          </button>
        </div>
      </SectionCard>
    </div>
  );
}
