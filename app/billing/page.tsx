"use client";

import React, { useEffect, useState } from "react";
import SectionCard from "@/components/shared/SectionCard";
import DataTable from "@/components/shared/DataTable";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSkeleton, { CardSkeleton } from "@/components/shared/LoadingSkeleton";
import ErrorState from "@/components/shared/ErrorState";
import StatusBadge from "@/components/shared/StatusBadge";
import KpiCard from "@/components/admin/overview/KpiCard";
import { adminService } from "@/lib/services/adminService";

const formatCurrency = (amount: number, currency: string = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
};

export default function AdminBillingPage() {
  const [revenue, setRevenue] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [revenueRes, subsRes] = await Promise.all([
          adminService.getBillingRevenue(),
          adminService.getBillingSubscriptions({ page: 1, limit: 20 }),
        ]);
        setRevenue(revenueRes.data || revenueRes);
        setSubscriptions(subsRes.data || []);
      } catch (err) {
        console.error("Failed to load billing data", err);
        setError("Failed to load billing data. Please try again.");
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
          title="Billing & Plans"
          description="Monitor revenue, subscriptions, and plan usage"
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
          title="Billing & Plans"
          description="Monitor revenue, subscriptions, and plan usage"
        />
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Billing & Plans"
        description="Monitor revenue, subscriptions, and plan usage"
      />

      {revenue && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {revenue.totalRevenue && (
            <KpiCard
              label="Total Revenue"
              value={formatCurrency(revenue.totalRevenue)}
              unit=""
            />
          )}
          {revenue.monthlyRevenue && (
            <KpiCard
              label="Monthly Revenue"
              value={formatCurrency(revenue.monthlyRevenue)}
              unit=""
            />
          )}
          {revenue.activeSubscriptions && (
            <KpiCard
              label="Active Subscriptions"
              value={revenue.activeSubscriptions}
              unit=""
            />
          )}
        </div>
      )}

      <SectionCard title="Subscriptions">
        <DataTable
          rows={subscriptions}
          columns={[
            {
              key: "userId",
              label: "User",
              render: (value) => (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {typeof value === "object" && value !== null
                    ? value.email || value.name || "Unknown"
                    : String(value || "Unknown")}
                </span>
              ),
            },
            {
              key: "planName",
              label: "Plan",
              render: (value) => (
                <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                  {String(value || "free")}
                </span>
              ),
            },
            {
              key: "status",
              label: "Status",
              render: (value) => <StatusBadge label={String(value || "unknown")} />,
            },
            {
              key: "amount",
              label: "Amount",
              render: (value) => (
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {typeof value === "number" ? formatCurrency(value) : String(value || "N/A")}
                </span>
              ),
            },
          ]}
          emptyMessage="No subscriptions found"
        />
      </SectionCard>
    </div>
  );
}
