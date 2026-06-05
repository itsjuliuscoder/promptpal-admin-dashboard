"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FiAlertTriangle,
  FiBarChart2,
  FiCpu,
  FiDownload,
  FiRefreshCw,
  FiSettings,
  FiUsers,
} from "react-icons/fi";
import PageHeader from "@/components/shared/PageHeader";
import ErrorState from "@/components/shared/ErrorState";
import SectionCard from "@/components/shared/SectionCard";
import DataTable from "@/components/shared/DataTable";
import Pagination from "@/components/shared/Pagination";
import { CardSkeleton, TableSkeleton } from "@/components/shared/LoadingSkeleton";
import StatusBadge from "@/components/shared/StatusBadge";
import SectionWorkspace, { WorkspaceSectionItem } from "@/components/shared/SectionWorkspace";
import { MetricTile, PreviewNotice } from "@/components/shared/AdminWidgets";
import { useSectionQueryState } from "@/lib/hooks/useSectionQueryState";
import {
  adminService,
  PersonalBrainStatsData,
  PersonalBrainSyncIssue,
  PersonalBrainUserRow,
} from "@/lib/services/adminService";

const SECTION_ITEMS: WorkspaceSectionItem[] = [
  { id: "overview", label: "Overview", icon: <FiBarChart2 size={18} /> },
  { id: "users", label: "User brains", icon: <FiUsers size={18} /> },
  { id: "issues", label: "Sync issues", icon: <FiAlertTriangle size={18} /> },
  { id: "config", label: "Configuration", icon: <FiSettings size={18} /> },
];

const BRAIN_STATUSES = [
  "",
  "not_started",
  "not_initialized",
  "learning",
  "initializing",
  "ready",
  "active",
  "stale",
  "error",
];

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function statusVariant(status: string): "success" | "warning" | "error" | "info" | undefined {
  if (["active", "ready"].includes(status)) return "success";
  if (["stale", "initializing", "learning"].includes(status)) return "warning";
  if (status === "error") return "error";
  return "info";
}

export default function PersonalBrainMonitorPage() {
  const sectionIds = useMemo(() => SECTION_ITEMS.map((item) => item.id), []);
  const { activeSection, setActiveSection } = useSectionQueryState(sectionIds, "overview");

  const [stats, setStats] = useState<PersonalBrainStatsData | null>(null);
  const [brains, setBrains] = useState<PersonalBrainUserRow[]>([]);
  const [issues, setIssues] = useState<PersonalBrainSyncIssue[]>([]);
  const [brainsTotal, setBrainsTotal] = useState(0);
  const [issuesTotal, setIssuesTotal] = useState(0);
  const [brainsPages, setBrainsPages] = useState(1);
  const [issuesPages, setIssuesPages] = useState(1);
  const [brainsPage, setBrainsPage] = useState(1);
  const [issuesPage, setIssuesPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingBrains, setLoadingBrains] = useState(true);
  const [loadingIssues, setLoadingIssues] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [brainsError, setBrainsError] = useState<string | null>(null);
  const [issuesError, setIssuesError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      setStatsError(null);
      const response = await adminService.getPersonalBrainStats(30);
      setStats(response.data);
    } catch (error) {
      console.error("Failed to load Personal Brain stats", error);
      setStatsError("Failed to load Personal Brain stats.");
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchBrains = async () => {
    try {
      setLoadingBrains(true);
      setBrainsError(null);
      const response = await adminService.getPersonalBrainUsers({
        page: brainsPage,
        limit: 15,
        status: statusFilter || undefined,
        search: search.trim() || undefined,
        days: 90,
      });
      setBrains(response.data.brains);
      setBrainsTotal(response.data.total);
      setBrainsPages(response.data.pages);
    } catch (error) {
      console.error("Failed to load Personal Brain users", error);
      setBrainsError("Failed to load user brains.");
    } finally {
      setLoadingBrains(false);
    }
  };

  const fetchIssues = async () => {
    try {
      setLoadingIssues(true);
      setIssuesError(null);
      const response = await adminService.getPersonalBrainSyncIssues({
        page: issuesPage,
        limit: 15,
      });
      setIssues(response.data.issues);
      setIssuesTotal(response.data.total);
      setIssuesPages(response.data.pages);
    } catch (error) {
      console.error("Failed to load Personal Brain sync issues", error);
      setIssuesError("Failed to load sync issues.");
    } finally {
      setLoadingIssues(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeSection === "users") {
      fetchBrains();
    }
  }, [activeSection, brainsPage, statusFilter, search]);

  useEffect(() => {
    if (activeSection === "issues") {
      fetchIssues();
    }
  }, [activeSection, issuesPage]);

  const insightCopy = useMemo(() => {
    if (!stats) return "Personal Brain metrics are loading.";
    const { summary } = stats;
    if (summary.totalBrains === 0) {
      return "No Personal Brain documents exist yet. Adoption will appear here once users on eligible plans connect tools.";
    }
    if (summary.errorBrains > 0 || summary.staleBrains > 0) {
      return `${summary.errorBrains} brain(s) in error and ${summary.staleBrains} stale. Review the Sync issues tab and user detail pages for pipeline or connector failures.`;
    }
    if (!summary.runtimeBetaEnabled) {
      return `${summary.initializedBrains} initialized brain(s). Runtime chat is disabled globally — enable personal_brain_runtime_beta in Settings to expose chat and agent surfaces.`;
    }
    return `${summary.activeBrains} active brain(s), ${summary.connectedIntegrations} connected integrations, and ${summary.chatMessagesMonth} chat requests this month.`;
  }, [stats]);

  const refreshActive = () => {
    if (activeSection === "users") {
      fetchBrains();
      return;
    }
    if (activeSection === "issues") {
      fetchIssues();
      return;
    }
    fetchStats();
  };

  const brainColumns = [
    {
      key: "userEmail",
      label: "User",
      render: (_: unknown, row: PersonalBrainUserRow) => (
        <div>
          <Link
            href={`/users/${row.userId}`}
            className="font-medium text-[color:var(--admin-accent-strong)] hover:underline"
          >
            {row.userEmail || row.userName}
          </Link>
          <p className="text-sm text-[color:var(--admin-text-soft)]">{row.userPlan}</p>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value: string) => (
        <StatusBadge label={value} variant={statusVariant(value)} size="sm" />
      ),
    },
    { key: "connectorCount", label: "Connectors" },
    { key: "pendingTemplatesCount", label: "Pending tpl" },
    { key: "memoryEpisodes", label: "Episodes" },
    {
      key: "lastFullSyncAt",
      label: "Last sync",
      render: (value: string | null) => formatDate(value),
    },
    {
      key: "updatedAt",
      label: "Updated",
      render: (value: string) => formatDate(value),
    },
  ];

  const issueColumns = [
    ...brainColumns.slice(0, 2),
    {
      key: "lastError",
      label: "Error",
      render: (value: string | null, row: PersonalBrainSyncIssue) => (
        <span className="line-clamp-2 max-w-md text-sm text-[color:var(--admin-danger)]">
          {value || row.pipelineErrors?.[0]?.message || "Pipeline / connector failure"}
        </span>
      ),
    },
    {
      key: "errorConnectors",
      label: "Connectors",
      render: (value: string[]) => (value?.length ? value.join(", ") : "—"),
    },
    {
      key: "failedPipelineStages",
      label: "Failed stages",
      render: (value: string[]) => (value?.length ? value.join(", ") : "—"),
    },
    {
      key: "updatedAt",
      label: "Updated",
      render: (value: string) => formatDate(value),
    },
  ];

  return (
    <div className="admin-page space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Personal Brain"
        description="Track connector adoption, brain health, sync failures, and runtime usage across users."
        actions={
          <>
            <button type="button" className="admin-button admin-button-secondary" onClick={refreshActive}>
              <FiRefreshCw size={16} />
              Refresh
            </button>
            <button
              type="button"
              className="admin-button admin-button-secondary"
              onClick={() =>
                downloadJson("personal-brain-export.json", { stats, brains, issues })
              }
            >
              <FiDownload size={16} />
              Export data
            </button>
          </>
        }
      />

      <SectionWorkspace
        sections={SECTION_ITEMS}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        sectionLabel="Personal Brain sections"
      >
        {activeSection === "overview" ? (
          statsError ? (
            <ErrorState message={statsError} onRetry={fetchStats} />
          ) : loadingStats ? (
            <CardSkeleton />
          ) : stats ? (
            <div className="space-y-6">
              <div className="admin-metric-grid">
                <MetricTile
                  label="Total brains"
                  value={stats.summary.totalBrains}
                  note="All PersonalBrain documents"
                />
                <MetricTile
                  label="Active / initialized"
                  value={`${stats.summary.activeBrains} / ${stats.summary.initializedBrains}`}
                  note="Active status vs started onboarding"
                />
                <MetricTile
                  label="Connected integrations"
                  value={stats.summary.connectedIntegrations}
                  note="OAuth tools currently connected"
                />
                <MetricTile
                  label="Chat (month)"
                  value={stats.summary.chatMessagesMonth}
                  note={`${stats.summary.templatesGeneratedMonth} templates generated`}
                />
              </div>

              <div className="admin-metric-grid">
                <MetricTile
                  label="Errors"
                  value={stats.summary.errorBrains}
                  note="Brains in error status"
                />
                <MetricTile
                  label="Stale"
                  value={stats.summary.staleBrains}
                  note="Needs refresh"
                />
                <MetricTile
                  label="Syncs today"
                  value={stats.summary.syncsToday}
                  note="Full syncs since midnight UTC"
                />
                <MetricTile
                  label="Runtime beta"
                  value={stats.summary.runtimeBetaEnabled ? "On" : "Off"}
                  note="personal_brain_runtime_beta flag"
                />
              </div>

              <SectionCard
                title="Operational summary"
                description="Health and adoption signals for Personal Brain."
              >
                <div className="space-y-6">
                  <div className="rounded-[1rem] border border-[color:var(--admin-warning)]/20 bg-[color:var(--admin-warning-soft)] px-5 py-4 text-[color:var(--admin-text)]">
                    <p className="text-lg font-medium leading-8">{insightCopy}</p>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-2">
                    <div>
                      <h3 className="mb-3 text-lg font-semibold text-[color:var(--admin-text)]">
                        By status
                      </h3>
                      {stats.byStatus.length === 0 ? (
                        <PreviewNotice message="No status breakdown available." />
                      ) : (
                        <ul className="space-y-2">
                          {stats.byStatus.map((row) => (
                            <li
                              key={row.status}
                              className="flex items-center justify-between rounded-lg border border-[color:var(--admin-border)] px-4 py-2"
                            >
                              <StatusBadge label={row.status} variant={statusVariant(row.status)} size="sm" />
                              <span className="font-semibold text-[color:var(--admin-text)]">
                                {row.count}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div>
                      <h3 className="mb-3 text-lg font-semibold text-[color:var(--admin-text)]">
                        Top connectors
                      </h3>
                      {stats.byConnector.length === 0 ? (
                        <PreviewNotice message="No connected integrations yet." />
                      ) : (
                        <ul className="space-y-2">
                          {stats.byConnector.map((row) => (
                            <li
                              key={row.connectorId}
                              className="flex items-center justify-between rounded-lg border border-[color:var(--admin-border)] px-4 py-2"
                            >
                              <span className="font-medium capitalize text-[color:var(--admin-text)]">
                                {row.connectorId}
                              </span>
                              <span className="font-semibold text-[color:var(--admin-text)]">
                                {row.connections}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>
          ) : null
        ) : null}

        {activeSection === "users" ? (
          <SectionCard
            title="User brains"
            description="Brains updated in the last 90 days. Open a user profile for full connector and pipeline detail."
          >
            <div className="space-y-5">
              <div className="admin-toolbar">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.7fr)]">
                  <input
                    className="admin-input"
                    placeholder="Search by name or email"
                    value={search}
                    onChange={(event) => {
                      setBrainsPage(1);
                      setSearch(event.target.value);
                    }}
                  />
                  <select
                    className="admin-select"
                    value={statusFilter}
                    onChange={(event) => {
                      setBrainsPage(1);
                      setStatusFilter(event.target.value);
                    }}
                  >
                    {BRAIN_STATUSES.map((status) => (
                      <option key={status || "all"} value={status}>
                        {status ? status : "All statuses"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {brainsError ? (
                <ErrorState message={brainsError} onRetry={fetchBrains} />
              ) : loadingBrains ? (
                <TableSkeleton />
              ) : (
                <>
                  <DataTable rows={brains} columns={brainColumns} />
                  <Pagination
                    currentPage={brainsPage}
                    totalPages={brainsPages}
                    totalItems={brainsTotal}
                    itemsPerPage={15}
                    onPageChange={setBrainsPage}
                  />
                </>
              )}
            </div>
          </SectionCard>
        ) : null}

        {activeSection === "issues" ? (
          <SectionCard
            title="Sync & pipeline issues"
            description="Brains with errors, failed pipeline stages, or connector ingestion failures."
          >
            {issuesError ? (
              <ErrorState message={issuesError} onRetry={fetchIssues} />
            ) : loadingIssues ? (
              <TableSkeleton />
            ) : issues.length === 0 ? (
              <PreviewNotice message="No sync or pipeline issues detected." />
            ) : (
              <>
                <DataTable rows={issues} columns={issueColumns} />
                <Pagination
                  currentPage={issuesPage}
                  totalPages={issuesPages}
                  totalItems={issuesTotal}
                  itemsPerPage={15}
                  onPageChange={setIssuesPage}
                />
              </>
            )}
          </SectionCard>
        ) : null}

        {activeSection === "config" ? (
          <SectionCard
            title="Configuration"
            description="Feature flags and plan limits that gate Personal Brain."
          >
            <div className="space-y-4 text-[color:var(--admin-text)]">
              <div className="flex items-start gap-3 rounded-xl border border-[color:var(--admin-border)] p-4">
                <FiCpu className="mt-1 shrink-0 text-[color:var(--admin-accent)]" size={20} />
                <div>
                  <p className="font-semibold">Runtime beta flag</p>
                  <p className="mt-1 text-sm text-[color:var(--admin-text-soft)]">
                    Toggle <code className="text-xs">personal_brain_runtime_beta</code> under{" "}
                    <Link href="/settings" className="text-[color:var(--admin-accent-strong)] hover:underline">
                      Settings → Platform
                    </Link>
                    . Current state:{" "}
                    <strong>{stats?.summary.runtimeBetaEnabled ? "enabled" : "disabled"}</strong>.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-[color:var(--admin-border)] p-4">
                <FiSettings className="mt-1 shrink-0 text-[color:var(--admin-accent)]" size={20} />
                <div>
                  <p className="font-semibold">Plan limits</p>
                  <p className="mt-1 text-sm text-[color:var(--admin-text-soft)]">
                    Connector, template, and chat caps are defined per plan in{" "}
                    <Link href="/billing" className="text-[color:var(--admin-accent-strong)] hover:underline">
                      Billing & Plans
                    </Link>
                    . Change a user&apos;s plan on their profile to adjust access.
                  </p>
                </div>
              </div>
              <p className="text-sm text-[color:var(--admin-text-faint)]">
                Ops scripts (backend): <code>npm run feature:enable-personal-brain-runtime</code>,{" "}
                <code>npm run db:backfill-personal-brain-runtime</code>
              </p>
            </div>
          </SectionCard>
        ) : null}
      </SectionWorkspace>
    </div>
  );
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
