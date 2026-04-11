"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  FiActivity,
  FiBarChart2,
  FiDownload,
  FiMessageSquare,
  FiRefreshCw,
  FiSettings,
  FiSliders,
} from "react-icons/fi";
import PageHeader from "@/components/shared/PageHeader";
import ErrorState from "@/components/shared/ErrorState";
import SectionCard from "@/components/shared/SectionCard";
import DataTable from "@/components/shared/DataTable";
import Pagination from "@/components/shared/Pagination";
import { CardSkeleton, TableSkeleton } from "@/components/shared/LoadingSkeleton";
import StatusBadge from "@/components/shared/StatusBadge";
import SectionWorkspace, { WorkspaceSectionItem } from "@/components/shared/SectionWorkspace";
import { MetricTile, PreviewNotice, ToggleCard } from "@/components/shared/AdminWidgets";
import { useSectionQueryState } from "@/lib/hooks/useSectionQueryState";
import {
  adminService,
  RefineChatSession,
  RefineChatStatsData,
} from "@/lib/services/adminService";

const SECTION_ITEMS: WorkspaceSectionItem[] = [
  { id: "overview", label: "Overview", icon: <FiBarChart2 size={18} /> },
  { id: "sessions", label: "Sessions", icon: <FiMessageSquare size={18} /> },
  { id: "config", label: "Configuration", icon: <FiSettings size={18} /> },
  { id: "prompts", label: "System prompts", icon: <FiSliders size={18} /> },
];

const DEFAULT_PROMPT = `You are an expert prompt engineer. Your job is to improve the user's prompt to make it clearer, more specific, and more effective for the chosen AI model while preserving the user's intent.`;

export default function RefineChatMonitorPage() {
  const sectionIds = useMemo(() => SECTION_ITEMS.map((item) => item.id), []);
  const { activeSection, setActiveSection } = useSectionQueryState(sectionIds, "overview");

  const [stats, setStats] = useState<RefineChatStatsData | null>(null);
  const [sessions, setSessions] = useState<RefineChatSession[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [provider, setProvider] = useState("");
  const [minQuality, setMinQuality] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  const [configPreview, setConfigPreview] = useState({
    model: "claude-sonnet-4-6",
    maxRounds: "3",
    sessionTimeout: "30",
    enabled: true,
    showOnboarding: false,
    planAware: true,
  });
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_PROMPT);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      setStatsError(null);
      const response = await adminService.getRefineChatStats(30);
      setStats(response.data);
    } catch (error) {
      console.error("Failed to load refine stats", error);
      setStatsError("Failed to load Refine Agent stats.");
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      setSessionsError(null);
      const response = await adminService.getRefineChatSessions({
        page,
        limit: 10,
        provider: provider || undefined,
        minQuality: minQuality ? Number(minQuality) : undefined,
        sort,
        days: 30,
      });
      setSessions(response.data.sessions);
      setTotalSessions(response.data.total);
      setPages(response.data.pages);
    } catch (error) {
      console.error("Failed to load refine sessions", error);
      setSessionsError("Failed to load Refine Agent sessions.");
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [page, provider, minQuality, sort]);

  const topProviders = useMemo(() => {
    return [...(stats?.byProvider || [])]
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 3);
  }, [stats]);

  const insightCopy = useMemo(() => {
    if (!stats) return "Refine Agent metrics are loading.";
    if (stats.summary.totalSessions === 0) {
      return "Refine Agent has 0 sessions in the last 30 days. This is a retention-sensitive workflow, so onboarding visibility and default entry points should be reviewed.";
    }
    if ((stats.summary.avgQualityScore || 0) < 50) {
      return "Usage is present, but quality is trending low. Review system prompts and provider configuration before driving more traffic into the feature.";
    }
    return "Refine Agent is receiving traffic with usable quality scores. Focus next on provider mix and session depth to improve the outcome rate.";
  }, [stats]);

  const refreshActive = () => {
    if (activeSection === "sessions") {
      fetchSessions();
      return;
    }
    fetchStats();
  };

  if (loadingStats && activeSection === "overview") {
    return (
      <div className="admin-page space-y-6">
        <PageHeader
          eyebrow="Operations"
          title="Refine Agent"
          description="Usage metrics, sessions, and admin-level configuration surfaces for prompt refinement."
        />
        <div className="admin-workspace">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Refine Agent"
        description="Usage metrics, sessions, and admin-level configuration surfaces for prompt refinement."
        actions={
          <>
            <button type="button" className="admin-button admin-button-secondary" onClick={refreshActive}>
              <FiRefreshCw size={16} />
              Refresh
            </button>
            <button
              type="button"
              className="admin-button admin-button-secondary"
              onClick={() => downloadJson("refine-agent-export.json", { stats, sessions })}
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
        sectionLabel="Refine Agent sections"
      >
        {activeSection === "overview" ? (
          statsError ? (
            <ErrorState message={statsError} onRetry={fetchStats} />
          ) : loadingStats ? (
            <CardSkeleton />
          ) : stats ? (
            <div className="space-y-6">
              <div className="admin-metric-grid">
                <MetricTile label="Total sessions" value={stats.summary.totalSessions} note="Last 30 days" />
                <MetricTile label="Sessions (30d)" value={stats.summary.totalSessions} note={`${stats.summary.sessionsToday} sessions today`} />
                <MetricTile label="Success rate" value={stats.summary.avgQualityScore != null ? `${stats.summary.avgQualityScore}%` : "Unknown"} note="Average quality score" />
                <MetricTile label="Unique users" value={stats.summary.uniqueUsers} note="Users who triggered refinement in the selected window" />
              </div>

              <SectionCard
                title="Refine Agent overview"
                description="Operational summary for the prompt refinement feature."
              >
                <div className="space-y-6">
                  <div className="rounded-[1rem] border border-[color:var(--admin-warning)]/20 bg-[color:var(--admin-warning-soft)] px-5 py-4 text-[color:var(--admin-text)]">
                    <p className="text-lg font-medium leading-8">{insightCopy}</p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold tracking-[-0.03em] text-[color:var(--admin-text)]">
                      Top provider signals (30d)
                    </h3>
                    {topProviders.length === 0 ? (
                      <PreviewNotice message="No provider distribution data has been returned for this period." />
                    ) : (
                      topProviders.map((item) => {
                        const max = topProviders[0]?.sessions || 1;
                        const width = Math.max(12, Math.round((item.sessions / max) * 100));
                        return (
                          <div key={item.provider} className="grid gap-2 md:grid-cols-[180px_minmax(0,1fr)_60px] md:items-center">
                            <span className="text-lg font-medium text-[color:var(--admin-text)]">
                              {item.provider}
                            </span>
                            <div className="h-3 overflow-hidden rounded-full bg-[color:var(--admin-panel-muted)]">
                              <div
                                className="h-full rounded-full bg-[color:var(--admin-accent)]"
                                style={{ width: `${width}%` }}
                              />
                            </div>
                            <span className="text-right text-lg font-semibold text-[color:var(--admin-text)]">
                              {item.sessions}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </SectionCard>
            </div>
          ) : null
        ) : null}

        {activeSection === "sessions" ? (
          <SectionCard
            title="Refine Agent sessions"
            description="Recent refinement sessions with provider, quality, and session depth."
          >
            <div className="space-y-5">
              <div className="admin-toolbar">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,0.8fr)_minmax(0,0.8fr)]">
                  <select
                    className="admin-select"
                    value={provider}
                    onChange={(event) => {
                      setPage(1);
                      setProvider(event.target.value);
                    }}
                  >
                    <option value="">All providers</option>
                    {stats?.byProvider.map((item) => (
                      <option key={item.provider} value={item.provider}>
                        {item.provider}
                      </option>
                    ))}
                  </select>
                  <input
                    className="admin-input"
                    placeholder="Minimum quality score"
                    value={minQuality}
                    onChange={(event) => {
                      setPage(1);
                      setMinQuality(event.target.value);
                    }}
                  />
                  <select
                    className="admin-select"
                    value={sort}
                    onChange={(event) => {
                      setPage(1);
                      setSort(event.target.value);
                    }}
                  >
                    <option value="createdAt">Newest first</option>
                    <option value="qualityScore">Highest quality</option>
                    <option value="messageCount">Most messages</option>
                  </select>
                </div>
              </div>

              {loadingSessions ? (
                <TableSkeleton rows={6} columns={6} />
              ) : sessionsError ? (
                <ErrorState message={sessionsError} onRetry={fetchSessions} />
              ) : (
                <>
                  <DataTable
                    rows={sessions}
                    rowKey={(row) => row.sessionId}
                    mobileCardTitle={(row) => row.userName || "Unknown"}
                    mobileCardMeta={(row) => row.userEmail}
                    mobileCardFooter={(row) => (
                      <StatusBadge
                        label={row.qualityScore != null ? `${row.qualityScore}` : "Unknown"}
                        variant={row.qualityScore != null && row.qualityScore >= 70 ? "success" : "warning"}
                        size="sm"
                      />
                    )}
                    columns={[
                      {
                        key: "userName",
                        label: "User",
                        emphasize: true,
                        render: (value, row) => (
                          <div>
                            <div className="font-semibold text-[color:var(--admin-text)]">{value}</div>
                            <div className="text-xs text-[color:var(--admin-text-faint)]">{row.userEmail}</div>
                          </div>
                        ),
                      },
                      { key: "provider", label: "Provider" },
                      {
                        key: "qualityScore",
                        label: "Quality",
                        render: (value) =>
                          value != null ? (
                            <StatusBadge
                              label={`${value}`}
                              variant={value >= 70 ? "success" : value >= 40 ? "warning" : "error"}
                            />
                          ) : (
                            <span className="text-[color:var(--admin-text-faint)]">Unknown</span>
                          ),
                      },
                      { key: "messageCount", label: "Messages", align: "right" },
                      { key: "totalRefinements", label: "Refinements", align: "right" },
                      {
                        key: "createdAt",
                        label: "Created",
                        render: (value) => formatDate(value),
                      },
                    ]}
                  />

                  {pages > 1 ? (
                    <Pagination
                      currentPage={page}
                      totalPages={pages}
                      totalItems={totalSessions}
                      itemsPerPage={10}
                      onPageChange={setPage}
                    />
                  ) : null}
                </>
              )}
            </div>
          </SectionCard>
        ) : null}

        {activeSection === "config" ? (
          <SectionCard
            title="Agent configuration"
            description="Control how Refine Agent behaves across the platform."
          >
            <div className="space-y-6">
              <PreviewNotice message="The current admin API does not expose persistence for Refine Agent configuration yet. These controls are rendered for review only." />

              <div className="admin-field-grid">
                <div className="admin-field-stack md:col-span-2">
                  <label className="admin-field-label" htmlFor="refine-model">
                    AI model
                  </label>
                  <select
                    id="refine-model"
                    className="admin-select"
                    value={configPreview.model}
                    onChange={(event) =>
                      setConfigPreview((current) => ({ ...current, model: event.target.value }))
                    }
                  >
                    <option value="claude-sonnet-4-6">claude-sonnet-4-6 (recommended)</option>
                    <option value="gpt-4o">gpt-4o</option>
                    <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                  </select>
                </div>

                <div className="admin-field-stack">
                  <label className="admin-field-label" htmlFor="max-rounds">
                    Max refinement rounds per session
                  </label>
                  <input
                    id="max-rounds"
                    className="admin-input"
                    value={configPreview.maxRounds}
                    onChange={(event) =>
                      setConfigPreview((current) => ({ ...current, maxRounds: event.target.value }))
                    }
                  />
                </div>

                <div className="admin-field-stack">
                  <label className="admin-field-label" htmlFor="session-timeout">
                    Session timeout (minutes)
                  </label>
                  <input
                    id="session-timeout"
                    className="admin-input"
                    value={configPreview.sessionTimeout}
                    onChange={(event) =>
                      setConfigPreview((current) => ({ ...current, sessionTimeout: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <ToggleCard
                  title="Refine Agent enabled"
                  description="Enable the Refine Agent feature for all users."
                  checked={configPreview.enabled}
                  onChange={(checked) =>
                    setConfigPreview((current) => ({ ...current, enabled: checked }))
                  }
                />
                <ToggleCard
                  title="Show Refine Agent on onboarding"
                  description="Surface refinement as the first action for new users."
                  checked={configPreview.showOnboarding}
                  onChange={(checked) =>
                    setConfigPreview((current) => ({ ...current, showOnboarding: checked }))
                  }
                />
                <ToggleCard
                  title="Plan-aware enforcement"
                  description="Limit free users to a bounded number of refinements each month."
                  checked={configPreview.planAware}
                  onChange={(checked) =>
                    setConfigPreview((current) => ({ ...current, planAware: checked }))
                  }
                />
              </div>

              <button type="button" className="admin-button admin-button-secondary opacity-60" disabled>
                Save config
              </button>
            </div>
          </SectionCard>
        ) : null}

        {activeSection === "prompts" ? (
          <SectionCard
            title="System prompts"
            description="The instructions given to the AI model during refinement."
          >
            <div className="space-y-6">
              <PreviewNotice message="System prompt editing is not persisted in this pass because the current admin API does not expose save, reset, or preview endpoints for these controls." />

              <div className="admin-field-stack">
                <label className="admin-field-label" htmlFor="system-prompt">
                  Main refinement system prompt
                </label>
                <textarea
                  id="system-prompt"
                  className="admin-textarea min-h-[220px] font-mono text-sm"
                  value={systemPrompt}
                  onChange={(event) => setSystemPrompt(event.target.value)}
                />
                <p className="admin-field-hint">
                  Model: {configPreview.model} · Temperature: 0.3 · Max tokens: 2000
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button type="button" className="admin-button admin-button-secondary opacity-60" disabled>
                  Save prompt
                </button>
                <button type="button" className="admin-button admin-button-secondary opacity-60" disabled>
                  Reset to default
                </button>
                <button type="button" className="admin-button admin-button-secondary opacity-60" disabled>
                  Preview output
                </button>
              </div>
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
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function formatDate(value?: string) {
  if (!value) return "Unknown";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
