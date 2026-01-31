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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [usageRes, funnelRes, modelRes] = await Promise.all([
          adminService.getAnalyticsPromptUsage(30),
          adminService.getAnalyticsFunnel(),
          adminService.getAnalyticsModelDistribution(),
        ]);
        setUsage(usageRes.data || []);
        setFunnel(funnelRes.data || []);
        setModels(modelRes.data || []);
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
