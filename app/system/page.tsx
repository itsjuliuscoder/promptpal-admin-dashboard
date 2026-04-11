"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  FiActivity,
  FiAlertTriangle,
  FiDownload,
  FiRefreshCw,
  FiShield,
  FiTool,
} from "react-icons/fi";
import PageHeader from "@/components/shared/PageHeader";
import ErrorState from "@/components/shared/ErrorState";
import { CardSkeleton, TableSkeleton } from "@/components/shared/LoadingSkeleton";
import SectionCard from "@/components/shared/SectionCard";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import SectionWorkspace, { WorkspaceSectionItem } from "@/components/shared/SectionWorkspace";
import { MetricTile, PreviewNotice, ToggleCard } from "@/components/shared/AdminWidgets";
import { useSectionQueryState } from "@/lib/hooks/useSectionQueryState";
import { adminService } from "@/lib/services/adminService";

const SECTION_ITEMS: WorkspaceSectionItem[] = [
  { id: "status", label: "System status", icon: <FiActivity size={18} /> },
  { id: "jobs", label: "Background jobs", icon: <FiTool size={18} /> },
  { id: "security", label: "Security rules", icon: <FiShield size={18} /> },
  { id: "logs", label: "Error logs", icon: <FiAlertTriangle size={18} /> },
];

const DEFAULT_SECURITY_PREVIEW = {
  apiRateLimit: "100",
  authRateLimit: "10",
  blockTor: false,
  requireHttps: true,
  adminAllowlist: false,
};

function formatDate(value?: string) {
  if (!value) return "Unknown";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function AdminSystemPage() {
  const sectionIds = useMemo(() => SECTION_ITEMS.map((item) => item.id), []);
  const { activeSection, setActiveSection } = useSectionQueryState(sectionIds, "status");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<any>(null);
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [aiHealth, setAiHealth] = useState<any>(null);
  const [failedLogins, setFailedLogins] = useState<any[]>([]);
  const [suspiciousActivity, setSuspiciousActivity] = useState<any[]>([]);
  const [abuseSignals, setAbuseSignals] = useState<any[]>([]);
  const [injectionAttempts, setInjectionAttempts] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [securityPreview, setSecurityPreview] = useState(DEFAULT_SECURITY_PREVIEW);

  const loadSystemData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [
        overviewRes,
        authRes,
        aiRes,
        failedRes,
        suspiciousRes,
        abuseRes,
        injectionRes,
        auditRes,
      ] = await Promise.all([
        adminService.getOverview().catch(() => null),
        adminService.getSystemAuthStatus().catch(() => null),
        adminService.getAIHealth().catch(() => null),
        adminService.getFailedLogins().catch(() => ({ data: [] })),
        adminService.getSuspiciousActivity().catch(() => ({ data: [] })),
        adminService.getAbuseSignals().catch(() => ({ data: [] })),
        adminService.getInjectionAttempts().catch(() => ({ data: [] })),
        adminService.getAuditLogs({ page: 1, limit: 10 }).catch(() => ({ data: [] })),
      ]);

      setOverview(overviewRes);
      setAuthStatus(authRes?.data || authRes || null);
      setAiHealth(aiRes?.data || aiRes || null);
      setFailedLogins(failedRes?.data || []);
      setSuspiciousActivity(suspiciousRes?.data || []);
      setAbuseSignals(abuseRes?.data || []);
      setInjectionAttempts(injectionRes?.data || []);
      setAuditLogs(auditRes?.data || []);
    } catch (loadError) {
      console.error("Failed to load system data", loadError);
      setError("Failed to load system and security data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSystemData();
  }, []);

  const apiUptimeMinutes = overview?.platformStatus?.apiUptimeSeconds
    ? Math.floor(overview.platformStatus.apiUptimeSeconds / 60)
    : null;
  const activeUsers30d = overview?.kpis?.find((item: any) =>
    String(item.label).toLowerCase().includes("active (30d)")
  )?.value;
  const aiProviderCount = Array.isArray(aiHealth?.providers) ? aiHealth.providers.length : 0;
  const avgProviderLatency = Array.isArray(aiHealth?.responseTimes) && aiHealth.responseTimes.length > 0
    ? Math.round(
        aiHealth.responseTimes.reduce(
          (sum: number, item: any) => sum + Number(item.avgResponseTime || 0),
          0
        ) / aiHealth.responseTimes.length
      )
    : null;
  const backgroundJobState = overview?.platformStatus?.backgroundJobs?.status || "Unknown";
  const extensionVersion = overview?.platformStatus?.extensionVersionHealth?.currentVersion || "Unknown";
  const extensionLastReported = overview?.platformStatus?.extensionVersionHealth?.lastReportedAt;

  const services = [
    {
      label: "Google OAuth",
      description: "Authentication provider",
      value: authStatus?.googleOAuth ? "Online" : "Disabled",
      variant: authStatus?.googleOAuth ? "success" : "warning",
    },
    {
      label: "Email Auth",
      description: "Local email/password login",
      value: authStatus?.emailAuth ? "Online" : "Disabled",
      variant: authStatus?.emailAuth ? "success" : "warning",
    },
    {
      label: "API uptime",
      description: "Application runtime health",
      value: apiUptimeMinutes != null ? `${apiUptimeMinutes} min` : "Unknown",
      variant: apiUptimeMinutes != null ? "success" : "warning",
    },
    {
      label: "Background jobs",
      description: "Worker and queue state",
      value: backgroundJobState,
      variant:
        String(backgroundJobState).toLowerCase() === "ok" ||
        String(backgroundJobState).toLowerCase() === "running"
          ? "success"
          : "warning",
    },
    {
      label: "Chrome Extension",
      description: "Extension heartbeat",
      value: extensionVersion,
      variant: extensionVersion === "Unknown" ? "warning" : "success",
    },
  ];

  const combinedLogs = useMemo(() => {
    const rows = [
      ...failedLogins.map((item, index) => ({
        id: `failed-${index}`,
        category: "Failed login",
        source: item.email || item.ip || "Unknown source",
        reason: item.reason || "Authentication failure",
        severity: "warning",
        createdAt: item.createdAt,
      })),
      ...suspiciousActivity.map((item, index) => ({
        id: `suspicious-${index}`,
        category: "Suspicious activity",
        source: item.userId || item.ipAddress || "Unknown source",
        reason: item.type || "Unexpected security signal",
        severity: "warning",
        createdAt: item.createdAt,
      })),
      ...abuseSignals.map((item, index) => ({
        id: `abuse-${index}`,
        category: "Abuse signal",
        source: item.userId || item.source || "Unknown source",
        reason: item.signal || "Abuse or policy trigger",
        severity: "error",
        createdAt: item.createdAt,
      })),
      ...injectionAttempts.map((item, index) => ({
        id: `inject-${index}`,
        category: "Injection attempt",
        source: item.source || item.userId || "Unknown source",
        reason: item.type || "Prompt injection",
        severity: "error",
        createdAt: item.createdAt,
      })),
      ...auditLogs.map((item, index) => ({
        id: `audit-${index}`,
        category: "Admin audit",
        source: item.actorRole || item.source || "admin",
        reason: item.action || "Audit event",
        severity: "info",
        createdAt: item.createdAt,
      })),
    ];

    return rows.sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }, [abuseSignals, auditLogs, failedLogins, injectionAttempts, suspiciousActivity]);

  if (loading) {
    return (
      <div className="admin-page space-y-6">
        <PageHeader
          eyebrow="Operations"
          title="System & Security"
          description="Monitor service health, worker state, and security signals."
        />
        <div className="admin-workspace">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page space-y-6">
        <PageHeader
          eyebrow="Operations"
          title="System & Security"
          description="Monitor service health, worker state, and security signals."
        />
        <ErrorState message={error} onRetry={loadSystemData} />
      </div>
    );
  }

  return (
    <div className="admin-page space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="System & Security"
        description="Monitor service health, worker state, and security signals."
        actions={
          <>
            <button type="button" className="admin-button admin-button-secondary" onClick={loadSystemData}>
              <FiRefreshCw size={16} />
              Refresh
            </button>
            <button
              type="button"
              className="admin-button admin-button-secondary"
              onClick={() =>
                downloadJson("system-security-logs.json", {
                  failedLogins,
                  suspiciousActivity,
                  abuseSignals,
                  injectionAttempts,
                  auditLogs,
                })
              }
            >
              <FiDownload size={16} />
              Export logs
            </button>
          </>
        }
      />

      <SectionWorkspace
        sections={SECTION_ITEMS}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        sectionLabel="System and security sections"
      >
        {activeSection === "status" ? (
          <div className="space-y-6">
            <SectionCard
              title="System status"
              description="Real-time health of platform services and currently available telemetry."
            >
              <div className="space-y-6">
                <div className="admin-metric-grid">
                  <MetricTile
                    label="API uptime"
                    value={apiUptimeMinutes != null ? `${apiUptimeMinutes} min` : "Unknown"}
                    note="Derived from current application uptime."
                  />
                  <MetricTile
                    label="AI providers"
                    value={aiProviderCount || "Unknown"}
                    note={
                      avgProviderLatency != null
                        ? `Average provider latency ${avgProviderLatency}ms`
                        : "Latency telemetry unavailable"
                    }
                  />
                  <MetricTile
                    label="Active users (30d)"
                    value={activeUsers30d ?? "Unknown"}
                    note="Pulled from the overview KPI feed."
                  />
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-semibold tracking-[-0.03em] text-[color:var(--admin-text)]">
                    Services
                  </h3>
                  <div className="space-y-3">
                    {services.map((service) => (
                      <div
                        key={service.label}
                        className="admin-list-card flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <p className="text-lg font-semibold text-[color:var(--admin-text)]">{service.label}</p>
                          <p className="text-sm text-[color:var(--admin-text-soft)]">{service.description}</p>
                        </div>
                        <StatusBadge label={service.value} variant={service.variant as any} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        ) : null}

        {activeSection === "jobs" ? (
          <SectionCard
            title="Background jobs"
            description="Worker health and extension heartbeat based on currently exposed admin telemetry."
          >
            <div className="space-y-5">
              <div className="admin-metric-grid">
                <MetricTile label="Worker status" value={backgroundJobState} note={overview?.platformStatus?.backgroundJobs?.note || "No extra worker note available"} />
                <MetricTile
                  label="Extension version"
                  value={extensionVersion}
                  note={
                    extensionLastReported
                      ? `Last reported ${formatDate(extensionLastReported)}`
                      : "No heartbeat report received"
                  }
                />
                <MetricTile
                  label="Queue telemetry"
                  value="Unknown"
                  note="Queue depth and job counts are not exposed by the current admin API."
                />
              </div>

              <PreviewNotice message="The current backend does not expose queue depth, retries, or per-worker metrics. This page intentionally stays within the available overview telemetry." />
            </div>
          </SectionCard>
        ) : null}

        {activeSection === "security" ? (
          <SectionCard
            title="Security rules"
            description="Rate limiting, IP controls, and access restrictions."
          >
            <div className="space-y-6">
              <PreviewNotice message="Security rule persistence is not implemented in the current admin API. These controls are rendered as a design-faithful preview only." />

              <div className="admin-field-grid">
                <div className="admin-field-stack">
                  <label className="admin-field-label" htmlFor="api-rate-limit">
                    Rate limit — API (requests/min)
                  </label>
                  <input
                    id="api-rate-limit"
                    className="admin-input"
                    value={securityPreview.apiRateLimit}
                    onChange={(event) =>
                      setSecurityPreview((current) => ({
                        ...current,
                        apiRateLimit: event.target.value,
                      }))
                    }
                  />
                  <p className="admin-field-hint">
                    Applied per IP address. Exceeding this returns HTTP 429.
                  </p>
                </div>

                <div className="admin-field-stack">
                  <label className="admin-field-label" htmlFor="auth-rate-limit">
                    Rate limit — Auth endpoints (requests/min)
                  </label>
                  <input
                    id="auth-rate-limit"
                    className="admin-input"
                    value={securityPreview.authRateLimit}
                    onChange={(event) =>
                      setSecurityPreview((current) => ({
                        ...current,
                        authRateLimit: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <ToggleCard
                  title="Block Tor exit nodes"
                  description="Deny requests from known Tor exit IP addresses."
                  checked={securityPreview.blockTor}
                  onChange={(checked) =>
                    setSecurityPreview((current) => ({ ...current, blockTor: checked }))
                  }
                />
                <ToggleCard
                  title="Require HTTPS"
                  description="Redirect all HTTP requests to HTTPS."
                  checked={securityPreview.requireHttps}
                  onChange={(checked) =>
                    setSecurityPreview((current) => ({ ...current, requireHttps: checked }))
                  }
                />
                <ToggleCard
                  title="Admin IP allowlist"
                  description="Restrict admin panel access to specific IP ranges."
                  checked={securityPreview.adminAllowlist}
                  onChange={(checked) =>
                    setSecurityPreview((current) => ({ ...current, adminAllowlist: checked }))
                  }
                />
              </div>

              <button type="button" className="admin-button admin-button-secondary opacity-60" disabled>
                Save security settings
              </button>
            </div>
          </SectionCard>
        ) : null}

        {activeSection === "logs" ? (
          <div className="space-y-6">
            <section className="admin-summary-strip">
              <div className="admin-summary-item">
                <p className="admin-summary-label">Failed logins</p>
                <p className="admin-summary-value">{failedLogins.length}</p>
                <p className="admin-summary-hint">Recent auth failures returned by the backend</p>
              </div>
              <div className="admin-summary-item">
                <p className="admin-summary-label">Suspicious activity</p>
                <p className="admin-summary-value">{suspiciousActivity.length}</p>
                <p className="admin-summary-hint">Security signals flagged for review</p>
              </div>
              <div className="admin-summary-item">
                <p className="admin-summary-label">Abuse signals</p>
                <p className="admin-summary-value">{abuseSignals.length}</p>
                <p className="admin-summary-hint">Potential policy or misuse incidents</p>
              </div>
              <div className="admin-summary-item">
                <p className="admin-summary-label">Injection attempts</p>
                <p className="admin-summary-value">{injectionAttempts.length}</p>
                <p className="admin-summary-hint">Prompt-security related alerts</p>
              </div>
            </section>

            <SectionCard
              title="Error and security logs"
              description="Consolidated feed from auth failures, security signals, and admin audit events."
            >
              {combinedLogs.length === 0 ? (
                <PreviewNotice title="No logs returned" message="No recent log events were returned by the current system endpoints." />
              ) : (
                <DataTable
                  rows={combinedLogs}
                  rowKey={(row) => row.id}
                  mobileCardTitle={(row) => row.category}
                  mobileCardMeta={(row) => row.reason}
                  mobileCardFooter={(row) => (
                    <StatusBadge
                      label={row.severity}
                      variant={row.severity === "error" ? "error" : row.severity === "warning" ? "warning" : "info"}
                      size="sm"
                    />
                  )}
                  columns={[
                    {
                      key: "category",
                      label: "Category",
                      emphasize: true,
                      width: "18%",
                    },
                    {
                      key: "source",
                      label: "Source",
                      width: "24%",
                      truncate: true,
                    },
                    {
                      key: "reason",
                      label: "Reason",
                      width: "32%",
                      truncate: true,
                    },
                    {
                      key: "severity",
                      label: "Severity",
                      width: "12%",
                      render: (value) => (
                        <StatusBadge
                          label={value}
                          variant={value === "error" ? "error" : value === "warning" ? "warning" : "info"}
                        />
                      ),
                    },
                    {
                      key: "createdAt",
                      label: "Time",
                      width: "14%",
                      render: (value) => formatDate(value),
                    },
                  ]}
                />
              )}
            </SectionCard>
          </div>
        ) : null}
      </SectionWorkspace>
    </div>
  );
}
