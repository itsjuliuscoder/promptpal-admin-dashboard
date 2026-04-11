"use client";

import React, { useEffect, useState } from "react";
import { FiRefreshCw } from "react-icons/fi";
import KpiCard from "@/components/admin/overview/KpiCard";
import PlatformStatusPanel from "@/components/admin/overview/PlatformStatusPanel";
import ActivityFeed from "@/components/admin/overview/ActivityFeed";
import PageHeader from "@/components/shared/PageHeader";
import ErrorState from "@/components/shared/ErrorState";
import SectionCard from "@/components/shared/SectionCard";
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
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await adminService.getOverview();
        setData(response);
        setLastUpdated(new Date().toISOString());
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
      <div className="admin-page space-y-6">
        <PageHeader
          eyebrow="Operations"
          title="Overview"
          description="Platform metrics, status, and recent activity"
        />
        <section className="space-y-4">
          <div className="h-4 w-24 max-w-xs rounded-full bg-[color:var(--admin-panel-muted)]" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="admin-kpi-card animate-pulse">
                <div className="mb-3 h-4 w-24 rounded-full bg-[color:var(--admin-panel-muted)]"></div>
                <div className="h-10 w-20 rounded-full bg-[color:var(--admin-panel-muted)]"></div>
              </div>
            ))}
          </div>
        </section>
        <section className="space-y-4">
          <div className="h-4 w-28 max-w-xs rounded-full bg-[color:var(--admin-panel-muted)]" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={`p-${i}`} className="admin-kpi-card animate-pulse">
                <div className="mb-3 h-4 w-24 rounded-full bg-[color:var(--admin-panel-muted)]"></div>
                <div className="h-8 w-16 rounded-full bg-[color:var(--admin-panel-muted)]"></div>
              </div>
            ))}
          </div>
        </section>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
          <div className="admin-panel animate-pulse p-6">
            <div className="mb-4 h-6 w-32 rounded-full bg-[color:var(--admin-panel-muted)]"></div>
            <div className="space-y-2">
              <div className="h-4 rounded-full bg-[color:var(--admin-panel-muted)]"></div>
              <div className="h-4 w-5/6 rounded-full bg-[color:var(--admin-panel-muted)]"></div>
            </div>
          </div>
          <div className="admin-panel animate-pulse p-6">
            <div className="mb-4 h-6 w-32 rounded-full bg-[color:var(--admin-panel-muted)]"></div>
            <div className="space-y-2">
              <div className="h-4 rounded-full bg-[color:var(--admin-panel-muted)]"></div>
              <div className="h-4 w-5/6 rounded-full bg-[color:var(--admin-panel-muted)]"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="admin-page space-y-6">
        <PageHeader
          eyebrow="Operations"
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

  const keyMetrics = data.kpis.slice(0, 4);
  const productUsage = data.kpis.slice(4);
  const lastUpdatedLabel = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      })
    : "Just now";

  const getMetricMeta = (label: string) => {
    const key = label.toLowerCase();
    if (key.includes("total users")) {
      return {
        caption: "Current registered accounts",
        tone: "accent" as const,
        emphasis: "primary" as const,
      };
    }
    if (key.includes("active (24")) {
      return {
        caption: "Short-term daily engagement",
        tone: "success" as const,
        emphasis: "primary" as const,
      };
    }
    if (key.includes("active (7")) {
      return {
        caption: "Weekly active footprint",
        tone: "neutral" as const,
        emphasis: "secondary" as const,
      };
    }
    if (key.includes("active (30")) {
      return {
        caption: "Monthly retained users",
        tone: "neutral" as const,
        emphasis: "secondary" as const,
      };
    }
    if (key.includes("mrr")) {
      return {
        caption: "Recurring revenue snapshot",
        tone: "warning" as const,
        emphasis: "secondary" as const,
      };
    }
    return {
      caption: "Platform usage signal",
      tone: "neutral" as const,
      emphasis: "secondary" as const,
    };
  };

  return (
    <div className="admin-page space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Overview"
        description="Platform metrics, status, and recent activity"
        metadata={
          <>
            <span className="admin-stat-pill">Live admin workspace</span>
            <span className="admin-stat-pill">Last updated {lastUpdatedLabel}</span>
          </>
        }
        actions={
          <button className="admin-button admin-button-secondary" onClick={() => window.location.reload()}>
            <FiRefreshCw size={16} />
            Refresh data
          </button>
        }
      />

      <section className="space-y-4" aria-labelledby="key-metrics-heading">
        <h2 id="key-metrics-heading" className="admin-eyebrow">
          Key metrics
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {keyMetrics.map((kpi, index) => {
            const meta = getMetricMeta(kpi.label);
            return (
              <KpiCard
                key={kpi.key}
                label={kpi.label}
                value={kpi.value}
                unit={kpi.unit}
                caption={meta.caption}
                tone={meta.tone}
                emphasis={index < 2 ? "primary" : meta.emphasis}
              />
            );
          })}
        </div>
      </section>

      {productUsage.length > 0 ? (
        <SectionCard
          eyebrow="Activity posture"
          title="Product usage"
          description="Secondary metrics that help explain where usage is concentrated across the platform."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {productUsage.map((kpi) => {
              const meta = getMetricMeta(kpi.label);
              return (
                <KpiCard
                  key={kpi.key}
                  label={kpi.label}
                  value={kpi.value}
                  unit={kpi.unit}
                  caption={meta.caption}
                  tone={meta.tone}
                />
              );
            })}
          </div>
        </SectionCard>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
        <div>
          <PlatformStatusPanel status={data.platformStatus} />
        </div>
        <ActivityFeed events={data.activityFeed} />
      </div>
    </div>
  );
}
