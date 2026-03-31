"use client";

import React, { useEffect, useState } from "react";
import SectionCard from "@/components/shared/SectionCard";
import PageHeader from "@/components/shared/PageHeader";
import { CardSkeleton } from "@/components/shared/LoadingSkeleton";
import ErrorState from "@/components/shared/ErrorState";
import EmptyState from "@/components/shared/EmptyState";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { adminService } from "@/lib/services/adminService";

const COLORS = ["#A84C34", "#92361a", "#d97706", "#8b5cf6", "#06b6d4"];

function mergeStructuredAndLegacyRefine(
  structured: { date: string; sessions?: number; messages?: number }[],
  legacy: { date: string; legacyRefines?: number }[]
) {
  const map = new Map<
    string,
    { date: string; sessions: number; messages: number; legacyRefines: number }
  >();
  for (const row of structured) {
    map.set(row.date, {
      date: row.date,
      sessions: row.sessions ?? 0,
      messages: row.messages ?? 0,
      legacyRefines: 0,
    });
  }
  for (const row of legacy) {
    const n = row.legacyRefines ?? 0;
    const cur = map.get(row.date);
    if (cur) {
      cur.legacyRefines = n;
    } else {
      map.set(row.date, {
        date: row.date,
        sessions: 0,
        messages: 0,
        legacyRefines: n,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export default function AdminAnalyticsPage() {
  const [usage, setUsage] = useState<any[]>([]);
  const [funnel, setFunnel] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [refineChat, setRefineChat] = useState<any[]>([]);
  const [refineAgent, setRefineAgent] = useState<{
    timeSeries: any[];
    summary: any;
    legacyTimeSeries: any[];
  } | null>(null);
  const [templateAdoption, setTemplateAdoption] = useState<any[]>([]);
  const [templateSummary, setTemplateSummary] = useState<{
    totalTemplates?: number;
    totalPrompts?: number;
    adoptionRate?: number;
    windowDays?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [usageRes, funnelRes, modelRes, refineRes, refineAgentRes, templateRes] = await Promise.all([
          adminService.getAnalyticsPromptUsage(30),
          adminService.getAnalyticsFunnel(),
          adminService.getAnalyticsModelDistribution(),
          adminService.getAnalyticsRefineChat(30),
          adminService.getAnalyticsRefineAgent(30),
          adminService.getAnalyticsTemplateAdoption(),
        ]);
        const rawUsage = usageRes.data ?? [];
        setUsage(
          rawUsage.map((row: any) => ({
            date: row.date ?? row._id,
            count: row.count ?? row.total ?? 0,
          }))
        );
        setFunnel(
          (funnelRes.data ?? []).map((row: any) => ({
            ...row,
            stage: row.stage ?? row.step ?? "",
          }))
        );
        setModels(
          (modelRes.data ?? []).map((row: any) => ({
            name: row.name ?? (row._id != null && row._id !== "" ? String(row._id) : "Unknown"),
            count: row.count ?? 0,
          }))
        );
        setRefineChat(Array.isArray(refineRes?.data) ? refineRes.data : []);
        const refineData = refineAgentRes?.data;
        if (refineData && typeof refineData === "object" && "timeSeries" in refineData) {
          setRefineAgent({
            timeSeries: refineData.timeSeries ?? [],
            summary: refineData.summary ?? {},
            legacyTimeSeries: Array.isArray(refineData.legacyTimeSeries) ? refineData.legacyTimeSeries : [],
          });
        } else {
          setRefineAgent(null);
        }
        const tpl = templateRes?.data;
        if (tpl && typeof tpl === "object" && "templates" in tpl) {
          setTemplateAdoption(Array.isArray((tpl as any).templates) ? (tpl as any).templates : []);
          setTemplateSummary((tpl as any).summary ?? null);
        } else {
          setTemplateAdoption(Array.isArray(tpl) ? tpl : []);
          setTemplateSummary(null);
        }
      } catch (err) {
        console.error("Failed to load analytics", err);
        setError("Failed to load analytics data. Please try again.");
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
          title="Analytics"
          description="Platform metrics, trends, and insights"
        />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader
          title="Analytics"
          description="Platform metrics, trends, and insights"
        />
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Analytics"
        description="Platform metrics, trends, and insights"
      />

      <SectionCard title="Prompt Usage Trends (Last 30 Days)">
        {usage && usage.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={usage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#A84C34" name="Prompts Used" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState message="No usage data available for the selected period" />
        )}
      </SectionCard>

      <SectionCard title="Funnel Analysis">
        {funnel && funnel.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funnel}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#A84C34" name="Users" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState message="No funnel data available" />
        )}
      </SectionCard>

      {/* PromptSession-based counts (distinct from RefineAgentSession block below) */}
      <SectionCard title="Refine Agent — prompt sessions (last 30 days)">
        {refineChat && refineChat.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={refineChat}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sessions" stroke="#8b5cf6" name="Prompt sessions" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState message="No Refine Agent prompt session data for the selected period" />
        )}
      </SectionCard>

      <SectionCard title="Refine Agent — structured sessions (last 30 days)">
        {(() => {
          if (!refineAgent) {
            return <EmptyState message="No Refine Agent analytics data for the selected period" />;
          }
          const legacyTotal = refineAgent.summary?.legacyRefineEvents ?? 0;
          const hasStructured =
            (refineAgent.timeSeries?.length ?? 0) > 0 ||
            (refineAgent.summary?.totalSessions ?? 0) > 0 ||
            (refineAgent.summary?.uniqueUsers ?? 0) > 0;
          const hasLegacy =
            (refineAgent.legacyTimeSeries?.length ?? 0) > 0 || legacyTotal > 0;
          const merged = mergeStructuredAndLegacyRefine(
            refineAgent.timeSeries ?? [],
            refineAgent.legacyTimeSeries ?? []
          );
          if (!hasStructured && !hasLegacy) {
            return (
              <EmptyState message="No structured Refine Agent session data or usage-log refine events for the selected period" />
            );
          }
          return (
            <div className="space-y-4">
              {refineAgent.summary && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Sessions</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {refineAgent.summary.totalSessions ?? 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Unique Users</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {refineAgent.summary.uniqueUsers ?? 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Messages</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {refineAgent.summary.totalMessages ?? 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Avg Quality Score</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {refineAgent.summary.avgQualityScore != null ? refineAgent.summary.avgQualityScore : "—"}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Legacy refine (log)</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{legacyTotal}</p>
                  </div>
                </div>
              )}
              {merged.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={merged}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {hasStructured ? (
                      <>
                        <Line type="monotone" dataKey="sessions" stroke="#8b5cf6" name="Structured sessions" />
                        <Line type="monotone" dataKey="messages" stroke="#06b6d4" name="Messages" />
                      </>
                    ) : null}
                    {hasLegacy ? (
                      <Line
                        type="monotone"
                        dataKey="legacyRefines"
                        stroke="#d97706"
                        name="Usage log refine"
                        connectNulls
                      />
                    ) : null}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No time series data for the selected period.</p>
              )}
            </div>
          );
        })()}
      </SectionCard>

      <SectionCard title="Template Adoption">
        {templateSummary ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-6">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
              <p className="text-gray-500 dark:text-gray-400 font-medium">Templates</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {templateSummary.totalTemplates ?? "—"}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
              <p className="text-gray-500 dark:text-gray-400 font-medium">Total prompts</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {templateSummary.totalPrompts ?? "—"}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
              <p className="text-gray-500 dark:text-gray-400 font-medium">Template share</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {templateSummary.adoptionRate != null
                  ? `${(templateSummary.adoptionRate * 100).toFixed(1)}%`
                  : "—"}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
              <p className="text-gray-500 dark:text-gray-400 font-medium">Usage window</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {templateSummary.windowDays != null ? `Last ${templateSummary.windowDays}d` : "—"}
              </p>
            </div>
          </div>
        ) : null}
        {templateAdoption && templateAdoption.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={templateAdoption.map((row: any) => ({
                ...row,
                label: row.name ?? row.title ?? row.templateName ?? row.id ?? "—",
                value: row.count ?? row.uses ?? row.adoptions ?? 0,
              }))}
              layout="vertical"
              margin={{ left: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="label" width={80} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#d97706" name="Uses" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState message="No per-template usage in the selected window (templates need runs logged against their prompt ID)" />
        )}
      </SectionCard>

      <SectionCard title="Model Distribution">
        {models && models.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={models}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name ?? "?"} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
              >
                {models.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState message="No model distribution data available" />
        )}
      </SectionCard>
    </div>
  );
}
