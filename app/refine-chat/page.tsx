"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import PageHeader from "@/components/shared/PageHeader";
import SectionCard from "@/components/shared/SectionCard";
import { CardSkeleton } from "@/components/shared/LoadingSkeleton";
import ErrorState from "@/components/shared/ErrorState";
import EmptyState from "@/components/shared/EmptyState";
import {
  adminService,
  RefineChatStatsData,
  RefineChatSession,
} from "@/lib/services/adminService";
import { FiMessageSquare, FiUsers, FiStar, FiActivity, FiSun, FiRepeat } from "react-icons/fi";

// ---- Constants ---------------------------------------------------------------

const PROVIDER_COLORS: Record<string, string> = {
  OPENAI: "#10b981",
  DEEPSEEK: "#6366f1",
  GEMINI: "#f59e0b",
  CLAUDE: "#A84C34",
  OLLAMA: "#64748b",
};

const PLAN_COLORS: Record<string, string> = {
  free: "#94a3b8",
  starter: "#3b82f6",
  pro: "#8b5cf6",
  team_starter: "#10b981",
  team_pro: "#A84C34",
};

const DAYS_OPTIONS = [
  { label: "7d", value: 7 },
  { label: "30d", value: 30 },
  { label: "90d", value: 90 },
];

const PROVIDER_OPTIONS = ["", "OPENAI", "DEEPSEEK", "GEMINI", "CLAUDE", "OLLAMA"];

// ---- Helper ------------------------------------------------------------------

function qualityColor(score: number | null): string {
  if (score == null) return "text-gray-400 dark:text-gray-500";
  if (score >= 70) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 40) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function qualityBg(score: number | null): string {
  if (score == null) return "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400";
  if (score >= 70) return "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
  if (score >= 40) return "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  return "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400";
}

// ---- KPI Card ----------------------------------------------------------------

function KpiCard({
  icon,
  label,
  value,
  sub,
  colorClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  colorClass?: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm font-medium">
        {icon}
        <span>{label}</span>
      </div>
      <div className={`text-3xl font-bold ${colorClass ?? "text-gray-900 dark:text-white"}`}>
        {value}
      </div>
      {sub && <div className="text-xs text-gray-400 dark:text-gray-500">{sub}</div>}
    </div>
  );
}

// ---- Main Page ---------------------------------------------------------------

export default function RefineChatMonitorPage() {
  const router = useRouter();

  // --- state ---
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState<RefineChatStatsData | null>(null);
  const [sessions, setSessions] = useState<RefineChatSession[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [filterProvider, setFilterProvider] = useState("");
  const [filterMinQuality, setFilterMinQuality] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  // --- fetch stats ---
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    setStatsError(null);
    try {
      const res = await adminService.getRefineChatStats(days);
      setStats(res.data);
    } catch {
      setStatsError("Failed to load Refine Chat stats.");
    } finally {
      setLoadingStats(false);
    }
  }, [days]);

  // --- fetch sessions ---
  const fetchSessions = useCallback(async () => {
    setLoadingSessions(true);
    setSessionsError(null);
    try {
      const res = await adminService.getRefineChatSessions({
        page,
        limit: 20,
        provider: filterProvider || undefined,
        minQuality: filterMinQuality ? Number(filterMinQuality) : undefined,
        days,
        sort,
      });
      setSessions(res.data.sessions);
      setTotalSessions(res.data.total);
      setPages(res.data.pages);
    } catch {
      setSessionsError("Failed to load sessions.");
    } finally {
      setLoadingSessions(false);
    }
  }, [days, page, filterProvider, filterMinQuality, sort]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    setPage(1);
  }, [days, filterProvider, filterMinQuality, sort]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // --- radar data ---
  const radarData = stats
    ? [
        { metric: "Clarity", value: stats.qualityBreakdown.clarity ?? 0 },
        { metric: "Specificity", value: stats.qualityBreakdown.specificity ?? 0 },
        { metric: "Completeness", value: stats.qualityBreakdown.completeness ?? 0 },
        { metric: "Reusability", value: stats.qualityBreakdown.reusability ?? 0 },
      ]
    : [];

  // ---- render ----------------------------------------------------------------

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="Refine Chat Monitor"
        description="Session volumes, quality scores, provider distribution, and recent activity"
        actions={
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {DAYS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDays(opt.value)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  days === opt.value
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        }
      />

      {/* KPI Cards */}
      {loadingStats ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 h-32 animate-pulse" />
          ))}
        </div>
      ) : statsError ? (
        <ErrorState message={statsError} onRetry={fetchStats} />
      ) : stats ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard
            icon={<FiMessageSquare size={16} />}
            label="Total Sessions"
            value={stats.summary.totalSessions.toLocaleString()}
            sub={`Last ${days} days`}
          />
          <KpiCard
            icon={<FiUsers size={16} />}
            label="Unique Users"
            value={stats.summary.uniqueUsers.toLocaleString()}
            sub={`Last ${days} days`}
          />
          <KpiCard
            icon={<FiStar size={16} />}
            label="Avg Quality Score"
            value={stats.summary.avgQualityScore != null ? `${stats.summary.avgQualityScore}` : "—"}
            sub="Out of 100"
            colorClass={qualityColor(stats.summary.avgQualityScore)}
          />
          <KpiCard
            icon={<FiActivity size={16} />}
            label="Avg Messages / Session"
            value={stats.summary.avgMessagesPerSession != null ? stats.summary.avgMessagesPerSession : "—"}
            sub="Avg conversation depth"
          />
          <KpiCard
            icon={<FiSun size={16} />}
            label="Sessions Today"
            value={stats.summary.sessionsToday.toLocaleString()}
            sub="Since midnight UTC"
          />
          <KpiCard
            icon={<FiRepeat size={16} />}
            label="Total Refinements"
            value={stats.summary.totalRefinements.toLocaleString()}
            sub={`Last ${days} days`}
          />
        </div>
      ) : null}

      {/* Trend Chart */}
      {stats && (
        <SectionCard title={`Sessions & Messages Over Time (Last ${days} Days)`}>
          {stats.timeSeries.length === 0 ? (
            <EmptyState message="No session data for this period." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={stats.timeSeries} margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sessions" stroke="#A84C34" strokeWidth={2} dot={false} name="Sessions" />
                <Line type="monotone" dataKey="messages" stroke="#6366f1" strokeWidth={2} dot={false} name="Messages" />
                <Line type="monotone" dataKey="uniqueUsers" stroke="#10b981" strokeWidth={2} dot={false} name="Unique Users" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      )}

      {/* Three-column grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Quality Breakdown Radar */}
          <SectionCard title="Quality Breakdown">
            {radarData.every((d) => d.value === 0) ? (
              <EmptyState message="No quality data yet." />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                  <Radar name="Avg Score" dataKey="value" stroke="#A84C34" fill="#A84C34" fillOpacity={0.3} />
                  <Tooltip formatter={(v: number) => v.toFixed(1)} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </SectionCard>

          {/* Provider Distribution Pie */}
          <SectionCard title="Provider Distribution">
            {stats.byProvider.length === 0 ? (
              <EmptyState message="No provider data yet." />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={stats.byProvider}
                    dataKey="sessions"
                    nameKey="provider"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ provider, percent }) =>
                      `${provider} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {stats.byProvider.map((entry) => (
                      <Cell
                        key={entry.provider}
                        fill={PROVIDER_COLORS[entry.provider] ?? "#94a3b8"}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v} sessions`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </SectionCard>

          {/* Plan Distribution Bar */}
          <SectionCard title="Plan Distribution">
            {stats.byPlan.length === 0 ? (
              <EmptyState message="No plan data yet." />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={stats.byPlan} layout="vertical" margin={{ left: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="plan" tick={{ fontSize: 12 }} width={90} />
                  <Tooltip />
                  <Bar dataKey="sessions" name="Sessions" radius={[0, 4, 4, 0]}>
                    {stats.byPlan.map((entry) => (
                      <Cell
                        key={entry.plan}
                        fill={PLAN_COLORS[entry.plan] ?? "#94a3b8"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </SectionCard>
        </div>
      )}

      {/* Sessions Table */}
      <SectionCard
        title="Recent Sessions"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterProvider}
              onChange={(e) => setFilterProvider(e.target.value)}
              className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#A84C34]"
            >
              <option value="">All Providers</option>
              {PROVIDER_OPTIONS.filter(Boolean).map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <input
              type="number"
              min={0}
              max={100}
              placeholder="Min quality"
              value={filterMinQuality}
              onChange={(e) => setFilterMinQuality(e.target.value)}
              className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 w-32 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#A84C34]"
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#A84C34]"
            >
              <option value="createdAt">Sort: Newest</option>
              <option value="qualityScore">Sort: Quality</option>
              <option value="messageCount">Sort: Messages</option>
            </select>
          </div>
        }
      >
        {loadingSessions ? (
          <CardSkeleton />
        ) : sessionsError ? (
          <ErrorState message={sessionsError} onRetry={fetchSessions} />
        ) : sessions.length === 0 ? (
          <EmptyState message="No sessions match the current filters." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <th className="py-3 pr-4">User</th>
                    <th className="py-3 pr-4">Provider</th>
                    <th className="py-3 pr-4">Quality</th>
                    <th className="py-3 pr-4">Messages</th>
                    <th className="py-3 pr-4">Refinements</th>
                    <th className="py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                  {sessions.map((s) => (
                    <tr
                      key={s.sessionId as string}
                      onClick={() => s.userId && router.push(`/users/${s.userId}`)}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 pr-4">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {s.userName || "Unknown"}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">{s.userEmail}</div>
                      </td>
                      <td className="py-3 pr-4">
                        {s.provider ? (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${PROVIDER_COLORS[s.provider] ?? "#94a3b8"}20`,
                              color: PROVIDER_COLORS[s.provider] ?? "#94a3b8",
                            }}
                          >
                            {s.provider}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {s.qualityScore != null ? (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${qualityBg(s.qualityScore)}`}
                          >
                            {s.qualityScore}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">{s.messageCount}</td>
                      <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">{s.totalRefinements}</td>
                      <td className="py-3 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                        {new Date(s.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800 mt-4">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {totalSessions} session{totalSessions !== 1 ? "s" : ""} total
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {page} / {pages}
                  </span>
                  <button
                    disabled={page >= pages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </SectionCard>
    </div>
  );
}
