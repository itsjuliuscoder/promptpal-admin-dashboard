"use client";

import React, { useEffect, useState } from "react";
import SectionCard from "@/components/shared/SectionCard";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSkeleton, { CardSkeleton } from "@/components/shared/LoadingSkeleton";
import ErrorState from "@/components/shared/ErrorState";
import EmptyState from "@/components/shared/EmptyState";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { adminService } from "@/lib/services/adminService";

const COLORS = ["#A84C34", "#92361a", "#d97706", "#8b5cf6", "#06b6d4"];

export default function AdminAnalyticsPage() {
  const [usage, setUsage] = useState<any[]>([]);
  const [funnel, setFunnel] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [refineChat, setRefineChat] = useState<any[]>([]);
  const [refineAgent, setRefineAgent] = useState<{ timeSeries: any[]; summary: any } | null>(null);
  const [templateAdoption, setTemplateAdoption] = useState<any[]>([]);
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
        setUsage(usageRes.data ?? []);
        setFunnel(funnelRes.data ?? []);
        setModels(modelRes.data ?? []);
        setRefineChat(Array.isArray(refineRes?.data) ? refineRes.data : []);
        setRefineAgent(
          refineAgentRes?.data && typeof refineAgentRes.data === "object" && "timeSeries" in refineAgentRes.data
            ? { timeSeries: refineAgentRes.data.timeSeries ?? [], summary: refineAgentRes.data.summary ?? {} }
            : null
        );
        setTemplateAdoption(Array.isArray(templateRes?.data) ? templateRes.data : []);
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
              <Line type="monotone" dataKey="count" stroke="#8b5cf6" name="Prompt sessions" />
              <Line type="monotone" dataKey="sessions" stroke="#06b6d4" name="Sessions" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState message="No Refine Agent prompt session data for the selected period" />
        )}
      </SectionCard>

      <SectionCard title="Refine Agent — structured sessions (last 30 days)">
        {refineAgent && (refineAgent.timeSeries?.length > 0 || (refineAgent.summary && (refineAgent.summary.totalSessions > 0 || refineAgent.summary.uniqueUsers > 0))) ? (
          <div className="space-y-4">
            {refineAgent.summary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                  <p className="text-gray-500 dark:text-gray-400 font-medium">Sessions</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{refineAgent.summary.totalSessions ?? 0}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                  <p className="text-gray-500 dark:text-gray-400 font-medium">Unique Users</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{refineAgent.summary.uniqueUsers ?? 0}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                  <p className="text-gray-500 dark:text-gray-400 font-medium">Messages</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{refineAgent.summary.totalMessages ?? 0}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                  <p className="text-gray-500 dark:text-gray-400 font-medium">Avg Quality Score</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {refineAgent.summary.avgQualityScore != null ? refineAgent.summary.avgQualityScore : "—"}
                  </p>
                </div>
              </div>
            )}
            {refineAgent.timeSeries && refineAgent.timeSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={refineAgent.timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="sessions" stroke="#8b5cf6" name="Sessions" />
                  <Line type="monotone" dataKey="messages" stroke="#06b6d4" name="Messages" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No time series data for the selected period.</p>
            )}
          </div>
        ) : (
          <EmptyState message="No structured Refine Agent session data for the selected period" />
        )}
      </SectionCard>

      <SectionCard title="Template Adoption">
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
          <EmptyState message="No template adoption data available" />
        )}
      </SectionCard>

      <SectionCard title="Model Distribution">
        {models && models.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={models}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
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
