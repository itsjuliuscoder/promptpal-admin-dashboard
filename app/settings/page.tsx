"use client";

import React, { useEffect, useState } from "react";
import SectionCard from "@/components/shared/SectionCard";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSkeleton, { CardSkeleton } from "@/components/shared/LoadingSkeleton";
import ErrorState from "@/components/shared/ErrorState";
import { FiToggleLeft, FiToggleRight } from "react-icons/fi";
import { adminService } from "@/lib/services/adminService";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [settingsRes, flagsRes] = await Promise.all([
          adminService.getPlatformSettings(),
          adminService.getAllFeatureFlags(),
        ]);
        setSettings(settingsRes.data || settingsRes);
        setFlags(flagsRes.data || []);
      } catch (err) {
        console.error("Failed to load settings", err);
        setError("Failed to load settings. Please try again.");
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
          title="Settings"
          description="Configure platform settings and feature flags"
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
          title="Settings"
          description="Configure platform settings and feature flags"
        />
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Settings"
        description="Configure platform settings and feature flags"
      />

      <SectionCard title="Platform Settings">
        {settings ? (
          <div className="space-y-4">
            {Object.entries(settings).map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-800 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {typeof value === "object" ? JSON.stringify(value) : String(value)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">No settings configured</p>
        )}
      </SectionCard>

      <SectionCard title="Feature Flags">
        {flags && flags.length > 0 ? (
          <div className="space-y-3">
            {flags.map((flag: any) => (
              <div
                key={flag.name || flag.key}
                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-800 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {flag.name || flag.key}
                  </p>
                  {flag.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {flag.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {flag.enabled !== undefined ? (
                    flag.enabled ? (
                      <FiToggleRight className="text-green-500" size={24} />
                    ) : (
                      <FiToggleLeft className="text-gray-400" size={24} />
                    )
                  ) : (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {String(flag.value || "N/A")}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">No feature flags configured</p>
        )}
      </SectionCard>
    </div>
  );
}
